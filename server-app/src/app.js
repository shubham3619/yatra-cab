import './config/loadEnv.js';
import express from 'express';
import { applySecurity, notFound, errorHandler, ok } from '@yatracab/core';
import { appConfig } from './config/loadEnv.js';

import authRoutes from './modules/auth/authRoutes.js';
import customerRoutes from './modules/customer/customerRoutes.js';
import driverRoutes from './modules/driver/driverRoutes.js';
import sharedRoutes from './modules/shared/sharedRoutes.js';

export function createApp() {
  const app = express();

  applySecurity(app, { allowedOrigins: appConfig.clientUrls, rateLimitMax: 600 });

  app.get('/health', (_req, res) => ok(res, { service: 'server-app', ts: Date.now() }));

  // Public + shared reference data (routes/fares) available to both roles.
  app.use('/api/auth', authRoutes);
  app.use('/api/shared', sharedRoutes);
  app.use('/api/customer', customerRoutes);
  app.use('/api/driver', driverRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
