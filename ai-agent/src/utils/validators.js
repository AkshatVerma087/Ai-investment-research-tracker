import { ValidationError } from "./errors.js";

export function validateResolvedCompany(obj, context = "validators.validateResolvedCompany") {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        throw new ValidationError("Resolved company is not an object", { code: "BAD_RESOLUTION_SHAPE", source: "llm", context });
    }

    const requiredFields = ["resolved_name", "is_public", "sector", "confidence"];

    const missing = requiredFields.filter((field) => obj[field] === undefined);
    if (missing.length > 0) {
        throw new ValidationError(`Missing required fields: ${missing.join(", ")}`, { code: "BAD_RESOLUTION_SHAPE", source: "llm", context });
    }

    if (typeof obj.resolved_name !== "string" || obj.resolved_name.trim() === "") {
        throw new ValidationError("resolved_name must be a non-empty string", { code: "BAD_RESOLUTION_SHAPE", source: "llm", context });
    }

    if (typeof obj.is_public !== "boolean") {
        throw new ValidationError("is_public must be a boolean", { code: "BAD_RESOLUTION_SHAPE", source: "llm", context });
    }

    if (typeof obj.sector !== "string" || obj.sector.trim() === "") {
        throw new ValidationError("sector must be a non-empty string", { code: "BAD_RESOLUTION_SHAPE", source: "llm", context });
    }

    if (obj.ticker !== null && obj.ticker !== undefined && typeof obj.ticker !== "string") {
        throw new ValidationError("ticker must be a string or null", { code: "BAD_RESOLUTION_SHAPE", source: "llm", context });
    }

    if (obj.exchange !== null && obj.exchange !== undefined && typeof obj.exchange !== "string") {
        throw new ValidationError("exchange must be a string or null", { code: "BAD_RESOLUTION_SHAPE", source: "llm", context });
    }

    if (obj.is_public && !obj.ticker) {
        throw new ValidationError("Public company must have a ticker", { code: "BAD_RESOLUTION_SHAPE", source: "llm", context });
    }

    if (!["high", "medium", "low"].includes(obj.confidence)) {
        throw new ValidationError(`Invalid confidence value: ${obj.confidence}`, { code: "BAD_RESOLUTION_SHAPE", source: "llm", context });
    }

    return true;

}
