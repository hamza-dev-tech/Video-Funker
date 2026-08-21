/**
 * Copies the MediaPipe vision runtime out of node_modules and into public/.
 *
 * The wasm is ~9.5MB per variant and is a build artefact of a pinned
 * dependency, so committing it would put 19MB of binary into the repository
 * that npm already fetches for us. Copying at build time keeps the repo clean
 * and guarantees the runtime always matches the installed package version —
 * a mismatch between the JS bundle and the wasm is a silent, confusing failure.
 *
 * Self-hosted rather than loaded from a CDN on purpose: the face check runs on
 * a customer's photo, and that is not a request to hand to a third-party host.
 * It also means no runtime dependency on a CDN staying up.
 */
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// npm workspaces hoist to the repo root, but a standalone install keeps it
// local — check both rather than assuming a layout.
const candidates = [
  join(root, "node_modules/@mediapipe/tasks-vision/wasm"),
  join(root, "../node_modules/@mediapipe/tasks-vision/wasm"),
];

const src = candidates.find((p) => existsSync(p));
if (!src) {
  // Not fatal. The face check degrades to "could not check" and the wizard
  // still works; failing the build over an optional enhancement would be worse.
  console.warn("[vision] @mediapipe/tasks-vision not found — face check will be unavailable");
  process.exit(0);
}

const dest = join(root, "public/vision/wasm");
mkdirSync(dest, { recursive: true });

let copied = 0;
let bytes = 0;
for (const name of readdirSync(src)) {
  const from = join(src, name);
  const to = join(dest, name);
  // Skip files already copied at the same size: this runs before every dev
  // start, and re-copying 19MB each time is a pointless delay.
  if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
  copyFileSync(from, to);
  copied++;
  bytes += statSync(from).size;
}

console.log(
  copied
    ? `[vision] copied ${copied} file(s), ${(bytes / 1024 / 1024).toFixed(1)}MB -> public/vision/wasm`
    : "[vision] wasm already up to date"
);
