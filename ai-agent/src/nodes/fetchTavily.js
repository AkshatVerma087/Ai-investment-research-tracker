// nodes/fetchTavily.js
//
// Thin wrapper: calls the already-tested tavilyClient service, shapes the
// result to match state.js's rawData.news slot, and pushes any failure
// into dataGaps instead of throwing (Tavily failures are recoverable).
// Cached by ticker (falls back to resolved_name if no ticker) — news
// changes fast, so this TTL is short.

import { searchNews } from "../services/tavilyClient.js";
import { getFromCache, setCache } from "../services/cacheClient.js";
import { logger } from "../utils/logger.js";

const NEWS_TTL_SECONDS = 60 * 60 * 2; // 2h — news moves fast, don't hold it long

export async function fetchTavily(state) {
  const { resolvedCompany } = state;
  const cacheKey = `news:${resolvedCompany.ticker ?? resolvedCompany.resolved_name}`;

  const cached = await getFromCache(cacheKey);
  if (cached) {
    logger.info({ msg: "fetchTavily cache hit", key: cacheKey });
    return { rawData: { news: cached } };
  }

  const query = `${resolvedCompany.resolved_name} ${resolvedCompany.ticker ?? ""} news`.trim();
  const { results, dataGap } = await searchNews(query, { days: 90 });

  // Never cache a dataGap — a temporary API failure shouldn't get
  // "remembered" and replayed as a fake miss for the full TTL.
  if (!dataGap) {
    await setCache(cacheKey, { results, dataGap: null }, NEWS_TTL_SECONDS);
  }

  return {
    rawData: { news: { results, dataGap } },
    ...(dataGap ? { dataGaps: [dataGap] } : {}),
  };
}