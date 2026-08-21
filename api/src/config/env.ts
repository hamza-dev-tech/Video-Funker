import dotenv from 'dotenv';
import path from 'path';

// Loads the API environment in two passes so local overrides win:
//   1. .env       — shared defaults committed alongside the code
//   2. .env.local — gitignored, machine-specific secrets and overrides
//
// Resolved from the package root rather than process.cwd() so both
// `ts-node-dev src/server.ts` and `node dist/server.js` find the files
// no matter which directory the process was started from.
//
// Keep this the first import in every entrypoint: several modules read
// process.env at module scope (see linkedin.controller.ts).
const packageRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(packageRoot, '.env') });
dotenv.config({ path: path.join(packageRoot, '.env.local'), override: true });
