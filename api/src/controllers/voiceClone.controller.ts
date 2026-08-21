import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { AppError, BadRequestError, NotFoundError } from '../errors';
import VoiceClone, { IVoiceClone } from '../models/VoiceClone';
import { assertCanCreateVoiceClone } from '../services/usage.service';

const HEYGEN_BASE = 'https://api.heygen.com';

const getApiKey = (): string => {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new AppError('HEYGEN_API_KEY is not configured on the server', 500);
  return apiKey;
};

const serialize = (v: IVoiceClone) => ({
  id: v._id,
  voiceName: v.voiceName,
  heygenVoiceId: v.heygenVoiceId,
  language: v.language || '',
  gender: v.gender || '',
  previewAudioUrl: v.previewAudioUrl || '',
  supportPause: !!v.supportPause,
  supportInteractiveAvatar: !!v.supportInteractiveAvatar,
  status: v.status,
  failureMessage: v.failureMessage || null,
  createdAt: (v as any).createdAt,
  updatedAt: (v as any).updatedAt,
});

// GET /api/voice-clones  (DB only — no HeyGen call)
export const listVoiceClones = async (req: AuthRequest, res: Response): Promise<void> => {
  const items = await VoiceClone.find({
    userId: req.user!._id,
    status: { $ne: 'deleted' },
    isDeleted: { $ne: true },
  }).sort('-createdAt');
  sendSuccess(res, { items: items.map(serialize) });
};

// POST /api/voice-clones  (multipart: audio file + fields)
export const createVoiceClone = async (req: AuthRequest, res: Response): Promise<void> => {
  const { voiceName, language, removeBackgroundNoise, consent } = req.body || {};

  if (!voiceName || typeof voiceName !== 'string' || !voiceName.trim()) {
    throw new BadRequestError('voiceName is required');
  }
  const trimmedName = voiceName.trim();
  if (trimmedName.length < 1 || trimmedName.length > 100) {
    throw new BadRequestError('voiceName must be between 1 and 100 characters');
  }

  const consentGiven = consent === true || consent === 'true';
  if (!consentGiven) {
    throw new BadRequestError('You must confirm you own or have permission to clone this voice');
  }

  const file = req.file;
  if (!file) throw new BadRequestError('An audio file (MP3 or WAV) is required');

  // Enforce plan limit
  await assertCanCreateVoiceClone(req.user!._id.toString());

  const removeNoise =
    removeBackgroundNoise === undefined
      ? true
      : removeBackgroundNoise === true || removeBackgroundNoise === 'true';

  const buffer = file.buffer;
  const base64 = buffer.toString('base64');
  const mediaType = file.mimetype === 'audio/wav' || file.mimetype === 'audio/x-wav' || file.mimetype === 'audio/wave'
    ? 'audio/wav'
    : 'audio/mpeg';

  const payload: Record<string, unknown> = {
    audio: {
      type: 'base64',
      media_type: mediaType,
      data: base64,
    },
    voice_name: trimmedName,
    remove_background_noise: removeNoise,
  };
  if (language && typeof language === 'string' && language.trim()) {
    payload.language = language.trim();
  }

  const response = await fetch(`${HEYGEN_BASE}/v3/voices/clone`, {
    method: 'POST',
    headers: {
      'X-Api-Key': getApiKey(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(`HeyGen voice clone failed [${response.status}]: ${text}`, 502);
  }

  const json: any = await response.json();
  const heygenVoiceId = json?.data?.voice_clone_id || json?.data?.voice_id || '';
  if (!heygenVoiceId) throw new AppError('HeyGen did not return a voice id', 502);

  const record = await VoiceClone.create({
    userId: req.user!._id,
    voiceName: trimmedName,
    heygenVoiceId,
    language: language && typeof language === 'string' ? language.trim() : '',
    status: 'processing',
  });

  sendSuccess(res, serialize(record), 201);
};

// PATCH /api/voice-clones/:id/sync
export const syncVoiceClone = async (req: AuthRequest, res: Response): Promise<void> => {
  const record = await VoiceClone.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!record) throw new NotFoundError('Voice clone not found');
  if (!record.heygenVoiceId) throw new BadRequestError('HeyGen voice ID missing');

  const response = await fetch(`${HEYGEN_BASE}/v3/voices/${record.heygenVoiceId}`, {
    method: 'GET',
    headers: { 'X-Api-Key': getApiKey(), Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(`HeyGen API failed [${response.status}]: ${text}`, 502);
  }

  const json: any = await response.json();
  const data = json?.data || {};

  if (data.failure_message) {
    record.status = 'failed';
    record.failureMessage = data.failure_message;
  } else {
    record.status = 'ready';
    record.failureMessage = null;
    if (data.language !== undefined) record.language = data.language || '';
    if (data.gender !== undefined) record.gender = data.gender || '';
    if (data.preview_audio_url !== undefined) record.previewAudioUrl = data.preview_audio_url || '';
    if (data.support_pause !== undefined) record.supportPause = !!data.support_pause;
    if (data.support_interactive_avatar !== undefined) {
      record.supportInteractiveAvatar = !!data.support_interactive_avatar;
    }
  }

  await record.save();
  sendSuccess(res, serialize(record));
};

// DELETE /api/voice-clones/:id  (HeyGen delete best-effort + soft delete locally)
export const deleteVoiceClone = async (req: AuthRequest, res: Response): Promise<void> => {
  const record = await VoiceClone.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!record) throw new NotFoundError('Voice clone not found');

  // Best-effort HeyGen delete (endpoint may not exist on all plans)
  try {
    await fetch(`${HEYGEN_BASE}/v3/voices/${record.heygenVoiceId}`, {
      method: 'DELETE',
      headers: { 'X-Api-Key': getApiKey(), Accept: 'application/json' },
    });
  } catch {
    /* ignore — soft delete locally regardless */
  }

  record.status = 'deleted';
  record.isDeleted = true;
  await record.save();

  sendSuccess(res, { message: 'Deleted' });
};
