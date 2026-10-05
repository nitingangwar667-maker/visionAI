import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Droplets,
  Layers,
  LoaderCircle,
  Mountain,
  RotateCw,
  Satellite,
  Sprout,
  Waves,
} from "lucide-react";
import { fetchWatershedHeatmap } from "../services/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const WATERSHED_PRESETS = [
  { id: "kolar", name: "Kolar Sub-Basin (Karnataka)", lat: 13.1338, lon: 78.1332 },
  { id: "raichur", name: "Raichur Tungabhadra Catchment", lat: 16.2076, lon: 77.3463 },
  { id: "anantapur", name: "Anantapur Arid Watershed (AP)", lat: 14.6819, lon: 77.6006 },
  { id: "bundelkhand", name: "Bundelkhand Recharge Zone (MP/UP)", lat: 25.4484, lon: 78.5685 },
  { id: "nagpur", name: "Vidarbha Basin (Maharashtra)", lat: 21.1458, lon: 79.0882 },
  { id: "barmer", name: "Thar Canal Command (Rajasthan)", lat: 25.7532, lon: 71.4181 },
];

const INDEX_OPTIONS = [
  { id: "ndvi", name: "Vegetation · NDVI", low: "Sparse cover", high: "Healthy cover", min: -1, max: 1, lowMax: 0.2, mediumMax: 0.5, magnitude: "vegetation signal", description: "Higher values generally indicate denser, healthier green vegetation.", icon: Sprout, colors: ["#bb5657", "#e5a653", "#ede176", "#8bc77f", "#218364"] },
  { id: "ndwi", name: "Water · NDWI", low: "Drier", high: "Wetter", min: -1, max: 1, lowMax: -0.1, mediumMax: 0.3, magnitude: "water signal", description: "Higher values indicate a stronger surface-water or moisture signal.", icon: Droplets, colors: ["#bc8656", "#e3d18b", "#a7d8c1", "#4aa5a4", "#255a9d"] },
  { id: "smi", name: "Soil moisture · SMI", low: "Drier", high: "Moister", min: 0, max: 1, lowMax: 0.1, mediumMax: 0.3, magnitude: "moisture signal", description: "This moisture proxy is derived from near-infrared and shortwave-infrared reflectance; higher values suggest wetter surface conditions.", icon: Droplets, colors: ["#c7784e", "#e5bf75", "#b8d49b", "#61b6a2", "#346c9c"] },
  { id: "ndti", name: "Turbidity · NDTI", low: "Lower signal", high: "Higher signal", min: -1, max: 1, lowMax: 0.1, mediumMax: 0.3, magnitude: "turbidity signal", description: "Higher values can indicate more suspended material in water; confirm with field observations.", icon: Waves, colors: ["#397e9e", "#75bdb4", "#e4d58b", "#e79a60", "#bd5554"] },
  { id: "bsi", name: "Bare soil · BSI", low: "Less exposed", high: "More exposed", min: -1, max: 1, lowMax: 0, mediumMax: 0.2, magnitude: "bare-soil signal", description: "Higher values indicate more exposed or bare soil and may warrant a closer field review.", icon: Mountain, colors: ["#397c69", "#8eb987", "#e2d58a", "#df9b5d", "#a94f48"] },
  { id: "evi", name: "Vegetation · EVI", low: "Sparse cover", high: "Healthy cover", min: -1, max: 1.5, lowMax: 0.2, mediumMax: 0.5, magnitude: "vegetation signal", description: "Higher values generally indicate denser green vegetation, with improved sensitivity in areas of thicker canopy.", icon: Sprout, colors: ["#bb5657", "#e5a653", "#ede176", "#8bc77f", "#218364"] },
];
const HEAT_CLASSES = [
  { id: "low", name: "Low", color: "#d58a61" },
  { id: "medium", name: "Moderate", color: "#e0bd59" },
  { id: "high", name: "High", color: "#57946b" },
];
const MAPBOX_TOKEN = (
  import.meta.env.NEXT_PUBLIC_MAPBOX_API_KEY ??
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
)?.trim();

function interpolateColor(colors, ratio) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const step = clamped * (colors.length - 1);
  const index = Math.min(Math.floor(step), colors.length - 2);
  const blend = step - index;
  const from = colors[index].slice(1).match(/.{2}/g).map((part) => parseInt(part, 16));
  const to = colors[index + 1].slice(1).match(/.{2}/g).map((part) => parseInt(part, 16));
  return `#${from.map((value, channel) =>
    Math.round(value + (to[channel] - value) * blend)
      .toString(16)
      .padStart(2, "0"),
  ).join("")}`;
}

function classifyIndexValue(value, index) {
  if (value < index.lowMax) return "low";
  if (value < index.mediumMax) return "medium";
  return "high";
}

function classColor(classId, index) {
  const representativeValues = {
    low: (index.min + index.lowMax) / 2,
    medium: (index.lowMax + index.mediumMax) / 2,
    high: (index.mediumMax + index.max) / 2,
  };
  const ratio =
    (representativeValues[classId] - index.min) / (index.max - index.min);
  return interpolateColor(index.colors, ratio);
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(lat2 - lat1);
  const longitudeDelta = radians(lon2 - lon1);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export default function BhuvanMapCard({
  coords,
  onCoordsChange,
  selectedPreset,
  onPresetChange,
  auditSummary,
  isIndicesLoading,
  onHeatmapSummaryChange,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState("ndvi");
  const [selectedYear, setSelectedYear] = useState(null);
  const [heatmapRefreshId, setHeatmapRefreshId] = useState(0);
  const [heatmap, setHeatmap] = useState({ key: "", data: null, error: "" });
  const [mapReady, setMapReady] = useState(false);
  const [canShowHeatmap, setCanShowHeatmap] = useState(true);
  const observedYear = [...(auditSummary?.indices ?? [])]
    .reverse()
    .find((record) => record.source === "sentinel-2")?.year;
  const latestYear = auditSummary?.indices?.at(-1)?.year;
  const activeYear = selectedYear ?? observedYear ?? latestYear ?? 2025;
  const activeIndex = INDEX_OPTIONS.find((item) => item.id === selectedIndex);
  const IndexIcon = activeIndex.icon;
  const heatmapKey = `${coords.latitude}:${coords.longitude}:${selectedIndex}:${activeYear}:${heatmapRefreshId}`;
  const currentHeatmap = heatmap.key === heatmapKey ? heatmap : null;
  const heatmapData = currentHeatmap?.data;
  const isHeatmapLoading = !currentHeatmap;
  const heatmapError = currentHeatmap?.error ?? "";
  const observedCellCount =
    heatmapData?.cells?.filter((cell) => cell.value !== null).length ?? 0;
  const validCells = useMemo(
    () => heatmapData?.cells?.filter((cell) => Number.isFinite(cell.value)) ?? [],
    [heatmapData],
  );
  const heatmapStats = useMemo(
    () => validCells.reduce(
      (stats, cell) => ({
        min: Math.min(stats.min, cell.value),
        max: Math.max(stats.max, cell.value),
        sum: stats.sum + cell.value,
        classes: {
          ...stats.classes,
          [classifyIndexValue(cell.value, activeIndex)]:
            stats.classes[classifyIndexValue(cell.value, activeIndex)] + 1,
        },
      }),
      {
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
        sum: 0,
        classes: { low: 0, medium: 0, high: 0 },
      },
    ),
    [activeIndex, validCells],
  );
  const heatmapMean = useMemo(
    () => validCells.length ? heatmapStats.sum / validCells.length : null,
    [heatmapStats.sum, validCells.length],
  );
  const heatmapRange = useMemo(
    () => validCells.length
      ? { min: heatmapStats.min, max: heatmapStats.max }
      : null,
    [heatmapStats.max, heatmapStats.min, validCells.length],
  );
  const nearestSample = useMemo(() => heatmapData
    ? validCells.reduce((closest, cell) => {
        const sampleLat =
          heatmapData.bounds.north -
          ((cell.row + 0.5) / heatmapData.grid_size) *
            (heatmapData.bounds.north - heatmapData.bounds.south);
        const sampleLon =
          heatmapData.bounds.west +
          ((cell.col + 0.5) / heatmapData.grid_size) *
            (heatmapData.bounds.east - heatmapData.bounds.west);
        const distance = distanceMeters(
          coords.latitude,
          coords.longitude,
          sampleLat,
          sampleLon,
        );
        return !closest || distance < closest.distance
          ? { ...cell, distance }
          : closest;
      }, null)
    : null, [coords.latitude, coords.longitude, heatmapData, validCells]);
  const pointClass = nearestSample
    ? HEAT_CLASSES.find(
        (item) =>
          item.id === classifyIndexValue(nearestSample.value, activeIndex),
      )
    : null;
  const callbacksRef = useRef({ onCoordsChange, onPresetChange });

  useEffect(() => {
    const controller = new AbortController();
    fetchWatershedHeatmap(
      coords.latitude,
      coords.longitude,
      selectedIndex,
      activeYear,
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setHeatmap({ key: heatmapKey, data, error: "" });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          const message = error.message === "Failed to fetch"
            ? "Cannot reach the API. Check that the backend is running."
            : error.message;
          setHeatmap({ key: heatmapKey, data: null, error: message });
        }
      });
    return () => controller.abort();
  }, [coords.latitude, coords.longitude, selectedIndex, activeYear, heatmapKey]);

  useEffect(() => {
    callbacksRef.current = { onCoordsChange, onPresetChange };
  }, [onCoordsChange, onPresetChange]);

  useEffect(() => {
    if (!heatmapData || !validCells.length) {
      onHeatmapSummaryChange(null);
      return;
    }
    onHeatmapSummaryChange({
      latitude: coords.latitude,
      longitude: coords.longitude,
      index: selectedIndex,
      year: heatmapData.year,
      validPixels: validCells.length,
      nearestValue: nearestSample?.value ?? null,
      nearestDistance: nearestSample ? Math.round(nearestSample.distance) : null,
      mean: heatmapMean,
      min: heatmapRange?.min ?? null,
      max: heatmapRange?.max ?? null,
      classes: heatmapStats.classes,
    });
  }, [
    coords.latitude,
    coords.longitude,
    heatmapData,
    heatmapKey,
    heatmapMean,
    heatmapRange?.max,
    heatmapRange?.min,
    heatmapStats.classes,
    nearestSample,
    onHeatmapSummaryChange,
    selectedIndex,
    validCells.length,
  ]);

  useEffect(() => {
    if (!mapInstanceRef.current && mapContainerRef.current) {
      const initialCenter = [WATERSHED_PRESETS[0].lat, WATERSHED_PRESETS[0].lon];
      const map = L.map(mapContainerRef.current).setView(
        initialCenter,
        13,
      );
      mapInstanceRef.current = map;

      const osmLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        },
      );
      const baseLayers = { "OpenStreetMap": osmLayer };
      let defaultLayer = osmLayer;

      if (MAPBOX_TOKEN) {
        const mapboxUrl = (style) =>
          `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/256/{z}/{x}/{y}?access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
        const satelliteLayer = L.tileLayer(mapboxUrl("satellite-streets-v12"), {
          attribution: "© Mapbox © OpenStreetMap",
          maxZoom: 22,
        });
        const terrainLayer = L.tileLayer(mapboxUrl("outdoors-v12"), {
          attribution: "© Mapbox © OpenStreetMap",
          maxZoom: 22,
        });
        baseLayers["Mapbox Satellite"] = satelliteLayer;
        baseLayers["Mapbox Outdoors"] = terrainLayer;
        defaultLayer = satelliteLayer;
      }

      // ISRO Bhuvan remains available as an alternate reference layer.
      const bhuvanLayer = L.tileLayer
        .wms("https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms/", {
          layers: "india3",
          format: "image/jpeg",
          version: "1.1.1",
          attribution: "© ISRO Bhuvan",
        })
      baseLayers["ISRO Bhuvan"] = bhuvanLayer;
      defaultLayer.addTo(map);
      map.createPane("heatmap");
      map.getPane("heatmap").style.zIndex = "450";
      map.createPane("watershed-boundary");
      map.getPane("watershed-boundary").style.zIndex = "470";

      L.control
        .layers(baseLayers)
        .addTo(map);

      // Watershed Geofence Boundary
      const circle = L.circle(initialCenter, {
        pane: "watershed-boundary",
        color: "#f5f7e8",
        weight: 2,
        dashArray: "5 5",
        fillColor: "#91d18b",
        fillOpacity: 0.07,
        radius: 3500,
      })
        .addTo(map)
        .bindPopup("3.5 km study area");
      circleRef.current = circle;

      // Draggable Marker
      const marker = L.marker(initialCenter, {
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      marker.on("dragstart", () => {
        isDraggingRef.current = true;
      });

      marker.on("drag", (event) => {
        const { lat, lng } = event.target.getLatLng();
        circle.setLatLng([lat, lng]);
        callbacksRef.current.onPresetChange("custom");
        callbacksRef.current.onCoordsChange({ latitude: lat, longitude: lng });
      });

      marker.on("dragend", (event) => {
        const { lat, lng } = event.target.getLatLng();
        isDraggingRef.current = false;
        circle.setLatLng([lat, lng]);
        callbacksRef.current.onPresetChange("custom");
        callbacksRef.current.onCoordsChange({ latitude: lat, longitude: lng });
      });

      // Click anywhere to reposition marker & update satellite query
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        callbacksRef.current.onPresetChange("custom");
        callbacksRef.current.onCoordsChange({ latitude: lat, longitude: lng });
      });

      map.on("zoomend", () => {
        setCanShowHeatmap(map.getZoom() >= 11);
      });
      setCanShowHeatmap(map.getZoom() >= 11);
      setMapReady(true);
    }

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      heatmapLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapReady || !map) return undefined;
    heatmapLayerRef.current?.remove();
    heatmapLayerRef.current = null;
    if (!canShowHeatmap || !heatmapData?.cells?.length) return undefined;

    const { bounds, grid_size: gridSize, cells } = heatmapData;
    const latitudeStep = (bounds.north - bounds.south) / gridSize;
    const longitudeStep = (bounds.east - bounds.west) / gridSize;
    const layer = L.layerGroup();
    for (const cell of cells) {
      if (cell.value === null || !Number.isFinite(cell.value)) continue;
      const ratio = (cell.value - activeIndex.min) / (activeIndex.max - activeIndex.min);
      const north = bounds.north - cell.row * latitudeStep;
      const south = north - latitudeStep;
      const west = bounds.west + cell.col * longitudeStep;
      const east = west + longitudeStep;
      L.rectangle([[south, west], [north, east]], {
        pane: "heatmap",
        color: "transparent",
        weight: 0,
        fillColor: interpolateColor(activeIndex.colors, ratio),
        fillOpacity: 0.72,
        interactive: true,
      })
        .bindTooltip(`${activeIndex.id.toUpperCase()} · ${cell.value.toFixed(3)}`, {
          direction: "top",
          sticky: true,
          className: "index-heat-tooltip",
        })
        .addTo(layer);
    }
    layer.addTo(map);
    heatmapLayerRef.current = layer;
    return () => layer.remove();
  }, [activeIndex, canShowHeatmap, heatmapData, mapReady]);

  // Update map viewport when presets or coordinates change
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      markerRef.current &&
      circleRef.current &&
      !isDraggingRef.current
    ) {
      const targetLatLng = [coords.latitude, coords.longitude];
      markerRef.current.setLatLng(targetLatLng);
      circleRef.current.setLatLng(targetLatLng);
      mapInstanceRef.current.panTo(targetLatLng);
    }
  }, [coords.latitude, coords.longitude]);

  return (
    <div className="glass-panel p-4 rounded-2xl shadow-2xl border border-slate-800">
      {/* Watershed Preset Selector Bar */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Watershed Selection
          </span>
        </div>

        <select
          data-tour="map-preset"
          value={selectedPreset}
          onChange={(e) => onPresetChange(e.target.value)}
          className="map-control-select"
        >
          <option value="custom">Custom sector</option>
          {WATERSHED_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="map-layer-toolbar">
        <label className="map-layer-select">
          <span><IndexIcon size={15} /> Index layer</span>
          <select
            aria-label="Satellite index heatmap"
            value={selectedIndex}
            onChange={(event) => setSelectedIndex(event.target.value)}
          >
            {INDEX_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </label>
        <label className="map-layer-select map-year-select">
          <span>Observation year</span>
          <select
            aria-label="Heatmap observation year"
            value={activeYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
          >
            {[2026, 2025, 2024, 2023, 2022].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <div className="map-layer-summary">
          <span className={`map-observation-status ${isHeatmapLoading ? "is-loading" : observedCellCount ? "is-ready" : "is-unavailable"}`}>
            {isHeatmapLoading ? <LoaderCircle size={13} className="map-spin" /> : <Satellite size={13} />}
            {isHeatmapLoading
              ? "Sampling scene…"
              : heatmapError
                ? "Unavailable"
                : observedCellCount
                ? `${observedCellCount} observed cells`
                : "No observed pixels"}
          </span>
          <button
            className="map-refresh-button"
            type="button"
            aria-label={isHeatmapLoading ? "Heatmap is refreshing" : "Refresh heatmap"}
            title={isHeatmapLoading ? "Heatmap request in progress" : "Retry or refresh satellite heatmap"}
            disabled={isHeatmapLoading}
            onClick={() => setHeatmapRefreshId((requestId) => requestId + 1)}
          >
            {isHeatmapLoading
              ? <LoaderCircle size={14} className="map-spin" />
              : <RotateCw size={14} />}
            <span>{isHeatmapLoading ? "Refreshing" : "Refresh map"}</span>
          </button>
          <small>
            {isIndicesLoading ? "Updating point series · " : ""}
            {heatmapData?.acquired
              ? `Sentinel-2 · ${new Date(heatmapData.acquired).toLocaleDateString()}`
              : "Real Sentinel-2 samples · 3.5 km radius"}
          </small>
        </div>
      </div>

      {/* Map Viewport */}
      <div
        className="map-viewport h-52 w-full rounded-xl overflow-hidden border border-slate-800 relative cursor-crosshair"
        data-tour="watershed-map"
      >
        <div ref={mapContainerRef} className="w-full h-full" />
        {isHeatmapLoading && (
          <div className="map-overlay-message" role="status">
            <LoaderCircle size={15} className="map-spin" /> Loading satellite pixels
          </div>
        )}
        {!isHeatmapLoading && heatmapError && (
          <div className="map-overlay-message map-overlay-warning" role="status">
            <Satellite size={15} />
            <span>{heatmapError}</span>
          </div>
        )}
        {!isHeatmapLoading && !heatmapError && !observedCellCount && (
          <div className="map-overlay-message map-overlay-warning" role="status">
            No valid pixels in this scene
          </div>
        )}
        {!canShowHeatmap && observedCellCount > 0 && (
          <div className="map-zoom-hint">Zoom in to reveal index pixels</div>
        )}
        {observedCellCount > 0 && (
          <div className="map-heat-legend" aria-label={`${activeIndex.name} color legend`}>
            <div className="map-heat-legend-heading">
              <strong>{selectedIndex.toUpperCase()}</strong>
              <span>{heatmapData.year}</span>
            </div>
            <div
              className="map-heat-gradient"
              style={{ background: `linear-gradient(90deg, ${activeIndex.colors.join(", ")})` }}
            />
            <div className="map-heat-legend-labels">
              <span>{activeIndex.low}</span>
              <span>{activeIndex.high}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex justify-between items-center text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
        <span>
          LAT:{" "}
          <strong className="text-slate-800">
            {coords.latitude.toFixed(5)}° N
          </strong>
        </span>
        <span>
          LON:{" "}
          <strong className="text-slate-800">
            {coords.longitude.toFixed(5)}° E
          </strong>
        </span>
        <span className="text-emerald-700">Drag pin · click to inspect</span>
      </div>

      {observedCellCount > 0 && (
        <section className="heat-details" aria-label="Heatmap location details">
          <div className="heat-details-heading">
            <div>
              <span className="heat-details-kicker">LOCATION INSIGHT</span>
              <h3>{activeIndex.name} details</h3>
            </div>
            <span className="heat-details-source">
              {heatmapData.year} · {observedCellCount} valid pixels
            </span>
          </div>

          <div className="heat-stat-grid">
            <article className="heat-stat-card heat-point-card">
              <span>Nearest sampled pixel</span>
              <div className="heat-point-value">
                <strong>{nearestSample?.value.toFixed(3) ?? "—"}</strong>
                {pointClass && (
                  <span
                    className="heat-class-badge"
                    style={{ "--heat-class-color": classColor(pointClass.id, activeIndex) }}
                  >
                    {pointClass.name} signal
                  </span>
                )}
              </div>
              <small>
                {nearestSample
                  ? `${Math.round(nearestSample.distance)} m from selected location`
                  : "No valid pixel at this location"}
              </small>
            </article>
            <article className="heat-stat-card">
              <span>Area average</span>
              <strong>{heatmapMean?.toFixed(3) ?? "—"}</strong>
              <small>{activeIndex.magnitude} · index units</small>
            </article>
            <article className="heat-stat-card">
              <span>Observed range</span>
              <strong>
                {heatmapRange
                  ? `${heatmapRange.min.toFixed(3)} to ${heatmapRange.max.toFixed(3)}`
                  : "—"}
              </strong>
              <small>Lowest to highest valid pixel</small>
            </article>
          </div>

          <div className="heat-distribution">
            <div className="heat-distribution-heading">
              <strong>Signal across the study area</strong>
              <span>Indicative index bands</span>
            </div>
            <div
              className="heat-distribution-bar"
              role="img"
              aria-label={`${heatmapStats.classes.low} low, ${heatmapStats.classes.medium} moderate, ${heatmapStats.classes.high} high signal pixels`}
            >
              {HEAT_CLASSES.map((heatClass) => {
                const count = heatmapStats.classes[heatClass.id];
                return count > 0 ? (
                  <span
                    key={heatClass.id}
                    style={{
                      backgroundColor: classColor(heatClass.id, activeIndex),
                      flexGrow: count,
                    }}
                  />
                ) : null;
              })}
            </div>
            <div className="heat-class-counts">
              {HEAT_CLASSES.map((heatClass) => (
                <span key={heatClass.id}>
                  <i style={{ backgroundColor: classColor(heatClass.id, activeIndex) }} />
                  <strong>{heatClass.name}</strong>
                  <small>{heatmapStats.classes[heatClass.id]}</small>
                </span>
              ))}
            </div>
            <p className="heat-interpretation">{activeIndex.description}</p>
            <p className="heat-threshold-note">
              Bands for {selectedIndex.toUpperCase()}: low &lt; {activeIndex.lowMax.toFixed(2)} ·
              moderate {activeIndex.lowMax.toFixed(2)}–{activeIndex.mediumMax.toFixed(2)} ·
              high ≥ {activeIndex.mediumMax.toFixed(2)}. These are indicative ranges, not field-verified classifications.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
