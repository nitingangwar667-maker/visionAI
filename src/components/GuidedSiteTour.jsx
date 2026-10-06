import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Satellite,
  X,
} from "lucide-react";
import { GUIDED_SITE_STEPS } from "../constants/guidedSiteSteps";

const demoSamples = {
  NDVI: { value: "0.68", range: "0.35 to 0.82", tone: "green" },
  NDWI: { value: "0.24", range: "-0.12 to 0.51", tone: "blue" },
  SMI: { value: "0.53", range: "0.21 to 0.76", tone: "teal" },
  NDTI: { value: "0.31", range: "0.08 to 0.49", tone: "orange" },
  BSI: { value: "0.17", range: "-0.04 to 0.38", tone: "sand" },
  EVI: { value: "0.59", range: "0.28 to 0.77", tone: "green" },
};

const heatCells = [
  "low", "medium", "high", "medium", "low",
  "medium", "high", "high", "medium", "low",
  "low", "medium", "high", "high", "medium",
];

function DemoButton({ children, selected, onClick }) {
  return (
    <button
      type="button"
      className={`tour-demo-choice${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TourDemo({ type, onEngagementChange }) {
  const [selection, setSelection] = useState(
    type === "data-source"
      ? "Satellite observation"
      : "NDVI",
  );
  const [year, setYear] = useState("2025");
  const [baseLayer, setBaseLayer] = useState("Satellite");
  const [cell, setCell] = useState(7);
  const [quality, setQuality] = useState("Clear");
  const [auditStage, setAuditStage] = useState(0);
  const [saved, setSaved] = useState(false);
  const sample = demoSamples[selection] ?? demoSamples.NDVI;

  let content;
  switch (type) {
    case "navigation":
      content = (
        <>
          <div className="tour-demo-choices">
            {["Home", "Map", "Upload", "Monitoring", "Offline", "About"].map(
              (item) => (
                <DemoButton
                  key={item}
                  selected={selection === item}
                  onClick={() => setSelection(item)}
                >
                  {item}
                </DemoButton>
              ),
            )}
          </div>
          <p className="tour-demo-result">
            {selection} selected in this walkthrough preview.
          </p>
        </>
      );
      break;
    case "preset":
      content = (
        <>
          <div className="tour-demo-choices">
            {["Kolar", "Doddaballapur", "Ramanagara"].map((place) => (
              <DemoButton
                key={place}
                selected={selection === place}
                onClick={() => setSelection(place)}
              >
                {place}
              </DemoButton>
            ))}
          </div>
          <p className="tour-demo-result">Sample area: {selection}</p>
        </>
      );
      break;
    case "map-point":
    case "map-index":
    case "heatmap-reading":
      content = (
        <>
          {type !== "map-point" && (
            <div className="tour-demo-choices">
              {Object.keys(demoSamples).map((index) => (
                <DemoButton
                  key={index}
                  selected={selection === index}
                  onClick={() => setSelection(index)}
                >
                  {index}
                </DemoButton>
              ))}
            </div>
          )}
          <div className={`tour-demo-map ${sample.tone}`}>
            <div className="tour-demo-heat-cells" aria-label="Sample heatmap">
              {heatCells.map((level, index) => (
                <button
                  type="button"
                  key={index}
                  className={`heat-${level}${cell === index ? " is-picked" : ""}`}
                  aria-label={`Sample ${level} index cell ${index + 1}`}
                  aria-pressed={cell === index}
                  onClick={() => setCell(index)}
                />
              ))}
            </div>
            <span className="tour-demo-map-label">Illustrative sample only</span>
          </div>
          <p className="tour-demo-result">
            {selection} · {heatCells[cell]} sample cell · value {sample.value} ·
            {" "}range {sample.range}
          </p>
        </>
      );
      break;
    case "map-year":
      content = (
        <>
          <div className="tour-demo-choices">
            {["2022", "2023", "2024", "2025", "2026"].map((value) => (
              <DemoButton
                key={value}
                selected={year === value}
                onClick={() => setYear(value)}
              >
                {value}
              </DemoButton>
            ))}
          </div>
          <p className="tour-demo-result">
            Previewing the illustrative {year} sample. This is not live imagery.
          </p>
        </>
      );
      break;
    case "base-layer":
      content = (
        <>
          <div className="tour-demo-choices">
            {["Satellite", "Outdoors", "OpenStreetMap", "Bhuvan"].map(
              (layer) => (
                <DemoButton
                  key={layer}
                  selected={baseLayer === layer}
                  onClick={() => setBaseLayer(layer)}
                >
                  {layer}
                </DemoButton>
              ),
            )}
          </div>
          <div className={`tour-demo-layer-preview layer-${baseLayer.toLowerCase()}`}>
            <span>{baseLayer} style preview</span>
          </div>
          <p className="tour-demo-result">
            Style choice is local to this demo; no map tiles are requested.
          </p>
        </>
      );
      break;
    case "overview":
      content = (
        <>
          <div className="tour-demo-home-banner">
            <span className="tour-demo-home-label">WATERSHED MONITORING</span>
            <strong>
              <span>SEE THE CHANGE.</span>
              <span>SHAPE A BETTER WATERSHED.</span>
            </strong>
            <Satellite size={19} aria-hidden="true" />
          </div>
          <p className="tour-demo-result">
            A short introduction to Drishti. Open Map or Monitoring to explore
            the current location and satellite indicators.
          </p>
        </>
      );
      break;
    case "monitoring-index":
      content = (
        <>
          <div className="tour-demo-choices">
            {Object.keys(demoSamples).map((index) => (
              <DemoButton
                key={index}
                selected={selection === index}
                onClick={() => setSelection(index)}
              >
                {index}
              </DemoButton>
            ))}
          </div>
          <div className="tour-demo-metrics">
            <div><strong>{sample.value}</strong><span>{selection} sample</span></div>
            <div><strong>12</strong><span>illustrative sites</span></div>
            <div>
              <strong>2</strong>
              <span>sample alerts</span>
            </div>
          </div>
          <p className="tour-demo-result">
            {selection} is a {selection === "NDWI" ? "water" : "surface"}{" "}
            indicator; example only.
          </p>
        </>
      );
      break;
    case "trend":
      content = (
        <>
          <div className="tour-demo-choices">
            {Object.keys(demoSamples).map((index) => (
              <DemoButton
                key={index}
                selected={selection === index}
                onClick={() => setSelection(index)}
              >
                {index}
              </DemoButton>
            ))}
          </div>
          <div className="tour-demo-chart" aria-label={`${selection} illustrative annual trend`}>
            {[36, 52, 44, 73, 62].map((height, index) => (
              <div className="tour-demo-bar-wrap" key={index}>
                <span style={{ height: `${height}%` }} />
                <small>{2022 + index}</small>
              </div>
            ))}
          </div>
          <p className="tour-demo-result">
            Illustrative {selection} trend · sample values, not observations.
          </p>
        </>
      );
      break;
    case "camera":
    case "quality":
      content = (
        <>
          <div className="tour-demo-choices">
            {["Clear", "Blurry", "Too dark", "Glare"].map((value) => (
              <DemoButton
                key={value}
                selected={quality === value}
                onClick={() => setQuality(value)}
              >
                {value}
              </DemoButton>
            ))}
          </div>
          <div className={`tour-demo-photo quality-${quality.toLowerCase().replace(" ", "-")}`}>
            <span aria-hidden="true" className="tour-demo-photo-mark" />
            <strong>{quality === "Clear" ? "Sample photo preview" : `${quality} example`}</strong>
          </div>
          <p className="tour-demo-result">
            {quality === "Clear"
              ? "Looks usable in this example. No camera is opened."
              : `${quality} example: the real app suggests a retake but does not block capture.`}
          </p>
        </>
      );
      break;
    case "audit":
      content = (
        <>
          <div className="tour-demo-choices">
            <DemoButton selected={auditStage === 1} onClick={() => setAuditStage(1)}>
              Simulate detected object
            </DemoButton>
            <DemoButton selected={auditStage === 2} onClick={() => setAuditStage(2)}>
              Simulate no detection
            </DemoButton>
            <DemoButton selected={auditStage === 3} onClick={() => setAuditStage(3)}>
              Simulate offline save
            </DemoButton>
          </div>
          <p className="tour-demo-result">
            {auditStage === 1
              ? "Demo result: sample structure recognized · review details · PDF preview ready."
              : auditStage === 2
                ? "Demo result: no object recognized · image remains available to review."
                : auditStage === 3
                  ? "Demo result: saved to a temporary walkthrough queue."
                  : "Choose a sample outcome to see what happens next."}
          </p>
        </>
      );
      break;
    case "vault":
    case "sync":
      content = (
        <>
          <div className="tour-demo-metrics">
            <div><strong>{saved ? "4" : "3"}</strong><span>demo items queued</span></div>
            <div><strong>{saved ? "Saved" : "Ready"}</strong><span>local preview</span></div>
          </div>
          <div className="tour-demo-choices">
            <DemoButton selected={saved} onClick={() => setSaved(!saved)}>
              {saved ? "Remove demo item" : "Add demo item"}
            </DemoButton>
            <span className="tour-demo-result">
              {type === "sync"
                ? "This control only changes the preview count; it never syncs."
                : "Sample queue only; your real offline records are untouched."}
            </span>
          </div>
        </>
      );
      break;
    case "data-source":
      content = (
        <>
          <div className="tour-demo-choices">
            {["Satellite observation", "Coordinate estimate"].map((source) => (
              <DemoButton
                key={source}
                selected={selection === source}
                onClick={() => setSelection(source)}
              >
                {source}
              </DemoButton>
            ))}
          </div>
          <p className="tour-demo-result">
            {selection === "Satellite observation"
              ? "Satellite observation includes a scene/year source label."
              : `${selection}: screening estimate only, not a measured pixel.`}
          </p>
        </>
      );
      break;
    case "about":
      content = (
        <>
          <div className="tour-demo-choices">
            {["What is Drishti?", "What does NDVI mean?", "Where are photos saved?"].map(
              (question) => (
                <DemoButton
                  key={question}
                  selected={selection === question}
                  onClick={() => setSelection(question)}
                >
                  {question}
                </DemoButton>
              ),
            )}
          </div>
          <p className="tour-demo-result">
            {selection === "What does NDVI mean?"
              ? "NDVI is an indicator of vegetation greenness derived from red and near-infrared reflectance."
              : selection === "Where are photos saved?"
                ? "Online audits are sent for processing; offline entries remain in this browser until you choose to sync."
                : "Drishti helps explore watershed indicators and field audit workflows."}
          </p>
        </>
      );
      break;
    default:
      content = (
        <p className="tour-demo-result">
          Use the walkthrough controls to explore this sample feature.
        </p>
      );
  }

  return (
    <div
      className="tour-demo"
      aria-label="Interactive walkthrough demo"
      onPointerEnter={() => onEngagementChange(true)}
      onPointerLeave={() => onEngagementChange(false)}
      onFocusCapture={() => onEngagementChange(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onEngagementChange(false);
        }
      }}
    >
      <div className="tour-demo-heading">
        <span>TRY A DEMO</span>
        <span>Illustrative · local only</span>
      </div>
      {content}
    </div>
  );
}

export default function GuidedSiteTour({
  active,
  stepIndex,
  onStepChange,
  onClose,
}) {
  const [demoPaused, setDemoPaused] = useState(false);
  const step = GUIDED_SITE_STEPS[stepIndex];
  const Icon = step?.icon;

  useEffect(() => {
    if (!active || !step) return undefined;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let target = null;
    let attempts = 0;
    let retryTimer;
    let scrollTimer;

    const findTarget = () => {
      target = document.querySelector(`[data-tour~="${step.target}"]`);
      if (target) {
        target.classList.add("tour-highlight");
        scrollTimer = window.setTimeout(() => {
          target?.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "center",
          });
        }, 80);
      } else if (attempts < 15) {
        attempts += 1;
        retryTimer = window.setTimeout(findTarget, 100);
      }
    };

    findTarget();
    return () => {
      window.clearTimeout(retryTimer);
      window.clearTimeout(scrollTimer);
      target?.classList.remove("tour-highlight");
    };
  }, [active, step]);

  useEffect(() => {
    if (
      !active ||
      demoPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      if (stepIndex < GUIDED_SITE_STEPS.length - 1) {
        onStepChange(stepIndex + 1);
      } else {
        onClose();
      }
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [active, demoPaused, onClose, onStepChange, stepIndex]);

  if (!active || !step) return null;

  return (
    <div className="site-tour-overlay" role="presentation">
      <section
        className={`site-tour-card${demoPaused ? " demo-paused" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby="site-tour-title"
        aria-describedby="site-tour-description"
      >
        <div className="site-tour-topline">
          <span className="site-tour-step-count">
            WALKTHROUGH · {String(stepIndex + 1).padStart(2, "0")} /{" "}
            {String(GUIDED_SITE_STEPS.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            className="site-tour-close"
            onClick={onClose}
            aria-label="Close guided walkthrough"
          >
            <X size={17} />
          </button>
        </div>
        <div className="site-tour-content" aria-live="polite">
          <span className="site-tour-icon">
            <Icon size={19} />
          </span>
          <div>
            <h2 id="site-tour-title">{step.title}</h2>
            <p id="site-tour-description">{step.description}</p>
          </div>
        </div>
        {step.demo && (
          <TourDemo
            key={`${stepIndex}-${step.demo}`}
            type={step.demo}
            onEngagementChange={setDemoPaused}
          />
        )}
        <p className="site-tour-safety">
          Demo actions affect only this preview. They will not change the live
          map, open the camera, submit audits, sync records, or delete data.
        </p>
        <div className="site-tour-footer">
          <div className="site-tour-progress" aria-hidden="true">
            <span key={stepIndex} />
          </div>
          <div className="site-tour-actions">
            <button
              type="button"
              className="site-tour-button secondary"
              onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
            >
              <ArrowLeft size={15} /> Back
            </button>
            <button
              type="button"
              className="site-tour-button primary"
              onClick={() =>
                stepIndex === GUIDED_SITE_STEPS.length - 1
                  ? onClose()
                  : onStepChange(stepIndex + 1)
              }
            >
              {stepIndex === GUIDED_SITE_STEPS.length - 1 ? (
                <>
                  Finish <Check size={15} />
                </>
              ) : (
                <>
                  Next <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
        <span className="sr-only">
          Step changes automatically after 15 seconds unless reduced motion is
          enabled. Interacting with the demo pauses the timer. Use Back or Next
          to control the tour.
        </span>
      </section>
    </div>
  );
}
