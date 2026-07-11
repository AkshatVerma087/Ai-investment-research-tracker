import { callModel } from "../services/llmClient.js";
import { buildResolvePrompt } from "../prompts/resolvePrompt.js";
import { validateResolvedCompany } from "../utils/validators.js";  
import { ResolutionError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";

export async function resolveCompany(state) {
    const { companyInput } = state;
    
    try {
        if (!companyInput || typeof companyInput !== "string") {
            throw new ResolutionError("companyInput must be a non-empty string", {
                code: "BAD_COMPANY_INPUT",
                source: "user",
                context: "resolveCompany",
            });
        }

        const messages = buildResolvePrompt(companyInput);

        const reply = await callModel(messages, { responseFormat: "json_object" });

        if (typeof reply !== "string") {
            throw new ResolutionError("Model client did not return text", {
                code: "BAD_MODEL_RESPONSE",
                source: "llm",
                context: "resolveCompany",
            });
        }

        let parsed;

        try {
            parsed = JSON.parse(reply);
        } catch (error) {
            throw new ResolutionError(`Failed to parse model response as JSON: ${reply.slice(0, 200)}`, {
                code: "BAD_JSON_RESPONSE",
                source: "llm",
                context: "resolveCompany",
                cause: error,
            });
        }

        validateResolvedCompany(parsed);

        if (parsed.confidence === "low") {
            logger.info({
                msg: "resolvedCompany: low confidence resolution",
                companyInput,
                resolved: parsed.resolved_name
            });
        }


        logger.info({
            msg: "resolvedCompany succeeded",
            companyInput,
            resolvedTicker: parsed.ticker,
            confidence: parsed.confidence
        });

        return {
            resolvedCompany: {
                input: companyInput,
                resolved_name: parsed.resolved_name,
                ticker: parsed.ticker,
                exchange: parsed.exchange,
                is_public: parsed.is_public,
                sector: parsed.sector,
                confidence: parsed.confidence
            }
        };


    } catch (error) {
        const normalizedError = error instanceof ResolutionError ? error : new ResolutionError(error.message, {
                code: "RESOLUTION_FAILED",
                source: "llm",
                context: "resolveCompany",
                cause: error,
            });
        const handledError = handleError(normalizedError, "resolveCompany");

        if (handledError.recoverable) {
            return {
                dataGaps: [handledError.message],
            };
        }

        throw normalizedError;
    }
}
