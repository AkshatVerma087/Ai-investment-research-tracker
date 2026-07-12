// Express router for Research API endpoints

import { Router } from 'express';
import { generateResearch, getResearchHistory, getResearchById } from '../controllers/research.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { researchRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// POST /api/research
// Expects { companyName } in body. Returns the AI research verdict.
// Protected by Auth (must be logged in) and Rate Limiter (5 per minute)
router.post('/', requireAuth, researchRateLimiter, generateResearch);

// GET /api/research/history
// Returns paginated list of past research
router.get('/history', requireAuth, getResearchHistory);

// GET /api/research/history/:id
// Returns detailed data for a specific past research
router.get('/history/:id', requireAuth, getResearchById);

export default router;
