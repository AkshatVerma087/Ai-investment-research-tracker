// nodes/synthesize.js
//
// Takes state.cleanedData (from aggregateData) and turns it into a
// structured, per-category summary via one LLM call — the first LLM call
// since the resolver. This is the step that enforces the "claim -> evidence
// -> source" and "findings vs. interpretation" discipline from the decision
// theory design: every finding must trace back to cleanedData, not the
// model's training knowledge.
//
// A malformed response here is FATAL (ValidationError, recoverable: false) —
// letting a bad synthesis flow into scoring would mean the final verdict is
// built on ungrounded or garbled analysis, which is worse than stopping.

import { callModel } from "../services/llmClient.js";
import { buildSynthesisPrompt } from "../prompts/synthesisPrompt.js";
import { validateSynthesis } from "../utils/validators.js";
import { ValidationError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";

export async function synthesize(state) {
  const { resolvedCompany, cleanedData } = state;

  try {
    if (!cleanedData) {
      // Shouldn't happen if the graph is wired correctly (aggregateData
      // always runs first), but a defensive check costs nothing and gives
      // a much clearer error than a downstream crash would.
      throw new ValidationError("synthesize called with no cleanedData", {
        code: "MISSING_CLEANED_DATA",
        source: "synthesize",
      });
    }

    const messages = buildSynthesisPrompt(resolvedCompany, cleanedData);
    const reply = await callModel(messages, {
      responseFormat: "json_object",
      temperature: 0.2,
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

    logger.info({
      msg: "synthesize succeeded",
      company: resolvedCompany.resolved_name,
      categoriesReturned: Object.keys(parsed).length,
      notableGaps: parsed.notable_gaps?.length ?? 0,
    });

    return { synthesis: parsed };
  } catch (err) {
    // Both a bad LLM call (fatal, from llmClient) and a bad shape (fatal,
    // ValidationError) should stop the run — synthesis is load-bearing for
    // everything after it, so there's no safe way to "continue with a gap"
    // here the way a single failed data source could.
    return handleError(
      err instanceof ValidationError
        ? err
        : new ValidationError(err.message, { code: "SYNTHESIS_FAILED", source: "synthesize", cause: err }),
      "synthesize"
    );
  }
}