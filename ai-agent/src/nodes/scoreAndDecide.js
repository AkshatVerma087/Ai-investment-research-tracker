// nodes/scoreAndDecide.js
//
// The LLM provides scores (1-10 per category) and weights (summing to 1,
// capped at 0.35 each) — but the THRESHOLD that turns a final_score into
// Invest/Hold/Pass is hardcoded here, in code, not decided by the model.
// This is the deliberate design choice from the decision theory: the
// scoring inputs can be adaptive, but the decision boundary stays fixed
// and auditable, so the model can't quietly shift what counts as "good enough."

import { callModel } from "../services/llmClient.js";
import { buildDecisionPrompt, DECISION_CATEGORIES } from "../prompts/decisionPrompt.js";
import { validateDecision } from "../utils/validators.js";
import { ValidationError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";

// Fixed decision boundary — change these two numbers to retune the whole
// agent's risk appetite, without touching any prompt or LLM logic.
const INVEST_THRESHOLD = 7.5;
const PASS_THRESHOLD = 5.0; // below this = Pass; between this and INVEST_THRESHOLD = Hold

function computeVerdict(finalScore) {
  if (finalScore >= INVEST_THRESHOLD) return "Invest";
  if (finalScore >= PASS_THRESHOLD) return "Hold";
  return "Pass";
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

    // final_score is computed here in code, not trusted from the model —
    // same reasoning as the verdict threshold: keep the arithmetic that
    // determines the actual decision auditable and outside the LLM's control.
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
        thresholds: { invest: INVEST_THRESHOLD, pass: PASS_THRESHOLD },
        weightRationale: parsed.weight_rationale,
        counterCase: parsed.counter_case,
      },
      confidence: parsed.confidence,
    };
  } catch (err) {
    // Same reasoning as synthesize.js: a bad or malformed decision is worse
    // than no decision, so both LLM failures and validation failures are
    // fatal here — nothing "recoverable" about a wrong verdict.
    return handleError(
      err instanceof ValidationError
        ? err
        : new ValidationError(err.message, { code: "DECISION_FAILED", source: "scoreAndDecide", cause: err }),
      "scoreAndDecide"
    );
  }
}