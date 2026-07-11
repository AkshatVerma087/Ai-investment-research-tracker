import { logger } from './logger.js';

export function handleError(error, context = {}) {
    logger.error({
        message: error?.message ?? 'Unknown error',
        code: error?.code ?? 'UNKNOWN_ERROR',
        source: error?.source ?? null,
        context,
        stack: error?.stack ?? null,
    });

    if(error?.recoverable) {
        // Handle recoverable error (e.g., retry logic, user notification)
        return {
            handled: true,
            recoverable: true,
            dataGap: `${error.source ?? 'unknown source'}: ${error.message}`,
            message: error.message,
        };
    }

    return {
        handled: false,
        recoverable: false,
        message: error?.message ?? 'Unknown error',
    };
}