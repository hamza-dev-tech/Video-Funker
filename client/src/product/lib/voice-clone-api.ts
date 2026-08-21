import { apiGet, apiUpload, apiPatch, apiDelete } from "@product/lib/api-client";

export type VoiceCloneStatus = "processing" | "ready" | "failed" | "deleted";

export interface VoiceClone {
  id: string;
  voiceName: string;
  heygenVoiceId: string;
  language: string;
  gender: string;
  previewAudioUrl: string;
  supportPause: boolean;
  supportInteractiveAvatar: boolean;
  status: VoiceCloneStatus;
  failureMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VoiceClonesPage {
  items: VoiceClone[];
}

export async function listVoiceClones(): Promise<VoiceClone[]> {
  const res = await apiGet<VoiceClonesPage>("/voice-clones");
  return res.items;
}

export async function createVoiceClone(formData: FormData): Promise<VoiceClone> {
  return apiUpload<VoiceClone>("/voice-clones", formData);
}

export async function syncVoiceClone(id: string): Promise<VoiceClone> {
  return apiPatch<VoiceClone>(`/voice-clones/${id}/sync`);
}

export async function deleteVoiceClone(id: string): Promise<void> {
  await apiDelete(`/voice-clones/${id}`);
}
