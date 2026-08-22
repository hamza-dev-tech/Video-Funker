import './config/env';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import connectDB from './config/db';
import { errorMiddleware } from './middleware/error.middleware';

// Route imports
import authRoutes from './routes/auth.routes';
import campaignRoutes from './routes/campaign.routes';
import icpRoutes from './routes/icp.routes';
import contentRoutes from './routes/content.routes';
import reconRoutes from './routes/recon.routes';
import uploadRoutes from './routes/upload.routes';
/*
  Deliberately not mounted — see below.
  import linkedinRoutes from './routes/linkedin.routes';
*/
import videoRoutes from './routes/video.routes';
import reportRoutes from './routes/report.routes';
import heygenRoutes from './routes/heygen.routes';
import customAvatarRoutes from './routes/customAvatar.routes';
import voiceCloneRoutes from './routes/voiceClone.routes';
import billingRoutes from './routes/billing.routes';
import stripeWebhook from './webhooks/stripe.webhook';
import heygenWebhook from './webhooks/heygen.webhook';
import { assertHeygenConfig } from './utils/heygenSignature';

const app = express();

/**
 * 3001, matching .env.example and the client's fallback in
 * client/src/product/config.ts. The previous default was 5000 while every
 * config file around it said 3001, so a developer who had not written a .env
 * got a server listening on one port and a browser calling another, with no
 * error at either end that said so.
 */
const PORT = Number(process.env.PORT) || 3001;

// Connect to MongoDB
connectDB();

/**
 * CORS.
 *
 * The product app is no longer a Vite dev server on :8080 — it is served by the
 * Next client at /app, so the browser's Origin is the marketing origin
 * (localhost:3000 in development, videofunker.ai in production) and any
 * hostname the product is additionally deployed under.
 *
 * A list rather than a single value, because there is always more than one:
 * local development, the apex domain, www, and app.videofunker.ai if the
 * product ever moves back onto its own hostname. CLIENT_URL is still read so an
 * existing deployment's environment keeps working.
 *
 * `credentials: true` is kept even though auth rides on an Authorization header
 * rather than a cookie: it costs nothing and the OAuth callbacks do set cookies.
 */
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.CLIENT_URL ||
  'http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: curl, server-to-server, and the Stripe and HeyGen
      // webhooks. Rejecting those would break the webhooks for nothing — CORS
      // is a browser policy and they are not browsers.
      if (!origin) return callback(null, true);
      // `false`, not an Error. An Error here is forwarded to errorMiddleware,
      // which turns a routine cross-origin probe into a logged 500; returning
      // false just omits the CORS headers and lets the browser do the refusing.
      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // The report and document downloads read the filename off this header;
    // without exposing it the browser hides it and the file saves unnamed.
    exposedHeaders: ['Content-Disposition'],
  })
);

// Stripe webhook needs the raw body — mount BEFORE express.json()
app.use('/api/billing/webhook', stripeWebhook);


/*
  Keep the raw bytes alongside the parsed body.

  HeyGen signs its webhooks with an HMAC over the exact bytes it sent, and
  JSON.parse followed by JSON.stringify does not reproduce them — key order,
  whitespace and number formatting all drift. The Stripe webhook above solves
  this by mounting before the parser; the HeyGen one cannot, because it is a
  normal router, so it keeps a copy instead. Costs one Buffer reference per
  request.
*/
app.use(
  express.json({
    /*
      25mb, because express.json defaults to 100kb.

      Avatar reference images are sent as base64 inside the JSON body, and
      base64 inflates by roughly a third — so a 149KB photo arrives as about
      200KB and was rejected outright with "request entity too large". The
      customer saw "Couldn't start generation" and no reason.

      Three references at the client's 1536px cap are comfortably inside this,
      and the client now shrinks them before sending, so the ceiling is a guard
      rather than a working limit.
    */
    limit: '25mb',
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
// Fails the boot in production rather than silently sending HeyGen the string
// "undefined" as a callback address, or accepting unsigned callbacks.
assertHeygenConfig();
app.use('/api/heygen/webhook', heygenWebhook);
app.use(morgan('dev'));

app.get("/", (_, res) => {
  return res.json({ message: "Video Funker API" })
})

// Serve uploaded files statically (uploads folder is at project root)
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/icp', icpRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/recon', reconRoutes);
app.use('/api/upload', uploadRoutes);
/*
  LinkedIn OAuth is unmounted until the feature is actually built.

  Nothing in the product reaches these routes: the client never calls
  /api/linkedin, and the callback's default address does not even match where it
  was mounted. Meanwhile the callback is unauthenticated, writes text taken
  straight from the query string into an HTML response, and uses the user's
  plain database id as the OAuth `state` — so the account a LinkedIn login binds
  to is chosen by whoever sends the request, and there is no CSRF protection at
  all.

  Unmounting removes the exposure completely in one line, which is the right
  trade for a feature with no users. Before re-enabling: make `state` a random,
  single-use, server-stored secret; escape or drop the query text in the
  response; and put the callback behind the same origin checks as the rest of
  the API.

  app.use('/api/linkedin', linkedinRoutes);
*/
app.use('/api/video', videoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/custom-avatars', customAvatarRoutes);
app.use('/api/voice-clones', voiceCloneRoutes);
app.use('/api', heygenRoutes);
app.use('/api/billing', billingRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler (must be last)
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`🚀 Video Funker API running on http://localhost:${PORT}`);
});
