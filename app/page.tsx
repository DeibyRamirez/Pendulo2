import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { StatsSection } from "@/components/stats-section"
import { AboutSection } from "@/components/about-section"
import { Footer } from "@/components/footer"
import { BurbujaChatFlotante } from "@/components/chat/BurbujaChatFlotante"

export default function Home() {
  return (
    <main id="contenido" className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <AboutSection />
      <Footer />
      <BurbujaChatFlotante />
    </main>
  )
}
