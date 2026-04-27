/**
 * Strategy Coach Agent — periodic ChainGPT-powered analyst.
 *
 * Runs daily (Vercel Cron). Pulls user trade history (decrypted via auditor key),
 * sends to ChainGPT Web3 LLM for pattern analysis + suggestions.
 */

const DAILY_MS = 24 * 60 * 60 * 1000;

export async function startStrategyCoach() {
  console.log("[strategy-coach] started");

  setInterval(() => {
    analyzeOnce().catch((err) => console.error("[strategy-coach]", err));
  }, DAILY_MS);
}

async function analyzeOnce() {
  // TODO: Pull last 30 days of trades (decrypted)
  // TODO: Call ChainGPT:
  //   "Here's user's trading data: {...}.
  //    Identify pattern. Suggest 3 strategy adjustments."
  // TODO: Send report via Slack/Discord webhook
}
