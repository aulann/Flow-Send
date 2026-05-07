import { DeviceMobile, QrCode, CheckCircle } from "@phosphor-icons/react/dist/ssr"

const steps = [
  {
    number: "01",
    icon: DeviceMobile,
    title: "Otwórz na obu urządzeniach",
    description: "Wejdź na flowsend.app z telefonu i komputera — bez instalacji.",
  },
  {
    number: "02",
    icon: QrCode,
    title: "Zeskanuj kod QR",
    description: 'Na urządzeniu wysyłającym kliknij "Wyślij" i zeskanuj kod z ekranu odbiorcy.',
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Gotowe",
    description: "Pliki pojawiają się od razu. Sesja znika po zamknięciu okna.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-2xl font-bold mb-8"
          style={{ color: "var(--text-primary)" }}
        >
          Jak to działa
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="sketch-card p-5 flex flex-col gap-1">
                <span
                  className="text-xs font-mono"
                  style={{ color: "var(--text-faint)" }}
                >
                  {step.number}
                </span>
                <Icon size={32} weight="bold" style={{ color: "var(--accent-primary)" }} />
                <h3
                  className="font-semibold mt-3 mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
