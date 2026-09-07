import Nav from "./components/Nav";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import ProofBand from "./components/ProofBand";
import RunConsole from "./components/RunConsole";
import Footer from "./components/Footer";
import EasterEgg from "./components/EasterEgg";

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <ProofBand />
        <RunConsole />
      </main>
      <Footer />
      <EasterEgg />
    </div>
  );
}
