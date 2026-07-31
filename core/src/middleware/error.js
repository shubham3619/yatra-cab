import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler. Normalises Mongoose errors, hides stack traces in
 * production, and always logs unexpected 5xx errors.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let error = err;

  // Mongoose: bad ObjectId etc.
  if (error.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
  }
  // Mongoose: schema validation.
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.badRequest('Validation failed', details);
  }
  // Mongo: duplicate key.
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`Duplicate value for ${field}`);
  }
  // JWT.
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Invalid or expired token');
  }

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || statusCode < 500;

  if (!isOperational) {
    logger.error(`${req.method} ${req.originalUrl} → ${error.message}`, { stack: error.stack });
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? error.message : 'Something went wrong',
    ...(error.details ? { details: error.details } : {}),
    ...(!env.isProd && !isOperational ? { stack: error.stack } : {}),
  });
}
