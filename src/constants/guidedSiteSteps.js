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
  },
  {
    tab: "home",
    target: "home-overview",
    icon: Satellite,
    title: "Start with your overview",
    description:
      "Home brings your current study location, data availability, latest vegetation signal, and offline record count into one dashboard.",
  },
  {
    tab: "map",
    target: "map-preset",
    icon: Map,
    title: "Choose a watershed",
    description:
      "Pick a saved watershed from this selector. The map marker and coordinates update to the selected area.",
  },
  {
    tab: "map",
    target: "watershed-map",
    icon: Map,
    title: "Explore the map",
    description:
      "Click the map or drag its marker to explore another location. Use the Layers control to switch map sources; indicators refresh for the selected point.",
  },
  {
    tab: "home",
    target: "quick-metrics",
    icon: Satellite,
    title: "Check the live overview",
    description:
      "These summary metrics show your current coordinates, connection, and saved audit count at a glance.",
  },
  {
    tab: "monitoring",
    target: "data-source",
    icon: Satellite,
    title: "Check where the data comes from",
    description:
      "This label distinguishes satellite pixel observations from coordinate-derived estimates. Treat estimates as screening information, not measured satellite data.",
  },
  {
    tab: "monitoring",
    target: "index-cards",
    icon: Satellite,
    title: "Compare satellite indicators",
    description:
      "Select an index card to inspect vegetation, water, moisture, soil, and sediment signals. Check its source label before interpreting values.",
  },
  {
    tab: "monitoring",
    target: "trend-chart",
    icon: Satellite,
    title: "Read the yearly trend",
    description:
      "The chart compares annual samples for the selected index. Estimated values are identified separately from Sentinel-2 observations.",
  },
  {
    tab: "upload",
    target: "field-camera",
    icon: Camera,
    title: "Document a field asset",
    description:
      "The camera panel lets you preview and capture an asset photo. You control camera access and when to take or retake a photo.",
  },
  {
    tab: "upload",
    target: "audit-action",
    icon: FileCheck,
    title: "Create a field audit",
    description:
      "After you capture a photo, use this action to submit an online audit or save it locally while offline. The tour will not submit anything.",
  },
  {
    tab: "vault",
    target: "offline-vault",
    icon: Database,
    title: "Manage offline records",
    description:
      "Offline audits stay in this browser until you choose to sync them. Review pending records here; the tour will not sync or delete them.",
  },
  {
    tab: "vault",
    target: "vault-sync",
    icon: Database,
    title: "Sync only when you choose",
    description:
      "When online, use this button to send queued audits. It is disabled when there are no records or the device is offline.",
  },
  {
    tab: "about",
    target: "about-overview",
    icon: FileCheck,
    title: "Learn about GeoDrishti",
    description:
      "About introduces the platform, its data and field-audit workflow, and the beginner guide for learning each feature.",
  },
];
