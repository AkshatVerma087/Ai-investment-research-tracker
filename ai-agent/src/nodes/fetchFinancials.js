// nodes/fetchFinancials.js
//
// Thin wrapper around fmpClient. Skips the call entirely if the resolver
// already determined the company is private — FMP has no data for it,
// so there's no point spending an API call to find that out again.

import { getFinancials } from "../services/fmpClient.js";

export async function fetchFinancials(state) {
  const { resolvedCompany } = state;

  if (!resolvedCompany.is_public || !resolvedCompany.ticker) {
    return {
      rawData: {
        financials: { data: null, dataGap: "skipped: company is not public" },
      },
    };
  }

  const { data, dataGap } = await getFinancials(resolvedCompany.ticker);

  return {
    rawData: { financials: { data, dataGap } },
    ...(dataGap ? { dataGaps: [dataGap] } : {}),
  };
}