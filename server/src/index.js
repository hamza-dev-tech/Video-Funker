import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import leadsRouter from './routes/leads.js';
import healthRouter from './routes/health.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Behind nginx / a platform load balancer, trust the first proxy hop so
// rate limiting keys on the real client IP rather than the proxy's.
app.set('trust proxy', 1);

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '64kb' }));

const allowed = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Same-origin and server-to-server calls arrive without an Origin header.
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);

app.use('/api/health', healthRouter);
app.use('/api/leads', leadsRouter);

app.use((req, res) => {
  res.status(404).json({ ok: false, error: `No route for ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('[server]', err);
  res.status(status).json({ ok: false, error: err.message || 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`[videofunker/server] listening on http://localhost:${PORT}`);
  console.log(`[videofunker/server] CORS origins: ${allowed.join(', ')}`);
});
