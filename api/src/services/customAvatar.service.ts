import mongoose from 'mongoose';
import CustomAvatar, { ICustomAvatar } from '../models/CustomAvatar';
import { AppError, BadRequestError, NotFoundError } from '../errors';
import { createAvatarFromImageService } from './avatarImage.service';
import { buildPresenterPrompt, PresenterSpec } from '../utils/avatarPrompt';
/*
  Imported from the controller because that is where the HeyGen fetch helpers
  live. Not circular — heygen.controller.ts does not import this service — but
  it is backwards, and the right home for getHeygenAvatarByIdService is a
  heygen.service alongside the other integrations. Left as-is rather than moved
  in a UX change, so the refactor is not buried in an unrelated diff.
*/
import { getHeygenAvatarByIdService } from '../controllers/heygen.controller';

export interface VoiceMetadata {
  voiceId?: string;
  voiceName?: string;
  voiceLanguage?: string;
  voiceGender?: string;
  previewAudioUrl?: string;
}

export interface ListAvatarsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  language?: string;
  gender?: string;
  avatarSourceType?: string;
}

/**
 * A reference image, in the shape HeyGen's file fields take.
 *
 * Up to three can ride along with a prompt avatar at no extra cost — they steer
 * likeness, wardrobe and setting far more precisely than words can, and they
 * are the single biggest quality lever available on this endpoint.
 */
export interface ReferenceImage {
  data: string;
  media_type: string;
}

interface CreatePromptAvatarInput {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  /**
   * The structured presenter description. The prompt sent upstream is built
   * from this on the server, so every avatar in the product is described the
   * same way and the wording can be improved for everyone in one place.
   */
  spec?: PresenterSpec;
  /**
   * Free-text fallback. Kept so older clients and any direct API caller keep
   * working; when a spec is present this is ignored.
   */
  prompt?: string;
  referenceImages?: ReferenceImage[];
  voice?: VoiceMetadata;
}

interface CreateImageAvatarInput {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  fileBuffer: Buffer;
  mimeType: string;
  voice?: VoiceMetadata;
}

const HEYGEN_BASE = 'https://api.heygen.com/v3/avatars';

const createPromptAvatarOnHeygen = async (
  name: string,
  prompt: string,
  referenceImages: ReferenceImage[] = []
) => {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new AppError('HEYGEN_API_KEY is not configured on the server', 500);

  const genRes = await fetch(HEYGEN_BASE, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    /*
      `reference_images` is omitted entirely when none were supplied rather than
      sent as an empty array. An unexpected empty field is the kind of thing an
      upstream API rejects the whole request over, and the no-reference path is
      the one every existing user is on.
    */
    body: JSON.stringify({
      type: 'prompt',
      name,
      prompt,
      ...(referenceImages.length
        ? {
            reference_images: referenceImages.slice(0, 3).map((img) => ({
              type: 'base64',
              data: img.data,
              media_type: img.media_type,
            })),
          }
        : {}),
    }),
  });

  if (!genRes.ok) {
    const text = await genRes.text();
    throw new AppError(`HeyGen avatar generation failed [${genRes.status}]: ${text}`, 502);
  }

  const { data }: any = await genRes.json();
  return data;
};

/** Shape a CustomAvatar document into the public API response. */
export const serializeAvatar = (a: ICustomAvatar) => ({
  id: a._id,
  name: a.name,
  description: a.description || '',
  avatar_id: a.avatar_id,
  avatarSourceType: a.avatarSourceType,
  avatarImage: a.previewImageUrl || '',
  voiceId: a.voiceId || '',
  voiceName: a.voiceName || '',
  voiceLanguage: a.voiceLanguage || '',
  voiceGender: a.voiceGender || '',
  previewAudioUrl: a.previewAudioUrl || '',
  status: a.status,
  createdAt: (a as any).createdAt,

  /*
    The record of what produced this face.

    Both fields were already being written on creation and then dropped here, so
    the preview modal could only ever show system facts — source, status, date —
    and nothing describing the presenter. We stored the exact prompt and the full
    spec and then threw them away at the API boundary.

    presenterSpec is what the UI renders (a readable summary and the chips);
    heygenPrompt is the literal string HeyGen received, kept behind a disclosure
    because six hundred characters of lens direction is proof of work rather
    than communication.
  */
  heygenPrompt: a.heygenPrompt || '',
  presenterSpec: a.presenterSpec || null,

  /*
    The real pixel dimensions, so the preview can size itself to the image
    instead of forcing every avatar into a hard-coded 3:4 box and cropping
    whatever does not fit — which silently cut the top of the head off.
  */
  imageWidth: a.image_width || null,
  imageHeight: a.image_height || null,
});

export const createPromptAvatar = async ({
  userId,
  name,
  description,
  spec,
  prompt,
  referenceImages,
  voice,
}: CreatePromptAvatarInput): Promise<ICustomAvatar> => {
  /*
    A spec always wins over raw text. The old path handed whatever was typed
    into a textarea straight to HeyGen, which is why results were inconsistent:
    the quality of an avatar depended entirely on how good the customer happened
    to be at prompting an image model, which is not their job.
  */
  const finalPrompt = spec ? buildPresenterPrompt(spec) : (prompt || '').trim();
  if (!finalPrompt) throw new BadRequestError('A presenter description is required');

  const data = await createPromptAvatarOnHeygen(name, finalPrompt, referenceImages);
  const avatar_id = data?.avatar_item?.id || '';
  if (!avatar_id) throw new AppError('HeyGen did not return an avatar id', 502);

  return CustomAvatar.create({
    userId,
    name,
    description: description || '',
    avatar_id,
    group_id: data?.avatar_item?.group_id || '',
    status: data?.avatar_item?.status || 'processing',
    avatarSourceType: 'prompt',
    // Stored so a later regeneration can start from what was actually asked for
    // rather than making the customer describe the person again.
    heygenPrompt: finalPrompt,
    presenterSpec: spec,
    voiceId: voice?.voiceId || '',
    voiceName: voice?.voiceName || '',
    voiceLanguage: voice?.voiceLanguage || '',
    voiceGender: voice?.voiceGender || '',
    previewAudioUrl: voice?.previewAudioUrl || '',
    heygenRaw: data,
  });
};

export const createImageAvatar = async ({
  userId,
  name,
  description,
  fileBuffer,
  mimeType,
  voice,
}: CreateImageAvatarInput): Promise<ICustomAvatar> => {
  if (!fileBuffer) throw new BadRequestError('image is required for image_upload avatars');

  const result = await createAvatarFromImageService({ name, fileBuffer, mimeType });
  const { avatar_item } = result?.data ?? result;
  const avatar_id = avatar_item?.id || '';
  if (!avatar_id) throw new AppError('HeyGen did not return an avatar id', 502);

  return CustomAvatar.create({
    userId,
    name: avatar_item.name || name,
    description: description || '',
    avatar_id,
    group_id: avatar_item?.group_id || '',
    status: avatar_item?.status || 'processing',
    avatarSourceType: 'image_upload',
    voiceId: voice?.voiceId || '',
    voiceName: voice?.voiceName || '',
    voiceLanguage: voice?.voiceLanguage || '',
    voiceGender: voice?.voiceGender || '',
    previewAudioUrl: voice?.previewAudioUrl || '',
    heygenRaw: result,
  });
};

export const listAvatars = async (
  userId: mongoose.Types.ObjectId,
  query: ListAvatarsQuery
) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const sortBy = query.sortBy || 'createdAt';
  const order = query.order === 'asc' ? 1 : -1;

  const filter: any = { userId, isDeleted: { $ne: true } };
  if (query.search) filter.name = { $regex: query.search, $options: 'i' };
  if (query.language) filter.voiceLanguage = query.language;
  if (query.gender) filter.voiceGender = query.gender;
  if (query.avatarSourceType) filter.avatarSourceType = query.avatarSourceType;

  const [items, total] = await Promise.all([
    CustomAvatar.find(filter)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit),
    CustomAvatar.countDocuments(filter),
  ]);

  /*
    Bring anything still rendering up to date before returning it.

    Without this, listing avatars is a pure Mongo read and NOTHING in the API
    ever advances a row out of `processing`. HeyGen's webhook handles only
    `video_agent.*` events, there is no cron, and the single code path that
    writes a fresh status is the per-card sync button. So an avatar HeyGen
    finished ten minutes ago still reads `processing` here, and the client can
    poll this endpoint forever without the answer ever changing — a spinner
    that spins on principle.

    Refreshing on read makes the list self-healing: whoever asks for it,
    however they ask, gets the truth. The alternative — adding avatar events to
    the webhook — needs a change in the HeyGen dashboard that this codebase
    cannot make or verify on its own.
  */
  const refreshed = await refreshPendingAvatars(items);

  return {
    items: refreshed.map(serializeAvatar),
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
};

/** Statuses HeyGen can still move away from. */
const PENDING_STATUSES = ['processing', 'pending', 'generating', 'training'];

/**
 * How stale a pending row must be before this re-checks it upstream.
 *
 * The client polls, so without a floor every poll would fan out to HeyGen once
 * per unfinished avatar. Ten seconds is shorter than the client's own polling
 * floor, so it never blocks a legitimate refresh, and long enough that two
 * tabs open on the same page do not double the upstream traffic.
 */
const REFRESH_AFTER_MS = 10_000;

const refreshPendingAvatars = async (items: ICustomAvatar[]): Promise<ICustomAvatar[]> => {
  const stale = items.filter(
    (a) =>
      PENDING_STATUSES.includes(a.status as string) &&
      a.avatar_id &&
      Date.now() - new Date(a.updatedAt).getTime() > REFRESH_AFTER_MS
  );

  if (stale.length === 0) return items;

  // In parallel, each isolated: one avatar HeyGen has forgotten about must
  // not take down the whole list request.
  await Promise.all(
    stale.map(async (avatar) => {
      try {
        const remote = await getHeygenAvatarByIdService(avatar.avatar_id);
        if (!remote?.status || remote.status === avatar.status) return;

        avatar.status = remote.status;
        avatar.heygenRaw = remote;
        if (remote.status === 'completed') {
          avatar.previewImageUrl = remote.preview_image_url;
          avatar.image_height = remote.image_height;
          avatar.image_width = remote.image_width;
        }
        await avatar.save();
      } catch {
        // Upstream is unreachable or the id is unknown. Leave the row as it is
        // and serve what we have — a failed status check should never turn a
        // working list into an error.
      }
    })
  );

  return items;
};

export const getAvatarById = async (
  userId: mongoose.Types.ObjectId,
  id: string
): Promise<ICustomAvatar> => {
  const avatar = await CustomAvatar.findOne({ _id: id, userId, isDeleted: { $ne: true } });
  if (!avatar) throw new NotFoundError('Avatar not found');
  return avatar;
};

interface UpdateAvatarInput {
  name?: string;
  description?: string;
  voice?: VoiceMetadata;
  metadata?: Record<string, any>;
}

export const updateAvatar = async (
  userId: mongoose.Types.ObjectId,
  id: string,
  input: UpdateAvatarInput
): Promise<ICustomAvatar> => {
  const avatar = await getAvatarById(userId, id);

  if (input.name !== undefined) avatar.name = input.name;
  if (input.description !== undefined) avatar.description = input.description;
  if (input.voice) {
    if (input.voice.voiceId !== undefined) avatar.voiceId = input.voice.voiceId;
    if (input.voice.voiceName !== undefined) avatar.voiceName = input.voice.voiceName;
    if (input.voice.voiceLanguage !== undefined) avatar.voiceLanguage = input.voice.voiceLanguage;
    if (input.voice.voiceGender !== undefined) avatar.voiceGender = input.voice.voiceGender;
    if (input.voice.previewAudioUrl !== undefined) avatar.previewAudioUrl = input.voice.previewAudioUrl;
  }
  if (input.metadata) {
    avatar.heygenRaw = { ...(avatar.heygenRaw || {}), metadata: input.metadata };
  }

  await avatar.save();
  return avatar;
};

export const softDeleteAvatar = async (
  userId: mongoose.Types.ObjectId,
  id: string
): Promise<void> => {
  const avatar = await getAvatarById(userId, id);
  avatar.isDeleted = true;
  await avatar.save();
};
