// Request handlers for Authentication routes.
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

const prisma = new PrismaClient();

// Setup JWKS client to fetch Google's public keys for GCIP
const client = jwksClient({
  jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  cache: true,
  rateLimit: true,
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
};

const verifyGcipToken = (token) => {
  return new Promise((resolve, reject) => {
    const projectId = env.FIREBASE_PROJECT_ID;
    if (!projectId) return reject(new Error('FIREBASE_PROJECT_ID is not configured in .env'));
    
    jwt.verify(token, getKey, {
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

// Helper to set standard cookie options
const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: maxAgeMs,
});

// Helper to convert typical JWT expiry string (e.g., '15m', '7d') to milliseconds.
// In a real production app, use 'ms' package, this is simplified.
const parseMs = (val) => {
  if (val.endsWith('m')) return parseInt(val) * 60 * 1000;
  if (val.endsWith('d')) return parseInt(val) * 24 * 60 * 60 * 1000;
  return 15 * 60 * 1000; // default 15m
};

// Handles login via GCIP (Google Cloud Identity Platform) ID Token.
export const gcipLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'idToken is required' });

    // Verify token directly using Google's public keys (No Firebase SDK needed)
    let decodedToken;
    try {
      decodedToken = await verifyGcipToken(idToken);
    } catch (err) {
      logger.warn({ msg: 'GCIP token verification failed', error: err.message });
      return res.status(401).json({ success: false, message: 'Invalid GCIP token' });
    }

    const { user_id: gcipId, email, name } = decodedToken;

    // Find or create user in our DB
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          gcipId,
          name: name || null,
        },
      });
      logger.info({ msg: 'New user created via GCIP', userId: user.id });
    } else if (!user.gcipId) {
      // Link GCIP ID if they already exist but don't have it linked
      user = await prisma.user.update({
        where: { id: user.id },
        data: { gcipId },
      });
    }

    // Generate custom JWTs
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const accessExpiry = parseMs(process.env.JWT_ACCESS_EXPIRES_IN || '15m');
    const refreshExpiry = parseMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d');

    // Set HTTP-only cookies
    res.cookie('accessToken', accessToken, getCookieOptions(accessExpiry));
    res.cookie('refreshToken', refreshToken, getCookieOptions(refreshExpiry));

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
};

// Refreshes the Access Token using a valid Refresh Token cookie.
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Make sure user still exists in DB
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate a new access token
    const newAccessToken = generateAccessToken(user.id);
    const accessExpiry = parseMs(process.env.JWT_ACCESS_EXPIRES_IN || '15m');

    res.cookie('accessToken', newAccessToken, getCookieOptions(accessExpiry));

    return res.status(200).json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    next(error);
  }
};

// Logs out the user by clearing the auth cookies.
export const logout = (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};
