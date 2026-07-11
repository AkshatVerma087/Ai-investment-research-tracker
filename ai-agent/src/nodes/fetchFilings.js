// nodes/fetchFilings.js
//
// Thin wrapper around edgarClient. Same private-company skip logic as
// fetchFinancials.js — SEC EDGAR only has data for US public filers.
// Cached by ticker — filings are infrequent, so the TTL is the longest
// of the three data sources.

import { getFilings } from "../services/edgarClient.js";
import { getFromCache, setCache } from "../services/cacheClient.js";
import { logger } from "../utils/logger.js";

const FILINGS_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days — filings are infrequent

export async function fetchFilings(state) {
  const { resolvedCompany } = state;

  if (!resolvedCompany.is_public || !resolvedCompany.ticker) {
    return {
      rawData: {
        filings: { data: null, dataGap: "skipped: company is not public" },
      },
    };
  }

  const cacheKey = `filings:${resolvedCompany.ticker}`;
  const cached = await getFromCache(cacheKey);
  if (cached) {
    logger.info({ msg: "fetchFilings cache hit", key: cacheKey });
    return { rawData: { filings: cached } };
  }

  const { data, dataGap } = await getFilings(resolvedCompany.ticker, { limit: 5 });

  // Never cache a dataGap — a temporary API failure shouldn't get
  // "remembered" and replayed as a fake miss for the full TTL.
  if (!dataGap) {
    await setCache(cacheKey, { data, dataGap: null }, FILINGS_TTL_SECONDS);
  }

  return {
    rawData: { filings: { data, dataGap } },
    ...(dataGap ? { dataGaps: [dataGap] } : {}),
  };
}