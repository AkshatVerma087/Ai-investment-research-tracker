import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGraph } from "./src/graph/buildGraph.js";
import { backendLogger } from "./src/utils/logger.js";

export async function runResearchAgent(companyName) {
    try {
        backendLogger.info({ msg: "research run started", companyName });

        const graph = buildGraph();
        const result = await graph.invoke({ companyInput: companyName });

        backendLogger.info({
            msg: "research run completed",
            companyName,
            verdict: result?.verdict?.verdict ?? null,
            finalScore: result?.verdict?.finalScore ?? null,
        });

        return { success: true, data: result };

    } catch (error) {
        backendLogger.error({
            msg: "research run failed",
            companyName,
            code: error.code ?? "UNKNOWN_ERROR",
            message: error.message,
            source: error.source ?? null,
            stack: error.stack ?? null,
        });

        return {
            success: false,
            error: {
                code: error.code ?? "UNKNOWN_ERROR",
                message: error.message,
                source: error.source ?? null,
            }
        };
    }
}

const isDirectRun = path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "");

if (isDirectRun) {
    const companyName = process.argv[2] ?? "tesla";
    const result = await runResearchAgent(companyName);
    console.log(JSON.stringify(result, null, 2));
}
