// nodes/fetchFilings.js
//
// Thin wrapper around edgarClient. Same private-company skip logic as
// fetchFinancials.js — SEC EDGAR only has data for US public filers.

import { getFilings } from "../services/edgarClient.js";

export async function fetchFilings(state) {
  const { resolvedCompany } = state;

  if (!resolvedCompany.is_public || !resolvedCompany.ticker) {
    return {
      rawData: {
        filings: { data: null, dataGap: "skipped: company is not public" },
      },
    };
  }

  const { data, dataGap } = await getFilings(resolvedCompany.ticker, { limit: 5 });

  return {
    rawData: { filings: { data, dataGap } },
    ...(dataGap ? { dataGaps: [dataGap] } : {}),
  };
}