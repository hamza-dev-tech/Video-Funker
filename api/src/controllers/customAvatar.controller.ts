import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../errors';
import * as avatarService from '../services/customAvatar.service';
import { describePhotoProblem } from '../utils/imageDimensions';
import {
  PresenterSpec, GENDERS, AGES, ETHNICITIES, STYLES, POSES, ORIENTATIONS,
} from '../utils/avatarPrompt';

const IMAGE_AVATAR_ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];
const IMAGE_AVATAR_MAX_BYTES = 10 * 1024 * 1024;

const parseVoice = (body: any): avatarService.VoiceMetadata => ({
  voiceId: body.voiceId,
  voiceName: body.voiceName,
  voiceLanguage: body.voiceLanguage,
  voiceGender: body.voiceGender,
  previewAudioUrl: body.previewAudioUrl,
});

// POST /api/custom-avatars
/**
 * Turns loose request fields into a validated PresenterSpec, or null if the
 * caller sent none of them.
 *
 * Anything outside the allowed set is rejected outright rather than quietly
 * dropped: silently ignoring `style: "Anime"` would hand the customer a
 * photoreal avatar with no explanation of why their choice did nothing, which
 * is exactly the failure mode this whole change exists to remove.
 */
function buildSpecFromBody(input: Record<string, any>): PresenterSpec | null {
  const provided = Object.values(input).some((v) => v !== undefined && v !== null && v !== '');
  if (!provided) return null;

  const oneOf = <T extends string>(value: any, allowed: readonly T[], field: string): T | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    if (!allowed.includes(value)) {
      throw new BadRequestError(`${field} must be one of: ${allowed.join(', ')}`);
    }
    return value as T;
  };

  const text = (value: any, field: string, max = 220): string | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const str = String(value).trim();
    if (str.length > max) throw new BadRequestError(`${field} must be ${max} characters or fewer`);
    return str;
  };

  return {
    gender: oneOf(input.gender, GENDERS, 'gender'),
    age: oneOf(input.age, AGES, 'age'),
    ethnicity: oneOf(input.ethnicity, ETHNICITIES, 'ethnicity'),
    style: oneOf(input.style, STYLES, 'style'),
    pose: oneOf(input.pose, POSES, 'pose'),
    orientation: oneOf(input.orientation, ORIENTATIONS, 'orientation'),
    wardrobe: text(input.wardrobe, 'wardrobe'),
    expression: text(input.expression, 'expression', 60),
    setting: text(input.setting, 'setting'),
    details: text(input.details, 'details', 300),
  };
}

/** At most three, each under 4MB once decoded, or HeyGen rejects the request. */
function parseReferenceImages(raw: any): { data: string; media_type: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r.data === 'string' && typeof r.media_type === 'string')
    .slice(0, 3);
}

export const createCustomAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const {
    avatarSourceType,
    name,
    description,
    prompt,
    // Structured presenter fields. Sent by the wizard; all optional so a direct
    // API caller can still post a bare prompt.
    gender,
    age,
    ethnicity,
    style,
    pose,
    orientation,
    wardrobe,
    expression,
    setting,
    details,
    referenceImages,
  } = req.body || {};

  if (!avatarSourceType) throw new BadRequestError('avatarSourceType is required');
  if (!['prompt', 'image_upload'].includes(avatarSourceType)) {
    throw new BadRequestError('avatarSourceType must be "prompt" or "image_upload"');
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new BadRequestError('name is required');
  }

  if (avatarSourceType === 'prompt') {
    /*
      Every enum is validated rather than trusted, because these values are
      interpolated straight into the prompt. An unvalidated `style` would let a
      caller inject arbitrary text into the instruction sent to HeyGen.
    */
    const spec = buildSpecFromBody({
      gender, age, ethnicity, style, pose, orientation, wardrobe, expression, setting, details,
    });

    if (!spec && (!prompt || !prompt.trim())) {
      throw new BadRequestError('Describe the presenter, or send a prompt');
    }

    const avatar = await avatarService.createPromptAvatar({
      userId,
      name: name.trim(),
      description,
      spec: spec || undefined,
      prompt,
      referenceImages: parseReferenceImages(referenceImages),
    });
    sendSuccess(res, avatarService.serializeAvatar(avatar), 201);
    return;
  }

  // image_upload
  const file = req.file;
  if (!file) throw new BadRequestError('image file is required for image_upload avatars');
  if (!IMAGE_AVATAR_ALLOWED_MIME.includes(file.mimetype)) {
    throw new BadRequestError('Only JPG, JPEG, and PNG images are allowed');
  }
  if (file.size > IMAGE_AVATAR_MAX_BYTES) {
    throw new BadRequestError('Image must be 10MB or smaller');
  }

  const fs = await import('fs');
  const fileBuffer = file.buffer ?? fs.readFileSync(file.path);

  /*
    Check the picture is usable BEFORE spending a generation on it.

    Until now the only gates were the MIME type and a 10MB ceiling, so a 200×200
    thumbnail or a wide group shot was accepted, sent to HeyGen, billed, and came
    back unusable several minutes later with nothing explaining why. Reading four
    integers out of the file header costs nothing and turns that into an
    immediate, specific sentence the person can act on.
  */
  const problem = describePhotoProblem(fileBuffer);
  if (problem) throw new BadRequestError(problem);

  const avatar = await avatarService.createImageAvatar({
    userId,
    name: name.trim(),
    description,
    fileBuffer,
    mimeType: file.mimetype,
  });

  if (file.path) {
    try { fs.unlinkSync(file.path); } catch { /* ignore */ }
  }

  sendSuccess(res, avatarService.serializeAvatar(avatar), 201);
};

// GET /api/custom-avatars
export const listCustomAvatars = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await avatarService.listAvatars(req.user!._id, {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    search: req.query.search as string,
    sortBy: req.query.sortBy as string,
    order: req.query.order as 'asc' | 'desc',
    language: req.query.language as string,
    gender: req.query.gender as string,
    avatarSourceType: req.query.avatarSourceType as string,
  });
  sendSuccess(res, result);
};

// GET /api/custom-avatars/:id
export const getCustomAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  const avatar = await avatarService.getAvatarById(req.user!._id, req.params.id as string);
  sendSuccess(res, avatarService.serializeAvatar(avatar));
};

// PUT /api/custom-avatars/:id
export const updateCustomAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, metadata } = req.body || {};
  const avatar = await avatarService.updateAvatar(req.user!._id, req.params.id as string, {
    name,
    description,
    voice: parseVoice(req.body),
    metadata,
  });
  sendSuccess(res, avatarService.serializeAvatar(avatar));
};

// DELETE /api/custom-avatars/:id  (soft delete)
export const deleteCustomAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  await avatarService.softDeleteAvatar(req.user!._id, req.params.id as string);
  sendSuccess(res, { message: 'Deleted' });
};
