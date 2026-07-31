// Optional zero-install dev database. Starts a REAL MongoDB (mongod) via
// mongodb-memory-server, bound to a fixed port so server-app, server-admin,
// and the seed script all share ONE instance.
//
//   npm run db        (keep this running in its own terminal)
//
// On first run it downloads a mongod binary (cached afterwards). In production
// set MONGODB_URI to MongoDB Atlas and you never need this.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(dir, '../.env') });

const PORT = Number(process.env.DEV_DB_PORT) || 27017;
const DB_NAME = process.env.DEV_DB_NAME || 'yatracab';

const { MongoMemoryServer } = await import('mongodb-memory-server');

console.log('[dev-db] starting MongoDB (first run downloads the mongod binary)…');
const server = await MongoMemoryServer.create({
  instance: { port: PORT, dbName: DB_NAME },
});

console.log('[dev-db] MongoDB ready →', server.getUri(DB_NAME));
console.log('[dev-db] Leave this running. Ctrl+C to stop.');

const stop = async () => {
  console.log('\n[dev-db] stopping…');
  await server.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
