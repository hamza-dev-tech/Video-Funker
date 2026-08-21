import { Router } from 'express';
import uploadAudio from '../middleware/uploadAudio';
import { protect, requireVerifiedEmail } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  listVoiceClones,
  createVoiceClone,
  syncVoiceClone,
  deleteVoiceClone,
} from '../controllers/voiceClone.controller';

const router = Router();

router.use(asyncHandler(protect));

router.get('/', asyncHandler(listVoiceClones));
router.post('/', requireVerifiedEmail, uploadAudio.single('audio'), asyncHandler(createVoiceClone));
router.patch('/:id/sync', asyncHandler(syncVoiceClone));
router.delete('/:id', requireVerifiedEmail, asyncHandler(deleteVoiceClone));

export default router;
