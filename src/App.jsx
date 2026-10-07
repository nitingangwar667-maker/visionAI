import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/header";
import QuickMetricsBar from "./components/QuickMetricsBar";
import VisionCanvasCard from "./components/VisionCanavasCard";
import BhuvanMapCard, { WATERSHED_PRESETS } from "./components/BhuvanMapCard";
import ExecutiveAnalyticsCard from "./components/ExecutiveAnalyticsCard";
import GettingStarted from "./components/GettingStarted";
import HomeHero from "./components/HomeHero";
import VaultTab from "./components/VaultTab";
import GuidedSiteTour from "./components/GuidedSiteTour";
import GeoDrishtiAssistant from "./components/GeoDrishtiAssistant";
import { GUIDED_SITE_STEPS } from "./constants/guidedSiteSteps";
import StatusAlert from "./components/StatusAlert";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { db } from "./db/dexie";
import { uploadFieldAudit, fetchWatershedIndices } from "./services/api";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  BookOpen,
  Camera,
  ChartNoAxesCombined,
  CircleHelp,
  FileCheck,
  Globe2,
  HardDriveDownload,
  Leaf,
  MapPinned,
  Satellite,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function App() {
  const isOnline = useNetworkStatus();
  const [selectedPreset, setSelectedPreset] = useState("kolar");
  const [coords, setCoords] = useState({
    latitude: WATERSHED_PRESETS[0].lat,
    longitude: WATERSHED_PRESETS[0].lon,
    accuracy: 4.5,
  });
  const [selectedLocationName, setSelectedLocationName] = useState(
    WATERSHED_PRESETS[0].name,
  );

  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoMetadata, setPhotoMetadata] = useState(null);
  const [auditImageResult, setAuditImageResult] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isIndicesLoading, setIsIndicesLoading] = useState(false);
  const [auditSummary, setAuditSummary] = useState(null);
  const [heatmapSummary, setHeatmapSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const debounceTimerRef = useRef(null);
  const syncInProgressRef = useRef(false);

  // Switch watershed preset from dropdown
  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    const target = WATERSHED_PRESETS.find((p) => p.id === presetId);
    setSelectedLocationName(target?.name ?? "");
    if (target) {
      setCoords({ latitude: target.lat, longitude: target.lon, accuracy: 5.0 });
    }
  };

  // Debounce coordinate changes so marker movement does not flood the API.
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    setIsIndicesLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const activePreset = WATERSHED_PRESETS.find((p) => p.id === selectedPreset);
        const activeName = activePreset
          ? activePreset.name
          : selectedLocationName ||
            `Coordinates (${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E)`;
        const data = await fetchWatershedIndices(
          coords.latitude,
          coords.longitude,
          activeName,
          controller.signal,
        );

        if (!isCancelled && data?.indices) {
          const hasEstimatedValues =
            data.source === "coordinate-fallback" ||
            data.indices.some(
              (record) =>
                record.source && record.source !== "sentinel-2",
            );
          setAuditSummary({
            watershed_name: data.watershed_name,
            category: hasEstimatedValues
              ? "Sentinel-2 observations; estimates for missing years"
              : "Sentinel-2 observations",
            indices: data.indices,
          });
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("Satellite band extraction exception:", err);
          setStatus({
            type: "error",
            text: err instanceof Error
              ? err.message
              : "Could not reach the Drishti API. Check the backend deployment.",
          });
        }
      } finally {
        if (!isCancelled) setIsIndicesLoading(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimerRef.current);
      controller.abort();
    };
  }, [coords.latitude, coords.longitude, selectedLocationName, selectedPreset, isOnline]);

  const refreshPendingCount = useCallback(async () => {
    const count = await db.outbox.count();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  const syncOutbox = useCallback(async () => {
    if (!isOnline || syncInProgressRef.current) return;

    syncInProgressRef.current = true;
    setIsSyncing(true);
    try {
      const queue = await db.outbox.toArray();
      let syncedCount = 0;
      let failedCount = 0;
      for (const record of queue) {
        try {
          await uploadFieldAudit(record, { downloadCertificate: false });
          await db.outbox.delete(record.id);
          syncedCount += 1;
        } catch (error) {
          failedCount += 1;
          console.error(`Could not sync offline record ${record.id}:`, error);
        }
      }
      await refreshPendingCount();
      if (queue.length > 0) {
        setStatus(
          failedCount > 0
            ? {
                type: "error",
                text: `${syncedCount} record(s) synced; ${failedCount} remain in the offline vault.`,
              }
            : {
                type: "success",
                text: `${syncedCount} offline record(s) synced successfully.`,
              },
        );
      }
    } catch (error) {
      console.error("Offline vault synchronization failed:", error);
      setStatus({
        type: "error",
        text: "The offline vault could not be synchronized. Your saved records remain on this device.",
      });
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, refreshPendingCount]);

  useEffect(() => {
    if (isOnline) void syncOutbox();
  }, [isOnline, syncOutbox]);

  const handleVaultSync = useCallback(() => {
    return syncOutbox();
  }, [syncOutbox]);

  const startGuidedTour = useCallback(() => {
    setTourStepIndex(0);
    setActiveTab(GUIDED_SITE_STEPS[0].tab);
    setIsTourActive(true);
  }, []);

  const handleNavigation = useCallback(
    (tab) => {
      setIsTourActive(false);
      setActiveTab(tab);
    },
    [],
  );

  const changeTourStep = useCallback((index) => {
    const boundedIndex = Math.max(
      0,
      Math.min(index, GUIDED_SITE_STEPS.length - 1),
    );
    setTourStepIndex(boundedIndex);
    setActiveTab(GUIDED_SITE_STEPS[boundedIndex].tab);
  }, []);

  const closeGuidedTour = useCallback(() => {
    setIsTourActive(false);
  }, []);

  const handlePhotoCaptured = useCallback((blob, metadata) => {
    setPhotoBlob(blob);
    setPhotoMetadata(metadata);
    setAuditImageResult(null);
  }, []);

  const handleAuditSubmission = async () => {
    if (!photoBlob) {
      setStatus({
        type: "error",
        text: "Capture an asset photo to generate the field audit report.",
      });
      return;
    }

    const payload = {
      lat: coords.latitude,
      lon: coords.longitude,
      blob: photoBlob,
      is_mock: false,
      captured_at: photoMetadata?.capturedAt ?? new Date().toISOString(),
      image_quality_variance: photoMetadata?.laplacianVariance ?? null,
    };

    setIsProcessing(true);

    if (isOnline) {
      try {
        setStatus({
          type: "loading",
          text: "Checking the field image and compiling the audit report...",
        });
        const summary = await uploadFieldAudit(payload);
        if (summary) {
          setAuditSummary(summary);
          setAuditImageResult(summary);
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });
        }
        setStatus({
          type: "success",
          text: "Field audit report downloaded. Review its source labels and integrity digest.",
        });
      } catch (error) {
        setStatus({ type: "error", text: error.message });
      } finally {
        setIsProcessing(false);
      }
    } else {
      await db.outbox.add(payload);
      await refreshPendingCount();
      setStatus({
        type: "success",
        text: "Audit saved to this device. It will sync when your connection returns.",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-frame">
      <Header
        isOnline={isOnline}
        activeTab={activeTab}
        setActiveTab={handleNavigation}
        pendingCount={pendingCount}
      />

      {activeTab === "home" && (
        <QuickMetricsBar />
      )}

      <main className={`page-shell page-${activeTab}`}>
        <StatusAlert status={status} />

        {activeTab === "home" && (
          <>
            <HomeHero
              coords={coords}
              isOnline={isOnline}
              onOpenMap={() => handleNavigation("map")}
              onOpenUpload={() => handleNavigation("upload")}
              onOpenMonitoring={() => handleNavigation("monitoring")}
            />

            <section className="home-section" aria-label="Explore Drishti">
              <div className="home-section-heading">
                <div>
                  <span className="eyebrow">EXPLORE DRISHTI</span>
                  <h2>Maps, indicators, and field records.</h2>
                </div>
                <span className="home-section-note">Choose a section to get started</span>
              </div>
              <div className="feature-grid">
                <button className="feature-card feature-map" onClick={() => handleNavigation("map")}>
                  <span className="feature-icon"><MapPinned size={19} /></span>
                  <span className="feature-index">01 / EXPLORE</span>
                  <strong>Watershed map</strong>
                  <span className="feature-description">Choose a watershed or set a point on the map.</span>
                  <span className="feature-link">Open map <ArrowRight size={14} /></span>
                </button>
                <button className="feature-card feature-monitoring" onClick={() => handleNavigation("monitoring")}>
                  <span className="feature-icon"><ChartNoAxesCombined size={19} /></span>
                  <span className="feature-index">02 / MONITOR</span>
                  <strong>Satellite indicators</strong>
                  <span className="feature-description">Compare six indices and their yearly readings.</span>
                  <span className="feature-link">View monitoring <ArrowRight size={14} /></span>
                </button>
                <button className="feature-card feature-upload" onClick={() => handleNavigation("upload")}>
                  <span className="feature-icon"><Camera size={19} /></span>
                  <span className="feature-index">03 / DOCUMENT</span>
                  <strong>Field asset audit</strong>
                  <span className="feature-description">Add a location to a photo and create an audit report.</span>
                  <span className="feature-link">Start an audit <ArrowRight size={14} /></span>
                </button>
              </div>
            </section>

            <section className="home-bottom-grid">
              <article className="home-data-card">
                <div className="home-data-icon"><Leaf size={18} /></div>
                <div>
                  <span className="eyebrow">LATEST NDVI</span>
                  <strong>{auditSummary?.indices?.at(-1)?.ndvi?.toFixed(3) ?? "—"}</strong>
                  <p>{auditSummary?.watershed_name ?? "Choose a study area to load readings."}</p>
                </div>
                <button className="text-action" onClick={() => handleNavigation("monitoring")}>
                  Explore data <ArrowRight size={14} />
                </button>
              </article>
              <article className="home-guide-card">
                <div className="home-guide-copy">
                  <span className="eyebrow"><CircleHelp size={13} /> FIRST VISIT?</span>
                  <strong>Take a quick tour</strong>
                  <p>Learn how to use the map, compare readings, and save field records.</p>
                </div>
                <button className="button-secondary" onClick={startGuidedTour}>
                  Start tour <ArrowRight size={15} />
                </button>
              </article>
            </section>
          </>
        )}

        {activeTab === "map" && (
          <section className="section-page map-page">
            <div className="section-page-heading">
              <div>
                <span className="eyebrow"><MapPinned size={14} /> LOCATION EXPLORER</span>
                <h1>Watershed map</h1>
                <p>Choose a study area or explore a custom location on the map.</p>
              </div>
              <div className={`page-status-pill ${isOnline ? "online" : "offline"}`}>
                <span className="status-pulse" /> {isOnline ? "Internet connection available" : "Map tiles may require internet"}
              </div>
            </div>
            <div className="map-layout">
              <div className="map-main-panel">
                <BhuvanMapCard
                  coords={coords}
                  onCoordsChange={setCoords}
                  selectedPreset={selectedPreset}
                  onPresetChange={handlePresetChange}
                  selectedLocationName={selectedLocationName}
                  onLocationNameChange={setSelectedLocationName}
                  auditSummary={auditSummary}
                  isIndicesLoading={isIndicesLoading}
                  onHeatmapSummaryChange={setHeatmapSummary}
                />
              </div>
              <aside className="map-side-column">
                <article className="map-info-card">
                  <span className="eyebrow">ACTIVE STUDY POINT</span>
                  <h2>
                    {WATERSHED_PRESETS.find((item) => item.id === selectedPreset)?.name ??
                      (selectedLocationName || "Custom sector")}
                  </h2>
                  <div className="coordinate-list">
                    <div><span>Latitude</span><strong>{coords.latitude.toFixed(5)}° N</strong></div>
                    <div><span>Longitude</span><strong>{coords.longitude.toFixed(5)}° E</strong></div>
                  </div>
                  <p>Move the map marker to refresh satellite monitoring for a custom location.</p>
                </article>
                <article className="map-info-card map-source-card">
                  <div className="map-source-icon"><Satellite size={17} /></div>
                  <div>
                    <strong>Satellite monitoring</strong>
                    <p>{isIndicesLoading ? "Retrieving observations…" : auditSummary?.category ?? "Select a watershed to load the available record."}</p>
                  </div>
                  <button className="text-action" onClick={() => handleNavigation("monitoring")}>
                    View data <ArrowRight size={13} />
                  </button>
                </article>
                <button className="map-next-action" onClick={() => handleNavigation("upload")}>
                  <span className="feature-icon"><Camera size={17} /></span>
                  <span><strong>Document a field asset</strong><small>Continue to photo capture</small></span>
                  <ArrowRight size={16} />
                </button>
              </aside>
            </div>
          </section>
        )}

        {activeTab === "upload" && (
          <section className="section-page upload-page">
            <div className="section-page-heading">
              <div>
                <span className="eyebrow"><Camera size={14} /> FIELD DOCUMENTATION</span>
                <h1>Upload an asset</h1>
                <p>Capture a clear image to prepare an audit for the selected study point.</p>
              </div>
              <div className="page-status-pill"><MapPinned size={14} /> {coords.latitude.toFixed(3)}° N, {coords.longitude.toFixed(3)}° E</div>
            </div>
            <div className="upload-layout">
              <div className="upload-camera-panel">
                <VisionCanvasCard
                  onPhotoCaptured={handlePhotoCaptured}
                  detections={auditSummary?.detections}
                  analysisResult={auditImageResult}
                  isProcessing={isProcessing}
                />
              </div>
              <aside className="upload-guidance">
                <span className="eyebrow">FIELD AUDIT WORKFLOW</span>
                <h2>From observation to record.</h2>
                <p>Use a clear, well-lit frame of the water or land asset you want to document.</p>
                <ol className="upload-steps">
                  <li><span>01</span><div><strong>Allow camera access</strong><small>Your browser asks before using the camera.</small></div></li>
                  <li><span>02</span><div><strong>Capture or retake</strong><small>Review the image before creating a record.</small></div></li>
                  <li><span>03</span><div><strong>Generate or save</strong><small>Online audits are submitted; offline audits stay on this device.</small></div></li>
                </ol>
                <div className="upload-location-note">
                  <MapPinned size={16} />
                  <span><strong>Attached study point</strong><small>{coords.latitude.toFixed(5)}° N · {coords.longitude.toFixed(5)}° E</small></span>
                </div>
              </aside>
            </div>
          </section>
        )}

        {activeTab === "monitoring" && (
          <section className="section-page monitoring-page">
            <div className="section-page-heading monitoring-page-heading">
              <div>
                <span className="eyebrow"><ChartNoAxesCombined size={14} /> MONITORING</span>
                <h1>Satellite indicators</h1>
                <p>Compare yearly index readings for the selected location.</p>
              </div>
              <div className="monitoring-heading-actions">
                <span className="monitoring-live-label"><span /> YEARLY READINGS</span>
                <button className="button-secondary" onClick={() => handleNavigation("map")}>
                  <MapPinned size={15} /> Change location
                </button>
              </div>
            </div>
            <div className="monitoring-summary">
              <div>
                <span className="monitoring-summary-index">01</span>
                <span className="eyebrow">STUDY AREA</span>
                <strong>{auditSummary?.watershed_name ?? "Loading study area…"}</strong>
              </div>
              <div>
                <span className="monitoring-summary-index">02</span>
                <span className="eyebrow">DATA WINDOW</span>
                <strong>
                  {auditSummary?.indices?.length
                    ? `${auditSummary.indices[0].year} — ${auditSummary.indices[auditSummary.indices.length - 1].year}`
                    : "Preparing annual series"}
                </strong>
              </div>
              <div>
                <span className="monitoring-summary-index">03</span>
                <span className="eyebrow">DATA SOURCE</span>
                <strong>{auditSummary?.category ?? "Loading source details…"}</strong>
              </div>
              <div>
                <span className="monitoring-summary-index">04</span>
                <span className="eyebrow">ANNUAL OBSERVATIONS</span>
                <strong>{auditSummary?.indices?.length ?? "—"} <small>years loaded</small></strong>
              </div>
            </div>
            <ExecutiveAnalyticsCard summary={auditSummary} isLoading={isIndicesLoading} />
            <p className="monitoring-disclaimer">
              These indices are screening indicators, not field measurements. Check their source, season, and local conditions before drawing conclusions.
            </p>
          </section>
        )}

        {activeTab === "vault" && (
          <section className="section-page vault-page">
            <div className="section-page-heading">
              <div>
                <span className="eyebrow"><ShieldCheck size={14} /> SAVED ON THIS DEVICE</span>
                <h1>Offline audit vault</h1>
                <p>Unsynced field records stay in this browser until you choose to sync them.</p>
              </div>
              <div className={`page-status-pill ${isOnline ? "online" : "offline"}`}>
                {isOnline ? "Connected" : "Offline mode"}
              </div>
            </div>
            <VaultTab
              isOnline={isOnline}
              onManualSync={handleVaultSync}
              isSyncing={isSyncing}
            />
          </section>
        )}

        {activeTab === "about" && (
          <section className="section-page about-page" data-tour="about-overview">
            <div className="section-page-heading">
              <div>
                <span className="eyebrow"><Globe2 size={14} /> ABOUT DRISHTI</span>
                <h1>Watershed maps and field records.</h1>
                <p>Use satellite indices to explore a location, then add field observations to help document what is there.</p>
              </div>
              <button className="button-primary" onClick={startGuidedTour}>
                <BookOpen size={16} /> Take the site tour
              </button>
            </div>
            <div className="about-feature-grid">
              <article><span className="about-feature-icon"><MapPinned size={18} /></span><span className="eyebrow">01 · MAP</span><h2>Choose a study area</h2><p>Select a watershed or set a point on the map.</p></article>
              <article><span className="about-feature-icon"><Satellite size={18} /></span><span className="eyebrow">02 · INDICATORS</span><h2>Compare satellite readings</h2><p>Review six indices by year and check whether values come from satellite data or estimates.</p></article>
              <article><span className="about-feature-icon"><FileCheck size={18} /></span><span className="eyebrow">03 · FIELD RECORDS</span><h2>Document an asset</h2><p>Capture a photo, review its location, and submit or save the audit for later.</p></article>
            </div>
            <GettingStarted
              onOpenWorkspace={() => handleNavigation("map")}
              isOnline={isOnline}
            />
            <div className="creator-credit">
              <span className="creator-credit-sparkle" aria-hidden="true">
                <Sparkles size={15} />
              </span>
              <span className="creator-credit-copy">
                <small>PROJECT BY</small>
                <span>Created by</span>
                <strong>saviour_tech</strong>
              </span>
              <span className="creator-credit-orbit" aria-hidden="true" />
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span className="site-footer-brand">
          <Satellite size={15} /> Drishti
        </span>
        <span>Satellite readings · Field records · Offline access</span>
        <button type="button" onClick={() => handleNavigation("about")}>
          About Drishti <ArrowRight size={13} />
        </button>
      </footer>

      {activeTab === "upload" && (
        <div className="action-dock">
          <div className="action-dock-inner">
            <div className="action-dock-copy">
              <span className={`dock-dot ${photoBlob ? "ready" : ""}`} />
              <span>{photoBlob ? "Photo ready for review" : "Capture a field asset to begin"}</span>
            </div>
            <button
              onClick={handleAuditSubmission}
              disabled={isProcessing || !photoBlob}
              className={`button-primary audit-button ${isProcessing ? "processing" : ""}`}
              data-tour="audit-action"
            >
              {isProcessing ? (
                <><Sparkles className="animate-spin" size={17} /> Preparing audit…</>
              ) : isOnline ? (
                photoBlob ? (
                  <><FileCheck size={17} /> Generate field audit</>
                ) : (
                  <><Camera size={17} /> Capture a photo to continue</>
                )
              ) : (
                <><HardDriveDownload size={17} /> Save to offline vault</>
              )}
            </button>
          </div>
        </div>
      )}
      <GuidedSiteTour
        active={isTourActive}
        stepIndex={tourStepIndex}
        onStepChange={changeTourStep}
        onClose={closeGuidedTour}
      />
      <GeoDrishtiAssistant
        activeTab={activeTab}
        auditSummary={auditSummary}
        heatmapSummary={heatmapSummary}
        coords={coords}
        isOnline={isOnline}
        pendingCount={pendingCount}
        onNavigate={handleNavigation}
        onStartTour={startGuidedTour}
      />
    </div>
  );
}
