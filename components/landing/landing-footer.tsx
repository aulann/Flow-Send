export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="py-6 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm"
      style={{
        borderTop: "2px solid var(--border-subtle)",
        color: "var(--text-faint)",
      }}
    >
      <span>Flow Send · Pliki między urządzeniami · Bezpłatnie</span>
      <span className="hidden sm:inline" aria-hidden="true">
        ·
      </span>
      <span>
        © {year}{" "}
        <a
          href="https://aulan.pl"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
          style={{ color: "var(--text-secondary)" }}
        >
          aulan.pl
        </a>
      </span>
    </footer>
  )
}
