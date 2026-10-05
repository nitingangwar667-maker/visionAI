import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Globe2,
  MapPinned,
  Satellite,
} from "lucide-react";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=85",
    eyebrow: "WATERSHED OVERVIEW",
    title: ["Explore your", "watershed."],
    description:
      "Choose a study area, inspect satellite indicators, and document field assets at mapped locations.",
    tag: "STUDY AREA",
    primary: "Open watershed map",
    secondary: "View indicators",
    action: "map",
  },
  {
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=85",
    eyebrow: "SATELLITE INDICATORS",
    title: ["Compare readings", "across years."],
    description:
      "Review NDVI, NDWI, and other indices by year. Source labels distinguish Sentinel-2 observations from estimates.",
    tag: "ANNUAL COMPARISON",
    primary: "View indicators",
    secondary: "Open map",
    action: "monitoring",
  },
  {
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2200&q=85",
    eyebrow: "FIELD RECORDS",
    title: ["Record what you", "find on site."],
    description:
      "Capture and review an asset photo with its study location. Submit it online or save it on this device while offline.",
    tag: "FIELD AUDIT",
    primary: "Open field audit",
    secondary: "View indicators",
    action: "upload",
  },
];

const SLIDE_INTERVAL = 6500;

export default function HomeHero({
  coords,
  isOnline,
  onOpenMap,
  onOpenUpload,
  onOpenMonitoring,
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return undefined;

    const timer = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL);

    return () => window.clearTimeout(timer);
  }, [activeSlide]);

  const handlePrimaryAction = () => {
    if (slide.action === "upload") {
      onOpenUpload();
    } else if (slide.action === "monitoring") {
      onOpenMonitoring();
    } else {
      onOpenMap();
    }
  };

  return (
    <section className="home-hero" aria-label="Drishti highlights">
      <div className="home-hero-art" aria-hidden="true">
        {slides.map((item, index) => (
          <div
            className={`home-hero-image ${index === activeSlide ? "active" : ""}`}
            key={item.image}
            style={{ backgroundImage: `url("${item.image}")` }}
          />
        ))}
        <div className="hero-grid" />
        <div className="hero-contour contour-one" />
        <div className="hero-contour contour-two" />
        <div className="hero-contour contour-three" />
        <div className="hero-pin">
          <MapPinned size={25} />
        </div>
        <div className="hero-coordinate">
          {coords.latitude.toFixed(4)}° N
          <br />
          {coords.longitude.toFixed(4)}° E
        </div>
        <div className="hero-scan-tag">
          <Satellite size={13} /> {slide.tag}
        </div>
      </div>

      <div className="home-hero-copy" key={activeSlide}>
        <span className="eyebrow">
          <Globe2 size={14} /> {slide.eyebrow}
        </span>
        <h1>
          {slide.title[0]}
          <br />
          {slide.title[1]}
        </h1>
        <p>{slide.description}</p>
        <div className="home-hero-actions">
          <button className="button-primary" onClick={handlePrimaryAction}>
            {slide.primary} <ArrowRight size={16} />
          </button>
          <button
            className="button-secondary"
            onClick={
              slide.action === "monitoring" ? onOpenMap : onOpenMonitoring
            }
          >
            {slide.action === "monitoring" ? (
              <MapPinned size={16} />
            ) : (
              <ChartNoAxesCombined size={16} />
            )}
            {slide.secondary}
          </button>
        </div>
        <div className="home-hero-meta">
          <span>
            <span className="status-pulse" />
            {isOnline ? "Connected" : "Offline"}
          </span>
          <span>Copernicus Sentinel-2 · 2022–2026</span>
        </div>
        <div className="home-hero-pagination" aria-label="Choose hero slide">
          {slides.map((item, index) => (
            <button
              aria-label={`Show highlight ${index + 1}: ${item.eyebrow.toLowerCase()}`}
              aria-current={index === activeSlide ? "true" : undefined}
              className={index === activeSlide ? "active" : ""}
              key={item.image}
              onClick={() => setActiveSlide(index)}
              type="button"
            />
          ))}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        Highlight {activeSlide + 1} of {slides.length}: {slide.eyebrow}
      </span>
    </section>
  );
}
