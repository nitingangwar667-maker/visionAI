import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw } from "lucide-react";

export default function CameraCard({ onPhotoCaptured }) {
  const videoRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    let streamInstance = null;

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamInstance = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        navigator.mediaDevices
          ?.getUserMedia({ video: true })
          .then((fallbackStream) => {
            streamInstance = fallbackStream;
            if (videoRef.current) videoRef.current.srcObject = fallbackStream;
          })
          .catch((err) => console.warn("Camera sensor unavailable:", err));
      });

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, [photoPreview]);

  const snapPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPhotoPreview(URL.createObjectURL(blob));
          onPhotoCaptured(blob);
        }
      },
      "image/jpeg",
      0.85,
    );
  };

  const retakePhoto = () => {
    setPhotoPreview(null);
    onPhotoCaptured(null);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <Camera className="w-5 h-5 text-isro-blue" />
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          1. Ground Visual Evidence
        </h2>
      </div>

      <div className="relative aspect-video w-full bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
        {!photoPreview ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={photoPreview}
            alt="Captured Structure"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {!photoPreview ? (
        <button
          onClick={snapPhoto}
          className="mt-3 w-full bg-isro-blue hover:bg-isro-dark text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 text-sm shadow"
        >
          <Camera className="w-4 h-4" />
          Capture Geotagged Photo
        </button>
      ) : (
        <button
          onClick={retakePhoto}
          className="mt-3 w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 text-sm shadow"
        >
          <RefreshCw className="w-4 h-4" />
          Retake Picture
        </button>
      )}
    </div>
  );
}
