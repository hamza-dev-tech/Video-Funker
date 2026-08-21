import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { UnauthorizedError, ForbiddenError } from '../errors';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new UnauthorizedError('Not authorized, no token');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  req.user = user;
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('Not authorized for this action');
    }
    next();
  };
};

export const requireVerifiedEmail = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.user?.emailVerified) {
    throw new ForbiddenError('Email not verified', 'EMAIL_NOT_VERIFIED');
  }
  next();
};
