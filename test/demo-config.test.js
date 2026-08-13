const assert = require("node:assert/strict");
const test = require("node:test");

const handler = require("../api/demo-config");

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
  };
}

test("demo config disables the unavailable database-backed demo mode", () => {
  const res = createResponseRecorder();
  handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.equal(res.body.enabled, false);
  assert.equal(res.body.active, false);
  assert.match(res.body.serverNow, /^\d{4}-\d{2}-\d{2}T/);
});
