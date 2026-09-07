// 1 HBAR = 100,000,000 tinybars.
export function formatHbar(tinybars: number): string {
  const hbar = tinybars / 1e8;
  if (hbar === 0) return "0 ℏ";
  if (hbar < 0.001) return `${tinybars.toLocaleString()} tℏ`;
  return `${hbar.toLocaleString(undefined, { maximumFractionDigits: 6 })} ℏ`;
}

export function shortAddr(s: string, head = 10, tail = 6): string {
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}
