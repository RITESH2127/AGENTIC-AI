# SIGNAL.AI — Autonomous Investment Intelligence Agent

> Scan GitHub, news, and social media. Filter signal from noise. Interview a simulated founder. Draft an investment memo. All autonomously.

![SIGNAL.AI Screenshot](https://raw.githubusercontent.com/yourusername/signal-ai/main/preview.png)

---

## What It Does

SIGNAL.AI is a single-page agentic app. It simulates the full workflow of a VC analyst — from spotting a tech trend to writing a conviction memo — without any manual research.

### Four-stage agentic workflow

| Stage | What happens |
|---|---|
| **Intelligence Scan** | Describe a thesis. The agent synthesises signals across GitHub activity, news, research papers, and social momentum. Noise is filtered and each signal scored 0–100. |
| **Trending** | Ranked momentum table showing what's accelerating or cooling in your selected verticals. |
| **Founder Interview** | The agent generates a contextually grounded fictional founder, then conducts (or auto-runs) a full due diligence interview. A live conviction meter tracks Market / Team / Moat scores turn-by-turn. |
| **Investment Memo** | Synthesises all signals + interview transcript into a structured VC memo: exec summary, thesis, risk grid, and a PASS / INVESTIGATE / INVEST recommendation. |

### Autonomous Information Foraging

The **Deep Dive** button on any signal triggers rabbit-hole logic: the agent evaluates which follow-up threads are worth pursuing vs. noise, surfaces key players, competitive landscape, and estimates time to mass adoption — then logs its reasoning in real time.

---

## Tech Stack

- **Frontend**: Vanilla HTML + CSS + JavaScript (zero build step)
- **Backend (optional)**: Node.js + Express proxy to keep your API key server-side
- **Fonts**: DM Mono + Syne via Google Fonts

---

## Quick Start

### Option A — Pure HTML (simplest, no server needed)

1. Clone the repo
   ```bash
   git clone https://github.com/yourusername/signal-ai.git
   cd signal-ai
   ```

2. Create `config.js` from the example
   ```bash
   cp config.js.example config.js
   ```

3. Open `config.js` and paste your Anthropic API key:
   ```js
   const CONFIG = {
     ANTHROPIC_API_KEY: "sk-ant-...",
     API_ENDPOINT: "https://api.anthropic.com/v1/messages",
     ...
   };
   ```

4. Open `index.html` directly in your browser — or use the **Live Server** extension in VS Code (right-click → _Open with Live Server_).

> **Note**: Direct browser API calls require the `anthropic-dangerous-direct-browser-access` header, which is already set in `app.js`. This is fine for local personal use. Do **not** deploy this to a public URL without switching to the proxy (Option B).

---

### Option B — Express Proxy (recommended for anything beyond local use)

The proxy keeps your API key on the server, never in the browser.

1. Clone and install
   ```bash
   git clone https://github.com/yourusername/signal-ai.git
   cd signal-ai
   npm install
   ```

2. Set up your environment
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   PORT=3000
   ```

3. Switch the endpoint in `config.js`:
   ```js
   const CONFIG = {
     ANTHROPIC_API_KEY: "",          // leave blank — key is in .env
     API_ENDPOINT: "/api/messages",  // use the proxy route
     ...
   };
   ```

4. Start the server
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000)

---

## File Structure

```
signal-ai/
├── index.html          # App shell + all CSS
├── app.js              # Agent logic (scan, interview, memo, deep dive)
├── config.js           # API key + endpoint config  ← create from example, never commit
├── config.js.example   # Safe template to commit
├── server.js           # Optional Express proxy
├── package.json
├── .env.example        # Safe template to commit
├── .env                # Real key lives here        ← never commit
└── .gitignore          # Excludes .env and config.js
```

---

## Usage Guide

### Running a Scan

1. Type a thesis or technology area into the search bar (e.g. _"on-device LLM inference"_)
2. Toggle focus area chips (AI/ML, DevTools, BioTech, etc.)
3. Click **▶ Run Intelligence Scan**
4. Watch the Agent Log as signals surface and noise gets filtered

### Deep Dive

On any signal card, click **Deep Dive →** to trigger autonomous rabbit-hole evaluation. The agent decides which threads are worth following and which are distractions.

### Founder Interview

Click **Interview Founder** on a signal to:
- Get an AI-generated contextually grounded founder persona
- Ask your own due diligence questions — or click **Auto Interview** to let the agent run a full session
- Watch the Market / Team / Moat conviction meter update live

### Drafting a Memo

Once an interview is complete, click **Generate Investment Memo** (or **Draft Memo** directly from a signal card). The agent synthesises everything into a structured memo with a final PASS / INVESTIGATE / INVEST recommendation.

---

## Configuration Reference

All configuration lives in `config.js`:

| Key | Description | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `"YOUR_API_KEY_HERE"` |
| `API_ENDPOINT` | Direct Anthropic URL or proxy route | `"https://api.anthropic.com/v1/messages"` |
| `MODEL` | Claude model to use | `"claude-sonnet-4-20250514"` |
| `MAX_TOKENS` | Max tokens per API response | `2000` |

---

## Security

- `config.js` and `.env` are in `.gitignore` — they will **never** be committed
- For any deployment beyond your local machine, always use the Express proxy (Option B) so your key stays server-side
- Do not fork and deploy the direct-browser variant to a public URL

---

## Getting an API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys** → **Create Key**
4. Copy the key and paste it into `config.js` or `.env`

API usage is billed per token. A typical full scan + interview + memo costs roughly 5,000–10,000 tokens (~$0.02–$0.05 at current Sonnet pricing).

---

## Roadmap

- [ ] Real GitHub Trending API integration
- [ ] NewsAPI / HackerNews live feed integration
- [ ] Export memo as PDF
- [ ] Save and compare multiple memos
- [ ] Multi-signal portfolio view
- [ ] Webhook alerts for high-score signals

---

## License

MIT — use freely, attribution appreciated.

---


