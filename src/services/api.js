const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = (
  configuredApiBaseUrl ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : window.location.origin)
).replace(/\/+$/, "");

// NEW: Dynamically fetch 6 multi-spectral indices by coordinate
export async function fetchWatershedIndices(
  lat,
  lon,
  watershedName = "Selected Zone",
  requestSignal,
) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    watershed_name: watershedName,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  const abortRequest = () => controller.abort();
  if (requestSignal?.aborted) {
    controller.abort();
  } else {
    requestSignal?.addEventListener("abort", abortRequest, { once: true });
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/watershed/indices?${params.toString()}`,
      { signal: controller.signal },
    );
    if (!response.ok) {
      throw new Error("API server returned error");
    }
    return await response.json();
  } catch (err) {
    if (requestSignal?.aborted) {
      throw err;
    }
    if (import.meta.env.PROD) {
      throw new Error(
        "Could not reach the Drishti API. Verify VITE_API_BASE_URL and the backend deployment.",
      );
    }
    console.warn("Using coordinate-derived local telemetry:", err.message);
    const factor = Math.abs(Math.sin(lat * 12.9 + lon * 78.2));
    const baseNdvi = +(0.15 + factor * 0.15).toFixed(3);
    const baseNdwi = +(-0.25 + factor * 0.12).toFixed(3);
    const baseSmi = +(0.06 + factor * 0.1).toFixed(3);

    return {
      status: "success",
      source: "coordinate-fallback",
      watershed_name: watershedName,
      indices: [
        { year: 2022, ndvi: baseNdvi, ndwi: baseNdwi, smi: baseSmi, ndti: 0.142, bsi: 0.35, evi: +(baseNdvi * 0.85).toFixed(3) },
        { year: 2023, ndvi: +(baseNdvi + 0.07).toFixed(3), ndwi: +(baseNdwi + 0.06).toFixed(3), smi: +(baseSmi + 0.05).toFixed(3), ndti: 0.11, bsi: 0.28, evi: +(baseNdvi * 1.05).toFixed(3) },
        { year: 2024, ndvi: +(baseNdvi + 0.14).toFixed(3), ndwi: +(baseNdwi + 0.13).toFixed(3), smi: +(baseSmi + 0.11).toFixed(3), ndti: 0.075, bsi: 0.21, evi: +(baseNdvi * 1.25).toFixed(3) },
        { year: 2025, ndvi: +(baseNdvi + 0.22).toFixed(3), ndwi: +(baseNdwi + 0.21).toFixed(3), smi: +(baseSmi + 0.18).toFixed(3), ndti: 0.035, bsi: 0.14, evi: +(baseNdvi * 1.45).toFixed(3) },
        { year: 2026, ndvi: +(baseNdvi + 0.3).toFixed(3), ndwi: +(baseNdwi + 0.29).toFixed(3), smi: +(baseSmi + 0.26).toFixed(3), ndti: -0.01, bsi: 0.07, evi: +(baseNdvi * 1.65).toFixed(3) },
      ],
    };
  } finally {
    clearTimeout(timeoutId);
    requestSignal?.removeEventListener("abort", abortRequest);
  }
}

export async function fetchWatershedHeatmap(
  lat,
  lon,
  index,
  year,
  requestSignal,
) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    index,
    year: year.toString(),
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  const abortRequest = () => controller.abort();
  if (requestSignal?.aborted) {
    controller.abort();
  } else {
    requestSignal?.addEventListener("abort", abortRequest, { once: true });
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/watershed/heatmap?${params.toString()}`,
      { signal: controller.signal },
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Could not retrieve the satellite heatmap.");
    }
    return data;
  } catch (error) {
    if (requestSignal?.aborted) {
      throw error;
    }
    if (error.name === "AbortError") {
      throw new Error("Satellite heatmap request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    requestSignal?.removeEventListener("abort", abortRequest);
  }
}

export async function uploadFieldAudit(
  payload,
  { downloadCertificate = true } = {},
) {
  const formData = new FormData();
  formData.append("latitude", payload.lat);
  formData.append("longitude", payload.lon);
  formData.append("is_mock", payload.is_mock);
  formData.append("captured_at", payload.captured_at || payload.timestamp || "");
  if (Number.isFinite(payload.image_quality_variance)) {
    formData.append(
      "image_quality_variance",
      payload.image_quality_variance.toString(),
    );
  }
  formData.append("asset_name", payload.asset_name || "Check Dam");
  formData.append("image", payload.blob, "field_asset.jpg");

  const response = await fetch(`${API_BASE_URL}/api/audit`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Verification rejected by server.");
  }

  const summaryHeader = response.headers.get("X-Audit-Summary");
  const summaryData = summaryHeader ? JSON.parse(summaryHeader) : null;
  const pdfBlob = await response.blob();

  if (downloadCertificate) {
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `Drishti_Audit_${payload.lat.toFixed(4)}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);
  }

  return summaryData;
}
