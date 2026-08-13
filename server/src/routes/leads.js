import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { deliverLead } from '../lib/deliverLead.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests from this address. Try again in a few minutes.' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INTENTS = new Set(['start-free', 'demo', 'contact']);

router.post('/', limiter, async (req, res, next) => {
  try {
    const { name = '', email = '', company = '', message = '', intent = 'start-free', website = '' } = req.body || {};

    // Honeypot: real people never fill a field that is hidden from them.
    if (website) return res.json({ ok: true });

    if (!EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ ok: false, error: 'Enter a valid work email so we can reach you.' });
    }
    if (!INTENTS.has(intent)) {
      return res.status(400).json({ ok: false, error: `Unknown request type "${intent}".` });
    }
    if (String(message).length > 2000) {
      return res.status(400).json({ ok: false, error: 'Message is too long — keep it under 2000 characters.' });
    }

    const lead = {
      intent,
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().toLowerCase().slice(0, 200),
      company: String(company).trim().slice(0, 160),
      message: String(message).trim(),
      source: req.get('referer') || 'direct',
      receivedAt: new Date().toISOString(),
    };

    const delivered = await deliverLead(lead);
    res.json({ ok: true, delivered });
  } catch (err) {
    next(err);
  }
});

export default router;
