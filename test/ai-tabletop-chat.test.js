const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const handler = require("../api/ai-tabletop/chat");
const {
  buildResponsesPayload,
  extractResponsesText,
  getReasoningEffort,
} = handler._private;

test("serverless duration covers Wolfcha long-form generation", () => {
  assert.equal(handler.config.maxDuration, 180);
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "vercel.json"), "utf8"));
  assert.equal(vercelConfig.functions["api/ai-tabletop/chat.js"].maxDuration, 180);
});

function createResponseRecorder() {
  return {
    body: undefined,
    headers: {},
    statusCode: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {},
  };
}

test("buildResponsesPayload maps chat JSON mode to Responses API", () => {
  const payload = buildResponsesPayload(
    [
      { role: "system", content: "Return JSON." },
      { role: "user", content: "Say OK." },
    ],
    {
      max_tokens: 64,
      reasoning_effort: "minimal",
      response_format: { type: "json_object" },
      temperature: 0.9,
    },
    "gpt-5.5",
  );

  assert.deepEqual(payload, {
    model: "gpt-5.5",
    input: [{ role: "user", content: "Say OK." }],
    max_output_tokens: 64,
    store: false,
    instructions: "Return JSON.",
    reasoning: { effort: "low" },
    text: { format: { type: "json_object" } },
  });
});

test("buildResponsesPayload preserves temperature for plain-text requests", () => {
  const payload = buildResponsesPayload(
    [{ role: "user", content: "Say OK." }],
    { reasoning_effort: "xhigh", temperature: 0.4 },
    "gpt-5.5",
  );

  assert.equal(payload.reasoning.effort, "xhigh");
  assert.equal(payload.temperature, 0.4);
  assert.equal(payload.store, false);
  assert.equal(payload.text, undefined);
});

test("large Wolfcha output budgets are preserved when reasoning is disabled", () => {
  const payload = buildResponsesPayload(
    [{ role: "user", content: "Generate twelve character profiles." }],
    { max_tokens: 9400, reasoning: { enabled: false }, temperature: 0.4 },
    "gpt-5.5",
  );

  assert.equal(payload.max_output_tokens, 9400);
  assert.equal(payload.reasoning, undefined);
});

test("legacy minimal reasoning is normalized to low", () => {
  assert.equal(getReasoningEffort({ reasoning_effort: "minimal" }), "low");
  assert.equal(getReasoningEffort({ reasoning: { effort: "minimal" } }), "low");
});

test("extractResponsesText reads nested Responses output", () => {
  assert.equal(
    extractResponsesText({
      output: [{ content: [{ type: "output_text", text: "OK" }] }],
    }),
    "OK",
  );
});

test("handler sends secrets only to the server-side Responses endpoint", async () => {
  const originalFetch = global.fetch;
  const originalEnv = {
    AITABLETOP_API_KEY: process.env.AITABLETOP_API_KEY,
    AITABLETOP_API_BASE_URL: process.env.AITABLETOP_API_BASE_URL,
    AITABLETOP_MODEL: process.env.AITABLETOP_MODEL,
  };
  let request;

  process.env.AITABLETOP_API_KEY = "test-token";
  process.env.AITABLETOP_API_BASE_URL = "https://provider.example";
  process.env.AITABLETOP_MODEL = "gpt-5.5";
  global.fetch = async (url, init) => {
    request = { url, init };
    return new Response(
      JSON.stringify({
        id: "resp_test",
        model: "gpt-5.5",
        status: "completed",
        output: [{ content: [{ type: "output_text", text: "OK" }] }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const res = createResponseRecorder();
    await handler(
      {
        method: "POST",
        body: { messages: [{ role: "user", content: "Say OK." }] },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.choices[0].message.content, "OK");
    assert.equal(request.url, "https://provider.example/v1/responses");
    assert.equal(request.init.headers.Authorization, "Bearer test-token");
    assert.equal(
      request.init.headers["x-openai-actor-authorization"],
      "local-image-extension",
    );
    assert.equal(JSON.parse(request.init.body).store, false);
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("handler rejects cross-origin browser requests without exposing CORS", async () => {
  const res = createResponseRecorder();
  await handler(
    {
      method: "POST",
      headers: {
        host: "hub.ericproject.xyz",
        origin: "https://attacker.example",
      },
      body: { messages: [{ role: "user", content: "Say OK." }] },
    },
    res,
  );

  assert.equal(res.statusCode, 403);
  assert.equal(res.headers["Access-Control-Allow-Origin"], undefined);
});

test("handler retries an incomplete reasoning response without reasoning", async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.AITABLETOP_API_KEY;
  const requests = [];
  process.env.AITABLETOP_API_KEY = "test-token";

  global.fetch = async (_url, init) => {
    requests.push(JSON.parse(init.body));
    if (requests.length === 1) {
      return new Response(
        JSON.stringify({
          status: "incomplete",
          incomplete_details: { reason: "max_output_tokens" },
          output: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({
        status: "completed",
        output: [{ content: [{ type: "output_text", text: "OK" }] }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const res = createResponseRecorder();
    await handler(
      {
        method: "POST",
        body: {
          messages: [{ role: "user", content: "Say OK." }],
          max_tokens: 64,
          reasoning_effort: "xhigh",
        },
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.choices[0].message.content, "OK");
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[0].reasoning, { effort: "xhigh" });
    assert.equal(requests[1].reasoning, undefined);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.AITABLETOP_API_KEY;
    else process.env.AITABLETOP_API_KEY = originalKey;
  }
});
