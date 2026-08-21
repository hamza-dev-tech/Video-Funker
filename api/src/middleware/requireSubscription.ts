import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ForbiddenError } from '../errors';
import { hasActiveSubscription, hasPlanAccess } from '../services/stripe.service';

/**
 * Guards premium endpoints behind an active subscription. Use after `protect`:
 *   router.post('/x', asyncHandler(protect), asyncHandler(requireActiveSubscription), handler)
 */
export const requireActiveSubscription = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const active = await hasActiveSubscription(req.user!._id.toString());
  if (!active) {
    throw new ForbiddenError('An active subscription is required for this feature');
  }
  next();
};

/** Backwards-compatible alias. */
export const requireSubscription = requireActiveSubscription;

/**
 * Guards endpoints behind specific plan tiers. Use after `protect`:
 *   router.post('/x', asyncHandler(protect), asyncHandler(requirePlan('pro', 'enterprise')), handler)
 */
export const requirePlan = (...allowedPlanIds: string[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    const allowed = await hasPlanAccess(req.user!._id.toString(), allowedPlanIds);
    if (!allowed) {
      throw new ForbiddenError(
        `This feature requires one of the following plans: ${allowedPlanIds.join(', ')}`
      );
    }
    next();
  };
};
