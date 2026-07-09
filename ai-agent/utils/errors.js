export class AgentError extends Error {
    constructor(message, {code, recoverable = false, source = null, cause = null}) {
        super(message);
        this.name = 'AgentError';
        this.code = code;
        this.recoverable = recoverable;
        this.source = source;
        this.cause = cause;
    }
}

export class ExternalAPIError extends AgentError {
    constructor(message, options = {}) {
        super(message, { code: 'EXTERNAL_API_ERROR', ...options });
        this.name = 'ExternalAPIError';
    }
}

export class ExternalAPiError extends ExternalAPIError {}

export class DatabaseError extends AgentError {
    constructor(message, options = {}) {
        super(message, { code: 'DATABASE_ERROR', ...options });
        this.name = 'DatabaseError';
    }
}

export class ValidationError extends AgentError {
    constructor(message, options = {}) {
        super(message, { code: 'VALIDATION_ERROR', ...options });
        this.name = 'ValidationError';
    }
}
