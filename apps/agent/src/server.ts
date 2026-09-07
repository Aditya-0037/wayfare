import "dotenv/config";
import { WebSocketServer, type WebSocket } from "ws";
import { runAgent } from "./runAgent.js";
import type { AgentEvent } from "./events.js";

const PORT = Number(process.env.WS_PORT ?? 4000);

const wss = new WebSocketServer({ port: PORT });
let running = false;

function broadcast(event: AgentEvent) {
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

    if (running) {
      socket.send(JSON.stringify({ type: "run_refused", reason: "a run is already in progress" }));
      return;
    }

    running = true;
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
