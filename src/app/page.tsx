import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { TechnologySection } from "@/components/landing/TechnologySection";
import { ConsentSection } from "@/components/landing/ConsentSection";
import { FooterSection } from "@/components/landing/FooterSection";

export default function HomePage() {
  return (
    <div className="grain-texture min-h-full bg-background">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <TrustSection />
        <TechnologySection />
        <ConsentSection />
      </main>
      <FooterSection />
    </div>
  );
}
