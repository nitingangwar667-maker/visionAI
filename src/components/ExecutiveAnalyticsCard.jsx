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
          Loading satellite readings for this location…
        </div>
        <p className="text-[11px] text-slate-500 max-w-xs">
          Loading yearly index readings for the selected location.
        </p>
      </div>
    );
  }

  if (!summary || !summary.indices || summary.indices.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl text-center text-slate-500 font-mono text-xs">
        Choose a study area to load its available satellite readings.
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
      label: "Vegetation greenness",
      val: latest.ndvi,
      icon: Leaf,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      accent: "#4f8b59",
    },
    {
      key: "ndwi",
      name: "NDWI",
      label: "Surface water",
      val: latest.ndwi,
      icon: Droplets,
      color: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      accent: "#278a94",
    },
    {
      key: "smi",
      name: "SMI",
      label: "Surface moisture",
      val: latest.smi,
      icon: Sun,
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      accent: "#c18b3e",
    },
    {
      key: "ndti",
      name: "NDTI",
      label: "Turbidity",
      val: latest.ndti,
      icon: Layers,
      color: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
      accent: "#8064a8",
    },
    {
      key: "evi",
      name: "EVI",
      label: "Enhanced vegetation",
      val: latest.evi,
      icon: Activity,
      color: "text-lime-400",
      border: "border-lime-500/30",
      bg: "bg-lime-500/10",
      accent: "#6b963e",
    },
    {
      key: "bsi",
      name: "BSI",
      label: "Bare soil",
      val: latest.bsi,
      icon: Compass,
      color: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
      accent: "#b66b60",
    },
  ];

  const metricData = indices.map((i) => ({
      year: i.year,
      val: i[activeTab.toLowerCase()],
      source: i.source,
    }));
  const chartMin = Math.min(...metricData.map((point) => point.val));
  const chartMax = Math.max(...metricData.map((point) => point.val));
  const chartRange = chartMax - chartMin || 1;
  const chartPadding = chartRange * 0.12;
  const chartDomainMin = chartMin - chartPadding;
  const chartDomainMax = chartMax + chartPadding;
  const chartDomainRange = chartDomainMax - chartDomainMin || 1;
  const chartPoints = metricData.map((point, index) => ({
    ...point,
    x: metricData.length === 1 ? 400 : 40 + (index * 720) / (metricData.length - 1),
    y: 164 - ((point.val - chartDomainMin) / chartDomainRange) * 132,
  }));
  const miniSparkline = (metricKey) => {
    const values = indices
      .map((record) => record[metricKey])
      .filter(Number.isFinite);
    if (!values.length) return "";
    const min = Math.min(...values);
    const span = Math.max(...values) - min || 1;
    return values
      .map((value, index) => {
        const x = values.length === 1 ? 50 : 3 + (index * 94) / (values.length - 1);
        const y = 25 - ((value - min) / span) * 18;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };
  const firstMetric = metricData[0];
  const latestMetric = metricData[metricData.length - 1];
  const netChange = latestMetric.val - firstMetric.val;
  const trendLabel =
    netChange > 0.005 ? "Higher than first year" : netChange < -0.005 ? "Lower than first year" : "Little net change";
  const trendDirection =
    netChange > 0.005 ? "up" : netChange < -0.005 ? "down" : "steady";
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
              {watershed_name || structure || "Selected study area"}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {category || "Satellite observations and index readings"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {confidence && (
            <span className="text-xs font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-lg">
              Model match: {Math.round(confidence * 100)}%
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
              ? `${drift_m.toFixed(0)} m from reference`
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
            Sentinel-2 observations
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
              aria-pressed={isSelected}
              className={`monitoring-index-card p-2.5 rounded-xl border text-left transition-all ${m.bg} ${m.border} ${
                isSelected
                  ? "is-selected ring-2 ring-sky-400 scale-[1.02]"
                  : "opacity-85 hover:opacity-100"
              }`}
              style={{ "--metric-accent": m.accent }}
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
              <div className="monitoring-index-label text-[9px] text-slate-400 truncate">
                {m.label}
              </div>
              <svg
                className="monitoring-index-sparkline"
                viewBox="0 0 100 30"
                role="img"
                aria-label={`${m.name} trend over ${indices.length} years`}
              >
                <path d={miniSparkline(m.key)} />
              </svg>
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
          <span>{activeTab} · YEARLY CHANGE</span>
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
          <div className="monitoring-trend-meta">
            <span className="monitoring-trend-current">
              Latest <strong>{latestMetric.val > 0 ? "+" : ""}{latestMetric.val.toFixed(3)}</strong>
            </span>
            <span className="monitoring-trend-range">{firstMetric.year} — {latestMetric.year} <span>·</span> {metricData.length} years</span>
          </div>
        </div>

        <div className="monitoring-trend-chart">
          <div className="monitoring-chart-scale" aria-hidden="true">
            <span>{chartMax.toFixed(2)}</span>
            <span>{((chartMax + chartMin) / 2).toFixed(2)}</span>
            <span>{chartMin.toFixed(2)}</span>
          </div>
          <svg
            className="monitoring-trend-svg"
            viewBox="0 0 800 220"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${activeTab} yearly values from ${firstMetric.year} to ${latestMetric.year}`}
          >
            {[32, 98, 164].map((y) => (
              <line
                key={y}
                className="monitoring-chart-gridline"
                x1="40"
                x2="760"
                y1={y}
                y2={y}
              />
            ))}
            {chartPoints.slice(1).map((point, index) => {
              const previous = chartPoints[index];
              const isEstimated = [previous, point].some(
                (item) => item.source && item.source !== "sentinel-2",
              );
              return (
                <line
                  key={`${previous.year}-${point.year}`}
                  className={`monitoring-chart-segment${isEstimated ? " estimated" : ""}`}
                  x1={previous.x}
                  y1={previous.y}
                  x2={point.x}
                  y2={point.y}
                />
              );
            })}
            {chartPoints.map((point, index) => {
              const isEstimated =
                point.source && point.source !== "sentinel-2";
              return (
                <g
                  key={point.year}
                  className={`monitoring-chart-point${isEstimated ? " estimated" : ""}`}
                >
                  {index === chartPoints.length - 1 && (
                    <circle className="monitoring-chart-halo" cx={point.x} cy={point.y} r="10" />
                  )}
                  <circle className="monitoring-chart-dot" cx={point.x} cy={point.y} r="5" />
                  <title>
                    {point.year}: {point.val.toFixed(3)}
                    {isEstimated ? " · Estimate" : point.source === "sentinel-2" ? " · Sentinel-2 observation" : ""}
                  </title>
                </g>
              );
            })}
            {chartPoints.map((point) => (
              <text
                key={`year-${point.year}`}
                className="monitoring-chart-year"
                x={point.x}
                y="202"
                textAnchor="middle"
              >
                {point.year}
              </text>
            ))}
          </svg>
        </div>
        <div className="monitoring-chart-legend">
          <span><i className="observed" /> Sentinel-2 observation</span>
          <span><i className="estimated" /> Coordinate-derived estimate</span>
          <small>Values are scaled to this series for readability.</small>
        </div>
      </div>
    </div>
  );
}
