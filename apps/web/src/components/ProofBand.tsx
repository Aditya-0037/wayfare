const proofs = [
  {
    label: "First settled payment",
    detail: "Blocky402 facilitator, Hedera testnet",
    href: "https://hashscan.io/testnet/transaction/0.0.7162784-1788608829-232641440",
    cta: "View on HashScan",
  },
  {
    label: "HCS receipt topic",
    detail: "Every settled call anchored — provider, quote id, amount, tx id, result hash",
    href: "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10403773/messages",
    cta: "View on Mirror Node",
  },
  {
    label: "ENS identity",
    detail: "wayfare.eth + provider subnames, real ENSv2 (beta) on Sepolia",
    href: "https://discuss.ens.domains/t/ensip-26-ens-native-ai-identity/21968",
    cta: "ENSIP-26 spec",
  },
];

export default function ProofBand() {
  return (
    <section id="proof" className="relative border-b border-edge/5 bg-surface/60 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Nothing here is mocked</h2>
            <p className="mt-3 max-w-xl text-haze">Every claim links to a public ledger you can check yourself.</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {proofs.map((p) => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col justify-between rounded-2xl border border-edge/10 bg-panel/50 p-6 transition hover:border-signal/30 hover:bg-panel"
            >
              <div>
                <h3 className="font-display text-lg font-semibold">{p.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-haze">{p.detail}</p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-signal">
                {p.cta}
                <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
