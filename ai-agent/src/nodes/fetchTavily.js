import { searchNews } from "../services/tavilyClient.js";

export async function fetchTavily(state) {
    const { resolvedCompany } = state;
    const query = `${resolvedCompany.resolved_name} ${resolvedCompany.ticker ?? ""} news`.trim();

    const { results, dataGap } = await searchNews(query, {days: 90});

    return {
        rawData: { news: { results, dataGap }},
        ...(dataGap ? { dataGaps: [dataGap] } : {})
    };
}
