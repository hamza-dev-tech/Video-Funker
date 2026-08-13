import { Router } from 'express';

const router = Router();
const startedAt = Date.now();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'videofunker-bff',
    env: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  });
});

export default router;
