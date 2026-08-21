import { Router } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as recon from '../controllers/recon.controller';

const router = Router();

router.use(asyncHandler(protect));

router.get('/', asyncHandler(recon.getAll));
router.post('/process', asyncHandler(recon.processData));
router.get('/report/:icpId', asyncHandler(recon.downloadReport));
router.get('/:id', asyncHandler(recon.getOne));
router.post('/', asyncHandler(recon.create));
router.delete('/:id', asyncHandler(recon.remove));

export default router;
