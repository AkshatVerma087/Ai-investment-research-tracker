// Environment variables configuration and validation.
// Uses Zod to define a schema for the required environment variables.
// It strictly validates the variables on application startup.
// If validation fails, it prevents the app from starting and logs the exact missing/invalid fields.

import { z } from 'zod';
import 'dotenv/config';

// Zod schema defining the expected environment variables and their types/defaults.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  DATABASE_URL: z.string().optional(),
});

// Parse the environment variables against the schema
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:\n', _env.error.format());
  process.exit(1); // Exit the process immediately if validation fails
}

// Export the validated environment variables object.
// Always import `env` from this file instead of using process.env directly.
export const env = _env.data;
