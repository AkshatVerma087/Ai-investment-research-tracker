// nodes/fetchFinancials.js
//
// Thin wrapper around fmpClient. Skips the call entirely if the resolver
// already determined the company is private — FMP has no data for it,
// so there's no point spending an API call to find that out again.
// Cached by ticker — financials only update quarterly, so a day-long
// TTL is safe.

import { getFinancials } from "../services/fmpClient.js";
import { getFromCache, setCache } from "../services/cacheClient.js";
import { logger } from "../utils/logger.js";

const FINANCIALS_TTL_SECONDS = 60 * 60 * 24; // 24h — financials don't change intraday

export async function fetchFinancials(state) {
  const { resolvedCompany } = state;

  if (!resolvedCompany.is_public || !resolvedCompany.ticker) {
    return {
      rawData: {
        financials: { data: null, dataGap: "skipped: company is not public" },
      },
    };
  }

  const cacheKey = `financials:${resolvedCompany.ticker}`;
  const cached = await getFromCache(cacheKey);
  if (cached) {
    logger.info({ msg: "fetchFinancials cache hit", key: cacheKey });
    return { rawData: { financials: cached } };
  }

  const { data, dataGap } = await getFinancials(resolvedCompany.ticker);

  // Never cache a dataGap — a temporary API failure shouldn't get
  // "remembered" and replayed as a fake miss for the full TTL.
  if (!dataGap) {
    await setCache(cacheKey, { data, dataGap: null }, FINANCIALS_TTL_SECONDS);
  }

  return {
    rawData: { financials: { data, dataGap } },
    ...(dataGap ? { dataGaps: [dataGap] } : {}),
  };
}