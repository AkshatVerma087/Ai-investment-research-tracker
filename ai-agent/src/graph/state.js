import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
    companyInput: Annotation({
        reducer: (existing, update) => update ?? existing,
        default: () => ({}),
    }),

    resolvedCompany: Annotation({
        reducer: (existing, update) => update ?? existing,
        default: () => null,
    }),

    rawData: Annotation({
        reducer: (existing, update) => ({ ...(existing ?? {}), ...(update ?? {}) }),
        default: () => ({}),
    }),

    cleanedData: Annotation({
        reducer: (existing, update) => update ?? existing,
        default: () => null 
    }),

    intent: Annotation({
        reducer: (existing, update) => update ?? existing,
        default: () => null
    }),

    message: Annotation({
        reducer: (existing, update) => update ?? existing,
        default: () => null
    }),

    synthesis: Annotation({
        reducer: (existing, update) => update ?? existing,
        default: () => null 
    }),

    scores: Annotation({
        reducer: (existing, update) => update ?? existing,
        default: () => null 
    }),

    weights: Annotation({
        reducer: (existing, update) => update ?? existing,
        default: () => null 
    }),

    verdict: Annotation({
        reducer: (existing, update) => update ?? existing,
        default: () => null 
    }),

    confidence: Annotation({
        reducer: (existing, update) => update ?? existing,
        default: () => null 
    }),

    dataGaps: Annotation({
        reducer: (existing, update) => [...(existing ?? []), ...(update ?? [])],
        default: () => [],
    }),
})
