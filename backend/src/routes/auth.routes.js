// Express router mapping endpoints to auth controller methods.

import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// POST /api/auth/register
// Expects { email, password, name } in body
router.post('/register', register);

// POST /api/auth/login
// Expects { email, password } in body
router.post('/login', login);

// POST /api/auth/refresh
// Reads httpOnly 'refreshToken' cookie to issue a new accessToken
router.post('/refresh', refresh);

// POST /api/auth/logout
// Clears httpOnly cookies
router.post('/logout', logout);

// GET /api/auth/me
// Protected route to get current user info
router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;
