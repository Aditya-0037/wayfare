import { Compass, GithubLogo } from "@phosphor-icons/react";
import ThemeToggle from "./ThemeToggle";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-edge/10 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button onClick={() => scrollTo("top")} className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Compass weight="duotone" className="h-6 w-6 text-signal" />
          Wayfare
        </button>
        <nav className="hidden items-center gap-8 text-sm text-haze md:flex">
          <button onClick={() => scrollTo("how")} className="transition hover:text-fg">How it works</button>
          <button onClick={() => scrollTo("proof")} className="transition hover:text-fg">On-chain proof</button>
          <button onClick={() => scrollTo("console")} className="transition hover:text-fg">Run it</button>
          <a
            href="https://github.com/Aditya-0037/wayfare"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition hover:text-fg"
          >
            <GithubLogo weight="fill" className="h-4 w-4" />
            Docs
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => scrollTo("console")}
            className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-onaccent shadow-glow transition hover:brightness-110 active:scale-95"
          >
            Launch console
          </button>
        </div>
      </div>
    </header>
  );
}
