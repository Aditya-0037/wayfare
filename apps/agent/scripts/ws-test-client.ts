import WebSocket from "ws";

const url = process.argv[2] ?? "ws://localhost:4000";
const text = process.argv.slice(3).join(" ") || "Testing the WebSocket event stream end to end.";

const ws = new WebSocket(url);
ws.on("open", () => {
  console.log("connected, sending run request");
  ws.send(JSON.stringify({ type: "run", text }));
});
ws.on("message", (raw) => {
  const event = JSON.parse(raw.toString());
  console.log(">>", event.type, JSON.stringify(event));
  if (event.type === "run_complete") ws.close();
});
ws.on("close", () => process.exit(0));
ws.on("error", (err) => {
  console.error("ws error:", err.message);
  process.exit(1);
});
