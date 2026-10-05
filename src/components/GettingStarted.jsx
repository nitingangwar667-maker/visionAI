import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Droplets,
  Layers3,
  Map,
  MapPin,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Satellite,
  ShieldCheck,
  WifiOff,
} from "lucide-react";

const STEP_DURATION = 6500;

const steps = [
  {
    number: "01",
    icon: Map,
    title: "Choose a study area",
    description:
      "Choose a watershed or click the map to set a point. The marker shows the location used for the readings.",
    hint: "Select a watershed or move the marker.",
  },
  {
    number: "02",
    icon: Satellite,
    title: "Review satellite readings",
    description:
      "Compare six indices and their yearly values. Each index describes a different vegetation, water, or land condition.",
    hint: "Use source labels to distinguish observations from estimates.",
  },
  {
    number: "03",
    icon: Camera,
    title: "Take a field photo",
    description:
      "Allow camera access, frame the asset, and take a photo. Review it and retake it if needed.",
    hint: "A steady, well-lit photo is easier to review.",
  },
  {
    number: "04",
    icon: ShieldCheck,
    title: "Submit or save the record",
    description:
      "The photo is paired with the selected coordinates. Submit it online for analysis and an audit PDF, or save it on this device while offline.",
    hint: "Review the photo and location before submitting.",
  },
];

const indices = [
  ["NDVI", "Vegetation greenness."],
  ["NDWI", "Surface-water signal."],
  ["SMI", "Surface-moisture estimate from near-infrared and SWIR."],
  ["NDTI", "Turbidity or suspended-sediment signal."],
  ["EVI", "Vegetation greenness, adjusted for some background effects."],
  ["BSI", "Exposed or bare soil."],
];

export default function GettingStarted({ onOpenWorkspace, isOnline }) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (!isPlaying) return undefined;

    const timer = window.setTimeout(() => {
      if (activeStep >= steps.length - 1) {
        setIsPlaying(false);
      } else {
        setActiveStep((current) => current + 1);
      }
    }, STEP_DURATION);

    return () => window.clearTimeout(timer);
  }, [activeStep, isPlaying]);

  const selectStep = (index) => {
    setActiveStep(index);
    setIsPlaying(index < steps.length - 1);
  };

  const replay = () => {
    setActiveStep(0);
    setIsPlaying(true);
  };

  return (
    <div className="guide-page">
      <section className="guide-intro">
        <div className="guide-intro-copy">
          <span className="eyebrow">
            <CircleHelp size={14} /> GETTING STARTED
          </span>
          <h2>Choose a place. Read the indicators. Record what you see.</h2>
          <p>
            A short guide to the map, satellite readings, and field records.
          </p>
          <button className="button-primary" onClick={onOpenWorkspace}>
            Open the map <ArrowRight size={16} />
          </button>
        </div>
        <div className="guide-intro-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="orbit-center">
            <Satellite size={34} />
          </span>
          <span className="orbit-dot dot-one" />
          <span className="orbit-dot dot-two" />
          <span className="orbit-dot dot-three" />
        </div>
      </section>

      {!isOnline && (
        <div className="guide-notice">
          <WifiOff size={17} />
          <span>
            You are offline. Previously saved field audits stay in this
            browser’s local vault until you sync them.
          </span>
        </div>
      )}

      <section className="guide-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">STEP-BY-STEP GUIDE</span>
            <h3>How it works</h3>
          </div>
          <span className="section-caption">
            {isPlaying ? "Playing" : "Paused"}
          </span>
        </div>
        <div className="tour-player">
          <aside className="tour-steps" aria-label="Walkthrough steps">
            {steps.map(({ number, icon: Icon, title }, index) => (
              <button
                className={`tour-step ${index === activeStep ? "current" : ""} ${index < activeStep ? "completed" : ""}`}
                key={number}
                onClick={() => selectStep(index)}
                aria-current={index === activeStep ? "step" : undefined}
              >
                <span className="tour-step-marker">
                  {index < activeStep ? <Check size={14} /> : <Icon size={15} />}
                </span>
                <span className="tour-step-copy">
                  <small>STEP {number}</small>
                  <strong>{title}</strong>
                </span>
                {index === activeStep && isPlaying && (
                  <span
                    className="tour-step-progress"
                    key={activeStep}
                    style={{ animationDuration: `${STEP_DURATION}ms` }}
                  />
                )}
              </button>
            ))}
          </aside>

          <div className="tour-main">
            <div className="tour-stage" key={activeStep}>
              <div
                className={`tour-illustration tour-illustration-${activeStep + 1}`}
                aria-hidden="true"
              >
                {activeStep === 0 && (
                  <div className="tour-map-scene">
                    <div className="tour-map-river" />
                    <div className="tour-map-field field-a" />
                    <div className="tour-map-field field-b" />
                    <div className="tour-map-field field-c" />
                    <div className="tour-map-grid" />
                    <span className="tour-map-marker">
                      <MapPin size={20} />
                    </span>
                    <span className="tour-map-label">SELECTED SECTOR</span>
                    <span className="tour-map-coordinate">
                      13.1338° N · 78.1332° E
                    </span>
                  </div>
                )}
                {activeStep === 1 && (
                  <div className="tour-satellite-scene">
                    <span className="tour-satellite-orbit orbit-a" />
                    <span className="tour-satellite-orbit orbit-b" />
                    <span className="tour-satellite-core">
                      <Satellite size={32} />
                    </span>
                    <div className="tour-spectral-pills">
                      <span>NDVI <b>0.62</b></span>
                      <span>NDWI <b>0.18</b></span>
                      <span>SMI <b>0.41</b></span>
                    </div>
                    <span className="tour-satellite-caption">
                      MULTISPECTRAL SIGNALS
                    </span>
                  </div>
                )}
                {activeStep === 2 && (
                  <div className="tour-camera-scene">
                    <span className="camera-frame frame-one" />
                    <span className="camera-frame frame-two" />
                    <span className="camera-target">
                      <Camera size={36} />
                    </span>
                    <span className="camera-scanline" />
                    <span className="camera-scene-caption">
                      FIELD ASSET · IN FRAME
                    </span>
                  </div>
                )}
                {activeStep === 3 && (
                  <div className="tour-audit-scene">
                    <div className="audit-document">
                      <span className="audit-document-icon">
                        <Layers3 size={21} />
                      </span>
                      <span className="audit-document-line line-long" />
                      <span className="audit-document-line line-short" />
                      <span className="audit-document-chart">
                        <i /><i /><i /><i /><i />
                      </span>
                      <span className="audit-document-stamp">
                        <Check size={14} /> READY
                      </span>
                    </div>
                    <span className="audit-glow" />
                  </div>
                )}
              </div>

              <div className="tour-copy" aria-live="polite">
                <span className="tour-current-label">
                  STEP {steps[activeStep].number} OF 04
                </span>
                <h4>{steps[activeStep].title}</h4>
                <p>{steps[activeStep].description}</p>
                <div className="tour-hint">
                  <span className="tour-hint-dot" />
                  {steps[activeStep].hint}
                </div>
              </div>
            </div>

            <div className="tour-controls">
              <span className="tour-progress-label">
                {String(activeStep + 1).padStart(2, "0")}
                <span> / 04</span>
              </span>
              <div className="tour-progress-track" aria-hidden="true">
                <span
                  style={{
                    width: `${((activeStep + 1) / steps.length) * 100}%`,
                  }}
                />
              </div>
              <div className="tour-control-buttons">
                <button
                  type="button"
                  className="tour-control-button"
                  onClick={() =>
                    activeStep === steps.length - 1
                      ? replay()
                      : setIsPlaying((playing) => !playing)
                  }
                  aria-label={
                    activeStep === steps.length - 1
                      ? "Replay walkthrough"
                      : isPlaying
                        ? "Pause walkthrough"
                        : "Play walkthrough"
                  }
                  title={
                    activeStep === steps.length - 1
                      ? "Replay"
                      : isPlaying
                        ? "Pause"
                        : "Play"
                  }
                >
                  {activeStep === steps.length - 1 ? (
                    <RotateCcw size={16} />
                  ) : isPlaying ? (
                    <Pause size={16} />
                  ) : (
                    <Play size={16} />
                  )}
                </button>
                <button
                  type="button"
                  className="tour-control-button"
                  onClick={() => selectStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  aria-label="Previous step"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="tour-control-button tour-next-button"
                  onClick={() =>
                    activeStep === steps.length - 1
                      ? replay()
                      : selectStep(activeStep + 1)
                  }
                  aria-label={
                    activeStep === steps.length - 1
                      ? "Replay walkthrough"
                      : "Next step"
                  }
                >
                  {activeStep === steps.length - 1 ? (
                    <RotateCcw size={16} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="guide-lower-grid">
        <article className="guide-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">THE MAP</span>
              <h3>Move the study point</h3>
            </div>
            <MousePointer2 className="heading-icon" size={19} />
          </div>
          <p>
            Choose a named watershed from the selector, or click the map or
            drag the marker to explore a custom location. The analysis refreshes
            after movement settles.
          </p>
          <p className="guide-footnote">
            Map layers require an internet connection and may load at different
            speeds.
          </p>
        </article>

        <article className="guide-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">THE INDICES</span>
              <h3>Read the indicators</h3>
            </div>
            <Droplets className="heading-icon" size={19} />
          </div>
          <dl className="index-glossary">
            {indices.map(([name, description]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
          <p className="guide-footnote">
              These are satellite indicators, not field measurements. Check the
              source and local conditions before drawing conclusions.
          </p>
        </article>
      </section>

      <section className="guide-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BEFORE YOU START</span>
            <h3>A few things to remember</h3>
          </div>
        </div>
        <div className="guide-tips">
          <div>
            <span className="tip-check">01</span>
            <p>
              <strong>Check the data source.</strong> Satellite observations
              and estimated fallback values are labeled separately.
            </p>
          </div>
          <div>
            <span className="tip-check">02</span>
            <p>
              <strong>Use a clear image.</strong> Good lighting and a steady
              frame help the asset analysis.
            </p>
          </div>
          <div>
            <span className="tip-check">03</span>
            <p>
              <strong>Offline is supported.</strong> Queue an audit without
              connectivity and sync it later from the offline vault.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
