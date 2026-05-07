import Image from "next/image"
import Link from "next/link"

function HeroDoodles() {
  const s = { stroke: "var(--border-ink)", opacity: 0.15 }
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">

      {/* Gwiazdka — górny lewy */}
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
        style={{ position: "absolute", top: "12%", left: "4%" }}>
        <line x1="14" y1="2" x2="14" y2="26" strokeWidth="2" strokeLinecap="round" style={s}/>
        <line x1="2" y1="14" x2="26" y2="14" strokeWidth="2" strokeLinecap="round" style={s}/>
        <line x1="5" y1="5" x2="23" y2="23" strokeWidth="2" strokeLinecap="round" style={s}/>
        <line x1="23" y1="5" x2="5" y2="23" strokeWidth="2" strokeLinecap="round" style={s}/>
      </svg>

      {/* Kółko przerywane — górny prawy */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none"
        style={{ position: "absolute", top: "8%", right: "7%" }}>
        <circle cx="16" cy="16" r="12" strokeWidth="2" strokeDasharray="6 4" style={s}/>
      </svg>

      {/* Falista linia — prawy środek */}
      <svg width="64" height="22" viewBox="0 0 64 22" fill="none"
        style={{ position: "absolute", top: "44%", right: "2%" }}>
        <path d="M2 11 C10 2, 22 20, 32 11 S 54 2, 62 11"
          strokeWidth="2" strokeLinecap="round" fill="none" style={s}/>
      </svg>

      {/* Trzy kropki — dolny lewy */}
      <svg width="48" height="10" viewBox="0 0 48 10" fill="none"
        style={{ position: "absolute", bottom: "18%", left: "3%" }}>
        <circle cx="5" cy="5" r="3" fill="var(--border-ink)" opacity="0.15"/>
        <circle cx="24" cy="5" r="3" fill="var(--border-ink)" opacity="0.15"/>
        <circle cx="43" cy="5" r="3" fill="var(--border-ink)" opacity="0.15"/>
      </svg>

      {/* Plus — dolny prawy */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
        style={{ position: "absolute", bottom: "14%", right: "12%" }}>
        <line x1="10" y1="2" x2="10" y2="18" strokeWidth="2.5" strokeLinecap="round" style={s}/>
        <line x1="2" y1="10" x2="18" y2="10" strokeWidth="2.5" strokeLinecap="round" style={s}/>
      </svg>

      {/* Zakrzywiona strzałka — lewy środek */}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
        style={{ position: "absolute", top: "55%", left: "1.5%" }}>
        <path d="M6 30 C6 12, 24 8, 28 10" strokeWidth="2" strokeLinecap="round" fill="none" style={s}/>
        <path d="M22 6 L28 10 L24 16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" style={s}/>
      </svg>

      {/* Dwie równoległe kreski — górny środek */}
      <svg width="44" height="14" viewBox="0 0 44 14" fill="none" className="hidden sm:block"
        style={{ position: "absolute", top: "6%", left: "42%" }}>
        <line x1="0" y1="4" x2="44" y2="4" strokeWidth="2" strokeLinecap="round" style={s}/>
        <line x1="6" y1="10" x2="38" y2="10" strokeWidth="2" strokeLinecap="round" style={s}/>
      </svg>

      {/* Trójkąt — pod nagłówkiem, lewa strona */}
      <svg width="26" height="24" viewBox="0 0 26 24" fill="none" className="hidden sm:block"
        style={{ position: "absolute", top: "32%", left: "18%" }}>
        <path d="M13 2 L24 22 L2 22 Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}/>
      </svg>

      {/* Spirala — środek po prawej */}
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="hidden sm:block"
        style={{ position: "absolute", top: "28%", right: "18%" }}>
        <path d="M17 17 m-6 0 a6 6 0 1 1 12 0 a9 9 0 1 1 -18 0 a12 12 0 1 1 24 0"
          strokeWidth="1.8" strokeLinecap="round" fill="none" style={s}/>
      </svg>

      {/* Pojedyncza kropka — pod tekstem */}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="hidden sm:block"
        style={{ position: "absolute", top: "48%", left: "28%" }}>
        <circle cx="5" cy="5" r="4" fill="var(--border-ink)" opacity="0.15"/>
      </svg>

      {/* Zygzak — dolny środek */}
      <svg width="60" height="18" viewBox="0 0 60 18" fill="none" className="hidden sm:block"
        style={{ position: "absolute", bottom: "10%", left: "35%" }}>
        <path d="M0 14 L12 4 L24 14 L36 4 L48 14 L60 4"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" style={s}/>
      </svg>

      {/* Mały romb — prawy dolny */}
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
        style={{ position: "absolute", bottom: "28%", right: "5%" }}>
        <path d="M11 2 L20 11 L11 20 L2 11 Z" strokeWidth="2" strokeLinejoin="round" style={s}/>
      </svg>

      {/* Okrąg wypełniony — górny prawy obszar */}
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="hidden sm:block"
        style={{ position: "absolute", top: "22%", right: "22%" }}>
        <circle cx="4" cy="4" r="3.5" fill="var(--border-ink)" opacity="0.15"/>
      </svg>

      {/* Długa pozioma kreska — środek */}
      <svg width="80" height="6" viewBox="0 0 80 6" fill="none" className="hidden sm:block"
        style={{ position: "absolute", top: "62%", left: "22%" }}>
        <line x1="0" y1="3" x2="80" y2="3" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="8 5" style={s}/>
      </svg>

      {/* Mały kwadrat — lewy dolny */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="hidden sm:block"
        style={{ position: "absolute", bottom: "32%", left: "8%" }}>
        <rect x="2" y="2" width="14" height="14" rx="2" strokeWidth="2" style={s}/>
      </svg>

      {/* Skos — prawy górny obszar */}
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="hidden sm:block"
        style={{ position: "absolute", top: "18%", right: "30%" }}>
        <line x1="4" y1="26" x2="26" y2="4" strokeWidth="2" strokeLinecap="round" style={s}/>
        <line x1="4" y1="18" x2="18" y2="4" strokeWidth="1.5" strokeLinecap="round" style={s}/>
      </svg>

    </div>
  )
}

export function HeroSection() {
  return (
    <section
      className="relative flex items-center justify-center px-4"
      style={{ minHeight: "calc(100vh - 3.5rem)", paddingTop: "3.5rem" }}
    >
      <HeroDoodles />
      <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-16">

        {/* Lewa kolumna na desktop — tekst + obrazek mobile + przyciski */}
        <div className="lg:flex-2 flex flex-col gap-6 w-full">

          {/* Tekst — zawsze pierwszy */}
          <div className="flex flex-col gap-4">
            <h1
              className="text-4xl sm:text-5xl font-bold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Prześlij wszystko.
              <br />
              Jednym skanem.
            </h1>
            <p
              className="text-base sm:text-lg max-w-md"
              style={{ color: "var(--text-secondary)" }}
            >
              Pliki, zdjęcia, linki, tekst — między dowolnymi urządzeniami.
              <br />
              Bez konta. Bez kabla. Bez tej samej sieci.
            </p>
          </div>

          {/* Obrazek — tylko na mobile, pojawia się między tekstem a przyciskami */}
          <div className="lg:hidden w-full">
            <Image
              src="/hero-ilustration.png"
              alt="Flow Send illustration"
              width={520}
              height={293}
              className="w-full max-w-sm mx-auto"
              priority
            />
          </div>

          {/* Przyciski — zawsze po obrazku na mobile */}
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <Link
              href="/send"
              className="sketch-btn font-semibold px-6 py-3 text-base inline-block text-center"
              style={{ background: "var(--accent-primary)", color: "#ffffff" }}
            >
              Wyślij →
            </Link>
            <Link
              href="/receive"
              className="sketch-btn font-semibold px-6 py-3 text-base inline-block text-center"
              style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}
            >
              Odbierz
            </Link>
          </div>
        </div>

        {/* Prawa kolumna — obrazek tylko na desktop */}
        <div className="hidden lg:flex lg:flex-3 items-center justify-center">
          <Image
            src="/hero-ilustration.png"
            alt="Flow Send illustration"
            width={520}
            height={293}
            className="w-full"
            priority
          />
        </div>

      </div>
    </section>
  )
}
