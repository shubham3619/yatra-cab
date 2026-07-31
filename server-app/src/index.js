import './config/loadEnv.js';
import http from 'http';
import { connectDB, disconnectDB, logger } from '@yatracab/core';
import { createApp } from './app.js';
import { appConfig } from './config/loadEnv.js';
import { initSockets } from './sockets/index.js';

async function bootstrap() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);

  server.listen(appConfig.port, () => {
    logger.info(`server-app (customer + driver) listening on http://localhost:${appConfig.port}`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down server-app…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force-exit if it hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error(`server-app failed to start: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
