import { Routes, Route, Link } from "react-router-dom";
import { PlanProvider } from "./lib/plan";
import ComponentGallery from "./pages/ComponentGallery";

function SandboxNav() {
  return (
    <nav className="app-nav">
      <Link to="/" className="nav-brand">
        <img src="/tipoffhq_logo.png" alt="TipOff" width={32} height={32} />
        <span>TipOff Sandbox</span>
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-link active">
          Components
        </Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <div className="ambient-blobs" aria-hidden="true">
        <span className="blob blob-primary" />
        <span className="blob blob-secondary" />
        <span className="blob blob-tertiary" />
        <span className="blob blob-bottom" />
      </div>
      <PlanProvider>
        <div className="app-shell">
          <SandboxNav />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<ComponentGallery />} />
            </Routes>
          </main>
        </div>
      </PlanProvider>
    </>
  );
}
