import dotenv from "dotenv";

// Load .env once at startup so every service reads config consistently.
dotenv.config({ quiet: true });

// Validate inside service functions, not at import time. That way importing a
// module only fails when that specific service actually needs a credential.
export function requireEnv(requiredEnvVars) {
  const missingEnvVars = requiredEnvVars.filter((key) => {
    return !process.env[key] || process.env[key].trim() === "";
  });

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missingEnvVars.join(", ")}. ` +
      "Check your .env file against .env.example."
    );
  }
}

// Central config object. Keep optional values here too so callers do not read
// process.env directly throughout the codebase.
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "3000",
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  FMP_API_KEY: process.env.FMP_API_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
};

export default env;
