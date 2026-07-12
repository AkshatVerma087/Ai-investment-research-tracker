# Quantix - AI Investment Research Tracker

Quantix is an advanced, full-stack application designed to automate deep financial research using autonomous AI agents. It provides a sleek, highly interactive chat interface where users can ask complex financial questions, and a powerful AI agent will autonomously search the web and financial databases to compile a comprehensive research report.

## 🏗️ System Architecture

Quantix is composed of three microservices that work in harmony:

1. **[Frontend](./frontend/README.md)**: A modern, glassmorphic UI built with Next.js 15, React, and Tailwind CSS.
2. **[Backend](./backend/README.md)**: A robust Express.js API that handles user authentication, database management (Prisma + PostgreSQL), and orchestrates communication between the frontend and the AI agent.
3. **[AI Agent](./ai-agent/README.md)**: A LangGraph-powered autonomous agent utilizing Groq (Llama 3), Tavily, and Financial Modeling Prep APIs to perform multi-step reasoning and deep financial analysis.

## 🚀 Deployment

The entire stack is fully dockerized and configured for one-click deployment on **Render** via a Blueprint (`render.yaml`).

- **Frontend, Backend, and AI Agent** run as scalable Web Services.
- **Database** runs as a managed PostgreSQL instance.
- Environment variables are securely injected at deployment time, with internal secrets automatically generated and shared between services.

## 📚 Service Documentation

For detailed setup instructions, environment variable requirements, and technical documentation for each service, please refer to their respective READMEs:

- 🎨 **[Frontend Documentation ➔](./frontend/README.md)**
- ⚙️ **[Backend Documentation ➔](./backend/README.md)**
- 🧠 **[AI Agent Documentation ➔](./ai-agent/README.md)**
