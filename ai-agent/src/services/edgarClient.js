import path from "node:path";
import { fileURLToPath } from "node:url";
import { ExternalAPIError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";

const USER_AGENT = "AI Investment Research Agent akshatvermagms@gmail.com";

const TICKER_MAP_URL = "https://www.sec.gov/files/company_tickers.json";
const getSubmissionUrl = (cik) => `https://data.sec.gov/submissions/CIK${cik}.json`;

let tickerMapCache = null;

async function getTickerToCikMap() {
    if (tickerMapCache) return tickerMapCache;

    const res = await fetch(TICKER_MAP_URL, {
        headers: {
            "user-agent": USER_AGENT
        }
    });

    if (!res.ok) {
        throw new Error(`SEC ticker map fetch returned ${res.status}`);
    }

    const raw = await res.json();

    tickerMapCache = Object.fromEntries(
        Object.values(raw).map((entry) => [entry.ticker.toUpperCase(), String(entry.cik_str).padStart(10, "0")])
    );
    return tickerMapCache;
}

export async function getFilings(ticker, options = {}) {
    const { limit = 10, forms = ["10-K", "10-Q", "8-K"] } = options;

    try {
        const symbol = ticker?.trim()?.toUpperCase();

        if (!symbol) {
            throw new Error("Ticker is required");
        }

        const tickerMap = await getTickerToCikMap();
        const cik = tickerMap[symbol];

        if (!cik) {
            throw new Error(`No SEC CIK found for ticker "${symbol}" - likely private or non-US filer`);
        }

        const res = await fetch(getSubmissionUrl(cik), { headers: { "user-agent": USER_AGENT } });

        if (!res.ok) {
            throw new Error(`SEC submission fetch returned ${res.status}`);
        }

        const submissions = await res.json();
        const recent = submissions.filings?.recent;

        if (!recent) {
            throw new Error("SEC response missing filings.recent data");
        }

        const allowedForms = new Set(forms.map((form) => form.toUpperCase()));
        const filings = recent.form
            .map((form, i) => ({
                form,
                filedDate: recent.filingDate[i],
                accessionNumber: recent.accessionNumber[i],
                primaryDocument: recent.primaryDocument[i],
                url: `https://www.sec.gov/Archives/edgar/data/${parseInt(cik, 10)}/${recent.accessionNumber[i].replace(/-/g, "")}/${recent.primaryDocument[i]}`,
            }))
            .filter((filing) => allowedForms.has(filing.form.toUpperCase()))
            .slice(0, limit);

        logger.info({
            msg: "edgarClient.getFilings succeeded",
            ticker: symbol,
            cik,
            filingsReturned: filings.length,
        });

        return {
            data: { cik, companyName: submissions.name, filings },
            dataGap: null,
        };
    } catch (error) {
        const result = handleError(
            new ExternalAPIError(error.message, {
                code: "EDGAR_FETCH_FAILED",
                source: "sec_edgar",
                cause: error,
                recoverable: true,
            }),
            "edgarClient.getFilings"
        );

        return { data: null, dataGap: result.dataGap };
    }
}

export const getFillings = getFilings;

const isDirectRun = path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "");

if (isDirectRun) {
    const { data, dataGap } = await getFilings("TSLA", { limit: 5 });

    if (dataGap) {
        console.log("Fetch failed (recoverable):", dataGap);
    } else {
        console.log("Company:", data.companyName, "| CIK:", data.cik);
        data.filings.forEach((filing) => {
            console.log(`- [${filing.filedDate}] ${filing.form} -> ${filing.url}`);
        });
    }
}
