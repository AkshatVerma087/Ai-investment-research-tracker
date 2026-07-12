# Quantix AI Agent

The AI Agent is a standalone microservice responsible for the actual "thinking" and research. It is built using **LangGraph.js**, which allows the agent to perform multi-step reasoning, autonomously decide which tools to use, and gracefully recover from API errors.

## 🚀 Tech Stack
- **Framework**: LangGraph.js & LangChain
- **LLM Provider**: Groq (Llama 3 70B) for blazing-fast inference
- **Search Tool**: Tavily API (Optimized for LLM research)
- **Financial Tool**: Financial Modeling Prep (FMP) API
- **Server**: Express.js (Wrapper to expose the agent via HTTP)

## 🧠 How It Works
When a user asks a question, the Backend forwards the prompt to this microservice. The LangGraph agent reads the prompt and enters a `reasoning loop`. It decides whether to search the web (Tavily), lookup financial data (FMP), or compile the final answer. It recursively calls itself until it has gathered enough data to provide a comprehensive markdown report.

## ⚙️ Environment Variables

Create a `.env` file with the following keys:

```env
PORT=5001
NODE_ENV=development

# LLM & Tool API Keys
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
FMP_API_KEY=your_fmp_api_key

# Internal Communication
# This must match the INTERNAL_API_KEY in the Backend's .env file
# It prevents unauthorized access to the agent from the outside world.
INTERNAL_API_KEY=shared_secret_between_backend_and_agent
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start the agent microservice
npm start
```
