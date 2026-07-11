// nodes/scoreAndDecide.js
//
// The LLM provides scores and weights, but the final Invest/Pass decision is
// computed here in code. This keeps the decision boundary fixed, auditable,
// and aligned with the assignment requirement: invest or pass.
//
// temperature is 0 here (not the 0.2 default used elsewhere) specifically
// because this node feeds that fixed decision boundary — identical
// cleanedData should produce identical scores/weights/finalScore on repeat
// runs, or the "auditable" claim above doesn't actually hold. Confirmed via
// real double-run: at 0.2, finalScore drifted 4.0 -> 3.6 and weights shifted
// (growth 0.25->0.20, risk 0.10->0.20) on byte-identical cached input.

import { callModelForJson } from "../services/llmClient.js";
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

    let parsed;
    try {
      parsed = await callModelForJson(messages, { temperature: 0 });
    } catch (err) {
      throw new ValidationError(`Decision returned invalid JSON: ${err.message}`, {
        code: "DECISION_JSON_PARSE_FAILED",
        source: "llm",
        cause: err,
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