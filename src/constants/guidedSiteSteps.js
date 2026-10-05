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
    title: "Move between workspace sections",
    description:
      "Use these tabs to move between Home, Map, Upload, Monitoring, Offline vault, and About.",
    demo: "navigation",
  },
  {
    tab: "home",
    target: "home-overview",
    icon: Satellite,
    title: "Start with your overview",
    description:
      "Home brings your current study location, data availability, latest vegetation signal, and offline record count into one dashboard.",
    demo: "overview",
  },
  {
    tab: "map",
    target: "map-preset",
    icon: Map,
    title: "Choose a watershed",
    description:
      "Pick a saved watershed from this selector. The map marker and coordinates update to the selected area.",
    demo: "preset",
  },
  {
    tab: "map",
    target: "watershed-map",
    icon: Map,
    title: "Explore the map",
    description:
      "Click the map or drag its marker to explore another location. The coloured grid appears as you zoom in; click or hover over a cell to inspect its sampled index value.",
    demo: "map-point",
  },
  {
    tab: "map",
    target: "map-index-selector",
    icon: Satellite,
    title: "Choose an index heatmap",
    description:
      "Choose NDVI for vegetation greenness, NDWI for surface-water signal, SMI for a surface-moisture proxy, NDTI for turbidity-related signal, BSI for exposed soil, or EVI for vegetation. These are satellite indicators, not field measurements.",
    demo: "map-index",
  },
  {
    tab: "map",
    target: "map-year-selector",
    icon: Satellite,
    title: "Compare available observation years",
    description:
      "Choose an available year from 2022–2026. The map only draws valid Sentinel-2 pixels for the selected scene; if no scene or pixels are available, the map reports that instead of inventing a heatmap.",
    demo: "map-year",
  },
  {
    tab: "map",
    target: "map-base-layers",
    icon: Map,
    title: "Pick a map style",
    description:
      "Use the map's layer control to choose the available base map: Mapbox Satellite for imagery, Mapbox Outdoors for terrain context, OpenStreetMap for reference streets, or ISRO Bhuvan when available. Satellite index colours are a separate overlay.",
    demo: "base-layer",
  },
  {
    tab: "map",
    target: "map-layer-summary",
    icon: Satellite,
    title: "Read the heatmap",
    description:
      "The legend maps low-to-high index values to colour. Below the map, read the nearest valid pixel, area average, observed range, and low/moderate/high pixel counts. High is a high index value, not automatically a good outcome.",
    demo: "heatmap-reading",
  },
  {
    tab: "home",
    target: "quick-metrics",
    icon: Satellite,
    title: "Check the live overview",
    description:
      "These summary metrics show your current coordinates, connection, and saved audit count at a glance.",
    demo: "quick-metrics",
  },
  {
    tab: "monitoring",
    target: "data-source",
    icon: Satellite,
    title: "Check where the data comes from",
    description:
      "This label distinguishes satellite pixel observations from coordinate-derived estimates. Treat estimates as screening information, not measured satellite data.",
    demo: "data-source",
  },
  {
    tab: "monitoring",
    target: "index-cards",
    icon: Satellite,
    title: "Compare satellite indicators",
    description:
      "Select an index card to inspect vegetation (NDVI/EVI), surface water (NDWI), moisture proxy (SMI), turbidity-related signal (NDTI), or exposed soil (BSI). Check source labels; coordinate estimates are not satellite observations.",
    demo: "monitoring-index",
  },
  {
    tab: "monitoring",
    target: "trend-chart",
    icon: Satellite,
    title: "Read the yearly trend",
    description:
      "The chart compares annual samples for the selected index. Estimated values are identified separately from Sentinel-2 observations.",
    demo: "trend",
  },
  {
    tab: "upload",
    target: "field-camera",
    icon: Camera,
    title: "Document a field asset",
    description:
      "Allow camera access, frame the asset, and capture a photo. A quick blur and lighting screen gives advice; it does not block the photo. Review it, then choose Retake or continue with this image.",
    demo: "camera",
  },
  {
    tab: "upload",
    target: "camera-quality",
    icon: Camera,
    title: "Review image-quality guidance",
    description:
      "A blurry, very dark, or overexposed image triggers a retake suggestion, but you can still use it if you choose. Clean the lens, hold steady, and check lighting for a clearer record.",
    demo: "quality",
  },
  {
    tab: "upload",
    target: "audit-action",
    icon: FileCheck,
    title: "What happens after capture?",
    description:
      "When online, Generate field audit sends the photo for object detection, loads the index series, and downloads an informational PDF report. If the detector finds no object, the image is still accepted and the report says no object was recognized—retake or continue. Offline, Save to vault queues the image on this device for syncing later.",
    demo: "audit",
  },
  {
    tab: "vault",
    target: "offline-vault",
    icon: Database,
    title: "Manage offline records",
    description:
      "Offline audits stay in this browser until you choose to sync them. Review pending records here; the tour will not sync or delete them.",
    demo: "vault",
  },
  {
    tab: "vault",
    target: "vault-sync",
    icon: Database,
    title: "Sync only when you choose",
    description:
      "When online, use this button to send queued audits. It is disabled when there are no records or the device is offline.",
    demo: "sync",
  },
  {
    tab: "about",
    target: "about-overview",
    icon: FileCheck,
    title: "Learn about Drishti",
    description:
      "About introduces the platform, its data and field-audit workflow, and the beginner guide for learning each feature.",
    demo: "about",
  },
];
