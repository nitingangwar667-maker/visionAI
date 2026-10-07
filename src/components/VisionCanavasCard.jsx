import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Scan, Sparkles } from "lucide-react";

export default function VisionCanvasCard({
  onPhotoCaptured,
  detections,
  analysisResult,
  isProcessing,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [qualityMessage, setQualityMessage] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraRetryId, setCameraRetryId] = useState(0);
  const [cameraRequested, setCameraRequested] = useState(false);

  useEffect(() => {
    let streamInstance = null;
    if (cameraRequested && !photoPreview) {
      const openCamera = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera access is unavailable. Use HTTPS or open this site on localhost, then check browser camera permissions.");
          return;
        }
        try {
          streamInstance = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
        } catch (error) {
          if (error instanceof Error && error.name === "NotAllowedError") {
            setCameraError("Camera permission was denied. Allow camera access in your browser settings and retry.");
            return;
          }
          try {
            streamInstance = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch (error) {
            setCameraError(
              error instanceof Error && error.name === "NotAllowedError"
                ? "Camera permission was denied. Allow camera access in your browser settings and retry."
                : "Could not start the camera. Check that another app is not using it, then retry.",
            );
            return;
          }
        }
        if (videoRef.current) {
          videoRef.current.srcObject = streamInstance;
        } else {
          streamInstance.getTracks().forEach((track) => track.stop());
        }
      };
      void openCamera();
    }

    return () => {
      if (streamInstance) streamInstance.getTracks().forEach((t) => t.stop());
    };
  }, [cameraRequested, cameraRetryId, photoPreview]);

  // Draw YOLO bounding boxes over image when inference completes
  useEffect(() => {
    if (!photoPreview || !canvasRef.current || !detections) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = photoPreview;
    img.onload = () => {
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Render Boxes
      detections.forEach((d) => {
        const [xmin, ymin, xmax, ymax] = d.box;
        const x = xmin * canvas.width;
        const y = ymin * canvas.height;
        const w = (xmax - xmin) * canvas.width;
        const h = (ymax - ymin) * canvas.height;

        // Box border
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Tag Label background
        ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
        const text = `${d.label} ${Math.round(d.confidence * 100)}%`;
        ctx.font = "bold 14px monospace";
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x, y - 22, textWidth + 8, 22);

        // Tag Label text
        ctx.fillStyle = "#0B0F19";
        ctx.fillText(text, x + 4, y - 6);
      });
    };
  }, [photoPreview, detections]);

  const snap = () => {
    if (
      !videoRef.current ||
      videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      !videoRef.current.videoWidth ||
      !videoRef.current.videoHeight
    ) {
      setQualityMessage("Camera is still starting. Wait for the live preview, then capture.");
      return;
    }
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth || 640;
    c.height = videoRef.current.videoHeight || 480;
    const ctx = c.getContext("2d");
    if (!ctx) {
      setQualityMessage("Could not inspect this camera frame. Please retry or use another camera.");
      return;
    }
    ctx.drawImage(videoRef.current, 0, 0);

    const sample = document.createElement("canvas");
    sample.width = 160;
    sample.height = 120;
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    if (!sampleContext) {
      setQualityMessage("Could not inspect this camera frame. Please retry or use another camera.");
      return;
    }
    let data;
    try {
      sampleContext.drawImage(c, 0, 0, sample.width, sample.height);
      ({ data } = sampleContext.getImageData(0, 0, sample.width, sample.height));
    } catch {
      setQualityMessage("Could not inspect this camera frame. Check camera access and retry.");
      return;
    }
    const luminance = new Float32Array(sample.width * sample.height);
    let darkPixels = 0;
    let brightPixels = 0;
    for (let pixel = 0; pixel < luminance.length; pixel += 1) {
      const offset = pixel * 4;
      const value =
        0.2126 * data[offset] +
        0.7152 * data[offset + 1] +
        0.0722 * data[offset + 2];
      luminance[pixel] = value;
      if (value <= 20) darkPixels += 1;
      if (value >= 245) brightPixels += 1;
    }

    let laplacianSum = 0;
    let laplacianSquaredSum = 0;
    let samples = 0;
    for (let y = 1; y < sample.height - 1; y += 1) {
      for (let x = 1; x < sample.width - 1; x += 1) {
        const index = y * sample.width + x;
        const laplacian =
          4 * luminance[index] -
          luminance[index - 1] -
          luminance[index + 1] -
          luminance[index - sample.width] -
          luminance[index + sample.width];
        laplacianSum += laplacian;
        laplacianSquaredSum += laplacian * laplacian;
        samples += 1;
      }
    }
    const laplacianVariance =
      laplacianSquaredSum / samples - (laplacianSum / samples) ** 2;
    const darkRatio = darkPixels / luminance.length;
    const brightRatio = brightPixels / luminance.length;
    const qualityWarnings = [];
    if (laplacianVariance < 60) qualityWarnings.push("Image looks blurry or obstructed. Clean the lens and retake.");
    if (darkRatio > 0.45) qualityWarnings.push("Image is too dark. Move to a brighter area and retake.");
    if (brightRatio > 0.4) qualityWarnings.push("Image has strong glare or overexposure. Adjust the camera angle and retake.");
    const capturedAt = new Date().toISOString();
    setQualityMessage(
      qualityWarnings.length
        ? `Quality check suggestion: ${qualityWarnings.join(" ")} The photo is captured; retake it or continue with this image.`
        : "Image quality check passed. Review it, then continue or retake.",
    );
    c.toBlob(
      (blob) => {
        if (blob) {
          setPhotoPreview(URL.createObjectURL(blob));
          onPhotoCaptured(blob, { capturedAt, laplacianVariance });
        } else {
          setQualityMessage("The browser could not create the photo. Please capture again.");
        }
      },
      "image/jpeg",
      0.88,
    );
  };

  const reset = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setCameraReady(false);
    setPhotoPreview(null);
    setQualityMessage("");
    setCameraError("");
    onPhotoCaptured(null, null);
  };

  return (
    <div
      className="glass-panel p-4 rounded-2xl relative overflow-hidden shadow-2xl"
      data-tour="field-camera"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <Scan className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Field photo
          </span>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 text-sky-400 px-2 py-0.5 rounded border border-slate-700">
        PHOTO ANALYSIS
        </span>
      </div>

      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
        {!photoPreview ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedData={() => setCameraReady(true)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-dashed border-sky-500/30 m-4 rounded-lg pointer-events-none" />
          </>
        ) : (
          <canvas ref={canvasRef} className="w-full h-full object-cover" />
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-sky-400 animate-spin" />
            <span className="text-xs text-sky-100">
              Reviewing photo and location…
            </span>
          </div>
        )}
      </div>

      <p className="camera-quality-message camera-quality-help" data-tour="camera-quality">
        Image checks are suggestions, not a lock: blurry or dim photos can still be used. After capture, choose Retake or continue; object detection may return no match without blocking the report.
      </p>

      {cameraError && (
        <div className="camera-error-actions">
          <p className="camera-quality-message warning" role="alert">{cameraError}</p>
          <button
            type="button"
            className="camera-retry-button"
            onClick={() => {
              setCameraError("");
              setCameraReady(false);
              setCameraRequested(true);
              setCameraRetryId((retryId) => retryId + 1);
            }}
          >
            <RefreshCw size={14} /> Retry camera
          </button>
        </div>
      )}

      {qualityMessage && (
        <p className={`camera-quality-message ${qualityMessage.startsWith("Quality check suggestion:") ? "warning" : photoPreview ? "passed" : "warning"}`} role="status" aria-live="polite">
          {qualityMessage}
        </p>
      )}

      {Array.isArray(analysisResult?.detections) && (
        <p className={`camera-quality-message ${analysisResult.detections.length ? "passed" : "warning"}`} role="status">
          {analysisResult.detections.length
            ? `${analysisResult.detections.length} possible object${analysisResult.detections.length === 1 ? "" : "s"} detected. Review the result; it does not verify the asset.`
            : "No object was recognized. Your photo was still accepted and the report was generated. Retake for a clearer view or continue with this photo."}
        </p>
      )}

      {!photoPreview ? (
        <button
          type="button"
          onClick={() => cameraRequested ? snap() : setCameraRequested(true)}
          disabled={isProcessing || (cameraRequested && !cameraReady)}
          className="mt-3 w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs tracking-wide shadow-lg shadow-sky-500/20 transition active:scale-[0.98]"
        >
          <Camera className="w-4 h-4" />
          {cameraReady
            ? "TAKE PHOTO"
            : cameraRequested
              ? cameraError ? "CAMERA UNAVAILABLE" : "STARTING CAMERA…"
              : "START CAMERA"}
        </button>
      ) : (
        <button
          type="button"
          onClick={reset}
          className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-xs tracking-wide border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          RETAKE PHOTO
        </button>
      )}
    </div>
  );
}
