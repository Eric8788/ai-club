function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    source: "database",
    enabled: false,
    active: false,
    startsAt: null,
    expiresAt: null,
    serverNow: new Date().toISOString(),
  });
}

module.exports = handler;
