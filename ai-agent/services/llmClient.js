import Groq from "groq-sdk";
import { env } from "../config/env.js";
import { ExternalAPIError } from "../errors/externalAPIError.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";


const DEFAULT_MODEL = "openai/gpt-oss-120b";


let client = null;
function getClient() {
    if(!client) {
        client = new Groq({
            apiKey: env.GROQ_API_KEY
        })
    }

    return client;
}



export async function callModel(messages, options = {}) {
    const {
        model = DEFAULT_MODEL,
        temperature = 0.2,
        responseFormat = "text",
    } = options;


    try {
        const response = await getClient().chat.completions.create({
            model,
            messages,
            temperature,
            ...(responseFormat === "json_object" ? { response_format: "json_object" } : {}),
    
        });


        const content = response?.choices?.[0]?.messages?.content;

        if(!content) {
            throw new Error("Groq")
        }

        logger.info({
            msg: "llmClient.callModel succeeded",
            model,
            promptTokens: response?.usage?.prompt_tokens,
            completionsTokens: response?.usage?.completion_tokens,
        });


    } catch (error) {


        return handleError(
            new ExternalAPIError(error.message, {
                code: "LLM_CLIENT_ERROR",
                recoverable: false,
                source: "Groq",
                cause: error
            }),
            "llmClient.callModel"
        );
    }

    if(import.meta.url === `file://${process.argv[1]}`) {

        const test = async () => {
            const reply = await callModel([
                {
                    role: "user",
                    content: "What is the capital of France?"
                }
            ]);

            console.log("model replied: ", reply);
        }

        test();
    }
}