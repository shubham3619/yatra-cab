import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const driverProfileSchema = Joi.object({
  homeStand: Joi.string().max(60).optional(),
  servesRoutes: Joi.array().items(objectId).optional(),
  vehicle: Joi.object({
    type: Joi.string().valid('hatchback', 'sedan', 'suv', 'tempo'),
    make: Joi.string().max(40).allow(''),
    model: Joi.string().max(40).allow(''),
    plateNumber: Joi.string().max(15).allow(''),
    color: Joi.string().max(20).allow(''),
    seats: Joi.number().integer().min(2).max(20),
  }).optional(),
  name: Joi.string().max(80).optional(),
  email: Joi.string().email().optional(),
  gender: Joi.string().valid('female', 'male', 'other', 'unspecified').optional(),
});

const place = Joi.object({
  address: Joi.string().max(200).required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

export const topupSchema = Joi.object({
  amount: Joi.number().integer().min(1).max(100000).required(),
});

export const dailyRouteSchema = Joi.object({
  origin: place.required(),
  destination: place.required(),
  departureTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).default('09:00'),
  days: Joi.array().items(Joi.string().valid('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')).default([]),
  bookingType: Joi.string().valid('full_cab', 'seat_share').default('seat_share'),
  vehicleType: Joi.string().valid('hatchback', 'sedan', 'suv', 'tempo').default('sedan'),
  seatsTotal: Joi.number().integer().min(1).max(20).default(3),
  perSeatFare: Joi.number().min(0).default(0),
  fullCabFare: Joi.number().min(0).default(0),
  womenOnly: Joi.boolean().default(false),
  active: Joi.boolean().default(true),
});

export const documentSchema = Joi.object({
  type: Joi.string()
    .valid('driving_licence', 'vehicle_rc', 'aadhaar', 'permit', 'insurance', 'profile_photo')
    .required(),
  number: Joi.string().max(40).allow('').optional(),
  url: Joi.string().max(400).allow('').optional(),
  expiresAt: Joi.date().optional(),
});

export const statusSchema = Joi.object({
  isOnline: Joi.boolean().required(),
});

export const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  rideId: objectId.optional(),
});

export const bidSchema = Joi.object({
  amount: Joi.number().integer().min(1).required(),
  note: Joi.string().max(160).allow('').optional(),
});

export const rateSchema = Joi.object({
  stars: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(300).allow('').optional(),
});
