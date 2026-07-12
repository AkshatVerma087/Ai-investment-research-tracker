import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '../utils/redis.js';
import { logger } from '../utils/logger.js';

// Create a new ratelimiter, that allows 20 requests per 1 day
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 d'),
  analytics: true,
});

export const researchRateLimiter = async (req, res, next) => {
  try {
    // We use the user's ID as the rate limit identifier since they must be logged in.
    const identifier = req.user.id;
    
    const { success, limit, reset, remaining } = await ratelimit.limit(`research_${identifier}`);
    
    res.set('X-RateLimit-Limit', limit.toString());
    res.set('X-RateLimit-Remaining', remaining.toString());
    res.set('X-RateLimit-Reset', reset.toString());

    if (!success) {
      logger.warn({ msg: 'Rate limit exceeded for user', userId: identifier });
      return res.status(429).json({ 
        success: false, 
        message: 'Too many research requests. Please try again in a minute.',
        reset
      });
    }

    next();
  } catch (error) {
    logger.error({ msg: 'Rate limiter error', error: error.message });
    // If Redis fails, we should probably let the request through to avoid complete downtime,
    // or fail securely. We'll fail open for now.
    next();
  }
};
