import path from "node:path";
import { fileURLToPath } from "node:url";
import env, { requireEnv } from "../config/env.js";
import { ExternalAPIError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";

const TAVILY_URL = "https://api.tavily.com/search";

export async function searchNews(query, options = {}) {
    const { maxResults = 5 } = options;

    try {
        requireEnv(["TAVILY_API_KEY"]);

        const response = await fetch(TAVILY_URL, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                api_key: env.TAVILY_API_KEY,
                query,
                max_results: maxResults,
                search_depth: "advanced",
                include_answer: false,
            }),
        });

        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload?.error || `Tavily request failed with status ${response.status}`);
        }

        const results = Array.isArray(payload?.results) ? payload.results : [];

        logger.info({
            msg: "tavilyClient.searchNews succeeded",
            query,
            resultCount: results.length,
        });

        return { results };
    } catch (error) {
        const result = handleError(
            new ExternalAPIError(error.message, {
                code: "TAVILY_CLIENT_ERROR",
                source: "Tavily",
                cause: error,
                recoverable: true,
            }),
            "tavilyClient.searchNews"
        );

        return { results: [], dataGap: result.dataGap };
    }
}

const isDirectRun = path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "");

if (isDirectRun) {
    const { results, dataGap } = await searchNews("Tesla Inc TSLA latest news");

    if (dataGap) {
        console.log("Search failed (recoverable):", dataGap);
    } else {
        console.log(`Got ${results.length} results:`);
        console.log(JSON.stringify(results, null, 2).slice(0, 1000));
    }
}
