// nodes/synthesize.js
//
// Turns cleanedData into structured findings. Because scoreAndDecide depends
// on this wording, synthesis is cached by exact input hash to avoid repeat-run
// drift from the LLM when the underlying research data has not changed.

import crypto from "node:crypto";
import { callModel } from "../services/llmClient.js";
import { buildSynthesisPrompt } from "../prompts/synthesisPrompt.js";
import { validateSynthesis } from "../utils/validators.js";
import { ValidationError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";
import { getFromCache, setCache } from "../services/cacheClient.js";

const SYNTHESIS_TTL_SECONDS = 60 * 60 * 24;

function hashPayload(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function synthesize(state) {
  const { resolvedCompany, cleanedData } = state;

  try {
    if (!cleanedData) {
      throw new ValidationError("synthesize called with no cleanedData", {
        code: "MISSING_CLEANED_DATA",
        source: "synthesize",
      });
    }

    const cachePayload = { resolvedCompany, cleanedData };
    const cacheKey = `synthesis:${hashPayload(cachePayload)}`;
    const cached = await getFromCache(cacheKey);
    if (cached) {
      logger.info({ msg: "synthesize cache hit", key: cacheKey });
      return { synthesis: cached };
    }

    const messages = buildSynthesisPrompt(resolvedCompany, cleanedData);
    const reply = await callModel(messages, {
      responseFormat: "json_object",
      temperature: 0,
    });

    let parsed;
    try {
      parsed = JSON.parse(reply);
    } catch {
      throw new ValidationError(`Synthesis returned invalid JSON: ${reply.slice(0, 200)}`, {
        code: "SYNTHESIS_JSON_PARSE_FAILED",
        source: "llm",
      });
    }

    validateSynthesis(parsed, "synthesize");
    await setCache(cacheKey, parsed, SYNTHESIS_TTL_SECONDS);

    logger.info({
      msg: "synthesize succeeded",
      company: resolvedCompany.resolved_name,
      categoriesReturned: Object.keys(parsed).length,
      notableGaps: parsed.notable_gaps?.length ?? 0,
    });

    return { synthesis: parsed };
  } catch (err) {
    return handleError(
      err instanceof ValidationError
        ? err
        : new ValidationError(err.message, { code: "SYNTHESIS_FAILED", source: "synthesize", cause: err }),
      "synthesize"
    );
  }
}
