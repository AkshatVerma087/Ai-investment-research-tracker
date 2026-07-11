// utils/validators.js
//
// LLMs occasionally return malformed or incomplete JSON even when asked
// nicely. These functions check the shape BEFORE it's trusted anywhere
// downstream — a bad shape here throws a ValidationError (fatal), rather
// than letting garbage silently flow into later stages.

import { ValidationError } from "./errors.js";

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