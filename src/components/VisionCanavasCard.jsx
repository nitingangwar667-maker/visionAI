import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Scan, Sparkles } from "lucide-react";

export default function VisionCanvasCard({
  onPhotoCaptured,
  detections,
  isProcessing,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    let streamInstance = null;
    if (!photoPreview) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "environment" } })
        .then((s) => {
          streamInstance = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {
          navigator.mediaDevices
            ?.getUserMedia({ video: true })
            .then((s) => {
              streamInstance = s;
              if (videoRef.current) videoRef.current.srcObject = s;
            })
            .catch((e) => console.warn("Camera fallback bypassed", e));
        });
    }

    return () => {
      if (streamInstance) streamInstance.getTracks().forEach((t) => t.stop());
    };
  }, [photoPreview]);

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
    if (!videoRef.current) return;
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth || 640;
    c.height = videoRef.current.videoHeight || 480;
    const ctx = c.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    c.toBlob(
      (blob) => {
        if (blob) {
          setPhotoPreview(URL.createObjectURL(blob));
          onPhotoCaptured(blob);
        }
      },
      "image/jpeg",
      0.88,
    );
  };

  const reset = () => {
    setPhotoPreview(null);
    onPhotoCaptured(null);
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
            Ground Vision Feed
          </span>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 text-sky-400 px-2 py-0.5 rounded border border-slate-700">
          YOLOv8n Neural Core
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
            <span className="text-xs font-mono text-sky-300">
              Executing Forward Pass & Sentinel Ingestion...
            </span>
          </div>
        )}
      </div>

      {!photoPreview ? (
        <button
          onClick={snap}
          className="mt-3 w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs tracking-wide shadow-lg shadow-sky-500/20 transition active:scale-[0.98]"
        >
          <Camera className="w-4 h-4" />
          CAPTURE FIELD ASSET
        </button>
      ) : (
        <button
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
