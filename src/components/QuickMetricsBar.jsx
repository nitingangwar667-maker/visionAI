import React, { useEffect, useState } from "react";
import { Satellite } from "lucide-react";

export default function QuickMetricsBar() {
  const firstPart = "See the change. ";
  const secondPart = "Shape a better watershed.";
  const tagline = `${firstPart}${secondPart}`;
  const [typedCharacters, setTypedCharacters] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedCharacters(tagline.length);
      return undefined;
    }

    let displayedCharacters = 0;
    let intervalId;
    const startTimeout = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        displayedCharacters += 1;
        setTypedCharacters(displayedCharacters);
        if (displayedCharacters >= tagline.length) {
          window.clearInterval(intervalId);
        }
      }, 42);
    }, 300);

    return () => {
      window.clearTimeout(startTimeout);
      window.clearInterval(intervalId);
    };
  }, [tagline.length]);

  const firstPartLength = Math.min(typedCharacters, firstPart.length);
  const secondPartLength = Math.max(0, typedCharacters - firstPart.length);

  return (
    <section
      className="metrics-wrap home-tagline-wrap"
      aria-label="Watershed intelligence"
      data-tour="quick-metrics home-overview"
    >
      <div className="home-tagline">
        <div className="home-tagline-copy">
          <h2
            className={typedCharacters >= tagline.length ? "is-typed" : ""}
            aria-label={tagline}
          >
            <span className="home-tagline-first" aria-hidden="true">
              {firstPart.slice(0, firstPartLength)}
            </span>
            <span className="home-tagline-second" aria-hidden="true">
              {secondPart.slice(0, secondPartLength)}
            </span>
          </h2>
        </div>
        <div className="home-tagline-orbit" aria-hidden="true">
          <span />
          <Satellite size={23} strokeWidth={1.7} />
        </div>
      </div>
    </section>
  );
}
