import { apiGet, apiPost, apiDelete, apiPatch } from "@product/lib/api-client";
import { API_BASE } from '@product/config';

export type VideoStatus = "thinking" | "generating" | "completed" | "failed";

export interface VideoItem {
  _id: string;
  campaignId: string;
  script: string;
  videoId: string;
  avatarId?: {
    _id: string;
    originalName: string;
    filePath: string;
    type: string;
  } | null;
  heygenAvatarId?: string | null;
  avatarType?: "custom" | "heygen";
  videoPath: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  fileName: string;
  title?: string | null;
  duration?: number;
  /** Why a render failed, when HeyGen told us. */
  failureReason?: string | null;
  /** HeyGen's own word: "pending", "processing", "completed"… */
  upstreamStatus?: string | null;
  /** Which HeyGen pipeline made it. See the Video model for the difference. */
  renderMode?: "exact" | "agent";
  voiceId?: string | null;
  voiceName?: string | null;
  status: VideoStatus;
  createdAt: string;
}

export interface GenerateVideoParams {
  campaignId: string;
  script: string;
  heygenAvatarId?: string;
  avatarType?: "custom" | "heygen" | "default";
  voiceId: string;
  voiceName?: string;
  voiceCloneId?: string;
  /** 'exact' speaks the script verbatim; 'agent' lets HeyGen author it. */
  renderMode?: "exact" | "agent";
  /** Burn subtitles into the file. Exact-script renders only. */
  captions?: boolean;
  /** Solid backdrop as #RRGGBB. Omit for the presenter's own. */
  backdrop?: string | null;
  /** HeyGen rendering engine. The biggest quality lever available. */
  engine?: "avatar_iii" | "avatar_iv" | "avatar_v";
  resolution?: "720p" | "1080p" | "4k";
}

export async function generateVideo(params: GenerateVideoParams): Promise<VideoItem> {
  return apiPost<VideoItem>('/video/generate', {
    campaignId: params.campaignId,
    script: params.script,
    heygenAvatarId: params.heygenAvatarId || undefined,
    avatarType: params.avatarType === "custom" ? "custom" : "heygen",
    voiceId: params.voiceId,
    voiceName: params.voiceName || undefined,
    voiceCloneId: params.voiceCloneId || undefined,
    renderMode: params.renderMode || undefined,
    captions: params.captions,
    backdrop: params.backdrop ?? undefined,
    engine: params.engine,
    resolution: params.resolution,
  });
}


export async function getVideoById(id: string): Promise<VideoItem> {
  return apiGet<VideoItem>(`/video/by/${id}`);
}

/** Re-fetch the latest state of a single video (used by the Sync action). */


export async function fetchVideos(campaignId: string): Promise<VideoItem[]> {
  return apiGet<VideoItem[]>(`/video/${campaignId}`);
}

export async function deleteVideo(id: string): Promise<void> {
  await apiDelete(`/video/${id}`);
}

export function getVideoDownloadUrl(id: string): string {
  return `${API_BASE}/video/download/${id}`;
}


export async function syncVideoById(id: string): Promise<VideoItem> {
  return apiPatch<VideoItem>(`/video/sync/${id}`);
}
