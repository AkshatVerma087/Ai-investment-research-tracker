# AI Investment Research Agent

## Overview

This project is an AI investment research agent built for the InsideIIM x Altuni AI Labs take-home assignment. It accepts a company name, resolves it to a real company, gathers public market/news/filing data, synthesizes the findings, scores the business across investment criteria, and returns an invest-or-pass decision with reasoning.

The current implementation is a Node.js + LangGraph.js agent exposed as a CLI. The core agent pipeline is complete; a React/Next.js UI and deployment are the main remaining additions for a more polished submission.

## How To Run It

Install dependencies:

```powershell
cd ai-agent
npm install
```

Create `ai-agent/.env` using `ai-agent/.env.example`:

```env
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
FMP_API_KEY=your_financial_modeling_prep_key
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

Run the agent:

```powershell
npm start -- "tesla"
```

You can also run:

```powershell
node src/index.js "Apple"
node src/index.js "Reliance Industries"
npm run cache:test
```

Required services:

- Groq: LLM calls for company resolution, synthesis, and scoring.
- Tavily: web/news search.
- Financial Modeling Prep: public-company profile, income statements, and ratios.
- SEC EDGAR: public filings for US-listed companies.
- Upstash Redis: optional external cache layer for hosted environments.

## How It Works

The agent is orchestrated with LangGraph in `ai-agent/src/graph/buildGraph.js`.

Pipeline:

1. `resolveCompany`: turns informal input like `"tesla"` into a structured company record with ticker, exchange, sector, public/private status, and confidence.
2. `fetchTavily`, `fetchFinancials`, `fetchFilings`: run in parallel after resolution.
3. `aggregateData`: cleans and normalizes raw API outputs into a smaller evidence bundle.
4. `synthesize`: asks the LLM to produce structured findings and interpretations for growth, profitability, valuation, news/sentiment, and risk.
5. `scoreAndDecide`: asks the LLM for category scores and weights, then computes the final score and verdict in code using fixed thresholds.

Important design point: the LLM does not decide the final threshold. It supplies scores, weights, rationale, and counter-case; the final weighted score and verdict are computed in code for auditability.

## Key Decisions And Trade-Offs

- Used LangGraph because the agent has a real workflow: resolve, parallel fetch, aggregate, synthesize, score.
- Used JSON-only LLM prompts plus validators so malformed model responses fail early.
- Kept final score arithmetic outside the LLM to make the decision boundary deterministic.
- Used multiple data sources instead of relying only on web search: FMP for financials, SEC EDGAR for filings, Tavily for news.
- Added `dataGaps` so missing or failed sources are visible instead of hidden.
- Used Upstash Redis instead of a local file cache because hosted deployments may not preserve local disk.
- Current trade-off: the project is CLI-first. A React/Next.js frontend and hosted deployment would improve assignment fit and demo quality.

## Example Runs

Example: `node src/index.js "tesla"`

Observed output summary:

- Resolved company: Tesla, Inc. (`TSLA`, NASDAQ)
- Financial data: revenue, net income trend, ratios, market cap, profile
- Filings: recent 8-K, 10-Q, and 10-K filings
- News: recent market/news snippets
- Synthesis highlighted slowing revenue growth, falling net income after FY2023, high valuation, low leverage, and mixed sentiment
- Final score: `4.2`
- Verdict: `Pass`
- Confidence: `medium`

Why `Pass`: the weighted score was below the invest threshold of `7.5`, mainly due to valuation pressure, declining recent profitability, and elevated risk.

Good additional companies to test:

```powershell
node src/index.js "Apple"
node src/index.js "Microsoft"
node src/index.js "Nvidia"
node src/index.js "Reliance Industries"
```

## What I Would Improve With More Time

- Add a React or Next.js frontend with a company search box, loading states, and a readable investment report.
- Deploy the app online, ideally with Vercel for the frontend and a small Node/Next API route for the agent.
- Add richer financial analysis: cash flow, segment revenue, analyst estimates, valuation comps, and quarterly trends.
- Add source citations directly into the final report.
- Add retry/backoff and rate-limit handling around external APIs.
- Add tests for graph state reducers, validators, and scoring thresholds.
- Store example runs as fixtures so the README can include reproducible outputs without exposing API keys.

## AI Usage

AI assistance was used throughout development for architecture review, debugging ESM import issues, improving LangGraph state handling, writing validators, reviewing error paths, and preparing this README. For bonus submission points, include the LLM chat transcript/logs from the build process alongside the zip.
