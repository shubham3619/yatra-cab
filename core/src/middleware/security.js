import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import express from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Apply the shared security + parsing middleware chain to an Express app.
 * server-admin passes a tighter `rateLimit` and its own origin allowlist.
 *
 * @param {import('express').Express} app
 * @param {object} opts
 * @param {string[]} opts.allowedOrigins
 * @param {number}   [opts.rateLimitMax]  requests / 15 min / IP
 * @param {string}   [opts.jsonLimit]
 */
export function applySecurity(app, { allowedOrigins = [], rateLimitMax = 300, jsonLimit = '1mb' } = {}) {
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin / server-to-server (no Origin header) and whitelisted origins.
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new ApiError(403, `Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: jsonLimit }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize()); // strip $ and . → blocks NoSQL injection
  app.use(hpp()); // HTTP parameter pollution
  app.use(compression());
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.isProd ? 'combined' : 'dev'));
  }

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please slow down.' },
    })
  );
}

// A tight limiter for OTP endpoints (SMS/email bombing defence).
export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Try again later.' },
});
