export function buildResolvePrompt(companyInput) {
    return [
        {
            role: "system",
            content:
                "You identify companies precisely. Given a possibly ambiguous or " +
                "informally-written company name, resolve it to the single most " +
                "likely real-world company. Respond with ONLY a valid JSON object, " +
                "no markdown and no extra text. The JSON object must use exactly " +
                "these keys: resolved_name, ticker, exchange, is_public, sector, " +
                "confidence. Use null for ticker or exchange when not applicable. " +
                'confidence must be one of "high", "medium", or "low". If you are ' +
                'not reasonably confident which company is meant, set "confidence" ' +
                'to "low" rather than guessing silently.',
        },
        {
            role: "user",
            content: `Company Input: ${JSON.stringify(companyInput)}`,
        }
    ];
}
