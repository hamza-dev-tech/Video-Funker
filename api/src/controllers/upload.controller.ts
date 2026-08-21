import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../errors';

export const uploadSingle = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new BadRequestError('No file uploaded');
  const filePath = `/uploads/${req.file.destination.includes('images') ? 'images' : 'documents'}/${req.file.filename}`;
  sendSuccess(res, {
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: filePath,
  }, 201);
};

export const uploadMultiple = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.files || !(req.files as Express.Multer.File[]).length) {
    throw new BadRequestError('No files uploaded');
  }
  const files = (req.files as Express.Multer.File[]).map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
    path: `/uploads/${f.destination.includes('images') ? 'images' : 'documents'}/${f.filename}`,
  }));
  sendSuccess(res, files, 201);
};
