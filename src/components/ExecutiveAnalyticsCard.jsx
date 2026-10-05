import React, { useState } from "react";
import {
  Activity,
  Droplets,
  Leaf,
  ShieldCheck,
  Sun,
  Layers,
  Compass,
  Loader2,
  MapPin,
} from "lucide-react";

export default function ExecutiveAnalyticsCard({ summary, isLoading }) {
  const [activeTab, setActiveTab] = useState("NDVI");

  if (isLoading) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[300px] text-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <div className="font-mono text-xs text-sky-300">
          Retrieving Sentinel-2 observations for this location…
        </div>
        <p className="text-[11px] text-slate-500 max-w-xs">
          Preparing the 2022–2026 spectral indicators for your selected
          coordinates.
        </p>
      </div>
    );
  }

  if (!summary || !summary.indices || summary.indices.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl text-center text-slate-500 font-mono text-xs">
        Select a watershed zone or click on the map to ingest satellite indices.
      </div>
    );
  }

  const { structure, category, confidence, drift_m, indices, watershed_name } =
    summary;
  const latest = indices[indices.length - 1];
  const hasEstimatedData = indices.some(
    (record) => record.source && record.source !== "sentinel-2",
  );
  const hasRealObservation = indices.some(
    (record) => record.source === "sentinel-2",
  );

  const indexMetrics = [
    {
      key: "ndvi",
      name: "NDVI",
      label: "Biomass Canopy",
      val: latest.ndvi,
      icon: Leaf,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
    },
    {
      key: "ndwi",
      name: "NDWI",
      label: "Surface Water",
      val: latest.ndwi,
      icon: Droplets,
      color: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
    },
    {
      key: "smi",
      name: "SMI",
      label: "Soil Moisture",
      val: latest.smi,
      icon: Sun,
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    {
      key: "ndti",
      name: "NDTI",
      label: "Turbidity (Silt)",
      val: latest.ndti,
      icon: Layers,
      color: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
    },
    {
      key: "evi",
      name: "EVI",
      label: "Enhanced Veg",
      val: latest.evi,
      icon: Activity,
      color: "text-lime-400",
      border: "border-lime-500/30",
      bg: "bg-lime-500/10",
    },
    {
      key: "bsi",
      name: "BSI",
      label: "Bare Soil Erosion",
      val: latest.bsi,
      icon: Compass,
      color: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
    },
  ];

  const metricData = indices.map((i) => ({
      year: i.year,
      val: i[activeTab.toLowerCase()],
      source: i.source,
    }));
  const firstMetric = metricData[0];
  const latestMetric = metricData[metricData.length - 1];
  const netChange = latestMetric.val - firstMetric.val;
  const trendLabel =
    netChange > 0.005 ? "Higher than first year" : netChange < -0.005 ? "Lower than first year" : "Little net change";
  const trendDirection =
    netChange > 0.005 ? "up" : netChange < -0.005 ? "down" : "steady";
  const metricMin = Math.min(...metricData.map((point) => point.val));
  const metricMax = Math.max(...metricData.map((point) => point.val));
  const metricSpan = metricMax - metricMin || 1;
  const realObservationCount = indices.filter(
    (record) => record.source === "sentinel-2",
  ).length;
  const latestBands = latest.raw_bands;
  const bandNames = [
    ["blue", "Blue", "B02"],
    ["green", "Green", "B03"],
    ["red", "Red", "B04"],
    ["nir", "Near infrared", "B08"],
    ["swir", "Shortwave infrared", "B11"],
  ];

  return (
    <div className="glass-panel analytics-focus monitoring-analytics-card p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
      {/* Header telemetry */}
      <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              {watershed_name || structure || "Selected Watershed Polygon"}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {category || "Multi-Temporal Sentinel-2 L2A Radiance Analysis"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {confidence && (
            <span className="text-xs font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-lg">
              AI Conf: {Math.round(confidence * 100)}%
            </span>
          )}
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-lg flex items-center gap-1 border ${
              drift_m !== undefined
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-500/10 text-slate-300 border-slate-500/30"
            }`}
          >
            {drift_m !== undefined ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
            {drift_m !== undefined
              ? `Drift: ${drift_m.toFixed(0)}m`
              : "Selected location"}
          </span>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 text-[10px]"
        data-tour="data-source"
      >
        <span className="text-slate-500">Data source:</span>
        {hasRealObservation ? (
          <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
            Sentinel-2 pixel values
          </span>
        ) : (
          <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-300">
            Coordinate-derived estimates
          </span>
        )}
        {hasEstimatedData && (
          <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-300">
            Some years are estimates
          </span>
        )}
      </div>

      {/* 6 Index Grid */}
      <div className="monitoring-index-grid grid grid-cols-3 gap-2" data-tour="index-cards">
        {indexMetrics.map((m) => {
          const Icon = m.icon;
          const isSelected = activeTab === m.name;
          return (
            <button
              key={m.name}
              onClick={() => setActiveTab(m.name)}
              className={`monitoring-index-card p-2.5 rounded-xl border text-left transition-all ${m.bg} ${m.border} ${
                isSelected
                  ? "ring-2 ring-sky-400 scale-[1.02]"
                  : "opacity-85 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">
                  {m.name}
                </span>
                <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              </div>
              <div className={`text-base font-mono font-bold mt-1 ${m.color}`}>
                {m.val > 0 ? `+${m.val.toFixed(2)}` : m.val.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                {m.label}
              </div>
            </button>
          );
        })}
      </div>

      {latestBands && (
        <section className="band-readout" aria-label="Latest spectral band values">
          <div className="band-readout-heading">
            <strong>Band reflectance</strong>
            <span>{latest.year} · scaled values</span>
          </div>
          <div className="band-readout-grid">
            {bandNames.map(([key, label, band]) => (
              <div className="band-value" key={key}>
                <span>{band}</span>
                <strong>{latestBands[key]?.toFixed(4) ?? "—"}</strong>
                <small>{label}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={`monitoring-signal-card signal-${trendDirection}`}>
        <div className="monitoring-signal-mark" aria-hidden="true">
          <Activity size={18} />
        </div>
        <div className="monitoring-signal-copy">
          <span>LONG-TERM SIGNAL · {activeTab}</span>
          <strong>{trendLabel}</strong>
          <p>
            {activeTab} changed by {netChange > 0 ? "+" : ""}
            {netChange.toFixed(2)} between {firstMetric.year} and {latestMetric.year}.
            This describes the loaded series, not a field-verified ecological outcome.
          </p>
        </div>
        <div className="monitoring-signal-stat">
          <strong>{netChange > 0 ? "+" : ""}{netChange.toFixed(2)}</strong>
          <span>NET CHANGE</span>
          <small>{realObservationCount} of {indices.length} Sentinel-2 years</small>
        </div>
      </div>

      {/* 5-Year Trend Graph */}
      <div
        className="monitoring-trend-panel bg-slate-950/60 p-3 rounded-xl border border-slate-800"
        data-tour="trend-chart"
      >
        <div className="monitoring-trend-heading">
          <div>
            <span className="eyebrow">YEAR-BY-YEAR PROFILE</span>
            <strong>{activeTab} <span>trajectory</span></strong>
          </div>
          <span className="monitoring-trend-range">{firstMetric.year} — {latestMetric.year} <span>·</span> {metricData.length} samples</span>
        </div>

        <div className="monitoring-trend-chart">
          {metricData.map((d) => {
            const normalizedHeight = 22 + ((d.val - metricMin) / metricSpan) * 66;
            return (
              <div
                key={d.year}
                className="monitoring-trend-point flex-1 flex flex-col items-center gap-1 group"
                title={`${d.year}: ${d.val.toFixed(3)}${d.source === "sentinel-2" ? " · Sentinel-2" : d.source ? " · Estimate" : ""}`}
              >
                <div className="monitoring-trend-value text-[9px] font-mono text-slate-400">
                  {d.val.toFixed(2)}
                </div>
                <div
                  style={{ height: `${normalizedHeight}%` }}
                  className={`monitoring-trend-bar w-full rounded-t-sm transition-all duration-300${d.source && d.source !== "sentinel-2" ? " estimated" : ""}`}
                />
                <span className="monitoring-trend-year text-[9px] font-mono text-slate-500 mt-1">
                  {d.year}
                </span>
                {d.source && d.source !== "sentinel-2" && (
                  <span className="monitoring-estimate-tag">
                    EST.
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
