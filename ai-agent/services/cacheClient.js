import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireEnv } from "../src/config/env.js";
import { getFromCache, setCache } from "../src/services/cacheClient.js";

// Compatibility wrapper for the old path:
//   node services/cacheClient.js
// The real implementation lives in src/services/cacheClient.js.
export { getFromCache, setCache };

const isDirectRun = path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "");

if (isDirectRun) {
  // Manual cache test needs real Upstash credentials. Normal app usage keeps
  // cache failures recoverable inside src/services/cacheClient.js.
  try {
    requireEnv(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    process.exit();
  }

  const key = "test:standalone";

  console.log("1. Miss before set:", await getFromCache(key));

  await setCache(key, { hello: "world" }, 60);
  console.log("2. Hit after set:", await getFromCache(key));

  await setCache(key, { hello: "world" }, 1);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log("3. Miss after TTL expiry:", await getFromCache(key));
}
