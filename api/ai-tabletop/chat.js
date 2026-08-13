const DEFAULT_BASE_URL = "https://jp-api.zhexueqi.xyz";
const DEFAULT_MODEL = "gpt-5.5";
const DEFAULT_REASONING_EFFORT = "low";
const DEFAULT_ACTOR_AUTHORIZATION = "local-image-extension";
const MAX_TOKENS_LIMIT = 12_000;
const MAX_MESSAGES = 100;
const MAX_INPUT_CHARS = 120_000;
const UPSTREAM_TIMEOUT_MS = 170_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 40;
const REASONING_EFFORTS = new Set(["low", "medium", "high", "xhigh"]);
const RETRYABLE_UPSTREAM_STATUSES = new Set([502, 503, 504]);
const rateLimitBuckets = new Map();

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function clampNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

function getReasoningEffort(body) {
  if (body?.reasoning && typeof body.reasoning === "object") {
    if (body.reasoning.enabled === false) return null;
    if (body.reasoning.effort === "minimal") return "low";
    if (REASONING_EFFORTS.has(body.reasoning.effort)) return body.reasoning.effort;
  }

  if (body?.reasoning_effort === "minimal") return "low";
  if (REASONING_EFFORTS.has(body?.reasoning_effort)) return body.reasoning_effort;

  const envEffort = process.env.AITABLETOP_REASONING_EFFORT;
  if (envEffort === "off" || envEffort === "none" || envEffort === "false") return null;
  if (envEffort === "minimal") return "low";
  if (REASONING_EFFORTS.has(envEffort)) return envEffort;

  return DEFAULT_REASONING_EFFORT;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;

  const normalized = [];
  let inputChars = 0;
  for (const message of messages) {
    if (!message || typeof message !== "object") return null;
    if (!["system", "user", "assistant"].includes(message.role)) return null;
    if (typeof message.content !== "string" && !Array.isArray(message.content)) return null;
    inputChars += contentToText(message.content).length;
    if (inputChars > MAX_INPUT_CHARS) return null;
    normalized.push({ role: message.role, content: message.content });
  }
  return normalized;
}

function getHeader(req, name) {
  if (!req?.headers) return "";
  const value = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || "" : String(value || "");
}

function isSameOriginRequest(req) {
  const origin = getHeader(req, "origin");
  if (!origin) return true;

  const forwardedHost = getHeader(req, "x-forwarded-host").split(",")[0].trim();
  const host = forwardedHost || getHeader(req, "host").split(",")[0].trim();
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function getClientIp(req) {
  const forwarded = getHeader(req, "x-forwarded-for").split(",")[0].trim();
  return forwarded || req?.socket?.remoteAddress || "unknown";
}

function consumeRateLimit(req, res) {
  const configuredLimit = clampNumber(
    process.env.AITABLETOP_RATE_LIMIT_PER_MINUTE,
    DEFAULT_RATE_LIMIT_PER_MINUTE,
    10,
    200,
  );
  const limit = Math.round(configuredLimit);
  const now = Date.now();
  const clientIp = getClientIp(req);
  const current = rateLimitBuckets.get(clientIp);
  const bucket = !current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS
    ? { startedAt: now, count: 0 }
    : current;

  bucket.count += 1;
  rateLimitBuckets.set(clientIp, bucket);

  if (rateLimitBuckets.size > 2_000) {
    for (const [key, value] of rateLimitBuckets) {
      if (now - value.startedAt >= RATE_LIMIT_WINDOW_MS) rateLimitBuckets.delete(key);
    }
  }

  const remaining = Math.max(0, limit - bucket.count);
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  if (bucket.count <= limit) return true;

  const retryAfterSeconds = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - bucket.startedAt)) / 1_000));
  res.setHeader("Retry-After", String(retryAfterSeconds));
  sendJson(res, 429, { error: "Too many AI requests" });
  return false;
}

function contentToText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (!part || typeof part !== "object") return "";
      if (typeof part.text === "string") return part.text;
      if (typeof part.content === "string") return part.content;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function buildResponsesPayload(messages, body, model) {
  const instructions = messages
    .filter((message) => message.role === "system")
    .map((message) => contentToText(message.content))
    .filter(Boolean)
    .join("\n\n");

  const input = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role,
      content: contentToText(message.content),
    }))
    .filter((message) => message.content);

  if (input.length === 0 && instructions) {
    input.push({ role: "user", content: "Continue." });
  }

  const payload = {
    model,
    input,
    max_output_tokens: Math.round(clampNumber(body.max_tokens, 512, 1, MAX_TOKENS_LIMIT)),
    store: false,
  };

  if (instructions) {
    payload.instructions = instructions;
  }

  const reasoningEffort = getReasoningEffort(body);
  if (reasoningEffort) {
    payload.reasoning = { effort: reasoningEffort };
  }

  if (body?.response_format?.type === "json_object") {
    payload.text = { format: { type: "json_object" } };
  } else {
    payload.temperature = clampNumber(body.temperature, 0.7, 0, 1.2);
  }

  return payload;
}

function extractResponsesText(payload) {
  if (!payload) return "";
  if (typeof payload.output_text === "string") return payload.output_text;

  const chunks = [];
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.text === "string") chunks.push(item.text);

    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (typeof part === "string") {
        chunks.push(part);
        continue;
      }
      if (!part || typeof part !== "object") continue;
      if (typeof part.text === "string") chunks.push(part.text);
      if (typeof part.content === "string") chunks.push(part.content);
    }
  }

  return chunks.join("\n").trim();
}

function toChatCompletionPayload(responsePayload, model) {
  const content = extractResponsesText(responsePayload);
  return {
    id: responsePayload?.id || `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: responsePayload?.created_at || Math.floor(Date.now() / 1000),
    model: responsePayload?.model || model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: responsePayload?.status === "completed" ? "stop" : responsePayload?.incomplete_details?.reason || null,
      },
    ],
    usage: responsePayload?.usage,
  };
}

function getErrorDetail(payload) {
  if (!payload) return undefined;
  if (typeof payload === "string") return payload.slice(0, 400);
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.error?.message === "string") return payload.error.message;
  if (typeof payload.message === "string") return payload.message;
  return undefined;
}

async function requestUpstream(upstreamUrl, apiKey, payload, signal) {
  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-openai-actor-authorization":
        process.env.AITABLETOP_ACTOR_AUTHORIZATION || DEFAULT_ACTOR_AUTHORIZATION,
    },
    body: JSON.stringify(payload),
    signal,
  });

  const raw = await upstream.text();
  let upstreamPayload = raw;
  if (raw) {
    try {
      upstreamPayload = JSON.parse(raw);
    } catch {
      // Preserve non-JSON upstream errors for a short, sanitized detail message.
    }
  }

  return { upstream, upstreamPayload };
}

async function requestUpstreamWithRetry(upstreamUrl, apiKey, payload, signal) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await requestUpstream(upstreamUrl, apiKey, payload, signal);
      if (attempt === 0 && RETRYABLE_UPSTREAM_STATUSES.has(result.upstream.status)) {
        console.warn("[ai-tabletop/chat] transient upstream error; retrying", result.upstream.status);
        continue;
      }
      return result;
    } catch (error) {
      lastError = error;
      if (attempt === 0 && error?.name !== "AbortError") {
        console.warn("[ai-tabletop/chat] transient network error; retrying");
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error("AI upstream request failed");
}

function shouldRetryWithoutReasoning(status, payload) {
  if (status !== 400 && status !== 422) return false;
  const detail = String(getErrorDetail(payload) || "").toLowerCase();
  return detail.includes("reasoning") || detail.includes("effort") || detail.includes("unknown parameter") || detail.includes("unsupported");
}

function shouldRetryIncompleteWithoutReasoning(payload) {
  return payload?.status === "incomplete"
    && payload?.incomplete_details?.reason === "max_output_tokens";
}

async function handler(req, res) {
  if (!isSameOriginRequest(req)) {
    sendJson(res, 403, { error: "Cross-origin AI requests are not allowed" });
    return;
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (!consumeRateLimit(req, res)) return;

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.AITABLETOP_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: "AITABLETOP_API_KEY is not configured" });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const messages = normalizeMessages(body.messages);
  if (!messages) {
    sendJson(res, 400, { error: "messages must be a valid, bounded OpenAI chat message array" });
    return;
  }

  const baseUrl = (process.env.AITABLETOP_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = process.env.AITABLETOP_MODEL || DEFAULT_MODEL;
  const upstreamUrl = `${baseUrl}/v1/responses`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  const payload = buildResponsesPayload(messages, body, model);

  try {
    let { upstream, upstreamPayload } = await requestUpstreamWithRetry(upstreamUrl, apiKey, payload, controller.signal);

    if (!upstream.ok && payload.reasoning && shouldRetryWithoutReasoning(upstream.status, upstreamPayload)) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.reasoning;
      console.warn("[ai-tabletop/chat] upstream rejected reasoning; retrying without reasoning");
      ({ upstream, upstreamPayload } = await requestUpstreamWithRetry(upstreamUrl, apiKey, fallbackPayload, controller.signal));
    }

    if (upstream.ok && payload.reasoning && shouldRetryIncompleteWithoutReasoning(upstreamPayload)) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.reasoning;
      console.warn("[ai-tabletop/chat] reasoning exhausted the output budget; retrying without reasoning");
      ({ upstream, upstreamPayload } = await requestUpstreamWithRetry(
        upstreamUrl,
        apiKey,
        fallbackPayload,
        controller.signal,
      ));
    }

    if (!upstream.ok) {
      console.error("[ai-tabletop/chat] upstream error", upstream.status, getErrorDetail(upstreamPayload));
      sendJson(res, upstream.status, {
        error: "AI upstream request failed",
        status: upstream.status,
      });
      return;
    }

    if (upstreamPayload?.status === "incomplete") {
      console.error(
        "[ai-tabletop/chat] upstream response incomplete",
        upstreamPayload?.incomplete_details?.reason || "unknown",
      );
      sendJson(res, 502, { error: "AI upstream returned an incomplete response" });
      return;
    }

    const responsePayload = toChatCompletionPayload(upstreamPayload, model);
    if (!responsePayload.choices[0].message.content) {
      sendJson(res, 502, { error: "AI upstream returned an empty response" });
      return;
    }

    sendJson(res, 200, responsePayload);
  } catch (error) {
    const isAbort = error?.name === "AbortError";
    console.error("[ai-tabletop/chat] request failed", isAbort ? "timeout" : error);
    sendJson(res, isAbort ? 504 : 502, {
      error: isAbort ? "AI upstream request timed out" : "AI upstream request failed",
    });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = handler;
module.exports.config = {
  maxDuration: 180,
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

module.exports._private = {
  buildResponsesPayload,
  extractResponsesText,
  getReasoningEffort,
  isSameOriginRequest,
  normalizeMessages,
  shouldRetryIncompleteWithoutReasoning,
  toChatCompletionPayload,
};
