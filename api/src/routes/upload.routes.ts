import { Router } from 'express';
import upload from '../middleware/upload';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { uploadMultiple, uploadSingle } from '../controllers/upload.controller';

const router = Router();

router.use(asyncHandler(protect));

router.post('/single', upload.single('file'), asyncHandler(uploadSingle));
router.post('/multiple', upload.array('files', 5), asyncHandler(uploadMultiple));

export default router;
