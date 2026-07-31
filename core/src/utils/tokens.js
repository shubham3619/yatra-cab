import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, type: 'refresh' },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpires }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

// httpOnly cookie options for the refresh token.
// In production the frontend (Netlify) and API (Render) live on different
// domains, so the cookie must be SameSite=None + Secure to be sent
// cross-site; locally we use lax over http.
export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30d
    path: '/',
  };
}
