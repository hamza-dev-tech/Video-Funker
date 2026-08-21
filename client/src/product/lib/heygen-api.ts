import { apiGet, apiPost, apiPut, apiDelete, apiPatch, apiUpload } from "@product/lib/api-client";

export type AvatarSourceType = "prompt" | "image_upload";

export interface HeygenAvatar {
  avatar_id: string;
  name: string;
  type: "default" | "custom";
  preview_image_url: string;
  status?: "training" | "pending" | "completed" | "failed";
}

export interface HeygenAvatarsPage {
  items: HeygenAvatar[];
  limit: number;
  hasMore: boolean;
  nextToken: string | null;
}

export interface CustomAvatar {
  id: string;
  name: string;
  description: string;
  avatar_id: string;
  avatarSourceType: AvatarSourceType;
  avatarImage: string;
  voiceId: string;
  voiceName: string;
  voiceLanguage: string;
  voiceGender: string;
  previewAudioUrl: string;
  status?: "processing" | "completed" | "failed";
  createdAt: string;

  /** The exact string HeyGen received. Empty for photo avatars. */
  heygenPrompt?: string;
  /** The choices that built the prompt, for showing a readable summary. */
  presenterSpec?: PresenterSpec | null;

  /** True dimensions of the generated image, so the preview need not guess. */
  imageWidth?: number | null;
  imageHeight?: number | null;
}

export interface CustomAvatarsPage {
  items: CustomAvatar[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ListCustomAvatarsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  language?: string;
  gender?: string;
  avatarSourceType?: AvatarSourceType;
}

export interface VoiceMetadata {
  voiceId: string;
  voiceName: string;
  voiceLanguage: string;
  voiceGender: string;
  previewAudioUrl: string;
}

export interface HeygenVoice {
  voice_id: string;
  name: string;
  gender: string;
  language: string;
  preview_audio_url: string;
  support_locale: boolean;
  support_pause: boolean;
  type: string;
}

export interface CreateHeygenAvatarPayload {
  name: string;
  age: string;
  gender: string;
  ethnicity: string;
  orientation: string;
  pose: string;
  style: string;
  appearance: string;
}

// ---- Legacy default-avatar gallery (kept for HeyGen public avatars) ----
export async function fetchHeygenAvatars(
  limit = 20,
  token?: string,
): Promise<HeygenAvatarsPage> {
  const params = new URLSearchParams();
  params.append("limit", String(limit));
  if (token) params.append("token", token);
  return apiGet<HeygenAvatarsPage>(`/avatars?${params.toString()}`);
}

export async function syncAvatarData(id: string): Promise<HeygenAvatar> {
  return apiPatch<HeygenAvatar>(`/avatars/${id}/sync`);
}

// ---- Custom Avatar CRUD ----
export async function listCustomAvatars(
  params: ListCustomAvatarsParams = {}
): Promise<CustomAvatarsPage> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  const query = qs.toString();
  return apiGet<CustomAvatarsPage>(`/custom-avatars${query ? `?${query}` : ""}`);
}

export async function getCustomAvatar(id: string): Promise<CustomAvatar> {
  return apiGet<CustomAvatar>(`/custom-avatars/${id}`);
}

/**
 * The structured description of a presenter.
 *
 * Mirrors the shape the API validates. The server turns this into the prompt
 * sent to HeyGen — the client never sends prompt text for a spec-based avatar,
 * so the wording can be improved for every customer in one place.
 */
export interface PresenterSpec {
  gender?: "Man" | "Woman" | "Unspecified";
  age?: "Young Adult" | "Early Middle Age" | "Late Middle Age" | "Senior" | "Unspecified";
  ethnicity?:
    | "White" | "Black" | "South Asian" | "South East Asian"
    | "East Asian" | "Middle Eastern" | "Hispanic" | "Pacific" | "Unspecified";
  style?: "Realistic" | "Cinematic" | "Pixar" | "Vintage" | "Noir" | "Cyberpunk" | "Unspecified";
  pose?: "half_body" | "close_up" | "full_body";
  orientation?: "square" | "horizontal" | "vertical";
  wardrobe?: string;
  expression?: string;
  setting?: string;
  details?: string;
}

/** A reference image, base64-encoded, in the shape the API forwards to HeyGen. */
export interface ReferenceImage {
  data: string;
  media_type: string;
}

export async function createCustomAvatarPrompt(payload: {
  name: string;
  description?: string;
  spec?: PresenterSpec;
  /** Only used when no spec is supplied. */
  prompt?: string;
  referenceImages?: ReferenceImage[];
  voice?: Partial<VoiceMetadata>;
}): Promise<CustomAvatar> {
  return apiPost<CustomAvatar>("/custom-avatars", {
    avatarSourceType: "prompt",
    name: payload.name,
    description: payload.description || "",
    ...(payload.spec || {}),
    ...(payload.prompt ? { prompt: payload.prompt } : {}),
    ...(payload.referenceImages?.length ? { referenceImages: payload.referenceImages } : {}),
    ...payload.voice,
  });
}

export async function createCustomAvatarImage(payload: {
  name: string;
  description?: string;
  image: File;
  voice?: Partial<VoiceMetadata>;
}): Promise<CustomAvatar> {
  const fd = new FormData();
  fd.append("avatarSourceType", "image_upload");
  fd.append("name", payload.name);
  fd.append("description", payload.description || "");
  fd.append("image", payload.image);
  if (payload.voice) {
    Object.entries(payload.voice).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
  }
  return apiUpload<CustomAvatar>("/custom-avatars", fd);
}

export async function updateCustomAvatar(
  id: string,
  payload: {
    name?: string;
    description?: string;
    voice?: Partial<VoiceMetadata>;
    metadata?: Record<string, unknown>;
  }
): Promise<CustomAvatar> {
  return apiPut<CustomAvatar>(`/custom-avatars/${id}`, {
    name: payload.name,
    description: payload.description,
    ...payload.voice,
    metadata: payload.metadata,
  });
}

export async function deleteCustomAvatar(id: string): Promise<void> {
  await apiDelete(`/custom-avatars/${id}`);
}
