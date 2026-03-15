// ============================================================
//  SIGNAL.AI — Core Agent Logic
// ============================================================

const state = {
  scanning: false,
  interviewing: false,
  signals: [],
  trends: [],
  chatLog: [],
  currentSignal: null,
  founderContext: null,
  interviewDone: false,
};

// ── UI helpers ────────────────────────────────────────────────

function log(text, type = "info") {
  const la = document.getElementById("log-area");
  const icons = { info: "◈", signal: "◉", warn: "◆", ai: "◈" };
  const el = document.createElement("div");
  el.className = `log-entry ${type}`;
  el.innerHTML = `<div class="log-icon">${icons[type] || "◈"}</div><div class="log-text">${text}</div>`;
  la.appendChild(el);
  la.scrollTop = la.scrollHeight;
}

function setStatus(text, active = true) {
  document.getElementById("status-text").textContent = text;
  document.getElementById("main-pulse").className = "pulse" + (active ? " active" : "");
}

function switchTab(name, el) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("pane-" + name).classList.add("active");
}

function toggleChip(el) {
  el.classList.toggle("active");
}

function setBadge(id, n) {
  document.getElementById("badge-" + id).textContent = n;
}

function setSignalMeter(id, val, label) {
  document.getElementById("sig-" + id).style.width = val + "%";
  document.getElementById("sig-" + id + "-val").textContent = label;
}

function animateSignalMeters(data) {
  setTimeout(() => setSignalMeter("github", data.github, data.github + "%"), 200);
  setTimeout(() => setSignalMeter("news", data.news, data.news + "%"), 500);
  setTimeout(() => setSignalMeter("social", data.social, data.social + "%"), 800);
  setTimeout(() => setSignalMeter("papers", data.papers, data.papers + "%"), 1100);
}

// ── API call ──────────────────────────────────────────────────

async function callClaude(systemPrompt, userMessage, maxTokens = CONFIG.MAX_TOKENS) {
  const headers = {
    "Content-Type": "application/json",
  };

  // Direct browser access — only used locally, never in production
  if (CONFIG.API_ENDPOINT.startsWith("https://api.anthropic.com")) {
    headers["x-api-key"] = CONFIG.ANTHROPIC_API_KEY;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }

  const resp = await fetch(CONFIG.API_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: CONFIG.MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

function safeParseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse JSON response from model.");
  }
}

// ── SCAN ──────────────────────────────────────────────────────

async function runScan() {
  if (state.scanning) return;
  state.scanning = true;

  const query = document.getElementById("scan-query").value.trim() || "AI infrastructure tooling";
  const topics = [...document.querySelectorAll(".chip.active")].map((c) => c.textContent).join(", ");
  const btn = document.getElementById("scan-btn");
  btn.disabled = true;
  btn.textContent = "◌ Scanning...";
  setStatus("Scanning...", true);

  log(`Starting scan: <b>"${query}"</b>`, "signal");
  log(`Focus areas: ${topics}`, "info");

  const systemPrompt = `You are an autonomous venture capital intelligence agent. You scan tech signals, filter noise from true market signals, and identify investment opportunities.

RESPOND ONLY WITH VALID JSON. No markdown, no explanation, no code blocks. Raw JSON only.

Return this exact structure:
{
  "signals": [
    {
      "id": "sig1",
      "title": "string (compelling signal headline)",
      "category": "one of: GitHub Surge, Research Breakout, Founder Activity, Market Shift, Social Momentum",
      "score": 85,
      "scoreLabel": "HIGH",
      "trend": "up",
      "summary": "2-3 sentence description of the signal and why it matters for investors",
      "evidence": ["evidence point 1", "evidence point 2", "evidence point 3"],
      "tags": ["tag1", "tag2", "tag3"],
      "tagHeat": ["hot", "warm", "cold"],
      "sourceBreakdown": {"github": 82, "news": 67, "social": 74, "papers": 55}
    }
  ],
  "trends": [
    {"rank": 1, "name": "string", "source": "string", "change": "+42%", "direction": "up"},
    {"rank": 2, "name": "string", "source": "string", "change": "+31%", "direction": "up"},
    {"rank": 3, "name": "string", "source": "string", "change": "+18%", "direction": "up"},
    {"rank": 4, "name": "string", "source": "string", "change": "-5%", "direction": "down"},
    {"rank": 5, "name": "string", "source": "string", "change": "+9%", "direction": "up"},
    {"rank": 6, "name": "string", "source": "string", "change": "+22%", "direction": "up"}
  ],
  "overallSignalMeters": {"github": 78, "news": 64, "social": 81, "papers": 59},
  "noiseFilteredOut": ["noise signal 1", "noise signal 2", "noise signal 3"],
  "agentInsight": "One key meta-observation about the landscape right now"
}

Generate 3-4 signals. Make them realistic, specific, and analytically sharp. Focus on: ${query}. Topics: ${topics}.`;

  try {
    const raw = await callClaude(
      systemPrompt,
      `Scan the tech landscape for investment signals related to: "${query}". Focus topics: ${topics}. Today's context: Q1 2026, post AGI-wave, competitive AI infrastructure buildout.`
    );

    const parsed = safeParseJSON(raw);

    state.signals = parsed.signals || [];
    state.trends = parsed.trends || [];
    animateSignalMeters(parsed.overallSignalMeters || { github: 70, news: 60, social: 75, papers: 50 });

    if (parsed.noiseFilteredOut) {
      log(`Noise filtered: ${parsed.noiseFilteredOut.slice(0, 2).join("; ")}`, "warn");
    }
    if (parsed.agentInsight) {
      log(`Agent insight: <b>${parsed.agentInsight}</b>`, "ai");
    }
    log(`Found <b>${state.signals.length} signals</b>, <b>${state.trends.length} trends</b>`, "signal");

    renderSignals();
    renderTrends();
    setBadge("signals", state.signals.length);
    setBadge("trends", state.trends.length);
    setStatus("Scan complete", false);
  } catch (err) {
    log(`Error: ${err.message}`, "warn");
    setStatus("Error", false);
    console.error(err);
  }

  state.scanning = false;
  btn.disabled = false;
  btn.textContent = "▶ Run Intelligence Scan";
}

// ── RENDER SIGNALS ────────────────────────────────────────────

function renderSignals() {
  const el = document.getElementById("signals-list");
  document.getElementById("signals-empty").style.display = "none";
  el.innerHTML = "";

  state.signals.forEach((sig, i) => {
    const scoreClass = sig.score >= 75 ? "high" : sig.score >= 55 ? "mid" : "low";
    const iconMap = {
      "GitHub Surge": "⌥",
      "Research Breakout": "◈",
      "Founder Activity": "◎",
      "Market Shift": "◆",
      "Social Momentum": "◉",
    };
    const colorMap = {
      "GitHub Surge": "green",
      "Research Breakout": "purple",
      "Founder Activity": "cyan",
      "Market Shift": "amber",
      "Social Momentum": "green",
    };
    const icon = iconMap[sig.category] || "◈";
    const color = colorMap[sig.category] || "cyan";
    const tags = (sig.tags || [])
      .map((t, j) => `<span class="meta-tag ${(sig.tagHeat || [])[j] || "cold"}">${t}</span>`)
      .join("");

    el.innerHTML += `
    <div class="card">
      <div class="card-header">
        <div class="card-icon ${color}">${icon}</div>
        <div style="flex:1">
          <div class="card-title">${sig.title}</div>
          <div class="card-sub">${sig.category}</div>
        </div>
        <div class="signal-score ${scoreClass}">${sig.score}</div>
      </div>
      <div class="card-meta">${tags}</div>
      <div class="card-body">
        <p>${sig.summary}</p>
        ${sig.evidence ? "<p><b>Evidence:</b> " + sig.evidence.slice(0, 2).join(" · ") + "</p>" : ""}
      </div>
      <div class="card-footer">
        <button class="btn btn-primary" onclick="startInterview(${i})">Interview Founder</button>
        <button class="btn btn-ghost" onclick="deepDive(${i})">Deep Dive →</button>
        <button class="btn btn-ghost" onclick="generateMemo(${i})">Draft Memo</button>
      </div>
    </div>`;
  });
}

// ── RENDER TRENDS ─────────────────────────────────────────────

function renderTrends() {
  const el = document.getElementById("trends-content");
  document.getElementById("trends-empty").style.display = "none";
  el.innerHTML = '<div class="card"><div class="section-title" style="margin-bottom:16px">Momentum Rankings</div></div>';
  state.trends.forEach((t) => {
    el.children[0].innerHTML += `
    <div class="trend-row">
      <div class="trend-rank">${t.rank}</div>
      <div class="trend-info">
        <div class="trend-name">${t.name}</div>
        <div class="trend-source">${t.source}</div>
      </div>
      <div class="trend-change ${t.direction === "up" ? "up" : "down"}">${t.change}</div>
    </div>`;
  });
}

// ── DEEP DIVE ─────────────────────────────────────────────────

async function deepDive(idx) {
  const sig = state.signals[idx];
  log(`Deep diving: <b>${sig.title}</b>`, "signal");
  setStatus("Foraging...", true);

  const systemPrompt = `You are an autonomous investment analyst doing a deep dive on a tech signal. Respond ONLY with valid JSON, no markdown.

{
  "followUpSignals": ["signal 1", "signal 2", "signal 3"],
  "worthFollowing": ["rabbit hole 1", "rabbit hole 2"],
  "notWorthFollowing": ["distraction 1"],
  "competitiveLandscape": "2 sentence summary",
  "keyPlayers": ["player 1", "player 2", "player 3"],
  "timeToMass": "6-18 months"
}`;

  try {
    const raw = await callClaude(systemPrompt, `Deep dive on: ${sig.title}. Summary: ${sig.summary}`, 800);
    const parsed = safeParseJSON(raw);

    log(`Rabbit holes worth following: <b>${(parsed.worthFollowing || []).join(", ")}</b>`, "ai");
    log(`Time to mass adoption: <b>${parsed.timeToMass || "unknown"}</b>`, "signal");
    if (parsed.notWorthFollowing?.length)
      log(`Skipping noise: ${parsed.notWorthFollowing.join(", ")}`, "warn");

    const cards = document.querySelectorAll("#signals-list .card");
    if (cards[idx]) {
      const dd = document.createElement("div");
      dd.style.cssText = "margin-top:12px;padding-top:12px;border-top:1px solid var(--border);";
      dd.innerHTML = `<div style="font-size:9px;color:var(--accent);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-family:Syne,sans-serif;font-weight:600;">Deep Dive Results</div>
      <div style="font-size:11px;color:var(--muted);line-height:1.7">
        <b style="color:var(--text)">Key players:</b> ${(parsed.keyPlayers || []).join(", ")}<br>
        <b style="color:var(--text)">Competitive landscape:</b> ${parsed.competitiveLandscape || ""}<br>
        <b style="color:var(--text)">Time to mass:</b> ${parsed.timeToMass || ""}
      </div>`;
      cards[idx].appendChild(dd);
    }
  } catch (e) {
    log(`Deep dive error: ${e.message}`, "warn");
  }
  setStatus("Ready", false);
}

// ── INTERVIEW ─────────────────────────────────────────────────

async function startInterview(idx) {
  const sig = state.signals[idx];
  state.currentSignal = sig;
  state.chatLog = [];
  state.interviewing = true;
  state.interviewDone = false;

  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".tab")[2].classList.add("active");
  document.getElementById("pane-interview").classList.add("active");

  document.getElementById("interview-empty").style.display = "none";
  const ic = document.getElementById("interview-content");

  const personaSystem = `You are generating a founder persona for a simulated VC interview. Respond ONLY with JSON:
{
  "name": "First Last",
  "company": "company name",
  "tagline": "one line pitch",
  "background": "2 sentence founder background"
}`;

  setStatus("Creating founder persona...", true);
  log(`Starting founder interview for: <b>${sig.title}</b>`, "signal");

  let founder = {
    name: "Alex Chen",
    company: "EdgeAI Labs",
    tagline: "Inference at the speed of thought",
    background: "Ex-Google Brain researcher with 2 chip design patents.",
  };

  try {
    const raw = await callClaude(personaSystem, `Create a founder for: ${sig.title}. Signal: ${sig.summary}`, 300);
    const p = safeParseJSON(raw);
    if (p) founder = p;
  } catch (e) {
    log("Using default founder persona", "warn");
  }

  state.founderContext = founder;
  setBadge("interview", 1);

  ic.innerHTML = `
  <div class="conviction-block">
    <div class="conviction-header">
      <div class="conviction-label">Due Diligence Score</div>
      <div class="conviction-score" id="conviction-score">—</div>
    </div>
    <div class="conviction-bar-wrap"><div class="conviction-bar-fill" id="conviction-bar" style="width:0%"></div></div>
    <div class="conviction-dims">
      <div class="dim-block"><div class="dim-name">Market</div><div class="dim-val g" id="dim-market">—</div></div>
      <div class="dim-block"><div class="dim-name">Team</div><div class="dim-val a" id="dim-team">—</div></div>
      <div class="dim-block"><div class="dim-name">Moat</div><div class="dim-val p" id="dim-moat">—</div></div>
    </div>
  </div>
  <div class="interview-container">
    <div class="interview-header">
      <div class="avatar founder">◈</div>
      <div>
        <div class="interview-name">${founder.name}</div>
        <div class="interview-role">Founder &amp; CEO, ${founder.company} · ${founder.tagline}</div>
      </div>
      <div class="interview-status live" id="interview-status-pill">LIVE</div>
    </div>
    <div class="chat-log" id="chat-log">
      <div class="msg analyst">
        <div class="msg-avatar a">A</div>
        <div class="msg-bubble">
          <div class="msg-name">Analyst</div>
          <div class="msg-text">Hi ${founder.name}, thanks for joining. Tell me about ${founder.company} and what you're building.</div>
        </div>
      </div>
    </div>
    <div class="typing-indicator" id="typing">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>
    <div class="interview-input-row">
      <input class="interview-input" id="interview-input" placeholder="Ask the founder a question..." onkeydown="if(event.key==='Enter')sendQuestion()"/>
      <button class="btn btn-purple" onclick="sendQuestion()">Ask →</button>
      <button class="btn btn-primary" onclick="autoInterview()">Auto Interview</button>
    </div>
  </div>
  <div style="text-align:right;margin-top:12px">
    <button class="btn btn-primary" onclick="generateMemoFromInterview()" id="draft-memo-btn" style="opacity:0.4" disabled>Generate Investment Memo →</button>
  </div>`;

  await askFounder(
    "Tell me about " + founder.company + " and what you're building in the context of " + sig.title
  );
  setStatus("Interview in progress", true);
}

async function askFounder(question, isAuto = false) {
  const chatLog = document.getElementById("chat-log");
  const typing = document.getElementById("typing");
  const sig = state.currentSignal;
  const founder = state.founderContext;
  if (!chatLog || !sig || !founder) return;

  if (!isAuto) state.chatLog.push({ role: "analyst", text: question });

  typing.classList.add("show");
  chatLog.scrollTop = chatLog.scrollHeight;

  const systemPrompt = `You are ${founder.name}, founder of ${founder.company}.
Company context: ${founder.tagline}. Background: ${founder.background}.
The investor is investigating: ${sig.title}. Signal context: ${sig.summary}.
Speak as a real founder — candid, specific, occasionally cautious about IP.
Keep answers to 2-4 sentences. Be authentic, not salesy.
After your answer, on a new line add exactly: SCORES:market=XX,team=XX,moat=XX (0-100 integers based on how compelling your own answer was)`;

  const history = state.chatLog
    .slice(-6)
    .map((m) => `${m.role === "analyst" ? "Analyst" : "You"}: ${m.text}`)
    .join("\n");

  try {
    const raw = await callClaude(systemPrompt, `${history}\nAnalyst: ${question}`, 500);
    typing.classList.remove("show");

    const scoreMatch = raw.match(/SCORES:market=(\d+),team=(\d+),moat=(\d+)/);
    const cleanResponse = raw.replace(/SCORES:[^\n]+/, "").trim();

    state.chatLog.push({ role: "founder", text: cleanResponse });

    const msgEl = document.createElement("div");
    msgEl.className = "msg founder";
    msgEl.innerHTML = `<div class="msg-avatar f">F</div><div class="msg-bubble"><div class="msg-name">${founder.name}</div><div class="msg-text">${cleanResponse}</div></div>`;
    chatLog.appendChild(msgEl);
    chatLog.scrollTop = chatLog.scrollHeight;

    if (scoreMatch) {
      const m = parseInt(scoreMatch[1]),
        t = parseInt(scoreMatch[2]),
        mo = parseInt(scoreMatch[3]);
      const avg = Math.round((m + t + mo) / 3);
      document.getElementById("conviction-score").textContent = avg;
      document.getElementById("conviction-bar").style.width = avg + "%";
      document.getElementById("dim-market").textContent = m;
      document.getElementById("dim-team").textContent = t;
      document.getElementById("dim-moat").textContent = mo;
      log(`Conviction updated: <b>${avg}/100</b> (M:${m} T:${t} Mo:${mo})`, "signal");
    }

    if (state.chatLog.length >= 6) {
      const draftBtn = document.getElementById("draft-memo-btn");
      if (draftBtn) {
        draftBtn.disabled = false;
        draftBtn.style.opacity = "1";
      }
      state.interviewDone = true;
    }
  } catch (e) {
    typing.classList.remove("show");
    log(`Interview error: ${e.message}`, "warn");
  }
}

async function sendQuestion() {
  const input = document.getElementById("interview-input");
  const q = input?.value.trim();
  if (!q || !state.founderContext) return;
  input.value = "";

  const chatLog = document.getElementById("chat-log");
  const msgEl = document.createElement("div");
  msgEl.className = "msg analyst";
  msgEl.innerHTML = `<div class="msg-avatar a">A</div><div class="msg-bubble"><div class="msg-name">Analyst</div><div class="msg-text">${q}</div></div>`;
  chatLog.appendChild(msgEl);
  chatLog.scrollTop = chatLog.scrollHeight;

  state.chatLog.push({ role: "analyst", text: q });
  await askFounder(q, true);
}

async function autoInterview() {
  if (!state.founderContext || !state.currentSignal) return;
  log("Running auto-interview sequence...", "ai");
  const questions = [
    "What's your unfair technical advantage?",
    "Who are your first 3 customers and what's their pain?",
    "What does your go-to-market look like in year 1?",
  ];
  for (const q of questions) {
    const chatLog = document.getElementById("chat-log");
    if (!chatLog) break;
    const msgEl = document.createElement("div");
    msgEl.className = "msg analyst";
    msgEl.innerHTML = `<div class="msg-avatar a">A</div><div class="msg-bubble"><div class="msg-name">Analyst</div><div class="msg-text">${q}</div></div>`;
    chatLog.appendChild(msgEl);
    state.chatLog.push({ role: "analyst", text: q });
    await askFounder(q, true);
    await new Promise((r) => setTimeout(r, 800));
  }
  setStatus("Interview complete", false);
  const pill = document.getElementById("interview-status-pill");
  if (pill) { pill.className = "interview-status done"; pill.textContent = "DONE"; }
}

// ── MEMO ──────────────────────────────────────────────────────

async function generateMemoFromInterview() {
  const idx = state.signals.indexOf(state.currentSignal);
  await generateMemo(idx >= 0 ? idx : 0);
}

async function generateMemo(idx) {
  const sig = state.signals[idx] || state.signals[0];
  if (!sig) return;

  setStatus("Drafting memo...", true);
  log(`Drafting investment memo: <b>${sig.title}</b>`, "ai");

  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".tab")[3].classList.add("active");
  document.getElementById("pane-memo").classList.add("active");

  const memoEl = document.getElementById("memo-content");
  memoEl.innerHTML = `<div class="card" style="padding:32px">
    <div class="skel" style="width:60%;height:22px;margin-bottom:10px"></div>
    <div class="skel" style="width:40%;height:12px;margin-bottom:24px"></div>
    <div class="skel" style="width:100%;height:10px;margin-bottom:8px"></div>
    <div class="skel" style="width:90%;height:10px;margin-bottom:8px"></div>
    <div class="skel" style="width:80%;height:10px"></div>
  </div>`;
  document.getElementById("memo-empty").style.display = "none";

  const interviewSummary = state.chatLog
    .slice(-8)
    .map((m) => `${m.role}: ${m.text}`)
    .join("\n");

  const systemPrompt = `You are a senior venture capital analyst drafting an investment memo. Respond ONLY with valid JSON:

{
  "title": "Investment Memo: [Company/Theme Name]",
  "date": "Q1 2026",
  "recommendation": "PASS | INVESTIGATE | INVEST",
  "oneLiner": "One sentence thesis",
  "executive": "2-3 sentence exec summary",
  "opportunity": ["bullet 1", "bullet 2", "bullet 3"],
  "marketSize": "TAM/SAM description",
  "thesis": "3-4 sentence investment thesis",
  "evidence": ["evidence 1", "evidence 2", "evidence 3"],
  "founderInsights": ["insight from interview 1", "insight from interview 2"],
  "risks": [
    {"label": "Market timing", "level": "medium", "note": "brief note"},
    {"label": "Competition", "level": "high", "note": "brief note"},
    {"label": "Technical", "level": "low", "note": "brief note"},
    {"label": "Regulatory", "level": "medium", "note": "brief note"}
  ],
  "conviction": 72,
  "nextSteps": ["next step 1", "next step 2", "next step 3"]
}`;

  try {
    const raw = await callClaude(
      systemPrompt,
      `Signal: ${sig.title}\nSummary: ${sig.summary}\nEvidence: ${(sig.evidence || []).join("; ")}\nFounder interview:\n${interviewSummary}`,
      CONFIG.MAX_TOKENS
    );
    const memo = safeParseJSON(raw);
    if (!memo) throw new Error("Memo parse failed");

    const recColor = { INVEST: "var(--accent)", INVESTIGATE: "var(--accent3)", PASS: "var(--danger)" };
    const risksHtml = (memo.risks || [])
      .map(
        (r) => `<div class="risk-item"><div class="risk-label">${r.label}</div><div class="risk-level ${r.level}">${r.level.toUpperCase()} — ${r.note}</div></div>`
      )
      .join("");
    const bullets = (arr) => (arr || []).map((b) => `<li>${b}</li>`).join("");

    memoEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div style="flex:1">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Investment Memo · ${memo.date || "Q1 2026"}</div>
        <div style="font-family:Syne,sans-serif;font-weight:800;font-size:20px;color:#fff;line-height:1.2">${memo.title}</div>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Recommendation</div>
        <div style="font-family:Syne,sans-serif;font-weight:800;font-size:16px;color:${recColor[memo.recommendation] || "var(--accent)"};background:rgba(255,255,255,0.05);padding:6px 14px;border-radius:6px;border:1px solid currentColor">${memo.recommendation || "INVESTIGATE"}</div>
      </div>
    </div>

    <div class="conviction-block" style="margin-bottom:20px">
      <div class="conviction-header">
        <div style="font-size:11px;color:var(--muted)">${memo.oneLiner}</div>
        <div class="conviction-score">${memo.conviction || 70}</div>
      </div>
      <div class="conviction-bar-wrap"><div class="conviction-bar-fill" style="width:${memo.conviction || 70}%"></div></div>
    </div>

    <div class="memo-block">
      <div class="memo-section">
        <div class="memo-section-title">Executive Summary</div>
        <div class="memo-text">${memo.executive}</div>
      </div>
      <div class="memo-section">
        <div class="memo-section-title">Market Opportunity</div>
        <div class="memo-text" style="margin-bottom:8px">${memo.marketSize}</div>
        <ul class="memo-bullets">${bullets(memo.opportunity)}</ul>
      </div>
      <div class="memo-section">
        <div class="memo-section-title">Investment Thesis</div>
        <div class="memo-text">${memo.thesis}</div>
      </div>
      <div class="memo-section">
        <div class="memo-section-title">Signal Evidence</div>
        <ul class="memo-bullets">${bullets(memo.evidence)}</ul>
      </div>
      ${
        memo.founderInsights?.length
          ? `<div class="memo-section">
        <div class="memo-section-title">Founder Interview Insights</div>
        <ul class="memo-bullets">${bullets(memo.founderInsights)}</ul>
      </div>`
          : ""
      }
      <div class="memo-section">
        <div class="memo-section-title">Risk Assessment</div>
        <div class="risk-grid">${risksHtml}</div>
      </div>
      <div class="memo-section">
        <div class="memo-section-title">Next Steps</div>
        <ul class="memo-bullets">${bullets(memo.nextSteps)}</ul>
      </div>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="window.print()">Export / Print</button>
      <button class="btn btn-primary" onclick="runScan()">New Scan</button>
    </div>`;

    setBadge("memo", 1);
    log(`Memo drafted: <b>${memo.recommendation}</b> with ${memo.conviction}% conviction`, "signal");
    setStatus("Memo complete", false);
  } catch (e) {
    log(`Memo error: ${e.message}`, "warn");
    setStatus("Error", false);
    console.error(e);
  }
}
