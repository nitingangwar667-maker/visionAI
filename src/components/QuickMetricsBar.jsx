import React from "react";
import {
  Activity,
  Database,
  MapPin,
  Satellite,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function QuickMetricsBar({
  coords,
  auditSummary,
  isOnline,
  pendingCount,
  isLoading,
}) {
  const latest = auditSummary?.indices?.at(-1);
  const indexSources = auditSummary?.indices
    ?.map((record) => record.source)
    .filter(Boolean);
  const hasRealObservation = indexSources?.includes("sentinel-2");
  const hasEstimate =
    auditSummary?.category?.includes("estimate") ||
    auditSummary?.category?.includes("gaps") ||
    indexSources?.some((source) => source !== "sentinel-2");

  const cards = [
    {
      label: "Study coordinates",
      value: `${coords.latitude.toFixed(4)}°, ${coords.longitude.toFixed(4)}°`,
      detail: "Selected map location",
      icon: MapPin,
      tone: "blue",
    },
    {
      label: "Satellite data",
      value: isLoading
        ? "Updating…"
        : hasRealObservation
          ? "Sentinel-2 available"
          : hasEstimate
            ? "Includes estimates"
            : "Awaiting observations",
      detail: hasEstimate
        ? "Check source labels in the trend"
        : "2022–2026 observation window",
      icon: Satellite,
      tone: "teal",
    },
    {
      label: "Latest NDVI",
      value: latest ? latest.ndvi.toFixed(3) : "—",
      detail: latest ? `Most recent year · ${latest.year}` : "No result yet",
      icon: Activity,
      tone: "green",
    },
    {
      label: "Offline records",
      value: pendingCount === 1 ? "1 record" : `${pendingCount} records`,
      detail:
        pendingCount === 0
          ? "No pending records"
          : isOnline
            ? "Ready to sync"
            : "Saved on this device",
      icon: pendingCount > 0 ? Database : isOnline ? Wifi : WifiOff,
      tone: pendingCount > 0 ? "amber" : "slate",
    },
  ];

  return (
    <section
      className="metrics-wrap"
      aria-label="Workspace overview"
      data-tour="quick-metrics home-overview"
    >
      <div className="metrics-grid">
        {cards.map(({ label, value, detail, icon: Icon, tone }) => (
          <article className={`metric-card tone-${tone}`} key={label}>
            <span className="metric-icon">
              <Icon size={17} />
            </span>
            <div className="metric-content">
              <span className="metric-label">{label}</span>
              <strong className="metric-value">{value}</strong>
              <span className="metric-detail">{detail}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
