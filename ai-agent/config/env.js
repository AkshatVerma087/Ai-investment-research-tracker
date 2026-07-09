import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
    "PORT",
    "GROQ_API_KEY",
    "TAVILY_API_KEY",
    "FMP_API_KEY",
    "DATABASE_URL"
];

const missingEnvVars = requiredEnvVars.filter((key) => {
    return !process.env[key] || process.env[key].trim() === '';
});

if(missingEnvVars.length > 0) {
    throw new Error(
        `Missing required credentials: ${missingEnvVars.join(', ')}`
    );
}

const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    FMP_API_KEY: process.env.FMP_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
}

export default env;