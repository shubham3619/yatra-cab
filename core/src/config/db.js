import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB. Retries a few times so `docker compose up` + app start
 * in any order still converges. Registers all models via the barrel import.
 */
export async function connectDB(uri = env.mongoUri, { retries = 5, delayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      logger.info(`MongoDB connected → ${redact(uri)}`);
      return mongoose.connection;
    } catch (err) {
      logger.warn(`MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

function redact(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}
