import "dotenv/config";
import { WebSocketServer, type WebSocket } from "ws";
import { runAgent } from "./runAgent.js";
import type { AgentEvent } from "./events.js";

// Render (and most PaaS hosts) inject PORT and expect the app to bind to it; WS_PORT stays
// the local-dev override so `npm run serve` on your own machine doesn't need it set.
const PORT = Number(process.env.PORT ?? process.env.WS_PORT ?? 4000);
const MAX_TEXT_LENGTH = Number(process.env.MAX_TEXT_LENGTH ?? 4000);

// Both default to "no extra restriction" for local dev — a public deployment sets these
// explicitly (see apps/agent/README or the Render env config) so a demo left running
// unattended can't be hammered into draining its payer account faster than intended.
const MIN_SECONDS_BETWEEN_RUNS = Number(process.env.MIN_SECONDS_BETWEEN_RUNS ?? 0);
const LIFETIME_MAX_TINYBARS = process.env.LIFETIME_MAX_TINYBARS ? Number(process.env.LIFETIME_MAX_TINYBARS) : Infinity;

const wss = new WebSocketServer({ port: PORT });
let running = false;
let lastRunAt = 0;
let lifetimeSpentTinybars = 0;

function broadcast(event: AgentEvent) {
  if (event.type === "payment_settled") lifetimeSpentTinybars += event.priceTinybars;
  const payload = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(payload);
  }
}

wss.on("connection", (socket: WebSocket) => {
  socket.on("message", async (raw) => {
    let msg: { type?: string; text?: string };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      socket.send(JSON.stringify({ type: "run_refused", reason: "malformed message, expected JSON" }));
      return;
    }

    if (msg.type !== "run" || typeof msg.text !== "string" || !msg.text.trim()) {
      socket.send(JSON.stringify({ type: "run_refused", reason: 'send {"type":"run","text":"..."}' }));
      return;
    }

    if (msg.text.length > MAX_TEXT_LENGTH) {
      socket.send(JSON.stringify({ type: "run_refused", reason: `text exceeds ${MAX_TEXT_LENGTH} characters` }));
      return;
    }

    if (running) {
      socket.send(JSON.stringify({ type: "run_refused", reason: "a run is already in progress" }));
      return;
    }

    const secondsSinceLastRun = (Date.now() - lastRunAt) / 1000;
    console.log(`[agent] cooldown check: lastRunAt=${lastRunAt} secondsSinceLastRun=${secondsSinceLastRun} threshold=${MIN_SECONDS_BETWEEN_RUNS}`);
    if (lastRunAt > 0 && secondsSinceLastRun < MIN_SECONDS_BETWEEN_RUNS) {
      const wait = Math.ceil(MIN_SECONDS_BETWEEN_RUNS - secondsSinceLastRun);
      socket.send(JSON.stringify({ type: "run_refused", reason: `rate limited — try again in ${wait}s` }));
      return;
    }

    if (lifetimeSpentTinybars >= LIFETIME_MAX_TINYBARS) {
      socket.send(JSON.stringify({ type: "run_refused", reason: "this demo has reached its lifetime spend cap" }));
      return;
    }

    running = true;
    lastRunAt = Date.now();
    try {
      await runAgent(msg.text, broadcast);
    } catch (err) {
      broadcast({ type: "run_refused", reason: err instanceof Error ? err.message : String(err) });
      broadcast({ type: "run_complete", success: false });
    } finally {
      running = false;
    }
  });
});

console.log(`[agent] WebSocket server listening on ws://localhost:${PORT}`);
console.log('[agent] send {"type":"run","text":"..."} to start a run; every client sees every event');
if (MIN_SECONDS_BETWEEN_RUNS > 0) console.log(`[agent] rate limit: ${MIN_SECONDS_BETWEEN_RUNS}s between runs`);
if (Number.isFinite(LIFETIME_MAX_TINYBARS)) console.log(`[agent] lifetime spend cap: ${LIFETIME_MAX_TINYBARS} tinybars`);
