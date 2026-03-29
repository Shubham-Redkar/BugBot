import NavBar from "./components/layout/NavBar";
import HomePage from "./components/pages/HomePage";
import ResultsPage from "./components/pages/ResultsPage";
import ScanningPage from "./components/pages/ScanningPage";
import ResultsLoader from "./components/ui/ResultsLoader";
import CursorReticle from "./components/ui/CursorReticle";
import HUDScaffolding from "./components/ui/HUDScaffolding";
import NeuralMesh from "./components/ui/NeuralMesh";
import { useScanner } from "./hooks/useScanner";

export default function App() {
  const scanner = useScanner();

  return (
    <div className="relative min-h-screen" style={{ background: "#050505" }}>
      <NeuralMesh />

      <HUDScaffolding />

      <CursorReticle />

      <NavBar phase={scanner.phase} onReset={scanner.reset} />

      {scanner.phase === "home" && <HomePage onScan={scanner.startScan} />}

      {scanner.phase === "scanning" && (
        <ScanningPage
          activeStep={scanner.activeStep}
          doneSteps={scanner.doneSteps}
          logLines={scanner.logLines}
          scannedUrl={scanner.scannedUrl}
        />
      )}

      {scanner.phase === "compiling" && (
        <ResultsLoader
          onComplete={scanner.confirmResults}
          dataReady={scanner.dataReady}
        />
      )}

      {scanner.phase === "results" && scanner.results && (
        <ResultsPage results={scanner.results} onReset={scanner.reset} />
      )}
    </div>
  );
}
