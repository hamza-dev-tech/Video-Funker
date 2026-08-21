import { Router } from 'express';
import upload from '../middleware/upload';
import { protect, requireVerifiedEmail } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as ctrl from '../controllers/customAvatar.controller';

const router = Router();

router.use(asyncHandler(protect));

router.post('/', requireVerifiedEmail, upload.single('image'), asyncHandler(ctrl.createCustomAvatar));
router.get('/', asyncHandler(ctrl.listCustomAvatars));
router.get('/:id', asyncHandler(ctrl.getCustomAvatar));
router.put('/:id', requireVerifiedEmail, asyncHandler(ctrl.updateCustomAvatar));
router.delete('/:id', requireVerifiedEmail, asyncHandler(ctrl.deleteCustomAvatar));

export default router;
