import React from "react";
import {
  Activity,
  Database,
  FileUp,
  Home,
  Info,
  Map,
  Satellite,
  ChartNoAxesCombined,
  Wifi,
  WifiOff,
} from "lucide-react";

const navigation = [
  { id: "home", label: "Home", icon: Home },
  { id: "map", label: "Map", icon: Map },
  { id: "upload", label: "Upload", icon: FileUp },
  { id: "monitoring", label: "Monitoring", icon: ChartNoAxesCombined },
  { id: "vault", label: "Offline vault", icon: Database },
  { id: "about", label: "About", icon: Info },
];

export default function Header({
  isOnline,
  activeTab,
  setActiveTab,
  pendingCount,
}) {
  return (
    <header className="app-header" id="top">
      <div className="header-main">
        <a
          className="brand"
          href="#top"
          onClick={() => setActiveTab("home")}
          aria-label="Drishti home"
        >
          <span className="brand-mark">
            <Satellite size={21} strokeWidth={1.8} />
          </span>
          <span className="brand-copy">
            <strong className="brand-name" aria-hidden="true">
              <span className="brand-name-typed">Drisht</span>
              <span className="brand-name-falling-i">i</span>
            </strong>
            <small>WATERSHED MONITORING</small>
          </span>
        </a>

        <nav
          className="primary-nav"
          aria-label="Main navigation"
          data-tour="main-navigation"
        >
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`nav-link ${activeTab === id ? "active" : ""}`}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
              {id === "vault" && pendingCount > 0 && (
                <span className="nav-count">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div
          className={`connection-status ${isOnline ? "online" : "offline"}`}
          role="status"
          aria-live="polite"
        >
          {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
          <span>{isOnline ? "Connected" : "Offline mode"}</span>
        </div>
      </div>

      <div className="header-subline">
        <span className="live-indicator">
          <Activity size={13} />
          {isOnline ? "Ready" : "Available offline"}
        </span>
        <span className="subline-separator" />
        <span>Sentinel-2 · 2022–2026</span>
      </div>
    </header>
  );
}
