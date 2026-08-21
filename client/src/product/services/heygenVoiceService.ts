import { apiGet } from "@product/lib/api-client";
import type { HeygenVoice } from "@product/lib/heygen-api";

export type { HeygenVoice };

export interface VoicesPage {
  items: HeygenVoice[];
  hasMore: boolean;
  nextToken: string | null;
}

/** Fetch a paginated page of voices from the backend. */
export async function fetchVoicesPage(
  limit = 10,
  token?: string,
  refresh = false
): Promise<VoicesPage> {
  const params = new URLSearchParams();
  params.append("limit", String(limit));
  if (token) params.append("token", token);
  if (refresh) params.append("refresh", "true");
  return apiGet<VoicesPage>(`/voices?${params.toString()}`);
}

let cache: HeygenVoice[] | null = null;
let inFlight: Promise<HeygenVoice[]> | null = null;

async function fetchWithRetry(refresh = false, retries = 2): Promise<HeygenVoice[]> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await apiGet<HeygenVoice[]>(`/voices${refresh ? "?refresh=true" : ""}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to fetch voices");
}

/** Returns all public HeyGen voices (cached). */
export async function getAllVoices(): Promise<HeygenVoice[]> {
  if (cache) return cache;
  if (inFlight) return inFlight;
  inFlight = fetchWithRetry()
    .then((voices) => {
      cache = voices;
      return voices;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Force a refresh of the voice cache. */
export async function refreshVoiceCache(): Promise<HeygenVoice[]> {
  cache = null;
  const voices = await fetchWithRetry(true);
  cache = voices;
  return voices;
}

export async function getVoiceById(id: string): Promise<HeygenVoice | undefined> {
  const voices = await getAllVoices();
  return voices.find((v) => v.voice_id === id);
}

export async function searchVoices(searchTerm: string): Promise<HeygenVoice[]> {
  const voices = await getAllVoices();
  const term = searchTerm.trim().toLowerCase();
  if (!term) return voices;
  return voices.filter(
    (v) =>
      v.name.toLowerCase().includes(term) ||
      v.language.toLowerCase().includes(term) ||
      v.gender.toLowerCase().includes(term)
  );
}

export async function filterVoices(
  language?: string,
  gender?: string
): Promise<HeygenVoice[]> {
  const voices = await getAllVoices();
  return voices.filter(
    (v) =>
      (!language || v.language === language) &&
      (!gender || v.gender.toLowerCase() === gender.toLowerCase())
  );
}
