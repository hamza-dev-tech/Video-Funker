import { Router } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import * as auth from '../controllers/auth.controller';
import * as account from '../controllers/account.controller';

const router = Router();

router.post('/signup', asyncHandler(auth.signup));
router.post('/login', asyncHandler(auth.login));
router.get('/me', asyncHandler(protect), asyncHandler(auth.getMe));
router.put('/password', asyncHandler(protect), asyncHandler(auth.updatePassword));
router.post('/forgot-password', asyncHandler(auth.forgotPassword));
router.post('/verify-reset-otp', asyncHandler(auth.verifyResetOtp));
router.post('/reset-password', asyncHandler(auth.resetPassword));
router.post('/send-verification', asyncHandler(protect), asyncHandler(auth.sendVerificationOtp));
router.post('/verify-email', asyncHandler(protect), asyncHandler(auth.verifyEmail));
router.post('/send-delete-otp', asyncHandler(protect), asyncHandler(account.sendDeleteOtp));
router.delete('/account', asyncHandler(protect), asyncHandler(account.deleteAccount));

export default router;
