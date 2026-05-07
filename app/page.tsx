import { LandingNavbar } from "@/components/landing/landing-navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { TransferTypesSection } from "@/components/landing/transfer-types-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <LandingNavbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <TransferTypesSection />
      </main>
      <LandingFooter />
    </div>
  )
}
