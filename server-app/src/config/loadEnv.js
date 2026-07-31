// Loads the repo-root .env BEFORE @yatracab/core is imported, so core's
// getters see the values. Imported first in index.js / app.js.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(dir, '../../../.env') });
// Optional per-service override.
dotenv.config({ path: path.resolve(dir, '../../.env'), override: false });

export const appConfig = {
  // APP_PORT for local dev; PORT is injected by the host (Render) in production.
  port: Number(process.env.APP_PORT || process.env.PORT) || 5000,
  clientUrls: (process.env.APP_CLIENT_URLS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
