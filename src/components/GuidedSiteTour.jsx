import React, { useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { GUIDED_SITE_STEPS } from "../constants/guidedSiteSteps";

export default function GuidedSiteTour({
  active,
  stepIndex,
  onStepChange,
  onClose,
}) {
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
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [active, onClose, onStepChange, stepIndex]);

  if (!active || !step) return null;

  return (
    <div className="site-tour-overlay" role="presentation">
      <section
        className="site-tour-card"
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
        <p className="site-tour-safety">
          The guide highlights features only. It will not change locations,
          capture photos, submit audits, sync records, or delete data.
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
          Step changes automatically. Use Back or Next to control the tour.
        </span>
      </section>
    </div>
  );
}
