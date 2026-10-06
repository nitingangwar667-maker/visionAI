import {
  Camera,
  Database,
  FileCheck,
  Map,
  Satellite,
} from "lucide-react";

export const GUIDED_SITE_STEPS = [
  {
    tab: "home",
    target: "main-navigation",
    icon: Map,
    title: "Move between sections",
    description:
      "Use the tabs to open Home, Map, Upload, Monitoring, Offline vault, or About.",
    demo: "navigation",
  },
  {
    tab: "home",
    target: "home-overview",
    icon: Satellite,
    title: "Start with the watershed tagline",
    description:
      "The Home banner introduces Drishti’s watershed focus. Use the main navigation to explore the map, satellite indicators, field audits, and offline records.",
    demo: "overview",
  },
  {
    tab: "map",
    target: "map-preset",
    icon: Map,
    title: "Choose a watershed",
    description:
      "Choose a watershed to move the map marker and update its coordinates.",
    demo: "preset",
  },
  {
    tab: "map",
    target: "watershed-map",
    icon: Map,
    title: "Explore the map",
    description:
      "Click the map or drag the marker to another location. Zoom in to see index cells; select a cell to inspect its value.",
    demo: "map-point",
  },
  {
    tab: "map",
    target: "map-index-selector",
    icon: Satellite,
    title: "Choose an index heatmap",
    description:
      "Choose NDVI or EVI for vegetation, NDWI for water, SMI for moisture, NDTI for turbidity, or BSI for exposed soil. These are satellite indicators, not field measurements.",
    demo: "map-index",
  },
  {
    tab: "map",
    target: "map-year-selector",
    icon: Satellite,
    title: "Compare available observation years",
    description:
      "Choose a year from 2022–2026. The map shows valid Sentinel-2 pixels when available; if there are none, it reports that.",
    demo: "map-year",
  },
  {
    tab: "map",
    target: "map-base-layers",
    icon: Map,
    title: "Pick a map style",
    description:
      "Choose Mapbox Satellite, Mapbox Outdoors, OpenStreetMap, or ISRO Bhuvan from the layer menu. The index-colour overlay is separate.",
    demo: "base-layer",
  },
  {
    tab: "map",
    target: "map-layer-summary",
    icon: Satellite,
    title: "Read the heatmap",
    description:
      "Use the legend and the summary below the map to read pixel values and ranges. A high index value is not always a good outcome.",
    demo: "heatmap-reading",
  },
  {
    tab: "monitoring",
    target: "data-source",
    icon: Satellite,
    title: "Check where the data comes from",
    description:
      "Source labels distinguish Sentinel-2 observations from estimates. Estimates are not satellite measurements.",
    demo: "data-source",
  },
  {
    tab: "monitoring",
    target: "index-cards",
    icon: Satellite,
    title: "Compare satellite indicators",
    description:
      "Select an index to view its readings. Check the source label to see whether each year is an observation or an estimate.",
    demo: "monitoring-index",
  },
  {
    tab: "monitoring",
    target: "trend-chart",
    icon: Satellite,
    title: "Read the yearly trend",
    description:
      "Compare yearly values for the selected index. Estimates are marked separately from Sentinel-2 observations.",
    demo: "trend",
  },
  {
    tab: "upload",
    target: "field-camera",
    icon: Camera,
    title: "Document a field asset",
    description:
      "Allow camera access, frame the asset, and take a photo. Review it and retake if needed.",
    demo: "camera",
  },
  {
    tab: "upload",
    target: "camera-quality",
    icon: Camera,
    title: "Review image-quality guidance",
    description:
      "Blur or poor lighting prompts a retake suggestion, but does not block the photo.",
    demo: "quality",
  },
  {
    tab: "upload",
    target: "audit-action",
    icon: FileCheck,
    title: "What happens after capture?",
    description:
      "Online, submit the photo for analysis and download the audit PDF. If no object is recognized, the photo is still accepted. Offline, save the audit on this device to sync later.",
    demo: "audit",
  },
  {
    tab: "vault",
    target: "offline-vault",
    icon: Database,
    title: "Manage offline records",
    description:
      "Review audits saved in this browser. They stay here until you choose to sync or remove them.",
    demo: "vault",
  },
  {
    tab: "vault",
    target: "vault-sync",
    icon: Database,
    title: "Sync only when you choose",
    description:
      "When online, use this button to send queued audits. It is unavailable when offline or when the queue is empty.",
    demo: "sync",
  },
  {
    tab: "about",
    target: "about-overview",
    icon: FileCheck,
    title: "About Drishti",
    description:
      "Find a short guide to the map, satellite readings, and field records.",
    demo: "about",
  },
];
