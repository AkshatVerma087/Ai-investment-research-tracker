import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGraph } from "./graph/buildGraph.js";

export async function runResearchAgent(companyName) {
    try {
        const graph = buildGraph();
        const result = await graph.invoke({ companyInput: companyName });
        return { success: true, data: result };

    } catch (error) {
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
