import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, statusCode = 200): void => {
  res.status(statusCode).json({ success: true, data });
};
