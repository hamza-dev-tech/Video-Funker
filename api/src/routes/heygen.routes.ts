import { Router } from 'express';
import { protect, requireVerifiedEmail } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  listHeygenAvatars,
  deleteCustomAvatar,
  syncCustomAvatar,
  getVoices,
  syncVideo,
} from '../controllers/heygen.controller';

/*
  Two create endpoints used to live here — POST /avatars/create and
  POST /avatars/image. Nothing in the client ever called either one, and the
  structured-prompt quality they carried is now on POST /api/custom-avatars,
  which is the path the app actually uses. Keeping two ways to make an avatar
  meant the better one was the one nobody could reach.

  What remains is the read-only HeyGen catalogue plus the two sync endpoints.
*/
const router = Router();

router.get('/avatars', asyncHandler(protect), asyncHandler(listHeygenAvatars));
router.get('/voices', asyncHandler(protect), asyncHandler(getVoices));
router.delete('/avatars/custom/:id', asyncHandler(protect), requireVerifiedEmail, asyncHandler(deleteCustomAvatar));
router.patch('/avatars/:id/sync', asyncHandler(protect), asyncHandler(syncCustomAvatar));
router.patch('/videos/:id/status/sync', asyncHandler(protect), asyncHandler(syncVideo));

export default router;
