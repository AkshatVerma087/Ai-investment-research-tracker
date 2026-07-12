// Request handlers for Authentication routes.
// Manages local registration, login, token refresh, and logout using httpOnly cookies.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Helper to set standard cookie options
const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: maxAgeMs,
});

const parseMs = (val) => {
  if (val.endsWith('m')) return parseInt(val) * 60 * 1000;
  if (val.endsWith('d')) return parseInt(val) * 24 * 60 * 60 * 1000;
  return 15 * 60 * 1000; // default 15m
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      }
    });
    logger.info({ msg: 'New user registered', userId: user.id });

    // Generate JWTs
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const accessExpiry = parseMs(process.env.JWT_ACCESS_EXPIRES_IN || '15m');
    const refreshExpiry = parseMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d');

    // Set cookies
    res.cookie('accessToken', accessToken, getCookieOptions(accessExpiry));
    res.cookie('refreshToken', refreshToken, getCookieOptions(refreshExpiry));

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWTs
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const accessExpiry = parseMs(process.env.JWT_ACCESS_EXPIRES_IN || '15m');
    const refreshExpiry = parseMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d');

    // Set cookies
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

// POST /api/auth/refresh
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

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user.id);
    const accessExpiry = parseMs(process.env.JWT_ACCESS_EXPIRES_IN || '15m');
    res.cookie('accessToken', newAccessToken, getCookieOptions(accessExpiry));

    return res.status(200).json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};
