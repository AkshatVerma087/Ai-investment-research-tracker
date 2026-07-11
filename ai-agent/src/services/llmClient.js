// src/services/llmClient.js
//
// This is the ONLY file in the whole project that talks to Groq directly.
// Every node (resolver, synthesis, scoring) calls `callModel()` from here —
// none of them import the Groq SDK themselves. That means if you ever swap
// providers (Groq -> Claude, or add a fallback model), this is the one file
// you touch.

import Groq from "groq-sdk";
import env, { requireEnv } from "../config/env.js";
import { ExternalAPIError } from "../utils/errors.js";
import { handleError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";

// Current supported general-purpose model on Groq (check console.groq.com/docs/models
// before relying on this long-term — Groq deprecates models periodically).
const DEFAULT_MODEL = "openai/gpt-oss-120b";

// Lazily create the client once and reuse it, instead of constructing a new
// Groq instance on every single call.
let client = null;
function getClient() {
  if (!client) {
    requireEnv(["GROQ_API_KEY"]);
    client = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return client;
}

/**
 * Sends a chat completion request to Groq and returns the assistant's reply.
 *
 * @param {Array<{role: string, content: string}>} messages - chat messages,
 *   e.g. [{ role: "system", content: "..." }, { role: "user", content: "..." }]
 * @param {Object} [options]
 * @param {string} [options.model] - override the default model
 * @param {number} [options.temperature] - default 0.2 (we want consistent,
 *   analytical output here, not creative variety)
 * @param {"text"|"json_object"} [options.responseFormat] - "json_object" forces
 *   the model to return valid JSON, used by synthesis/decision nodes later
 * @returns {Promise<string>} the raw text content of the model's reply
 */
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
      // The API call succeeded (no network/auth error) but returned nothing
      // usable — still a real failure our pipeline needs to know about.
      throw new Error("Groq returned an empty response");
    }

    logger.info({
      msg: "llmClient.callModel succeeded",
      model,
      promptTokens: response?.usage?.prompt_tokens,
      completionTokens: response?.usage?.completion_tokens,
    });

    return content;
  } catch (err) {
    // Every failure path funnels through the same typed error + global handler.
    // LLM failures are NOT recoverable: if the model call fails, nothing
    // downstream (synthesis, scoring) can proceed, so this should stop the run.
    const wrappedError = new ExternalAPIError(err.message, {
      code: "LLM_CALL_FAILED",
      recoverable: false,
      source: "groq",
      cause: err,
    });

    handleError(wrappedError, "llmClient.callModel");
    throw wrappedError;
  }
}

/**
 * Same as callModel, but for callers that need parsed JSON back (resolver,
 * synthesis, scoring). If the model returns malformed JSON, this retries
 * ONCE with the bad reply + a corrective instruction appended, since a
 * single retry cheaply fixes most transient JSON slip-ups without hiding
 * a genuinely broken prompt (a second failure still throws).
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} [options] - same as callModel's options
 * @returns {Promise<any>} the parsed JSON object
 * @throws {Error} if the model returns invalid JSON twice in a row
 */
export async function callModelForJson(messages, options = {}) {
  const callOptions = { ...options, responseFormat: "json_object" };

  const firstReply = await callModel(messages, callOptions);
  try {
    return JSON.parse(firstReply);
  } catch {
    logger.info({
      msg: "callModelForJson: invalid JSON, retrying once",
      preview: firstReply.slice(0, 200),
    });
  }

  const retryMessages = [
    ...messages,
    { role: "assistant", content: firstReply },
    {
      role: "user",
      content:
        "Your last response was not valid JSON. Reply again with ONLY a " +
        "valid JSON object matching the requested shape — no other text, " +
        "no markdown code fences.",
    },
  ];

  const retryReply = await callModel(retryMessages, callOptions);
  try {
    return JSON.parse(retryReply);
  } catch {
    throw new Error(`Model returned invalid JSON twice in a row: ${retryReply.slice(0, 200)}`);
  }
}

// ---- Standalone test runner ----
// Lets you check this file works in isolation, before any node depends on it:
//   node src/services/llmClient.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = async () => {
    const reply = await callModel([
      { role: "user", content: "Reply with exactly one word: 'pong'." },
    ]);
    console.log("Model replied:", reply);
  };
  test();
}
