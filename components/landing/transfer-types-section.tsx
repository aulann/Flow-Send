import { TextTIcon, ImageIcon, FilmStripIcon, FileIcon, LinkIcon } from "@phosphor-icons/react/dist/ssr"

const types = [
  { icon: TextTIcon, label: "Tekst" },
  { icon: ImageIcon, label: "Zdjęcie" },
  { icon: FilmStripIcon, label: "Wideo" },
  { icon: FileIcon, label: "Plik" },
  { icon: LinkIcon, label: "Link" },
]

export function TransferTypesSection() {
  return (
    <section className="px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-2xl font-bold mb-8"
          style={{ color: "var(--text-primary)" }}
        >
          Co możesz przesłać
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {types.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="sketch-card-dash p-4 flex flex-col items-center gap-2 cursor-default"
            >
              <Icon size={28} weight="bold" style={{ color: "var(--text-secondary)" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
