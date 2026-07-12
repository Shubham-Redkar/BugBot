import { useScanner } from "./hooks/useScanner";
import NavBar from "./components/layout/NavBar";
import HomePage from "./components/pages/HomePage";
import ScanningPage from "./components/pages/ScanningPage";
import ResultsPage from "./components/pages/ResultsPage";
import ErrorOverlay from "./components/ui/ErrorOverlay";

export default function App() {
  const scanner = useScanner();

  return (
    <div className="app-shell">
      <NavBar
        phase={scanner.phase}
        systemStatus={scanner.systemStatus}
        onReset={scanner.reset}
      />

      <main className="main-content">
        {scanner.phase === "home" && <HomePage onScan={scanner.startScan} />}

        {scanner.phase === "scanning" && (
          <ScanningPage url={scanner.scannedUrl} onCancel={scanner.reset} />
        )}

        {scanner.phase === "results" && scanner.results && (
          <ResultsPage results={scanner.results} onReset={scanner.reset} />
        )}
      </main>

      {scanner.error && (
        <ErrorOverlay error={scanner.error} onClose={scanner.clearError} />
      )}
    </div>
  );
}
