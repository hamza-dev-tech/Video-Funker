# Video Funker product API

Express + Mongoose + TypeScript. Serves the product app that the client renders
at `/app` — auth, campaigns, ICP, content, prospect research, avatars, video,
reports and Stripe billing.

This is a workspace in the monorepo, not a standalone checkout. Install once at
the repo root; npm links the dependencies from there.

## Running it

```bash
docker run -d --name vf-mongo -p 27017:27017 mongo:7
```

```bash
cp api/.env.example api/.env && npm install && npm run dev:api
```

`npm run dev` at the root starts this alongside the client and the marketing
BFF. `dotenv` reads `api/.env` from this directory, so a value written in the
repo-root `.env` is invisible here.

| Script                     | What it does                                  |
| -------------------------- | --------------------------------------------- |
| `npm run dev:api`          | ts-node-dev, restarts on change               |
| `npm run build:api`        | `tsc` to `dist/` (type-checked, `strict: true`) |
| `npm run start:api`        | runs the compiled `dist/server.js`            |

MongoDB and `JWT_SECRET` are the only hard requirements — see
[.env.example](.env.example), which documents what each remaining key switches
on and what breaks without it.

## Routes

Every path below is prefixed with `/api`. `protect` means a JWT is required;
`verified` means the account's email must also be verified.

| Prefix            | Notable endpoints                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/auth`           | `POST /signup`, `POST /login`, `GET /me`, `PUT /password`, `POST /forgot-password`, `/verify-reset-otp`, `/reset-password`, `/send-verification`, `/verify-email`, `/send-delete-otp`, `DELETE /account` |
| `/campaigns`      | CRUD; create/update/delete are `verified` and pass the plan's campaign limit                                                          |
| `/icp`            | ICP profile, the guided chat, document generation and download                                                                       |
| `/content`        | `POST /generate`, per-section regeneration, script editing                                                                            |
| `/recon`          | prospect research and the downloadable report                                                                                         |
| `/video`          | `POST /generate` (`verified`, plan-limited), list, fetch, download, delete, status sync                                               |
| `/custom-avatars` | user-created avatars                                                                                                                  |
| `/voice-clones`   | voice cloning                                                                                                                         |
| `/avatars`, `/voices` | HeyGen catalogue and creation (mounted at `/api` directly, not `/api/heygen`)                                                     |
| `/reports`        | campaign reporting                                                                                                                    |
| `/upload`         | file upload to `uploads/`                                                                                                             |
| `/linkedin`       | OAuth URL, callback, status, disconnect — no screen in the app calls these yet                                                        |
| `/billing`        | plans, status, checkout, portal, cancel, resume, usage                                                                                |
| `/health`         | liveness, unauthenticated                                                                                                             |

Two webhooks are mounted outside the JSON body parser because they need the raw
body to verify a signature: `POST /api/billing/webhook` (Stripe) and
`POST /api/heygen/webhook`.

## Conventions worth keeping

- **`asyncHandler` around every async handler AND every async middleware.**
  Express 4 does not await what a handler returns, so an unwrapped async
  function that throws produces an unhandled rejection: the request hangs, and
  Node 20+ ends the process. `protect` is async — a bare `router.use(protect)`
  means one request with an expired token kills the API for everyone. This was
  a live bug in `video`, `heygen` and `linkedin` routes; do not reintroduce it.
- **Third-party SDKs are constructed lazily** — see `config/openai.ts` and
  `services/stripe.service.ts`. Constructing one at module scope turns a missing
  key into a service that will not boot rather than a feature that is switched
  off.
- **`APP_URL` and `CORS_ORIGINS` are different things.** The first is an origin
  plus the SPA's base path (Stripe returns customers to it); the second is a
  list of bare origins. A CORS origin may not contain a path.
- **Errors are thrown, not returned.** `errors/` holds the typed set
  (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`)
  and `middleware/error.middleware.ts` renders them as
  `{ success: false, error, code }`. Successful responses go through
  `utils/response.ts` as `{ success: true, data }` — the client's `api-client.ts`
  unwraps exactly that shape.

## Uploads

`uploads/` is written at runtime (avatar images, generated documents) and is
resolved relative to this package root, which holds for both `src/` under
ts-node-dev and `dist/` in production. On a release-directory deploy that path
changes with every release, so point it at a persistent location with a symlink.
