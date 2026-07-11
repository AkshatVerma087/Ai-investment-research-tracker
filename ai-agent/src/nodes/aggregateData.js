// nodes/aggregateData.js
//
// No external API calls here — pure logic. Takes whatever landed in
// state.rawData (from the three parallel fetch nodes) and turns it into
// one clean, consistent bundle for the synthesis LLM step.
//
// Three jobs: (1) strip low-signal/stale noise, (2) normalize into a
// common shape, (3) surface data gaps explicitly rather than hiding them.

import { logger } from "../utils/logger.js";

// ---- News cleaning ----

// Real Tavily results sometimes embed old, unrelated content inside an
// "evergreen" page (e.g. a stock-quote page that lists years of old press
// releases). Neither the `days` filter nor domain exclusion catches this,
// since the PAGE is current even though most of its TEXT isn't. Heuristic:
// if a result's content contains many distinct "Mon DD, YYYY" style dates,
// it's very likely a stale link-list/spam page, not a genuine current article.
function looksLikeStaleLinkDump(content) {
  const dateMatches = content.match(/\b[A-Z][a-z]{2}\.?\s\d{1,2},\s\d{4}\b/g) ?? [];
  const uniqueDates = new Set(dateMatches);
  return uniqueDates.size >= 4; // 4+ distinct dates in one snippet = link-dump pattern
}

function cleanNews(newsResult) {
  if (!newsResult || newsResult.dataGap) {
    return { items: [], gap: newsResult?.dataGap ?? "no news data available" };
  }

  const seenUrls = new Set();
  const items = [];

  for (const r of newsResult.results ?? []) {
    if (seenUrls.has(r.url)) continue; // dedupe by URL
    seenUrls.add(r.url);

    if (looksLikeStaleLinkDump(r.content ?? "")) continue; // drop spam/link-dump pages

    items.push({
      title: r.title,
      url: r.url,
      // truncate — synthesis doesn't need the full page, just enough to summarize
      snippet: (r.content ?? "").slice(0, 600),
      publishedDate: r.publishedDate ?? null,
      recency: r.publishedDate ? "dated" : "undated", // synthesis should treat undated content more cautiously
    });
  }

  return { items, gap: items.length === 0 ? "no usable news after filtering" : null };
}

// ---- Financials cleaning ----

function cleanFinancials(financialsResult) {
  if (!financialsResult || financialsResult.dataGap || !financialsResult.data) {
    return { summary: null, gap: financialsResult?.dataGap ?? "no financial data available" };
  }

  const { profile, income, ratios } = financialsResult.data;

  // Compute simple YoY revenue/net-income deltas across whatever years came back,
  // instead of handing synthesis a raw array it would have to do this math on itself.
  const yearlyTrend = (income ?? [])
    .slice() // don't mutate original
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((row, i, arr) => {
      const prev = arr[i - 1];
      const revenueGrowthPct = prev ? (((row.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1) : null;
      return {
        fiscalYear: row.fiscalYear,
        revenue: row.revenue,
        netIncome: row.netIncome,
        revenueGrowthPct,
      };
    });

  const latestRatios = (ratios ?? [])[0] ?? null;

  return {
    summary: {
      companyName: profile?.companyName,
      sector: profile?.sector,
      currentPrice: profile?.price,
      marketCap: profile?.marketCap,
      description: (profile?.description ?? "").slice(0, 400),
      yearlyTrend,
      latestRatios: latestRatios && {
        peRatio: latestRatios.priceToEarningsRatio,
        debtToEquity: latestRatios.debtToEquityRatio,
        currentRatio: latestRatios.currentRatio,
        netProfitMargin: latestRatios.netProfitMargin,
      },
    },
    gap: null,
  };
}

// ---- Filings cleaning ----

function cleanFilings(filingsResult) {
  if (!filingsResult || filingsResult.dataGap || !filingsResult.data) {
    return { items: [], gap: filingsResult?.dataGap ?? "no filings data available" };
  }

  const items = (filingsResult.data.filings ?? []).map((f) => ({
    form: f.form,
    filedDate: f.filedDate,
    url: f.url,
  }));

  return { items, gap: null };
}

// ---- The node itself ----

export async function aggregateData(state) {
  const { rawData } = state;

  const news = cleanNews(rawData.news);
  const financials = cleanFinancials(rawData.financials);
  const filings = cleanFilings(rawData.filings);

  const newGaps = [news.gap, financials.gap, filings.gap].filter(Boolean);

  logger.info({
    msg: "aggregateData succeeded",
    newsItems: news.items.length,
    filingsItems: filings.items.length,
    hasFinancials: !!financials.summary,
    newGaps,
  });

  return {
    cleanedData: {
      news: news.items,
      financials: financials.summary,
      filings: filings.items,
      asOf: new Date().toISOString().slice(0, 10),
    },
    ...(newGaps.length ? { dataGaps: newGaps } : {}),
  };
}
