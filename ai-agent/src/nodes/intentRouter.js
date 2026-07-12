import { backendLogger } from "../utils/logger.js";
import { callModelForJson } from "../services/llmClient.js";

export async function intentRouter(state) {
  backendLogger.info({ msg: "Routing intent", input: state.companyInput });

  const messages = [
    {
      role: "system",
      content: `You are a routing assistant for an AI investment research agent.
Classify the user's input into one of three categories:
1. "GREETING" - e.g. "hi", "hello", "how are you?", "who are you"
2. "INVESTMENT" - e.g. "analyze apple", "research tsla", "what about microsoft?"
3. "GENERAL" - Irrelevant questions like "who is the pm of india?", "what is 2+2?", "tell me a joke"

Return ONLY a JSON object with exactly this structure:
{
  "intent": "GREETING" | "INVESTMENT" | "GENERAL",
  "message": "If intent is GREETING, write a friendly greeting here. If GENERAL, politely explain you only do investment research. If INVESTMENT, leave empty string."
}`
    },
    { role: "user", content: state.companyInput }
  ];
  
  try {
    const parsed = await callModelForJson(messages);
    
    backendLogger.info({ msg: "Intent routed", intent: parsed.intent });
    
    if (parsed.intent !== "INVESTMENT") {
      return { 
        intent: parsed.intent, 
        message: parsed.message,
        verdict: {
           verdict: "UNKNOWN",
           finalScore: 0
        }
      }; 
    }
    
    return { intent: "INVESTMENT" };
  } catch (e) {
    backendLogger.error({ msg: "Failed to route intent, defaulting to investment", error: e.message });
    return { intent: "INVESTMENT" };
  }
}
