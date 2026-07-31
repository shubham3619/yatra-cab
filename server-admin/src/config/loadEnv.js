// Loads repo-root .env before @yatracab/core is imported.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(dir, '../../../.env') });
dotenv.config({ path: path.resolve(dir, '../../.env'), override: false });

export const adminConfig = {
  // ADMIN_PORT for local dev; PORT is injected by the host (Render) in production.
  port: Number(process.env.ADMIN_PORT || process.env.PORT) || 5100,
  clientUrls: (process.env.ADMIN_CLIENT_URLS || 'http://localhost:5175')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
