// utils/validators.js
//
// LLMs occasionally return malformed or incomplete JSON even when asked
// nicely. These functions check the shape BEFORE it's trusted anywhere
// downstream — a bad shape here throws a ValidationError (fatal), rather
// than letting garbage silently flow into later stages.

import { ValidationError } from "./errors.js";
import { DECISION_CATEGORIES } from "../prompts/decisionPrompt.js";

export function validateResolvedCompany(obj, context = "validators.validateResolvedCompany") {
  if (!obj || typeof obj !== "object") {
    throw new ValidationError("Resolved company is not an object", { code: "BAD_RESOLUTION_SHAPE", source: "llm", context });
  }

  const requiredFields = ["resolved_name", "is_public", "sector", "confidence"];
  const missing = requiredFields.filter((f) => obj[f] === undefined);
  if (missing.length > 0) {
    throw new ValidationError(
      `Resolved company missing required field(s): ${missing.join(", ")}`,
      { code: "BAD_RESOLUTION_SHAPE", source: "llm", context }
    );
  }

  if (obj.is_public && !obj.ticker) {
    throw new ValidationError(
      "Resolved company marked is_public=true but has no ticker",
      { code: "BAD_RESOLUTION_SHAPE", source: "llm", context }
    );
  }

  if (!["high", "medium", "low"].includes(obj.confidence)) {
    throw new ValidationError(
      `Resolved company has invalid confidence value: "${obj.confidence}"`,
      { code: "BAD_RESOLUTION_SHAPE", source: "llm", context }
    );
  }

  return true;
}

export function validateSynthesis(obj, context = "validators.validateSynthesis") {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new ValidationError("Synthesis is not an object", { code: "BAD_SYNTHESIS_SHAPE", source: "llm", context });
  }

  const requiredCategories = ["growth", "profitability", "valuation", "sentiment_and_news", "risk"];
  const missing = requiredCategories.filter((cat) => !obj[cat]);
  if (missing.length > 0) {
    throw new ValidationError(`Synthesis missing categories: ${missing.join(", ")}`, {
      code: "BAD_SYNTHESIS_SHAPE",
      source: "llm",
      context,
    });
  }

  for (const cat of requiredCategories) {
    const entry = obj[cat];
    if (!Array.isArray(entry.findings)) {
      throw new ValidationError(`Synthesis category "${cat}" missing a findings array`, {
        code: "BAD_SYNTHESIS_SHAPE",
        source: "llm",
        context,
      });
    }
    if (typeof entry.interpretation !== "string") {
      throw new ValidationError(`Synthesis category "${cat}" missing an interpretation string`, {
        code: "BAD_SYNTHESIS_SHAPE",
        source: "llm",
        context,
      });
    }
  }

  if (!Array.isArray(obj.notable_gaps)) {
    throw new ValidationError('Synthesis missing "notable_gaps" array', {
      code: "BAD_SYNTHESIS_SHAPE",
      source: "llm",
      context,
    });
  }

  return true;
}

export function validateDecision(obj, context = "validators.validateDecision") {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new ValidationError("Decision is not an object", { code: "BAD_DECISION_SHAPE", source: "llm", context });
  }

  const { scores, weights, confidence, counter_case: counterCase } = obj;

  if (!scores || typeof scores !== "object") {
    throw new ValidationError("Decision missing scores object", { code: "BAD_DECISION_SHAPE", source: "llm", context });
  }
  if (!weights || typeof weights !== "object") {
    throw new ValidationError("Decision missing weights object", { code: "BAD_DECISION_SHAPE", source: "llm", context });
  }

  const missingScores = DECISION_CATEGORIES.filter((cat) => scores[cat] === undefined);
  if (missingScores.length > 0) {
    throw new ValidationError(`Decision missing score(s) for: ${missingScores.join(", ")}`, {
      code: "BAD_DECISION_SHAPE",
      source: "llm",
      context,
    });
  }

  for (const cat of DECISION_CATEGORIES) {
    const entry = scores[cat];
    if (typeof entry.value !== "number" || entry.value < 1 || entry.value > 10) {
      throw new ValidationError(`Decision score "${cat}" must be a number 1-10, got: ${entry.value}`, {
        code: "BAD_DECISION_SHAPE",
        source: "llm",
        context,
      });
    }
    if (typeof entry.justification !== "string" || entry.justification.trim().length === 0) {
      throw new ValidationError(`Decision score "${cat}" missing a justification string`, {
        code: "BAD_DECISION_SHAPE",
        source: "llm",
        context,
      });
    }
  }

  const missingWeights = DECISION_CATEGORIES.filter((cat) => typeof weights[cat] !== "number");
  if (missingWeights.length > 0) {
    throw new ValidationError(`Decision missing numeric weight(s) for: ${missingWeights.join(", ")}`, {
      code: "BAD_DECISION_SHAPE",
      source: "llm",
      context,
    });
  }

  // Guardrail: no single category may dominate the decision.
  const overweight = DECISION_CATEGORIES.filter((cat) => weights[cat] > 0.35);
  if (overweight.length > 0) {
    throw new ValidationError(
      `Decision weight(s) exceed the 0.35 cap: ${overweight.map((c) => `${c}=${weights[c]}`).join(", ")}`,
      { code: "WEIGHT_GUARDRAIL_VIOLATED", source: "llm", context }
    );
  }

  // Weights should sum to ~1 — allow small float tolerance rather than
  // demanding an exact 1.0, since the LLM is doing this arithmetic itself.
  const weightSum = DECISION_CATEGORIES.reduce((sum, cat) => sum + weights[cat], 0);
  if (Math.abs(weightSum - 1) > 0.03) {
    throw new ValidationError(`Decision weights sum to ${weightSum.toFixed(3)}, expected ~1.0`, {
      code: "BAD_DECISION_SHAPE",
      source: "llm",
      context,
    });
  }

  if (!["high", "medium", "low"].includes(confidence)) {
    throw new ValidationError(`Decision has invalid confidence value: "${confidence}"`, {
      code: "BAD_DECISION_SHAPE",
      source: "llm",
      context,
    });
  }

  if (typeof counterCase !== "string" || counterCase.trim().length === 0) {
    throw new ValidationError('Decision missing "counter_case" string', {
      code: "BAD_DECISION_SHAPE",
      source: "llm",
      context,
    });
  }

  return true;
}