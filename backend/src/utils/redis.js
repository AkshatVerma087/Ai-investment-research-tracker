// Configures and exports the Upstash Redis client.
// This client interacts with the Redis database via REST, which is optimal for serverless environments.
// It is used primarily for rate-limiting and caching AI agent responses.

import { Redis } from '@upstash/redis';
import 'dotenv/config';

// The Upstash Redis client instance.
// Automatically configured using the UPSTASH_REDIS_REST_URL and TOKEN from the environment variables.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
