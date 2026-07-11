// prompts/synthesisPrompt.js
//
// Kept separate from synthesize.js so wording can be tuned without touching
// control flow. Enforces the "claim -> evidence -> source" discipline from
// the decision-theory design: every finding must be traceable to something
// actually in cleanedData, never filled in from the model's own knowledge.

export function buildSynthesisPrompt(resolvedCompany, cleanedData) {
  return [
    {
      role: "system",
      content:
        "You are a financial research synthesizer. You are given CLEANED, " +
        "ALREADY-SOURCED data about a company — news snippets, a financial " +
        "trend summary, and recent filings. Your job is to summarize what " +
        "this data actually shows, organized by category. " +
        "\n\nSTRICT RULES:\n" +
        "1. Every finding must be traceable to something in the provided " +
        "data. Do not add outside facts from your own knowledge.\n" +
        "2. Separate FINDINGS (what the data literally shows) from " +
        "INTERPRETATION (what you think it means). Never blend them.\n" +
        "3. If the data for a category is thin or missing, say so — do not " +
        "fill the gap with a guess.\n" +
        "4. Respond with ONLY a JSON object, no markdown, no extra text, " +
        "matching exactly this shape:\n" +
        `{
  "growth": { "findings": [string], "interpretation": string },
  "profitability": { "findings": [string], "interpretation": string },
  "valuation": { "findings": [string], "interpretation": string },
  "sentiment_and_news": { "findings": [string], "interpretation": string },
  "risk": { "findings": [string], "interpretation": string },
  "notable_gaps": [string]
}` +
        "\nEach finding string should read like a sourced analyst note, " +
        'e.g. "Revenue declined 2.9% YoY in FY2025 (FMP income statement)." ' +
        "Keep interpretation to 1-3 sentences per category.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          company: resolvedCompany.resolved_name,
          ticker: resolvedCompany.ticker,
          sector: resolvedCompany.sector,
          cleanedData,
        },
        null,
        2
      ),
    },
  ];
}