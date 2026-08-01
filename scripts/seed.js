// Seed the YatraCab database (routes, demo accounts, wallets, referrals, rides).
//   npm run seed          (from the repo root; reads MONGODB_URI from .env)
//   SEED_DEMO_EMAIL=you@example.com npm run seed   (put your email on demo accounts)
//
// All seeded accounts log in with OTP 123456 in dev / demo mode.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(dir, '../.env') });

const { connectDB, disconnectDB, logger, seedDatabase } = await import('@yatracab/core');

async function run() {
  await connectDB();
  await seedDatabase({ demoEmail: process.env.SEED_DEMO_EMAIL, clear: true });
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Seed failed: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
