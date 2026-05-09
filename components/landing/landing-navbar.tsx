import Link from "next/link"
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr"

export function LandingNavbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4"
      style={{
        background: "var(--bg-base)",
        borderBottom: "2px solid var(--border-ink)",
      }}
    >
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 leading-none"
          aria-label="Flow Send — strona główna"
        >
          <span
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              background: "var(--accent-primary)",
              border: "2px solid var(--border-ink)",
              borderRadius: "7px 8px 7px 6px",
              boxShadow: "2px 2px 0 var(--border-ink)",
            }}
          >
            <PaperPlaneTiltIcon size={16} weight="bold" color="#ffffff" />
          </span>
          <span
            className="font-bold text-lg tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Flow Send
          </span>
        </Link>
      </div>
    </header>
  )
}
