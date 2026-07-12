import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// POST /api/research
export const generateResearch = async (req, res, next) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ success: false, message: 'companyName is required' });
    }

    logger.info({ msg: 'Proxying research request to AI Agent Microservice', companyName });

    // Call the internal AI Agent Microservice
    const aiResponse = await fetch(`${env.AI_AGENT_URL}/internal/generate`, {
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

    logger.info({ msg: 'Research generated and saved', historyId: history.id });

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
    logger.error({ msg: 'Research controller error', error: error.message });
    next(error);
  }
};
