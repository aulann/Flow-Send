import { PencilLine } from "@phosphor-icons/react/dist/ssr"

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
        <div className="flex items-center gap-2">
          <PencilLine size={24} weight="bold" style={{ color: "var(--text-primary)" }} />
          <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            Flow Send
          </span>
        </div>
        <span
          className="text-xs px-2 py-0.5 font-medium"
          style={{
            border: "1px solid var(--border-light)",
            borderRadius: "6px 7px 6px 5px",
            color: "var(--text-muted)",
          }}
        >
          beta
        </span>
      </div>
    </header>
  )
}
