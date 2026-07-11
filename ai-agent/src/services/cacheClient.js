// Upstash Redis cache client using the REST API. This avoids relying on a
// persistent local filesystem in hosted environments.
// Public interface stays intentionally small: getFromCache() and setCache().

import path from "node:path";
import { fileURLToPath } from "node:url";
import env, { requireEnv } from "../config/env.js";
import { ExternalAPIError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";

async function redisCommand(command) {
  // Validate lazily so importing cacheClient does not require cache credentials.
  requireEnv(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]);

  const res = await fetch(env.UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    throw new Error(`Upstash returned ${res.status}`);
  }

  const { result } = await res.json();
  return result;
}

/**
 * Reads a cached value. Returns the parsed value, or null on a cache miss.
 * Cache failures are recoverable because callers can fetch fresh data instead.
 *
 * @param {string} key - e.g. "financials:TSLA"
 * @returns {Promise<any|null>}
 */
export async function getFromCache(key) {
  try {
    const raw = await redisCommand(["GET", key]);

    if (raw === null) {
      logger.info({ msg: "cacheClient.getFromCache miss", key });
      return null;
    }

    logger.info({ msg: "cacheClient.getFromCache hit", key });
    return JSON.parse(raw);
  } catch (err) {
    handleError(
      new ExternalAPIError(err.message, {
        code: "CACHE_READ_FAILED",
        recoverable: true,
        source: "upstash",
        cause: err,
      }),
      "cacheClient.getFromCache"
    );

    // Treat any cache error as a miss and fetch fresh instead.
    return null;
  }
}

/**
 * Writes a value to cache with a TTL. Failed cache writes are recoverable
 * because the underlying data was already fetched successfully.
 *
 * @param {string} key
 * @param {any} value - will be JSON.stringify'd
 * @param {number} ttlSeconds
 */
export async function setCache(key, value, ttlSeconds) {
  try {
    await redisCommand(["SET", key, JSON.stringify(value), "EX", String(ttlSeconds)]);
    logger.info({ msg: "cacheClient.setCache stored", key, ttlSeconds });
  } catch (err) {
    handleError(
      new ExternalAPIError(err.message, {
        code: "CACHE_WRITE_FAILED",
        recoverable: true,
        source: "upstash",
        cause: err,
      }),
      "cacheClient.setCache"
    );

    // A failed cache write should never fail the overall run.
  }
}

// Standalone test runner:
//   node src/services/cacheClient.js
const isDirectRun = path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "");

if (isDirectRun) {
  // For the manual cache test, fail fast instead of printing three recoverable
  // cache errors from get/set/get.
  try {
    requireEnv(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    process.exit();
  }

  const test = async () => {
    const key = "test:standalone";

    console.log("1. Miss before set:", await getFromCache(key));

    await setCache(key, { hello: "world" }, 60);
    console.log("2. Hit after set:", await getFromCache(key));

    await setCache(key, { hello: "world" }, 1);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("3. Miss after TTL expiry:", await getFromCache(key));
  };

  test();
}
