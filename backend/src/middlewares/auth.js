// Express middleware to protect routes by verifying the JWT Access token.
// The token is expected to be provided in the 'accessToken' httpOnly cookie.
// On success, attaches the user payload to req.user.

import { verifyAccessToken } from '../services/auth.service.js';

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};
