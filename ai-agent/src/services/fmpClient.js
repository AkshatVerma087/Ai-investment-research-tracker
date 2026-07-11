import path from "node:path";
import { fileURLToPath } from "node:url";
import env, { requireEnv } from "../config/env.js";
import { ExternalAPIError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";

const FMP_URL = "https://financialmodelingprep.com/stable";

function getFmpErrorMessage(payload, fallback) {
    return payload?.error
        || payload?.["Error Message"]
        || payload?.message
        || payload?.Information
        || fallback;
}

function buildFmpUrl(endpoint, params) {
    const searchParams = new URLSearchParams({
        ...params,
        apikey: env.FMP_API_KEY,
    });

    return `${FMP_URL}/${endpoint}?${searchParams.toString()}`;
}

export async function getFinancials(ticker) {
    try {
        requireEnv(["FMP_API_KEY"]);

        const symbol = ticker?.trim()?.toUpperCase();

        if (!symbol) {
            throw new Error("Ticker is required");
        }

        const [profileResponse, incomeResponse, ratiosResponse] = await Promise.all([
            fetch(buildFmpUrl("profile", { symbol })),
            fetch(buildFmpUrl("income-statement", { symbol, limit: "5" })),
            fetch(buildFmpUrl("ratios", { symbol, limit: "5" })),
        ]);

        for (const [name, res] of [["profile", profileResponse], ["income statement", incomeResponse], ["ratios", ratiosResponse]]) {
            if (!res.ok) {
                const payload = await res.json();
                throw new Error(getFmpErrorMessage(payload, `FMP request for ${name} failed with status ${res.status}`));
            }
        }

        const [profile, income, ratios] = await Promise.all([
            profileResponse.json(),
            incomeResponse.json(),
            ratiosResponse.json(),
        ]);

        if (!profile?.length) {
            throw new Error(`FMP returned empty profile for ticker ${symbol}`);
        }

        logger.info({
            msg: "fmpClient.getFinancials succeeded",
            ticker: symbol,
            quartersReturned: income?.length ?? 0,
        });

        return {
            data: { profile: profile[0], income, ratios },
            dataGap: null,
        };
    } catch (error) {
        const result = handleError(
            new ExternalAPIError(error.message, {
                code: "FMP_CLIENT_ERROR",
                source: "FMP",
                cause: error,
                recoverable: true,
            }),
            "fmpClient.getFinancials"
        );

        return { data: null, dataGap: result.dataGap };
    }
}

const isDirectRun = path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "");

if (isDirectRun) {
    const { data, dataGap } = await getFinancials("AAPL");

    if (dataGap) {
        console.log("Data gap:", dataGap);
    } else {
        console.log("Company:", data.profile.companyName);
        console.log("Sector:", data.profile.sector);
        console.log("Quarters of income data:", data.income.length);
        console.log("Latest quarter revenue:", data.income[0]?.revenue);
    }
}
