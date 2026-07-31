import Joi from 'joi';

const phone = Joi.string()
  .pattern(/^\+?[0-9]{10,13}$/)
  .message('Enter a valid phone number');

export const requestOtpSchema = Joi.object({
  phone: phone.required(),
  email: Joi.string().email().optional(),
});

export const verifyOtpSchema = Joi.object({
  phone: phone.required(),
  code: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({ 'string.pattern.base': 'OTP must be 6 digits' }),
  // Only used when the account is created on first verify.
  role: Joi.string().valid('customer', 'driver').default('customer'),
  name: Joi.string().max(80).optional(),
  email: Joi.string().email().optional(),
  gender: Joi.string().valid('female', 'male', 'other', 'unspecified').optional(),
  referralCode: Joi.string().max(12).uppercase().optional(),
});
