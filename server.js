// ============================================================
//  SIGNAL.AI — Express Proxy Server
//  Keeps your API key server-side, away from the browser.
//
//  Usage:
//    1. npm install
//    2. Add ANTHROPIC_API_KEY to .env
//    3. node server.js
//    4. Open http://localhost:3000
// ============================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Proxy route — forwards requests to Anthropic with the server-side key
app.post("/api/messages", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY not set in .env" } });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: { message: err.message } });
  }
});

app.listen(PORT, () => {
  console.log(`\n  SIGNAL.AI running at http://localhost:${PORT}\n`);
});
