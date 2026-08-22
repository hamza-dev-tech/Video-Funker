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
/**
 * Orientations for AVATAR IMAGE generation — POST /v3/avatars.
 *
 * Not the same vocabulary as video rendering. See VIDEO_ORIENTATION below;
 * confusing the two returns "Input should be 'landscape' or 'portrait'" from
 * HeyGen and the render never starts.
 */
const ALLOWED_ORIENTATIONS = ['square', 'horizontal', 'vertical'];

/**
 * Orientations for VIDEO rendering — POST /v3/video-agents.
 *
 * HeyGen accepts only these two here. An avatar carries the shape it was
 * generated for in its presenterSpec, using the image vocabulary above, so it
 * has to be translated rather than passed through.
 *
 * A square avatar maps to portrait deliberately: the product is aimed at
 * LinkedIn and Reels, so vertical is the shape its videos are watched in, and
 * a 1:1 subject sits comfortably inside it.
 */
const VIDEO_ORIENTATIONS = ['landscape', 'portrait'] as const;

const VIDEO_ORIENTATION: Record<string, (typeof VIDEO_ORIENTATIONS)[number]> = {
  vertical: 'portrait',
  square: 'portrait',
  horizontal: 'landscape',
  // Already in the video vocabulary — accepted so callers may pass either.
  portrait: 'portrait',
  landscape: 'landscape',
};
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
    Follow the presenter, do not force 16:9 — but in this endpoint's own words.

    'landscape' was hard-coded here. Five of the six presenter recipes are
    vertical, and one is labelled "9:16 — the LinkedIn and Reels shape", so a
    customer followed our own recommendation, got a presenter framed for a phone
    feed, and the render cropped it to the one shape their channel does not
    want — discovered only after the credit was spent.

    The translation matters: presenterSpec stores the IMAGE orientation
    (square / horizontal / vertical) and this endpoint accepts only
    landscape / portrait. Passing the image value straight through is rejected
    with "Input should be 'landscape' or 'portrait'".
  */
  const shape = VIDEO_ORIENTATION[String(orientation)] ?? 'landscape';

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



/**
 * Renders a video from an exact script — POST /v2/video/generate.
 *
 * The alternative, /v3/video-agents, is an autonomous agent: HeyGen's own docs
 * describe it as handling "scripting, avatar selection, scene composition and
 * rendering" from a single prompt. That is the wrong tool for this product.
 * Eight AI steps exist upstream to produce a script, and handing that script to
 * something that rewrites it makes those steps pointless — the proof was a
 * render that came back titled "The Evolution of Buyer Engagement & Form
 * Optimization", a subject the customer never chose.
 *
 * This endpoint speaks the words it is given, in the voice it is given. Fewer
 * stages upstream also means less queueing: a measured agent render sat at
 * "pending" for eleven minutes before starting.
 *
 * No callback_url here — v2 webhooks are configured per account rather than per
 * request. That is fine because the reconciler in video.controller polls
 * /v1/video_status.get for anything still in flight, which is the same path
 * that already recovers agent renders whose callback goes missing.
 */
export interface GenerateAvatarVideoPayload {
  heygenAvatarId: string;
  voiceId: string;
  script: string;
  callback_id: string;
  orientation?: string;
  title?: string;
  /** Burn subtitles into the video. */
  caption?: boolean;
  /** Solid backdrop as #RRGGBB. Omit to keep the avatar's own. */
  backdrop?: string | null;
}

/**
 * 1080p, both orientations.
 *
 * This was 1280x720 — a sensible default for a demo and the wrong one for a
 * product selling presenter video as the deliverable. 720p is visibly soft on a
 * modern phone, and it is the first thing that makes AI video look cheap. HeyGen
 * prices per second of output rather than per pixel, so the higher resolution
 * costs nothing extra; it was simply never asked for.
 */
const VIDEO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1920 },
};

/** Guards the backdrop before it reaches HeyGen, which 400s on a bad value. */
const isHexColour = (v?: string | null): v is string =>
  typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v.trim());

export const generateHeygenAvatarVideoService = async ({
  heygenAvatarId,
  voiceId,
  script,
  callback_id,
  orientation,
  title,
  caption,
  backdrop,
}: GenerateAvatarVideoPayload): Promise<HeygenVideoResponse> => {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    throw new AppError('HEYGEN_API_KEY is not configured on the server', 500);
  }

  const shape = VIDEO_ORIENTATION[String(orientation)] ?? 'landscape';

  /*
    The brand kit applies here too.

    Confirmed by looking at a real agent render: the logo in the corner comes
    from the kit, and the agent path was passing brand_kit_id while this one was
    not. Switching pipelines would have silently dropped the customer's logo off
    every video — a regression nobody would attribute to the endpoint change.
  */
  const brand = await getBrandKits();

  const payload = {
    /*
      Burned-in subtitles, on by default.

      The overwhelming majority of feed video is watched with the sound off, so
      a talking head with no captions is a talking head nobody hears. HeyGen can
      render them into the file, which survives every platform — unlike an
      uploaded subtitle track, which most social players ignore.
    */
    caption: caption !== false,
    title: title || undefined,
    callback_id,
    dimension: VIDEO_DIMENSIONS[shape],
    brand_kit_id: brand?.brand_kit_id || undefined,
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: heygenAvatarId,
          avatar_style: 'normal',
        },
        voice: {
          // Not a prompt. The exact words, spoken.
          type: 'text',
          input_text: script,
          voice_id: voiceId,
        },
        /*
          Only sent when one was chosen. Omitting the key entirely leaves the
          avatar's own backdrop in place; sending an empty or invalid value is
          rejected outright rather than ignored.
        */
        ...(isHexColour(backdrop)
          ? { background: { type: 'color', value: backdrop } }
          : {}),
      },
    ],
  };

  const response = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result: any = await response.json().catch(() => null);

  if (!response.ok || result?.error) {
    const detail =
      result?.error?.message || result?.message || `HTTP ${response.status}`;
    throw new AppError(`HeyGen could not start this render: ${detail}`, 502);
  }

  const videoId = result?.data?.video_id;
  if (!videoId) {
    throw new AppError('HeyGen accepted the request but returned no video id.', 502);
  }

  return {
    video_id: videoId,
    status: 'generating',
  };
};

/**
 * Reads a render's state, from whichever endpoint created it.
 *
 * The two paths do not share a status route: agent renders live under
 * /v3/videos/{id}, exact-script renders under /v1/video_status.get. Polling the
 * wrong one 404s, which the reconciler swallows — so the card would sit on
 * "Rendering" forever while the video was finished and waiting. Verified
 * against a live render: v1 returned "pending" for an eleven-minute-old job.
 *
 * Both are normalised to the same shape so callers do not have to care.
 */
/**
 * The rendering engine. This is the single largest quality lever HeyGen sells.
 *
 * Measured on a real avatar in this account, HeyGen reported:
 *   supported_api_engines: ["avatar_v", "avatar_iv", "avatar_iii"]
 *
 * We were asking for none of them. Both endpoints used previously —
 * /v3/video-agents and /v2/video/generate — take no engine field at all, so
 * every render came out of the base pipeline while the avatar was capable of
 * the two high-fidelity ones. That is most of why finished videos looked, in
 * the customer's words, "100 percent fake".
 *
 *   avatar_iii — photo-specialised, cheapest, softest
 *   avatar_iv  — HeyGen's default, broadest support
 *   avatar_v   — highest fidelity they offer
 */
export const VIDEO_ENGINES = ['avatar_iii', 'avatar_iv', 'avatar_v'] as const;
export type VideoEngine = (typeof VIDEO_ENGINES)[number];

/** Orientation in the vocabulary /v3/videos uses. */
const ASPECT_RATIO: Record<string, string> = {
  vertical: '9:16',
  portrait: '9:16',
  square: '1:1',
  horizontal: '16:9',
  landscape: '16:9',
};

export interface GenerateV3VideoPayload {
  heygenAvatarId: string;
  voiceId: string;
  script: string;
  callback_id: string;
  callbackUrl?: string;
  orientation?: string;
  title?: string;
  caption?: boolean;
  backdrop?: string | null;
  engine?: VideoEngine;
  resolution?: '720p' | '1080p' | '4k';
}

/**
 * Renders through /v3/videos — the endpoint that actually exposes quality.
 *
 * This supersedes both earlier paths. /v3/video-agents writes its own script
 * from a prompt, which defeats the eight AI steps upstream that exist to write
 * one. /v2/video/generate speaks the script correctly but offers no engine
 * choice, no resolution above what the dimension implies, and no aspect ratio
 * of its own.
 *
 * This one takes the exact script, the engine, the resolution, the aspect ratio,
 * burned-in captions and a background, and returns a video id that the existing
 * /v3/videos/{id} poller already understands.
 */
export const generateHeygenV3VideoService = async ({
  heygenAvatarId,
  voiceId,
  script,
  callback_id,
  callbackUrl,
  orientation,
  title,
  caption,
  backdrop,
  engine,
  resolution,
}: GenerateV3VideoPayload): Promise<HeygenVideoResponse> => {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    throw new AppError('HEYGEN_API_KEY is not configured on the server', 500);
  }

  const chosenEngine: VideoEngine = VIDEO_ENGINES.includes(engine as VideoEngine)
    ? (engine as VideoEngine)
    : 'avatar_iv';

  const payload: Record<string, unknown> = {
    type: 'avatar',
    avatar_id: heygenAvatarId,
    // The words, not a prompt. This endpoint speaks what it is given.
    script,
    voice_id: voiceId,
    engine: { type: chosenEngine },
    aspect_ratio: ASPECT_RATIO[String(orientation)] || '16:9',
    resolution: resolution || '1080p',
    callback_id,
    title: title || undefined,
  };

  // Burned into the file rather than a sidecar track, because social players
  // ignore sidecars and most feed video is watched with the sound off.
  if (caption !== false) payload.caption = { style: 'default' };

  if (callbackUrl && callbackUrl !== 'undefined') payload.callback_url = callbackUrl;

  if (isHexColour(backdrop)) {
    payload.background = { type: 'color', value: backdrop };
  }

  const response = await fetch('https://api.heygen.com/v3/videos', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result: any = await response.json().catch(() => null);

  if (!response.ok || result?.error) {
    const detail = result?.error?.message || result?.message || `HTTP ${response.status}`;
    throw new AppError(`HeyGen could not start this render: ${detail}`, 502);
  }

  const videoId = result?.data?.video_id;
  if (!videoId) {
    throw new AppError('HeyGen accepted the request but returned no video id.', 502);
  }

  return { video_id: videoId, status: 'generating' };
};

export const getHeygenVideoStatusService = async (
  videoId: string,
  mode: 'exact' | 'agent'
): Promise<any> => {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    throw new AppError('HEYGEN_API_KEY is not configured on the server', 500);
  }

  if (mode === 'agent') return getHeygenVideoByIdService(videoId);

  const response = await fetch(
    `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
    { method: 'GET', headers: { 'X-Api-Key': apiKey, Accept: 'application/json' } }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new AppError(`HeyGen Video API Error [${response.status}]: ${error}`, 502);
  }

  const result: any = await response.json();
  const d = result?.data || {};

  return {
    id: d.id || videoId,
    status: d.status,
    video_url: d.video_url || d.video_url_caption || '',
    thumbnail_url: d.thumbnail_url || '',
    duration: d.duration ?? null,
    // v1 has no title of its own — the caller keeps whatever it stored, which
    // for an exact render is the customer's own campaign name.
    title: '',
    error: d.error || null,
  };
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
