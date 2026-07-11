// nodes/resolveCompany.js
//
// The first node in the graph. Plain function: takes the current state,
// returns a partial update. Knows nothing about LangGraph itself — that's
// the whole point of keeping nodes thin.

import { callModel } from "../services/llmClient.js";
import { buildResolvePrompt } from "../prompts/resolvePrompt.js";
import { validateResolvedCompany } from "../utils/validators.js";
import { ResolutionError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";
import { getFromCache, setCache } from "../services/cacheClient.js";

const RESOLUTION_TTL_SECONDS = 60 * 60 * 24; // 24h — company identity rarely changes

export async function resolveCompany(state) {
  const { companyInput } = state;
  const cacheKey = `resolution:${companyInput.trim().toLowerCase()}`;

  try {
    const cached = await getFromCache(cacheKey);
    if (cached) {
      logger.info({ msg: "resolveCompany cache hit", companyInput });
      return { resolvedCompany: cached };
    }

    const messages = buildResolvePrompt(companyInput);
    const reply = await callModel(messages, { responseFormat: "json_object" });

    let parsed;
    try {
      parsed = JSON.parse(reply);
    } catch {
      throw new ResolutionError(`Model returned invalid JSON: ${reply.slice(0, 200)}`, {
        code: "RESOLUTION_JSON_PARSE_FAILED",
        source: "llm",
      });
    }

    validateResolvedCompany(parsed, "resolveCompany");

    if (parsed.confidence === "low") {
      // Not necessarily fatal, but worth being loud about — a low-confidence
      // resolution means everything downstream is built on shaky ground.
      logger.info({
        msg: "resolveCompany: low confidence resolution",
        companyInput,
        resolved: parsed.resolved_name,
      });
    }

    logger.info({
      msg: "resolveCompany succeeded",
      companyInput,
      resolvedTicker: parsed.ticker,
      confidence: parsed.confidence,
    });

    const resolvedCompany = {
      input: companyInput,
      resolved_name: parsed.resolved_name,
      ticker: parsed.ticker,
      exchange: parsed.exchange,
      is_public: parsed.is_public,
      sector: parsed.sector,
      confidence: parsed.confidence,
    };

    // Never cache a low-confidence guess — replaying a shaky resolution
    // for 24h is worse than just re-asking the model next time.
    if (parsed.confidence !== "low") {
      await setCache(cacheKey, resolvedCompany, RESOLUTION_TTL_SECONDS);
    }

    return { resolvedCompany };
  } catch (err) {
    // Resolution failure is FATAL (recoverable: false by default on
    // ResolutionError) — nothing downstream can run without an identity,
    // so this re-throws and stops the graph run entirely.
    return handleError(
      err instanceof ResolutionError
        ? err
        : new ResolutionError(err.message, { code: "RESOLUTION_FAILED", source: "resolveCompany", cause: err }),
      "resolveCompany"
    );
  }
}