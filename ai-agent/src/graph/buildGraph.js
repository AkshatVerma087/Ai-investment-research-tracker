// graph/buildGraph.js
//
// This is the ONLY file that actually uses LangGraph's orchestration API.
// Everything before this point (services, nodes) is plain JS that knows
// nothing about graphs. Here, we register nodes and wire the edges that
// decide execution order/parallelism/branching.
//
// Currently: just the resolver, wired START -> resolveCompany -> END.
// This is deliberately the smallest possible graph, to prove the mechanism
// works before adding the three parallel fetch nodes on top of it.

import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { resolveCompany } from "../nodes/resolveCompany.js";
import { fetchTavily } from "../nodes/fetchTavily.js";
import { fetchFinancials } from "../nodes/fetchFinancials.js";
import { fetchFilings } from "../nodes/fetchFilings.js";
import { aggregateData } from "../nodes/aggregateData.js";
import { synthesize } from "../nodes/synthesize.js";
import { scoreAndDecide } from "../nodes/scoreAndDecide.js";

import { intentRouter } from "../nodes/intentRouter.js";

export function buildGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("intentRouter", intentRouter)
    .addNode("resolveCompany", resolveCompany)
    .addNode("fetchTavily", fetchTavily)
    .addNode("fetchFinancials", fetchFinancials)
    .addNode("fetchFilings", fetchFilings)
    .addNode("aggregateData", aggregateData)
    .addNode("synthesize", synthesize)
    .addNode("scoreAndDecide", scoreAndDecide)

    .addEdge(START, "intentRouter")
    
    .addConditionalEdges("intentRouter", (state) => {
        if (state.intent !== "INVESTMENT") return END;
        return "resolveCompany";
    })

    // parallel fan-out: three edges leaving the same node run concurrently
    .addEdge("resolveCompany", "fetchTavily")
    .addEdge("resolveCompany", "fetchFinancials")
    .addEdge("resolveCompany", "fetchFilings")

     // fan-in: aggregateData waits for all three to finish
    .addEdge("fetchTavily", "aggregateData")
    .addEdge("fetchFinancials", "aggregateData")
    .addEdge("fetchFilings", "aggregateData")

    .addEdge("aggregateData", "synthesize")
    .addEdge("synthesize", "scoreAndDecide")
    .addEdge("scoreAndDecide", END);

  return graph.compile();
}
