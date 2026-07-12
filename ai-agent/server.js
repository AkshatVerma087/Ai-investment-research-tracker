import express from 'express';
import cors from 'cors';
import { runResearchAgent } from './index.js';
import pinoHttp from 'pino-http';
import pino from 'pino';
import dotenv from 'dotenv';
import { requireInternalApiKey } from './middlewares/auth.js';

dotenv.config();

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, ignore: 'pid,hostname' },
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ 
  logger,
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode })
  }
}));



app.post('/internal/generate', requireInternalApiKey, async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ success: false, error: 'companyName is required' });
    }

    logger.info(`Starting research generation for: ${companyName}`);
    
    // Call the original Graph Logic
    const result = await runResearchAgent(companyName);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    logger.error({ msg: 'Agent Endpoint Error', error: error.message });
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`AI Agent Microservice running on http://localhost:${PORT}`);
});
