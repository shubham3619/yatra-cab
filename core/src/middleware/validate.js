import { ApiError } from '../utils/apiError.js';

/**
 * Validate a request section against a Joi schema. Strips unknown keys and
 * replaces the section with the coerced value.
 *   router.post('/', validate(schema, 'body'), controller)
 */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[source] = value;
    next();
  };
