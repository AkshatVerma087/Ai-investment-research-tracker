import { START, END, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { resolveCompany } from "../nodes/resolveCompany.js";

export function buildGraph() {
    const graph = new StateGraph(AgentState)
        .addNode("resolveCompany", resolveCompany)
        .addEdge(START, "resolveCompany")
        .addEdge("resolveCompany", END);
    

    return graph.compile();
}
