// ============================================================
//  SIGNAL.AI — Configuration
//  Set your Anthropic API key below to run the app locally.
//  NEVER commit this file with a real key — it's in .gitignore
// ============================================================

const CONFIG = {
  // Get your key at https://console.anthropic.com
  ANTHROPIC_API_KEY: "YOUR_API_KEY_HERE",

  // API endpoint — change to "/api/messages" if using the Express proxy (server.js)
  API_ENDPOINT: "https://api.anthropic.com/v1/messages",

  // Model to use
  MODEL: "claude-sonnet-4-20250514",

  // Max tokens per response
  MAX_TOKENS: 2000,
};
