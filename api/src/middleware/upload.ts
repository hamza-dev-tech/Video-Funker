import multer from 'multer';
import path from 'path';
import fs from 'fs';

const dirs = ['uploads/images', 'uploads/documents'];
dirs.forEach((dir) => {
  const fullPath = path.join(__dirname, '../..', dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const folder = isImage ? 'uploads/images' : 'uploads/documents';
    cb(null, path.join(__dirname, '../..', folder));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|csv|xlsx|mp4|mov|avi|webm|mkv/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext || mime) return cb(null, true);
  cb(new Error('Unsupported file type'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;
