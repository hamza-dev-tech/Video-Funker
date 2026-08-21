import { Router } from 'express';
import { protect, requireVerifiedEmail } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { enforceVideoLimit } from '../middleware/planLimits';
import { generateVideo, getVideos, deleteVideo, downloadVideo, getVideoById, syncVideoById } from '../controllers/video.controller';

const router = Router();



/**
 * asyncHandler(protect), never a bare `protect`.
 *
 * `protect` is an async function that THROWS — on a missing token, on an
 * expired one, on a user that no longer exists. Express 4 does not await the
 * promise a middleware returns, so a bare `protect` turns every one of those
 * into an unhandled rejection: the request hangs with no response, and Node 20+
 * (this repo requires >=20) terminates the process on an unhandled rejection by
 * default. One request with a stale token would take the API down for everyone.
 * asyncHandler catches the rejection and hands it to errorMiddleware, which is
 * what turns it into the 401 the client expects.
 */
router.use(asyncHandler(protect));

router.post('/generate', requireVerifiedEmail, asyncHandler(enforceVideoLimit), asyncHandler(generateVideo));
router.get('/:campaignId', asyncHandler(getVideos));
router.get('/by/:id', asyncHandler(getVideoById));
router.get('/download/:id', asyncHandler(downloadVideo));
router.delete('/:id', asyncHandler(deleteVideo));
router.patch('/sync/:id', asyncHandler(syncVideoById));

export default router;
