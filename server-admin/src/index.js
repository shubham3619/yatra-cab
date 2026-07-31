import './config/loadEnv.js';
import http from 'http';
import { connectDB, disconnectDB, logger } from '@yatracab/core';
import { createAdminApp } from './app.js';
import { adminConfig } from './config/loadEnv.js';

async function bootstrap() {
  await connectDB();
  const app = createAdminApp();
  const server = http.createServer(app);

  server.listen(adminConfig.port, () => {
    logger.info(`server-admin (hardened) listening on http://localhost:${adminConfig.port}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down server-admin…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error(`server-admin failed to start: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
