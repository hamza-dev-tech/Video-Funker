#!/usr/bin/env node
/**
 * One command that answers "is my local Video Funker actually working, and
 * which credentials are real?" — run it any time something fails and it will
 * tell you whether the cause is a missing env file, a dead service, a wrong
 * port, an invalid key, or a provider that has simply run out of credits.
 *
 *   node scripts/check-stack.mjs          (or: npm run doctor)
 *
 * Every provider is asked a question that distinguishes those cases:
 * authentication and quota are checked separately, because a key that
 * authenticates is not the same as an account that can still do work — that
 * distinction is exactly what a "Failed to send" toast hides.
 *
 * Nothing here writes, sends or charges anything: SendGrid runs in sandbox
 * mode, OpenAI is asked for a single token, and the rest are read-only calls.
 * Secrets are masked in the output, so it is safe to paste.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const C = {
  reset: '[0m', bold: '[1m', dim: '[2m',
  green: '[32m', yellow: '[33m', red: '[31m', cyan: '[36m',
};

let failures = 0;
let warnings = 0;

function head(title) {
  console.log(`\n${C.bold}${C.cyan}${title}${C.reset}`);
}

function row(status, label, detail = '') {
  const mark = { pass: `${C.green}PASS${C.reset}`, warn: `${C.yellow}WARN${C.reset}`, fail: `${C.red}FAIL${C.reset}`, info: `${C.dim}····${C.reset}` }[status];
  if (status === 'fail') failures++;
  if (status === 'warn') warnings++;
  console.log(`  ${mark}  ${label.padEnd(30)} ${C.dim}${detail}${C.reset}`);
}

const mask = (v) => (v ? `${v.slice(0, 6)}…(${v.length} chars)` : '—');

/** Minimal .env reader: KEY=value, ignoring comments and blank lines. */
function readEnv(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  const out = {};
  for (const raw of readFileSync(full, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const value = line.slice(eq + 1).trim();
    if (value) out[line.slice(0, eq).trim()] = value;
  }
  return out;
}

/** Is anything listening? Cheaper and clearer than a failed fetch. */
function tcpOpen(port, host = '127.0.0.1', timeout = 1200) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host });
    const done = (result) => { socket.destroy(); resolve(result); };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function http(url, options = {}, timeout = 20000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: ac.signal });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json, keep the text */ }
    return { ok: res.ok, status: res.status, headers: res.headers, text, json };
  } catch (err) {
    return { ok: false, status: 0, error: err.name === 'AbortError' ? 'timed out' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

// ── 1. Env files ────────────────────────────────────────────────────────────
head('Environment files');

const apiEnv = readEnv('api/.env');
const clientEnv = readEnv('client/.env.local');
const serverEnv = readEnv('server/.env');

row(apiEnv ? 'pass' : 'fail', 'api/.env', apiEnv ? `${Object.keys(apiEnv).length} keys set` : 'missing — the API cannot start');
row(clientEnv ? 'pass' : 'warn', 'client/.env.local', clientEnv ? `${Object.keys(clientEnv).length} keys set` : 'missing — the app will call the wrong API port');
row(serverEnv ? 'pass' : 'info', 'server/.env', serverEnv ? `${Object.keys(serverEnv).length} keys set` : 'absent — the BFF falls back to :4000 and CORS localhost:3000');

const env = apiEnv || {};
const PROVIDER_KEYS = [
  'SENDGRID_API_KEY', 'OPENAI_API_KEY', 'HEYGEN_API_KEY',
  'STRIPE_SECRET_KEY', 'LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET',
];
const missing = PROVIDER_KEYS.filter((k) => !env[k]);
if (missing.length) {
  row('warn', 'unset provider keys', missing.join(', '));
}
if (env.JWT_SECRET && /local_dev|not_a_real|changeme/i.test(env.JWT_SECRET)) {
  row('warn', 'JWT_SECRET', 'placeholder value — fine locally, replace before deploying');
}

// ── 2. Services and ports ───────────────────────────────────────────────────
head('Services');

const apiPort = Number(env.PORT) || 3001;
const apiBase = `http://localhost:${apiPort}`;

const health = await http(`${apiBase}/api/health`, {}, 6000);
row(health.ok ? 'pass' : 'fail', `API :${apiPort}`, health.ok ? `/api/health → ${health.status}` : `not responding (${health.error || health.status}) — is npm run dev running in api/?`);

// Find the Next client by asking each likely port who it is. A dev server
// with a half-written .next answers 500 to everything while still looking
// alive on the port, so "responding" and "working" are reported separately.
let clientOrigin = null;
let brokenClient = null;
for (const port of [3000, 3001, 3100, 3002]) {
  if (!(await tcpOpen(port))) continue;
  const res = await http(`http://localhost:${port}/`, {}, 20000);
  const isNext =
    /next-router/i.test(res.headers?.get('vary') || '') ||
    /_next|Video ?Funker/i.test(res.text || '');
  if (!isNext) continue;
  if (res.ok) { clientOrigin = `http://localhost:${port}`; break; }
  brokenClient = { origin: `http://localhost:${port}`, status: res.status };
}
if (clientOrigin) {
  row('pass', 'Next client', `serving at ${clientOrigin}`);
} else if (brokenClient) {
  row('fail', 'Next client', `${brokenClient.origin} answers ${brokenClient.status} — stale build: stop it, delete client/.next, start again`);
} else {
  row('warn', 'Next client', 'not found on 3000/3001/3100/3002');
}

const bff = (await tcpOpen(4000)) ? await http('http://localhost:4000/health', {}, 5000) : { ok: false, error: 'nothing listening' };
row(bff.ok ? 'pass' : 'info', 'BFF :4000', bff.ok ? `/health → ${bff.status}` : 'not running (only needed for the marketing lead form)');

// ── 3. MongoDB ──────────────────────────────────────────────────────────────
head('Database');

const uri = env.MONGODB_URI;
if (!uri) {
  row('fail', 'MONGODB_URI', 'not set in api/.env');
} else {
  // Never print the connection string as given: it carries the password.
  const shown = uri.replace(/\/\/[^@]*@/, '//***@').split('?')[0];
  const srv = /^mongodb\+srv:/i.test(uri);
  const hostPort = uri.replace(/^mongodb(\+srv)?:\/\//, '').split('/')[0].split('@').pop();
  const [host, port] = hostPort.split(':');
  const atlas = /mongodb\.net$/i.test(host);
  row('info', 'target', `${shown}${atlas ? '  ← REMOTE cluster, not local' : ''}`);

  // An +srv URI names no port: the real hosts come from a DNS SRV lookup, so
  // a TCP probe against the cluster name always fails. Let the driver do it.
  const reachable = srv ? true : await tcpOpen(Number(port) || 27017, host, 2500);
  if (!srv) {
    row(reachable ? 'pass' : 'fail', 'mongod reachable', reachable ? hostPort : `${hostPort} refused — docker start videofunker-mongo`);
  }
  if (reachable) {
    try {
      const { default: mongoose } = await import('mongoose');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      const names = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
      const users = names.includes('users') ? await mongoose.connection.db.collection('users').countDocuments() : 0;
      row('pass', 'connection', `${names.length} collections, ${users} user${users === 1 ? '' : 's'}`);
      await mongoose.disconnect();
    } catch (err) {
      row('fail', 'connection', err.message);
    }
  }
}

// ── 4. Wiring between the three ─────────────────────────────────────────────
head('Wiring');

const productApi = clientEnv?.NEXT_PUBLIC_PRODUCT_API_URL;
if (productApi) {
  const points = productApi.includes(`:${apiPort}`);
  row(points ? 'pass' : 'fail', 'client → API URL', points ? productApi : `${productApi} but the API is on :${apiPort}`);
}

if (clientOrigin && health.ok) {
  // The real test, not a string comparison: ask the API to approve a preflight
  // from the origin the browser actually uses.
  const pre = await http(`${apiBase}/api/auth/signup`, {
    method: 'OPTIONS',
    headers: {
      Origin: clientOrigin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  }, 8000);
  const allowed = pre.headers?.get('access-control-allow-origin');
  row(allowed ? 'pass' : 'fail', 'CORS preflight', allowed ? `${clientOrigin} allowed` : `${clientOrigin} rejected — add it to CORS_ORIGINS in api/.env and restart`);
}

if (env.APP_URL && clientOrigin && !env.APP_URL.startsWith(clientOrigin)) {
  row('warn', 'APP_URL', `${env.APP_URL} does not match ${clientOrigin} — Stripe returns customers to the wrong port`);
}

// ── 5. Provider credentials ─────────────────────────────────────────────────
head('Credentials');

if (env.EMAIL_TRANSPORT === 'console') {
  row('info', 'EMAIL_TRANSPORT', 'console — OTPs print to the API log, no mail is sent');
}

if (env.SENDGRID_API_KEY) {
  const key = env.SENDGRID_API_KEY;
  const auth = { Authorization: `Bearer ${key}` };
  const scopes = await http('https://api.sendgrid.com/v3/scopes', { headers: auth });
  const canSendScope = scopes.json?.scopes?.includes('mail.send');
  row(scopes.ok ? 'pass' : 'fail', 'SendGrid key', scopes.ok ? `valid ${mask(key)}${canSendScope ? ', mail.send granted' : ', NO mail.send scope'}` : `rejected (${scopes.status})`);

  if (scopes.ok) {
    const credits = await http('https://api.sendgrid.com/v3/user/credits', { headers: auth });
    const c = credits.json;
    if (c) {
      const dry = c.remain === 0;
      row(dry ? 'fail' : 'pass', 'SendGrid credits', `remain ${c.remain} of ${c.total}${c.is_hard_limit ? ' (hard limit)' : ''}, resets ${c.reset_frequency} — next ${c.next_reset}`);
    }
    // Sandbox mode validates the whole request, including sender identity,
    // without delivering anything.
    const probe = await http('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: 'probe@example.com' }] }],
        from: { email: env.SENDGRID_FROM_EMAIL || 'no-reply@videofunker.ai' },
        subject: 'probe', content: [{ type: 'text/plain', value: 'probe' }],
        mail_settings: { sandbox_mode: { enable: true } },
      }),
    });
    const why = probe.json?.errors?.[0]?.message;
    row(probe.ok ? 'pass' : 'fail', 'SendGrid can send', probe.ok ? 'sender accepted' : `${probe.status} — ${why || 'rejected'}`);
  }
}

if (env.OPENAI_API_KEY) {
  const auth = { Authorization: `Bearer ${env.OPENAI_API_KEY}` };
  const models = await http('https://api.openai.com/v1/models', { headers: auth });
  row(models.ok ? 'pass' : 'fail', 'OpenAI key', models.ok ? `valid ${mask(env.OPENAI_API_KEY)}` : `rejected (${models.status}) — ${models.json?.error?.message || ''}`);
  if (models.ok) {
    // One token: enough to separate "key works" from "account has no quota".
    const probe = await http('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
    });
    const code = probe.json?.error?.code;
    row(probe.ok ? 'pass' : 'fail', 'OpenAI quota', probe.ok ? 'completion succeeded' : `${probe.status} — ${code || probe.json?.error?.message || 'refused'}`);
  }
}

if (env.HEYGEN_API_KEY) {
  const auth = { 'X-Api-Key': env.HEYGEN_API_KEY };
  const quota = await http('https://api.heygen.com/v2/user/remaining_quota', { headers: auth });
  const remaining = quota.json?.data?.remaining_quota;
  row(quota.ok ? 'pass' : 'fail', 'HeyGen key', quota.ok ? `valid ${mask(env.HEYGEN_API_KEY)}` : `rejected (${quota.status}) — ${quota.json?.message || ''}`);
  if (quota.ok) {
    // HeyGen reports quota in API credits; 0 means generation will fail.
    row(remaining > 0 ? 'pass' : 'fail', 'HeyGen credits', `remaining_quota ${remaining ?? 'unknown'}`);
  }
  if (!env.HEYGEN_WEBHOOK_URL) {
    row('warn', 'HEYGEN_WEBHOOK_URL', 'unset — generation results arrive by webhook, which needs a public URL (ngrok) locally');
  }
}

if (env.STRIPE_SECRET_KEY) {
  const key = env.STRIPE_SECRET_KEY;
  const balance = await http('https://api.stripe.com/v1/balance', { headers: { Authorization: `Bearer ${key}` } });
  const mode = key.startsWith('sk_live') ? 'LIVE key — real charges' : 'test mode';
  row(balance.ok ? 'pass' : 'fail', 'Stripe key', balance.ok ? `valid, ${mode}` : `rejected (${balance.status}) — ${balance.json?.error?.message || ''}`);
  for (const priceKey of ['STRIPE_PRICE_MONTHLY', 'STRIPE_ENTERPRISE_MONTHLY']) {
    if (!env[priceKey]) continue;
    const price = await http(`https://api.stripe.com/v1/prices/${env[priceKey]}`, { headers: { Authorization: `Bearer ${key}` } });
    row(price.ok ? 'pass' : 'fail', priceKey, price.ok ? `${(price.json.unit_amount ?? 0) / 100} ${String(price.json.currency).toUpperCase()} / ${price.json.recurring?.interval || 'one-off'}` : `not found (${price.status})`);
  }
}

if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.LINKEDIN_CLIENT_ID,
    client_secret: env.LINKEDIN_CLIENT_SECRET,
  });
  const token = await http('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  });
  // A wrong pair returns invalid_client; anything else means the credentials
  // themselves were accepted even if this grant type is not enabled.
  const bad = token.json?.error === 'invalid_client';
  row(bad ? 'fail' : 'pass', 'LinkedIn app', bad ? 'client id/secret rejected' : `credentials accepted (${token.status})`);
}

// ── Summary ─────────────────────────────────────────────────────────────────
const verdict = failures
  ? `${C.red}${failures} failure${failures === 1 ? '' : 's'}${C.reset}`
  : `${C.green}all checks passed${C.reset}`;
console.log(`\n${C.bold}${verdict}${C.reset}${warnings ? `${C.dim}, ${warnings} warning${warnings === 1 ? '' : 's'}${C.reset}` : ''}\n`);
process.exit(failures ? 1 : 0);
