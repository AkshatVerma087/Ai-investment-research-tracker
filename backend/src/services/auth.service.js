// Handles JWT generation and verification.
// Exposes utilities for creating access and refresh tokens.

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Generates an Access Token with a short expiration.
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};

// Generates a Refresh Token with a longer expiration.
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

// Verifies an Access Token.
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

// Verifies a Refresh Token.
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
