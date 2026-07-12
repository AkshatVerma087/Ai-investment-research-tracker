import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { redis } from '../utils/redis.js';

const prisma = new PrismaClient();

// POST /api/research
export const generateResearch = async (req, res, next) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ success: false, message: 'companyName is required' });
    }

    logger.info({ msg: 'Proxying research request to AI Agent Microservice', companyName });

    // Ensure the AI Agent URL has a protocol (Render Internal URLs often look like 'ai-agent-xyz:10000')
    let aiAgentUrl = env.AI_AGENT_URL;
    if (!aiAgentUrl.startsWith('http://') && !aiAgentUrl.startsWith('https://')) {
      aiAgentUrl = `http://${aiAgentUrl}`;
    }

    // Call the internal AI Agent Microservice
    const aiResponse = await fetch(`${aiAgentUrl}/internal/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': env.INTERNAL_API_KEY 
      },
      body: JSON.stringify({ companyName }),
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok || !aiData.success) {
      logger.error({ msg: 'AI Agent Microservice failed', error: aiData });
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate research from AI Agent',
        error: aiData.error
      });
    }

    const { verdict, finalScore } = aiData.data?.verdict || {};

    // Save the result to PostgreSQL ResearchHistory table
    const history = await prisma.researchHistory.create({
      data: {
        userId: req.user.id,
        companyName,
        verdict: verdict || 'UNKNOWN',
        finalScore: finalScore || 0,
        rawOutput: aiData.data || {},
      }
    });

    // Invalidate the user's history cache since there's a new entry
    const cachePattern = `researchHistory:${req.user.id}:*`;
    let cursor = '0';
    do {
      const scanResult = await redis.scan(cursor, { match: cachePattern, count: 100 });
      cursor = scanResult[0];
      const keys = scanResult[1];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');

    logger.info({ msg: 'Research generated, saved, and cache invalidated', historyId: history.id });

    return res.status(200).json({
      success: true,
      message: 'Research generated successfully',
      data: {
        historyId: history.id,
        companyName,
        verdict,
        finalScore,
        rawOutput: aiData.data
      }
    });
  } catch (error) {
    logger.error({ msg: 'Research controller error', error: error.message, stack: error.stack });
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      errorDetail: error.message,
      targetUrl: env.AI_AGENT_URL
    });
  }
};

// GET /api/research/history
export const getResearchHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    const cacheKey = `researchHistory:${userId}:page:${page}:limit:${limit}`;
    
    // Check Redis Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      logger.info({ msg: 'Serving research history from cache', userId, page });
      return res.status(200).json(cachedData);
    }

    // Fetch from Postgres (exclude rawOutput to save bandwidth on lists)
    const [history, total] = await Promise.all([
      prisma.researchHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          companyName: true,
          verdict: true,
          finalScore: true,
          createdAt: true
        }
      }),
      prisma.researchHistory.count({ where: { userId } })
    ]);

    const responseData = {
      success: true,
      data: history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cache the result in Redis for 5 minutes
    await redis.set(cacheKey, responseData, { ex: 300 });

    logger.info({ msg: 'Fetched research history from DB', userId, page });
    return res.status(200).json(responseData);
  } catch (error) {
    logger.error({ msg: 'Get history error', error: error.message });
    next(error);
  }
};

// GET /api/research/history/:id
export const getResearchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const cacheKey = `researchDetail:${id}:${userId}`;

    // Check Redis Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      logger.info({ msg: 'Serving research detail from cache', historyId: id });
      return res.status(200).json({ success: true, data: cachedData });
    }

    const history = await prisma.researchHistory.findFirst({
      where: { id, userId }
    });

    if (!history) {
      return res.status(404).json({ success: false, message: 'Research not found' });
    }

    // Cache for 10 minutes
    await redis.set(cacheKey, history, { ex: 600 });

    logger.info({ msg: 'Fetched research detail from DB', historyId: id });
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    logger.error({ msg: 'Get research by id error', error: error.message });
    next(error);
  }
};
