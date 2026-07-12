# Quantix Backend

The backend of Quantix is a robust **Node.js + Express.js** server that acts as the central nervous system of the application. It manages secure user authentication, stores historical chat data, and orchestrates requests between the user and the AI Agent.

## 🚀 Tech Stack
- **Server**: Node.js & Express.js
- **Database**: PostgreSQL (managed via Prisma ORM)
- **Authentication**: JWT (Access & Refresh tokens) via HttpOnly Cookies
- **OAuth**: Google Auth Library
- **Rate Limiting**: Upstash Redis
- **Logging**: Pino & Pino-HTTP

## ⚙️ Environment Variables

Create a `.env` file with the following keys:

```env
PORT=5000
NODE_ENV=development

# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/quantix?schema=public"

# Cross-Origin Resource Sharing (Frontend URL)
FRONTEND_URL=http://localhost:3000

# Authentication Secrets
JWT_SECRET=super_secret_key
JWT_REFRESH_SECRET=super_secret_refresh_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id_here

# Internal Communication
# This must match the INTERNAL_API_KEY in the AI Agent's .env file
INTERNAL_API_KEY=shared_secret_between_backend_and_agent
AI_AGENT_URL=http://localhost:5001

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

## 🛠️ Database Setup (Prisma)

Before running the server, you must generate the Prisma client and push the schema to your database:

```bash
# Generate the Prisma Client
npx prisma generate

# Push the schema to your PostgreSQL database to create tables
npx prisma db push
```

## 🏃‍♂️ Running the Server

```bash
# Install dependencies
npm install

# Run in development mode (auto-restarts on save)
npm run dev

# Run in production mode
npm start
```
