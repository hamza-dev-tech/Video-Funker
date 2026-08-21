import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { AppError, BadRequestError, NotFoundError } from '../errors';
import CustomAvatar from '../models/CustomAvatar';
import { buildAvatarPrompt } from '../utils/helper';
import { createAvatarFromImageService } from '../services/avatarImage.service';
import Video from '../models/Video';

const IMAGE_AVATAR_ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];
const IMAGE_AVATAR_MAX_BYTES = 10 * 1024 * 1024;

interface HeygenAvatar {
  avatar_id: string;
  avatar_name?: string;
  preview_image_url?: string;
}


interface GenerateHeygenVideoPayload {
  heygenAvatarId: string;
  voiceId: string;
  script: string;
  callbackUrl: string;
  callback_id: string;
  /** Shape the presenter was generated for. Defaults to vertical. */
  orientation?: string;
}

export interface HeygenVideoResponse {
  video_id: string;
  session_id?: string;
  status: "completed" | "thinking" | "generating" | "failed";
  brand_kit_id?: string;
  brand_kit?: Record<string, unknown> | null;
}


const ALLOWED_AGES = ['Young Adult', 'Early Middle Age', 'Late Middle Age', 'Senior', 'Unspecified'];
const ALLOWED_GENDERS = ['Man', 'Woman', 'Unspecified'];
const ALLOWED_ETHNICITIES = [
  'White', 'Black', 'South Asian', 'South East Asian',
  'East Asian', 'Middle Eastern', 'Hispanic', 'Pacific', 'Unspecified',
];
/** Joins the spoken-script instruction block below. */
const LINE_BREAK = '\n';
const ALLOWED_ORIENTATIONS = ['square', 'horizontal', 'vertical'];
const ALLOWED_POSES = ['half_body', 'close_up', 'full_body'];
const ALLOWED_STYLES = ['Realistic', 'Pixar', 'Cinematic', 'Vintage', 'Noir', 'Cyberpunk', 'Unspecified'];

// GET /api/avatars?page=1&limit=8  (HeyGen ONLY)
export const listHeygenAvatars = async (req: AuthRequest, res: Response): Promise<void> => {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    throw new AppError('HEYGEN_API_KEY is not configured on the server', 500);
  }

  const ownership =
    (req.query.ownership as string) || 'public';

  const token = (req.query.token as string) || '';
  const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '8', 10)));

  const url = new URL('https://api.heygen.com/v3/avatars/looks');

  url.searchParams.append('ownership', ownership);
  url.searchParams.append('limit', String(limit));

  if (token) {
    url.searchParams.append('token', token);
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(`HeyGen API failed [${response.status}]: ${text}`, 502);
  }

  const json: any = await response.json();
  const rawAvatars = json?.data || [];

  const defaults = rawAvatars.map((a: any) => ({
    avatar_id: a.id,
    name: a.name || 'Unnamed',
    type: 'default' as const,
    preview_image_url: a.preview_image_url || '',
  }));

  // Include user's HeyGen-generated photo avatars (no local files)
  const customs = await CustomAvatar.find({ userId: req.user!._id, isDeleted: { $ne: true } }).sort('-createdAt');

  const customList = customs.map((c) => ({
    avatar_id: c.avatar_id,
    name: c.name,
    type: 'custom' as const,
    preview_image_url: c.previewImageUrl || '',
    status: c.status,
  }));

  let items = [...defaults];

  if (!token) {
    items = [...customList, ...defaults]
  }



  sendSuccess(res, {
    items,
    limit,
    hasMore: json?.has_more || false,
    nextToken: json?.next_token || null,
  });
};



// POST /api/avatars/create  (JSON body — official HeyGen photo avatar generation)
export const createHeygenAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new AppError('HEYGEN_API_KEY is not configured on the server', 500);

  const { name, age, gender, ethnicity, orientation, pose, style, appearance } = req.body || {};

  // Validation
  if (!name || typeof name !== 'string' || !name.trim()) throw new BadRequestError('name is required');
  if (!appearance || typeof appearance !== 'string' || !appearance.trim()) {
    throw new BadRequestError('appearance is required');
  }
  if (!ALLOWED_AGES.includes(age)) throw new BadRequestError(`age must be one of: ${ALLOWED_AGES.join(', ')}`);
  if (!ALLOWED_GENDERS.includes(gender)) throw new BadRequestError(`gender must be one of: ${ALLOWED_GENDERS.join(', ')}`);
  if (!ALLOWED_ETHNICITIES.includes(ethnicity)) throw new BadRequestError(`ethnicity must be one of: ${ALLOWED_ETHNICITIES.join(', ')}`);
  if (!ALLOWED_ORIENTATIONS.includes(orientation)) throw new BadRequestError(`orientation must be one of: ${ALLOWED_ORIENTATIONS.join(', ')}`);
  if (!ALLOWED_POSES.includes(pose)) throw new BadRequestError(`pose must be one of: ${ALLOWED_POSES.join(', ')}`);
  if (!ALLOWED_STYLES.includes(style)) throw new BadRequestError(`style must be one of: ${ALLOWED_STYLES.join(', ')}`);

  const payload = {
    type: "prompt",
    name: name.trim(),
    prompt: buildAvatarPrompt({
      age,
      gender,
      ethnicity,
      expression: appearance,
      hair: appearance,
      eyes: appearance,
      outfit: appearance,
      environment: appearance,
      style,
    })

  };


  const genRes = await fetch('https://api.heygen.com/v3/avatars', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!genRes.ok) {
    const text = await genRes.text();
    throw new AppError(`HeyGen avatar generation failed [${genRes.status}]: ${text}`, 502);
  }

  const { data }: any = await genRes.json();

  const avatar_id = data?.avatar_item?.id || '';

  if (!avatar_id) throw new AppError('HeyGen did not return an avatar id', 502);



  const record = await CustomAvatar.create({
    userId: req.user!._id,
    name: payload.name,
    avatar_id,
    filePath: '',
    group_id: data?.avatar_item?.group_id || '',
    status: data?.avatar_item?.status || 'processing',
    heygenRaw: data,
  });

  sendSuccess(
    res,
    {
      _id: record._id,
      avatar_id: record.avatar_id,
      name: record.name,
      type: 'custom',
      preview_image_url: record.previewImageUrl,
      status: record.status,
    },
    201
  );
};


// POST /api/avatars/image  (multipart/form-data — image-based avatar creation)
// NOTE: kept fully separate from createHeygenAvatar (prompt flow). Do not merge.
export const createAvatarFromImageController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const file = req.file;
  if (!file) throw new BadRequestError('image file is required');

  if (!IMAGE_AVATAR_ALLOWED_MIME.includes(file.mimetype)) {
    throw new BadRequestError('Only JPG, JPEG, and PNG images are allowed');
  }
  if (file.size > IMAGE_AVATAR_MAX_BYTES) {
    throw new BadRequestError('Image must be 10MB or smaller');
  }

  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new BadRequestError('name is required');
  }

  const fs = await import('fs');
  const fileBuffer = file.buffer ?? fs.readFileSync(file.path);

  const result = await createAvatarFromImageService({
    name: name.trim(),
    fileBuffer,
    mimeType: file.mimetype,
  });


  const { avatar_item } = result?.data ?? result;

  const avatarId =
    avatar_item?.id || ""

  if (!avatarId) throw new AppError('HeyGen did not return an avatar id', 502);


  const record = await CustomAvatar.create({
    userId: req.user!._id,
    name: avatar_item.name,
    avatar_id: avatarId,
    filePath: '',
    group_id: avatar_item?.group_id || '',
    status: avatar_item?.status || 'processing',
    heygenRaw: result,
  });




  // Clean up the temp file if it was written to disk
  if (file.path) {
    try { fs.unlinkSync(file.path); } catch { /* ignore */ }
  }

  sendSuccess(res, record, 201);
};





export const generateHeygenVideoService = async ({
  heygenAvatarId,
  voiceId,
  script,
  callback_id,
  callbackUrl,
  orientation,
}: GenerateHeygenVideoPayload): Promise<HeygenVideoResponse> => {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    throw new AppError('HEYGEN_API_KEY is not configured on the server', 500);
  }


  const brand = await getBrandKits()


  /*
    Follow the presenter, do not force 16:9.

    'landscape' was hard-coded here — and it is not even one of the three values
    this file accepts elsewhere (square, horizontal, vertical). Five of the six
    presenter recipes are vertical, and one is labelled "9:16 — the LinkedIn and
    Reels shape", so a customer followed our own recommendation, got a presenter
    framed with headroom for a phone feed, and the render cropped it into the one
    shape their channel does not want. They found out after the credit was spent.
  */
  const shape = ALLOWED_ORIENTATIONS.includes(String(orientation)) ? String(orientation) : 'vertical';

  /*
    Say what the script is for.

    This posts to /v3/video-agents — a GENERATIVE endpoint — in a field named
    `prompt`, and the response carries a title and duration the agent chose. So
    the script was being read as a creative brief while our own screen promised
    "the script your avatar will speak". Wrapping it with an explicit
    deliver-verbatim instruction is the same move the avatar prompt builder
    already makes for presenters.
  */
  const spokenScript = [
    'Deliver the following script to camera, word for word, exactly as written.',
    'Do not rewrite it, summarise it, add an introduction or add a sign-off.',
    'Speak only these words:',
    '',
    script,
  ].join(LINE_BREAK);

  const payload = {
    avatar_id: heygenAvatarId,
    voice_id: voiceId,
    prompt: spokenScript,
    orientation: shape,
    callback_url: callbackUrl,
    callback_id,
    brand_kit_id: brand?.brand_kit_id || '',
  };


  const response = await fetch('https://api.heygen.com/v3/video-agents', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData: any = await response.json();

    throw new AppError(
      errorData?.error?.message || 'Failed to generate HeyGen video',
      response.status
    );
  }

  const result: any = await response.json();

  return {
    ...result.data,
    brand_kit_id: brand?.brand_kit_id || '',
    brand_kit: brand || null,
  };
}



// DELETE /api/avatars/custom/:id  (id can be Mongo _id or HeyGen avatar_id)
export const deleteCustomAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (typeof id !== 'string') {
    throw new AppError('Invalid ID', 400);
  }
  const isObjectId = /^[a-f\d]{24}$/i.test(id);
  const query: any = isObjectId
    ? { $or: [{ _id: id }, { avatar_id: id }] }
    : { avatar_id: id };
  const record = await CustomAvatar.findOne({ ...query, userId: req.user!._id });
  if (!record) throw new AppError('Custom avatar not found', 404);

  await CustomAvatar.deleteOne({ _id: record._id });
  sendSuccess(res, { message: 'Deleted' });
};




export const getBrandKits = async () => {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    throw new AppError(
      'HEYGEN_API_KEY is not configured',
      500
    );
  }

  const response = await fetch(
    'https://api.heygen.com/v3/brand-kits',
    {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new AppError(
      `HeyGen Brand Kits Error [${response.status}]: ${error}`,
      502
    );
  }

  const { data }: any = await response.json();

  const saleslightBrand = data?.find((k:any) => k.name === 'Saleslights');


  return saleslightBrand || [];
};







export const getHeygenAvatarByIdService = async (
  avatarId: string
) => {

  try {

    const apiKey =
      process.env.HEYGEN_API_KEY;

    if (!apiKey) {
      throw new AppError(
        'HEYGEN_API_KEY is not configured',
        500
      );
    }

    if (!avatarId) {
      throw new AppError(
        'avatarId is required',
        400
      );
    }

    const response = await fetch(
      `https://api.heygen.com/v3/avatars/looks/${avatarId}`,
      {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {

      const text =
        await response.text();

      throw new AppError(
        `HeyGen API failed [${response.status}]: ${text}`,
        502
      );
    }

    const json: any = await response.json();

    return json?.data || null;

  } catch (error: any) {

    console.error(
      'getHeygenAvatarByIdService error:',
      error
    );

    throw error;
  }
};


// PATCH /api/avatars/:id/sync  (syncs a CustomAvatar's status from HeyGen)
export const syncCustomAvatar = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const avatar = await CustomAvatar.findOne({ avatar_id: id });

  if (!avatar) {
    throw new NotFoundError('Avatar not found');
  }

  if (!avatar.avatar_id) {
    throw new BadRequestError('HeyGen avatar ID missing');
  }

  const response = await getHeygenAvatarByIdService(avatar.avatar_id);

  if (!response) {
    throw new AppError('Failed to fetch avatar from HeyGen', 500);
  }

  avatar.status = response.status;
  avatar.heygenRaw = response;

  if (response.status === 'completed') {
    avatar.previewImageUrl = response.preview_image_url;
    avatar.image_height = response.image_height;
    avatar.image_width = response.image_width;
  }

  await avatar.save();

  sendSuccess(res, avatar);
};



export const getHeygenVideoByIdService = async (
  videoId: string
) => {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    throw new AppError(
      'HEYGEN_API_KEY is not configured on the server',
      500
    );
  }

  const response = await fetch(
    `https://api.heygen.com/v3/videos/${videoId}`,
    {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new AppError(
      `HeyGen Video API Error [${response.status}]: ${error}`,
      502
    );
  }

  const result: any = await response.json();

  return result?.data;
};

// PATCH /api/videos/:id/sync

// PATCH /api/videos/:id/sync

export const syncVideo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const video = await Video.findOne({
    videoId: id,
    userId: req.user!._id,
  });

  if (!video) {
    throw new NotFoundError('Video not found');
  }

  if (!video.videoId) {
    throw new BadRequestError(
      'HeyGen video ID missing'
    );
  }

  const response = await getHeygenVideoByIdService(
    video.videoId
  );

  if (!response) {
    throw new AppError(
      'Failed to fetch video from HeyGen',
      500
    );
  }

  video.status = response.status;

  // metadata
  video.duration = response.duration;

  // assets
  video.videoUrl = response.video_url || '';
  video.thumbnailUrl = response.thumbnail_url || '';


  await video.save();

  sendSuccess(res, video);
};

// ===================== HeyGen Voices =====================

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

let voiceCache: { data: HeygenVoice[]; fetchedAt: number } | null = null;
const VOICE_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const mapVoice = (v: any): HeygenVoice => ({
  voice_id: v.voice_id || v.id || '',
  name: v.name || 'Unnamed',
  gender: v.gender || 'Unspecified',
  language: v.language || v.locale || 'Unknown',
  preview_audio_url: v.preview_audio || v.preview_audio_url || '',
  support_locale: !!v.support_locale,
  support_pause: !!v.support_pause,
  type: v.type || 'public',
});

// Fetches the full list of public voices from HeyGen (with retry) and caches it.
const fetchAllVoicesFromHeygen = async (): Promise<HeygenVoice[]> => {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new AppError('HEYGEN_API_KEY is not configured on the server', 500);

  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://api.heygen.com/v3/voices?type=public', {
        method: 'GET',
        headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new AppError(`HeyGen voices API failed [${response.status}]: ${text}`, 502);
      }

      const json: any = await response.json();
      const raw = json?.data?.voices || json?.data || [];

      return (raw as any[]).map(mapVoice);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new AppError('Failed to fetch HeyGen voices', 502);
};

const getCachedVoices = async (refresh: boolean): Promise<HeygenVoice[]> => {
  const now = Date.now();
  if (!refresh && voiceCache && now - voiceCache.fetchedAt < VOICE_CACHE_TTL) {
    return voiceCache.data;
  }
  const voices = await fetchAllVoicesFromHeygen();
  voiceCache = { data: voices, fetchedAt: now };
  return voices;
};

// GET /api/voices?limit=10&token=xxx&refresh=true
// Emulates pagination over the full HeyGen public voices list, since the
// upstream endpoint returns the complete list without a pagination cursor.
export const getVoices = async (req: AuthRequest, res: Response): Promise<void> => {
  const refresh = req.query.refresh === 'true';
  const all = await getCachedVoices(refresh);

  const hasLimit = req.query.limit !== undefined || req.query.token !== undefined;

  if (!hasLimit) {
    // Backward-compatible: return the full array when no pagination params.
    sendSuccess(res, all);
    return;
  }

  const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '10', 10)));
  const offset = Math.max(0, parseInt((req.query.token as string) || '0', 10) || 0);

  const items = all.slice(offset, offset + limit);
  const nextOffset = offset + limit;
  const hasMore = nextOffset < all.length;

  sendSuccess(res, {
    items,
    hasMore,
    nextToken: hasMore ? String(nextOffset) : null,
  });
};
