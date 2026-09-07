import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentEvent, LedgerEntry, ProviderState } from "./types";

export type ConnectionState = "idle" | "connecting" | "open" | "closed" | "error";
export type RunPhase = "idle" | "running" | "refused" | "success" | "failed";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000";

let entryId = 0;
const nextId = () => `entry-${++entryId}`;

export function useAgentRun() {
  const socketRef = useRef<WebSocket | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [providers, setProviders] = useState<Record<string, ProviderState>>({});
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [budget, setBudget] = useState<{ totalSpentTinybars: number; maxTotalTinybars: number; callsMade: number; maxCalls: number; remainingTinybars: number } | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [refusedReason, setRefusedReason] = useState<string | null>(null);
  const [rawLog, setRawLog] = useState<AgentEvent[]>([]);

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState <= 1) return socketRef.current;
    setConnection("connecting");
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => setConnection("open");
    socket.onclose = () => setConnection("closed");
    socket.onerror = () => setConnection("error");

    socket.onmessage = (raw) => {
      let event: AgentEvent;
      try {
        event = JSON.parse(raw.data);
      } catch {
        return;
      }
      setRawLog((log) => [...log, event]);

      switch (event.type) {
        case "run_started": {
          setPhase("running");
          setProviders({});
          setReasoning([]);
          setChosen(null);
          setLedger([]);
          setResult(null);
          setRefusedReason(null);
          setBudget({
            totalSpentTinybars: 0,
            maxTotalTinybars: event.maxTotalTinybars,
            callsMade: 0,
            maxCalls: event.maxCalls,
            remainingTinybars: event.maxTotalTinybars,
          });
          break;
        }
        case "provider_discovered": {
          setProviders((p) => ({
            ...p,
            [event.provider]: {
              provider: event.provider,
              name: event.name,
              agentContext: event.agentContext,
              endpoints: event.endpoints,
              status: "discovered",
            },
          }));
          break;
        }
        case "quote_received": {
          setProviders((p) => ({
            ...p,
            [event.provider]: { ...p[event.provider], status: "quoted", quotePriceTinybars: event.priceTinybars },
          }));
          break;
        }
        case "quote_declined": {
          setProviders((p) => ({
            ...p,
            [event.provider]: { ...p[event.provider], status: "declined", declinedReason: event.reason },
          }));
          break;
        }
        case "decision_made": {
          setChosen(event.chosen);
          setReasoning(event.reasoning);
          if (event.chosen) {
            setProviders((p) => ({
              ...p,
              [event.chosen as string]: { ...p[event.chosen as string], status: "chosen" },
            }));
          }
          break;
        }
        case "payment_settled": {
          setProviders((p) => ({
            ...p,
            [event.provider]: { ...p[event.provider], status: "paid" },
          }));
          setLedger((l) => [
            ...l,
            {
              id: nextId(),
              kind: "payment",
              label: `Paid ${event.provider}`,
              detail: `${event.priceTinybars.toLocaleString()} tinybars — tx ${event.transaction.slice(0, 14)}…`,
              href: event.hashscanUrl,
              timestamp: Date.now(),
            },
          ]);
          break;
        }
        case "result_delivered": {
          setResult(event.result);
          break;
        }
        case "receipt_recorded": {
          setLedger((l) => [
            ...l,
            {
              id: nextId(),
              kind: "receipt",
              label: `HCS receipt anchored`,
              detail: `topic ${event.topicId} · seq #${event.sequenceNumber}`,
              href: event.mirrorNodeUrl,
              timestamp: Date.now(),
            },
          ]);
          break;
        }
        case "reputation_updated": {
          setProviders((p) => ({
            ...p,
            [event.provider]: {
              ...p[event.provider],
              reputation: {
                completed_calls: event.completed_calls,
                disputes: event.disputes,
                mean_latency_ms: event.mean_latency_ms,
              },
            },
          }));
          break;
        }
        case "budget_updated": {
          setBudget({
            totalSpentTinybars: event.totalSpentTinybars,
            maxTotalTinybars: event.maxTotalTinybars,
            callsMade: event.callsMade,
            maxCalls: event.maxCalls,
            remainingTinybars: event.remainingTinybars,
          });
          break;
        }
        case "run_refused": {
          setPhase("refused");
          setRefusedReason(event.reason);
          setLedger((l) => [
            ...l,
            { id: nextId(), kind: "refused", label: "Run refused", detail: event.reason, timestamp: Date.now() },
          ]);
          break;
        }
        case "run_complete": {
          setPhase(event.success ? "success" : "failed");
          break;
        }
      }
    };

    return socket;
  }, []);

  const startRun = useCallback(
    (text: string) => {
      const socket = connect();
      const send = () => socket.send(JSON.stringify({ type: "run", text }));
      if (socket.readyState === WebSocket.OPEN) send();
      else socket.addEventListener("open", send, { once: true });
    },
    [connect],
  );

  useEffect(() => {
    return () => {
      socketRef.current?.close();
    };
  }, []);

  return {
    connection,
    connect,
    phase,
    providers,
    reasoning,
    chosen,
    ledger,
    budget,
    result,
    refusedReason,
    rawLog,
    startRun,
  };
}
