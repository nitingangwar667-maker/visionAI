import os

# Keep MKL on the sequential backend so NumPy and PyTorch do not initialize
# incompatible OpenMP runtimes in this Windows Conda environment.
os.environ["MKL_THREADING_LAYER"] = "SEQUENTIAL"

import json
import hashlib
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response, Query
from starlette.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from classifier import analyze_asset_with_bounding_boxes
from engine import (
    fetch_real_sentinel_indices,
    fetch_sentinel_index_grid,
    generate_pdf_certificate,
    verify_spatial_boundary,
)

app = FastAPI(title="Drishti Geospatial Live Satellite Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Audit-Summary", "Content-Disposition"]
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/watershed/indices")
async def get_live_indices(
    latitude: float = Query(...),
    longitude: float = Query(...),
    watershed_name: str = Query("Field Target"),
):
    """Extract Sentinel-2 spectral pixels for the selected coordinates."""
    time_series = await run_in_threadpool(
        fetch_real_sentinel_indices, latitude, longitude
    )
    return {
        "status": "success",
        "watershed_name": watershed_name,
        "coordinates": {"lat": latitude, "lon": longitude},
        "indices": time_series
    }


@app.get("/api/watershed/heatmap")
async def get_watershed_heatmap(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    index: str = Query(...),
    year: int = Query(..., ge=2022, le=2026),
):
    """Sample observed Sentinel-2 pixels around a selected map coordinate."""
    if index not in {"ndvi", "ndwi", "smi", "ndti", "bsi", "evi"}:
        raise HTTPException(status_code=422, detail="Unsupported satellite index.")

    try:
        return await run_in_threadpool(
            fetch_sentinel_index_grid, latitude, longitude, index, year
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/api/audit")
async def execute_field_audit(
    latitude: float = Form(...),
    longitude: float = Form(...),
    is_mock: bool = Form(False),
    asset_name: str = Form("Auto"),
    captured_at: str = Form(""),
    image_quality_variance: float | None = Form(None),
    image: UploadFile = File(...)
):
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Null image buffer received.")

    is_valid, reason, drift_m = verify_spatial_boundary(latitude, longitude, is_mock)
    if not is_valid:
        raise HTTPException(status_code=400, detail=reason)

    vision_meta = analyze_asset_with_bounding_boxes(image_bytes)
    time_series = await run_in_threadpool(
        fetch_real_sentinel_indices, latitude, longitude
    )
    captured_at = captured_at or datetime.now().astimezone().isoformat()
    image_sha256 = hashlib.sha256(image_bytes).hexdigest()
    record_manifest = {
        "latitude": round(latitude, 6),
        "longitude": round(longitude, 6),
        "captured_at": captured_at,
        "is_mock": is_mock,
        "image_sha256": image_sha256,
        "image_quality_variance": image_quality_variance,
        "asset": vision_meta,
        "indices": time_series,
    }
    canonical_manifest = json.dumps(
        record_manifest,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    record_sha256 = hashlib.sha256(canonical_manifest).hexdigest()
    pdf_bytes = generate_pdf_certificate(
        latitude,
        longitude,
        vision_meta,
        time_series,
        drift_m,
        image_bytes,
        captured_at,
        image_sha256,
        record_sha256,
        image_quality_variance,
    )

    summary_meta = json.dumps({
        "structure": vision_meta["structure_name"],
        "category": vision_meta["classification"],
        "confidence": vision_meta["confidence"],
        "detections": vision_meta["detections"],
        "drift_m": drift_m,
        "captured_at": captured_at,
        "image_sha256": image_sha256,
        "record_sha256": record_sha256,
        "indices": time_series
    })

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Drishti_Audit_{latitude:.3f}.pdf",
            "X-Audit-Summary": summary_meta
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
    )