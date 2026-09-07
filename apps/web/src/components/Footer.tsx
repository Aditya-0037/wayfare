export default function Footer() {
  return (
    <footer className="border-t border-edge/5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-wisp sm:flex-row">
        <div className="flex items-center gap-2">
          <span>🧭</span>
          <span>Wayfare — agent discovery over ENS, payment over x402, receipts on HCS.</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="https://hedera.com" target="_blank" rel="noreferrer" className="transition hover:text-fg">Hedera</a>
          <a href="https://ens.domains" target="_blank" rel="noreferrer" className="transition hover:text-fg">ENS</a>
          <a href="https://x402.gitbook.io/x402/" target="_blank" rel="noreferrer" className="transition hover:text-fg">x402</a>
        </div>
      </div>
    </footer>
  );
}
