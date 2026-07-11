// nodes/scoreAndDecide.js
//
// The LLM provides scores and weights, but the final Invest/Pass decision is
// computed here in code. This keeps the decision boundary fixed, auditable,
// and aligned with the assignment requirement: invest or pass.

import { callModel } from "../services/llmClient.js";
import { buildDecisionPrompt, DECISION_CATEGORIES } from "../prompts/decisionPrompt.js";
import { validateDecision } from "../utils/validators.js";
import { ValidationError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";

// Fixed binary decision boundary. Change this number to retune risk appetite.
const INVEST_THRESHOLD = 7.5;

function computeVerdict(finalScore) {
  return finalScore >= INVEST_THRESHOLD ? "Invest" : "Pass";
}

export async function scoreAndDecide(state) {
  const { resolvedCompany, synthesis } = state;

  try {
    if (!synthesis) {
      throw new ValidationError("scoreAndDecide called with no synthesis", {
        code: "MISSING_SYNTHESIS",
        source: "scoreAndDecide",
      });
    }

    const messages = buildDecisionPrompt(resolvedCompany, synthesis);
    const reply = await callModel(messages, {
      responseFormat: "json_object",
      temperature: 0.2,
    });

    let parsed;
    try {
      parsed = JSON.parse(reply);
    } catch {
      throw new ValidationError(`Decision returned invalid JSON: ${reply.slice(0, 200)}`, {
        code: "DECISION_JSON_PARSE_FAILED",
        source: "llm",
      });
    }

    validateDecision(parsed, "scoreAndDecide");

    // Compute final score in code instead of trusting model arithmetic.
    const finalScore = DECISION_CATEGORIES.reduce(
      (sum, cat) => sum + parsed.scores[cat].value * parsed.weights[cat],
      0
    );
    const roundedScore = Math.round(finalScore * 10) / 10;
    const verdict = computeVerdict(roundedScore);

    logger.info({
      msg: "scoreAndDecide succeeded",
      company: resolvedCompany.resolved_name,
      finalScore: roundedScore,
      verdict,
      confidence: parsed.confidence,
    });

    return {
      scores: parsed.scores,
      weights: parsed.weights,
      verdict: {
        verdict,
        finalScore: roundedScore,
        thresholds: { invest: INVEST_THRESHOLD },
        weightRationale: parsed.weight_rationale,
        counterCase: parsed.counter_case,
      },
      confidence: parsed.confidence,
    };
  } catch (err) {
    // A malformed decision is fatal: returning a wrong investment decision is
    // worse than stopping with a clear error.
    return handleError(
      err instanceof ValidationError
        ? err
        : new ValidationError(err.message, { code: "DECISION_FAILED", source: "scoreAndDecide", cause: err }),
      "scoreAndDecide"
    );
  }
}
