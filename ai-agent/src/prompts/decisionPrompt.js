// prompts/decisionPrompt.js
//
// The hybrid scoring design: categories and scale are HARDCODED here (so
// every company is judged on the same fixed rubric, comparable and
// auditable). The LLM only fills in: a score 1-10 per category (justified),
// a weight per category (must sum to 1, none above 0.35), and a counter-case.
// The final verdict threshold is NOT decided by the LLM — that's computed
// in code (scoreAndDecide.js) from a fixed band, so the model can't quietly
// shift the decision boundary.

const CATEGORIES = [
  { key: "growth", label: "Growth", desc: "Revenue/earnings trajectory" },
  { key: "profitability", label: "Profitability", desc: "Margins, cash flow quality" },
  { key: "valuation", label: "Valuation", desc: "Price relative to fundamentals" },
  { key: "moat", label: "Moat", desc: "Competitive durability" },
  { key: "management", label: "Management", desc: "Track record, insider alignment, leadership" },
  { key: "risk", label: "Risk", desc: "Regulatory, concentration, macro exposure (higher score = LOWER risk)" },
];

export function buildDecisionPrompt(resolvedCompany, synthesis) {
  const rubricText = CATEGORIES.map((c) => `- ${c.key} (${c.label}): ${c.desc}`).join("\n");

  return [
    {
      role: "system",
      content:
        "You are an investment decision engine using weighted multi-criteria " +
        "analysis. You are given a structured synthesis (findings + " +
        "interpretation per category, already sourced from research) for one " +
        "company. Your job has three parts:\n\n" +
        "1. SCORE each of these six fixed categories 1-10, based ONLY on the " +
        "synthesis provided (never your own outside knowledge of the company):\n" +
        rubricText +
        "\n\n2. WEIGHT each category by how much it should matter for THIS " +
        "company's business model and sector (weights must sum to exactly 1.0, " +
        "and no single category's weight may exceed 0.35 — this is a hard " +
        "guardrail, do not violate it). Briefly justify the weighting.\n\n" +
        "3. Provide a COUNTER-CASE: the strongest argument against whatever " +
        "your scores imply, stated honestly, not as a throwaway caveat.\n\n" +
        "Also assess CONFIDENCE ('high'|'medium'|'low') based on how complete " +
        "and mutually consistent the underlying research was (check notable_gaps " +
        "and whether findings across categories agree or conflict).\n\n" +
        "Do NOT compute a final verdict or final score yourself — that is " +
        "computed separately from your scores/weights. Respond with ONLY a " +
        "JSON object, no markdown, no extra text, matching exactly this shape:\n" +
        `{
  "scores": {
    "growth": { "value": number, "justification": string },
    "profitability": { "value": number, "justification": string },
    "valuation": { "value": number, "justification": string },
    "moat": { "value": number, "justification": string },
    "management": { "value": number, "justification": string },
    "risk": { "value": number, "justification": string }
  },
  "weights": {
    "growth": number, "profitability": number, "valuation": number,
    "moat": number, "management": number, "risk": number
  },
  "weight_rationale": string,
  "confidence": "high" | "medium" | "low",
  "counter_case": string
}`,
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          company: resolvedCompany.resolved_name,
          ticker: resolvedCompany.ticker,
          sector: resolvedCompany.sector,
          synthesis,
        },
        null,
        2
      ),
    },
  ];
}

export const DECISION_CATEGORIES = CATEGORIES.map((c) => c.key);