import path from "node:path";
import { fileURLToPath } from "node:url";
import Groq from "groq-sdk";
import env, { requireEnv } from "../config/env.js";
import { ExternalAPIError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

let client = null;

function getClient() {
    if (!client) {
        requireEnv(["GROQ_API_KEY"]);

        client = new Groq({
            apiKey: env.GROQ_API_KEY
        });
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
            ...(responseFormat === "json_object"
                ? { response_format: { type: "json_object" } }
                : {}),
        });

        const content = response?.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("Groq returned an empty response");
        }

        logger.info({
            msg: "llmClient.callModel succeeded",
            model,
            promptTokens: response?.usage?.prompt_tokens,
            completionTokens: response?.usage?.completion_tokens,
        });

        return content;
    } catch (error) {
        const wrappedError = new ExternalAPIError(error.message, {
            code: "LLM_CLIENT_ERROR",
            recoverable: false,
            source: "Groq",
            cause: error,
        });

        handleError(wrappedError, "llmClient.callModel");
        throw wrappedError;
    }
}

const isDirectRun = path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "");

if (isDirectRun) {
    const reply = await callModel([
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ]);

    console.log("model replied:", reply);
}
