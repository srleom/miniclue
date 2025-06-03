import { Header } from "@/components/header";
import HeroSection from "@/components/hero-section";

export default async function Dashboard() {
  return (
    <div>
      <Header authenticated={true} />
      <HeroSection />
    </div>
  );
}
