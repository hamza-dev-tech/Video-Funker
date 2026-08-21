import multer from 'multer';

const ALLOWED_AUDIO_MIME = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
];

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_AUDIO_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only MP3 and WAV audio files are allowed'));
};

const uploadAudio = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

export default uploadAudio;
