// Express router for Research API endpoints

import { Router } from 'express';
import { generateResearch } from '../controllers/research.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { researchRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// POST /api/research
// Expects { companyName } in body. Returns the AI research verdict.
// Protected by Auth (must be logged in) and Rate Limiter (5 per minute)
router.post('/', requireAuth, researchRateLimiter, generateResearch);

export default router;
