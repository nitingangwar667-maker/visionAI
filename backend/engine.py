import io
import math
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import numpy as np
import rasterio
from rasterio.windows import Window
from rasterio.warp import transform, transform_bounds
import pystac_client
import planetary_computer

WATERSHED_CENTER = (13.133, 78.133)
STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"


def haversine_meters(lat1, lon1, lat2, lon2):
    R = 6371000.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def verify_spatial_boundary(lat: float, lon: float, is_mock: bool):
    drift_m = haversine_meters(
        lat, lon, WATERSHED_CENTER[0], WATERSHED_CENTER[1]
    )
    if is_mock:
        return False, "Simulated / Mock Location API detected on device.", round(drift_m, 1)
    if drift_m > 50000.0:
        return True, f"Regional sector active ({drift_m / 1000:.1f} km).", round(drift_m, 1)
    return True, f"Point verified ({drift_m:.0f}m from reference).", round(drift_m, 1)


def extract_real_band_pixel(asset_href: str, bbox: list) -> float:
    """Read a small coordinate window from a cloud-optimized Sentinel-2 raster."""
    with rasterio.Env(
        CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif",
        GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
    ):
        with rasterio.open(asset_href) as src:
            projected_bounds = transform_bounds(
                "EPSG:4326", src.crs, *bbox, densify_pts=21
            )
            min_x, min_y, max_x, max_y = projected_bounds
            corners = (
                (min_x, min_y),
                (min_x, max_y),
                (max_x, min_y),
                (max_x, max_y),
            )
            pixel_corners = [~src.transform * corner for corner in corners]
            columns = [point[0] for point in pixel_corners]
            rows = [point[1] for point in pixel_corners]
            col_start = max(0, math.floor(min(columns)))
            row_start = max(0, math.floor(min(rows)))
            col_stop = min(src.width, math.ceil(max(columns)))
            row_stop = min(src.height, math.ceil(max(rows)))
            if col_start >= col_stop or row_start >= row_stop:
                raise ValueError("Coordinate window does not overlap the Sentinel-2 raster.")

            window = Window(
                col_start,
                row_start,
                col_stop - col_start,
                row_stop - row_start,
            )
            data = src.read(1, window=window)
            valid = data[data > 0]
            if valid.size == 0:
                raise ValueError("No valid Sentinel-2 pixels intersect the coordinate window.")
            return float(np.mean(valid)) / 10000.0


def fetch_real_sentinel_indices(lat: float, lon: float):
    """Fetch Sentinel-2 band pixels and calculate indices for five observation years."""
    try:
        catalog = pystac_client.Client.open(
            STAC_URL, modifier=planetary_computer.sign_inplace
        )
    except Exception as exc:
        print(f"Sentinel-2 STAC catalog unavailable; using coordinate estimates: {exc}")
        catalog = None

    delta = 0.001
    bbox = [lon - delta, lat - delta, lon + delta, lat + delta]
    records = []

    for year in [2022, 2023, 2024, 2025, 2026]:
        try:
            if catalog is None:
                items = []
            else:
                search = catalog.search(
                    collections=["sentinel-2-l2a"],
                    bbox=bbox,
                    datetime=f"{year}-01-01/{year}-05-30",
                    query={"eo:cloud_cover": {"lt": 25}},
                    max_items=1,
                )
                items = list(search.items())

            if items:
                item = items[0]
                source = "sentinel-2"
                bands = {
                    key: extract_real_band_pixel(item.assets[asset].href, bbox)
                    for key, asset in (
                        ("blue", "B02"),
                        ("green", "B03"),
                        ("red", "B04"),
                        ("nir", "B08"),
                        ("swir", "B11"),
                    )
                }
            else:
                geo_seed = (
                    math.sin(lat * 100.0) * math.cos(lon * 100.0)
                    + (year - 2022) * 0.05
                )
                bands = {
                    "blue": max(0.02, 0.05 + 0.01 * geo_seed),
                    "green": max(0.04, 0.08 + 0.02 * geo_seed),
                    "red": max(0.03, 0.09 - 0.02 * geo_seed),
                    "nir": max(0.05, 0.22 + 0.06 * geo_seed),
                    "swir": max(0.03, 0.15 - 0.03 * geo_seed),
                }
                source = "coordinate-estimate"

            blue, green, red, nir, swir = (
                bands[name] for name in ("blue", "green", "red", "nir", "swir")
            )
            denom_ndvi = nir + red or 1e-5
            denom_ndwi = green + nir or 1e-5
            denom_ndti = red + green or 1e-5
            denom_smi = nir + swir or 1e-5
            bsi_den = (swir + red) + (nir + blue)
            evi_den = nir + 6.0 * red - 7.5 * blue + 1.0

            ndvi = (nir - red) / denom_ndvi
            ndwi = (green - nir) / denom_ndwi
            ndti = (red - green) / denom_ndti
            smi = (nir - swir) / denom_smi
            bsi = ((swir + red) - (nir + blue)) / bsi_den if bsi_den else 0.0
            evi = 2.5 * (nir - red) / evi_den if evi_den else 0.0

            records.append({
                "year": year,
                "ndvi": round(float(np.clip(ndvi, -1.0, 1.0)), 3),
                "ndwi": round(float(np.clip(ndwi, -1.0, 1.0)), 3),
                "smi": round(float(np.clip(smi, 0.0, 1.0)), 3),
                "ndti": round(float(np.clip(ndti, -1.0, 1.0)), 3),
                "bsi": round(float(np.clip(bsi, -1.0, 1.0)), 3),
                "evi": round(float(np.clip(evi, -1.0, 1.5)), 3),
                "source": source,
                "raw_bands": {name: round(value, 4) for name, value in bands.items()},
            })
        except Exception as exc:
            print(f"Year {year} extraction fallback: {exc}")
            ratio = math.sin(lat * 3.14 + year) * math.cos(lon * 3.14)
            records.append({
                "year": year,
                "ndvi": round(0.24 + ratio * 0.12, 3),
                "ndwi": round(-0.16 + ratio * 0.09, 3),
                "smi": round(0.12 + abs(ratio) * 0.14, 3),
                "ndti": round(0.08 - ratio * 0.04, 3),
                "bsi": round(0.22 - ratio * 0.08, 3),
                "evi": round(0.20 + ratio * 0.10, 3),
                "source": "coordinate-fallback",
            })

    return records


def fetch_sentinel_index_grid(
    lat: float,
    lon: float,
    index: str,
    year: int,
    radius_m: float = 1000.0,
    grid_size: int | None = None,
    cell_size_m: float = 30.0,
):
    """Sample one Sentinel-2 scene into approximately 30 m map cells."""
    band_requirements = {
        "ndvi": ("nir", "red"),
        "ndwi": ("green", "nir"),
        "smi": ("nir", "swir"),
        "ndti": ("red", "green"),
        "bsi": ("swir", "red", "nir", "blue"),
        "evi": ("nir", "red", "blue"),
    }
    band_assets = {
        "blue": "B02",
        "green": "B03",
        "red": "B04",
        "nir": "B08",
        "swir": "B11",
    }
    if index not in band_requirements:
        raise ValueError(f"Unsupported index: {index}")
    if radius_m <= 0 or cell_size_m <= 0:
        raise ValueError("Heatmap radius and cell size must be greater than zero.")
    if grid_size is None:
        grid_size = math.ceil((2 * radius_m) / cell_size_m)

    try:
        catalog = pystac_client.Client.open(
            STAC_URL, modifier=planetary_computer.sign_inplace
        )
        lat_delta = radius_m / 111_320.0
        lon_delta = radius_m / (
            111_320.0 * max(math.cos(math.radians(lat)), 0.01)
        )
        south, north = lat - lat_delta, lat + lat_delta
        west, east = lon - lon_delta, lon + lon_delta
        search = catalog.search(
            collections=["sentinel-2-l2a"],
            bbox=[west, south, east, north],
            datetime=f"{year}-01-01/{year}-12-31",
            query={"eo:cloud_cover": {"lt": 25}},
            max_items=1,
        )
        items = list(search.items())
    except Exception as exc:
        raise RuntimeError(f"Sentinel-2 scene search failed: {exc}") from exc

    if not items:
        raise ValueError(
            f"No low-cloud Sentinel-2 scene was found for {year} at this location."
        )

    item = items[0]
    lat_edges = np.linspace(south, north, grid_size + 1)
    lon_edges = np.linspace(west, east, grid_size + 1)
    lat_centers = (lat_edges[:-1] + lat_edges[1:]) / 2
    lon_centers = (lon_edges[:-1] + lon_edges[1:]) / 2
    center_lons, center_lats = np.meshgrid(lon_centers, lat_centers[::-1])
    flat_lons = center_lons.ravel()
    flat_lats = center_lats.ravel()

    band_values = {}
    try:
        for band_name in band_requirements[index]:
            asset_href = item.assets[band_assets[band_name]].href
            with rasterio.Env(
                CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif",
                GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
            ):
                with rasterio.open(asset_href) as src:
                    sample_x, sample_y = transform(
                        "EPSG:4326",
                        src.crs,
                        flat_lons.tolist(),
                        flat_lats.tolist(),
                    )
                    samples = np.ma.vstack(
                        list(
                            src.sample(
                                zip(sample_x, sample_y, strict=True),
                                indexes=1,
                                masked=True,
                            )
                        )
                    ).reshape(-1)
                    values = samples.astype(np.float64).filled(np.nan) / 10_000.0
                    band_values[band_name] = np.where(values > 0, values, np.nan)
    except Exception as exc:
        raise RuntimeError(f"Sentinel-2 pixel sampling failed: {exc}") from exc

    blue = band_values.get("blue")
    green = band_values.get("green")
    red = band_values.get("red")
    nir = band_values.get("nir")
    swir = band_values.get("swir")

    if index == "ndvi":
        values = np.divide(
            nir - red, nir + red, out=np.full_like(nir, np.nan), where=(nir + red) != 0
        )
        value_range = (-1.0, 1.0)
    elif index == "ndwi":
        values = np.divide(
            green - nir,
            green + nir,
            out=np.full_like(green, np.nan),
            where=(green + nir) != 0,
        )
        value_range = (-1.0, 1.0)
    elif index == "smi":
        values = np.divide(
            nir - swir,
            nir + swir,
            out=np.full_like(nir, np.nan),
            where=(nir + swir) != 0,
        )
        value_range = (0.0, 1.0)
    elif index == "ndti":
        values = np.divide(
            red - green,
            red + green,
            out=np.full_like(red, np.nan),
            where=(red + green) != 0,
        )
        value_range = (-1.0, 1.0)
    elif index == "bsi":
        numerator = (swir + red) - (nir + blue)
        denominator = (swir + red) + (nir + blue)
        values = np.divide(
            numerator,
            denominator,
            out=np.full_like(numerator, np.nan),
            where=denominator != 0,
        )
        value_range = (-1.0, 1.0)
    else:
        denominator = nir + 6.0 * red - 7.5 * blue + 1.0
        values = np.divide(
            2.5 * (nir - red),
            denominator,
            out=np.full_like(nir, np.nan),
            where=denominator != 0,
        )
        value_range = (-1.0, 1.5)

    values = np.clip(values, *value_range)
    cells = []
    for row in range(grid_size):
        for col in range(grid_size):
            sample_index = row * grid_size + col
            value = values[sample_index]
            if haversine_meters(
                lat, lon, flat_lats[sample_index], flat_lons[sample_index]
            ) > radius_m:
                value = np.nan
            cells.append(
                {
                    "row": row,
                    "col": col,
                    "value": round(float(value), 3) if np.isfinite(value) else None,
                }
            )

    return {
        "index": index,
        "year": year,
        "source": "sentinel-2",
        "scene_id": item.id,
        "acquired": item.datetime.isoformat() if item.datetime else None,
        "cloud_cover": item.properties.get("eo:cloud_cover"),
        "grid_size": grid_size,
        "bounds": {"south": south, "west": west, "north": north, "east": east},
        "cells": cells,
    }

def generate_pdf_certificate(
    lat: float,
    lon: float,
    asset_info: dict,
    time_series: list,
    drift_m: float,
    image_bytes: bytes,
    captured_at: str,
    image_sha256: str,
    record_sha256: str,
    image_quality_variance: float | None = None,
) -> bytes:
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    p.setFillColor(colors.HexColor("#315D42"))
    p.rect(0, height - 90, width, 90, fill=1, stroke=0)
    p.setFont("Helvetica-Bold", 18)
    p.setFillColor(colors.white)
    p.drawString(40, height - 42, "Drishti Field Audit Report")
    p.setFont("Helvetica", 9)
    p.drawString(40, height - 64, "AI-assisted field observation · Not an official government certificate")

    p.setFillColor(colors.HexColor("#0F172A"))
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, height - 115, "FIELD OBSERVATION")
    p.setFont("Helvetica", 9)
    p.drawString(40, height - 132, f"AI-assigned label: {asset_info['structure_name']} ({int(asset_info['confidence'] * 100)}% model confidence)")
    p.drawString(40, height - 147, f"Category: {asset_info['classification']}")
    p.drawString(40, height - 162, f"Selected coordinates: {lat:.6f} N, {lon:.6f} E")
    p.drawString(40, height - 177, f"Distance from reference point: {drift_m:.0f} m (informational; no catchment polygon validated)")
    p.drawString(40, height - 192, f"Client-reported capture time: {captured_at} (device clock; not independently verified)")

    p.setStrokeColor(colors.HexColor("#94A3B8"))
    p.line(40, height - 207, width - 40, height - 207)
    p.setFont("Helvetica-Bold", 8)
    p.drawString(40, height - 221, "Year")
    p.drawString(85, height - 221, "NDVI")
    p.drawString(155, height - 221, "NDWI")
    p.drawString(225, height - 221, "NDTI")
    p.drawString(295, height - 221, "SMI")
    p.drawString(365, height - 221, "BSI")
    p.drawString(425, height - 221, "EVI")
    p.drawString(490, height - 221, "Source")
    p.line(40, height - 227, width - 40, height - 227)

    y = height - 243
    p.setFont("Helvetica", 8)
    for r in time_series:
        p.drawString(40, y, str(r["year"]))
        p.drawString(85, y, f"{r['ndvi']:+.3f}")
        p.drawString(155, y, f"{r['ndwi']:+.3f}")
        p.drawString(225, y, f"{r['ndti']:+.3f}")
        p.drawString(295, y, f"{r['smi']:+.3f}")
        p.drawString(365, y, f"{r['bsi']:+.3f}")
        p.drawString(425, y, f"{r['evi']:+.3f}")
        p.drawString(490, y, "Sentinel-2" if r.get("source") == "sentinel-2" else "Estimate")
        y -= 17

    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica", 8)
    p.drawString(40, y - 8, "Satellite indicators are screening signals; source labels distinguish observations from estimates.")
    p.drawString(40, y - 22, "Distance is informational only. No official boundary, hardware GPS, or intervention status was verified.")
    p.showPage()

    p.setFillColor(colors.HexColor("#315D42"))
    p.rect(0, height - 72, width, 72, fill=1, stroke=0)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(40, height - 42, "Evidence & integrity")
    p.setFillColor(colors.HexColor("#0F172A"))
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, height - 100, "CAPTURED FIELD PHOTO")
    photo = ImageReader(io.BytesIO(image_bytes))
    p.drawImage(
        photo,
        40,
        height - 405,
        width=260,
        height=285,
        preserveAspectRatio=True,
        anchor="c",
        mask="auto",
    )
    p.setStrokeColor(colors.HexColor("#CBD5E1"))
    p.rect(40, height - 405, 260, 285, stroke=1, fill=0)

    p.setFont("Helvetica-Bold", 11)
    p.drawString(330, height - 100, "SELECTED STUDY POINT")
    p.setFont("Helvetica", 9)
    p.drawString(330, height - 120, f"{lat:.6f} N")
    p.drawString(330, height - 136, f"{lon:.6f} E")
    p.setFont("Helvetica-Oblique", 8)
    p.setFillColor(colors.HexColor("#64748B"))
    p.drawString(330, height - 158, "Coordinate reference only")
    p.drawString(330, height - 171, "No boundary polygon available")
    sketch_x, sketch_y, sketch_w, sketch_h = 330, height - 310, 220, 100
    p.setFillColor(colors.HexColor("#F1F6ED"))
    p.setStrokeColor(colors.HexColor("#CBD5E1"))
    p.roundRect(sketch_x, sketch_y, sketch_w, sketch_h, 8, fill=1, stroke=1)
    p.setStrokeColor(colors.HexColor("#DCE7D8"))
    for grid_x in range(1, 5):
        x = sketch_x + grid_x * sketch_w / 5
        p.line(x, sketch_y + 8, x, sketch_y + sketch_h - 8)
    for grid_y in range(1, 3):
        y_grid = sketch_y + grid_y * sketch_h / 3
        p.line(sketch_x + 8, y_grid, sketch_x + sketch_w - 8, y_grid)
    p.setFillColor(colors.HexColor("#C45546"))
    p.circle(sketch_x + sketch_w / 2, sketch_y + sketch_h / 2, 5, fill=1, stroke=0)
    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica-Oblique", 7)
    p.drawString(sketch_x, sketch_y - 12, "Schematic only; not imagery, terrain, or a geofence.")

    recent = time_series[-3:]
    p.setFillColor(colors.HexColor("#0F172A"))
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, height - 450, "THREE-YEAR NDVI SERIES")
    graph_x, graph_y, graph_w, graph_h = 65, height - 640, width - 120, 145
    p.setStrokeColor(colors.HexColor("#CBD5E1"))
    p.line(graph_x, graph_y, graph_x, graph_y + graph_h)
    p.line(graph_x, graph_y, graph_x + graph_w, graph_y)
    if recent:
        values = [float(record["ndvi"]) for record in recent]
        low, high = min(values), max(values)
        span = max(high - low, 0.01)
        points = [
            (
                graph_x + index * graph_w / max(len(recent) - 1, 1),
                graph_y + 12 + (value - low) / span * (graph_h - 30),
            )
            for index, value in enumerate(values)
        ]
        p.setStrokeColor(colors.HexColor("#4E8A58"))
        p.setLineWidth(2)
        for start, end in zip(points, points[1:]):
            p.line(*start, *end)
        for point, record in zip(points, recent):
            p.setFillColor(colors.HexColor("#4E8A58"))
            p.circle(point[0], point[1], 3, fill=1, stroke=0)
            p.setFillColor(colors.HexColor("#475569"))
            p.setFont("Helvetica", 8)
            p.drawCentredString(point[0], graph_y - 13, str(record["year"]))
            p.drawCentredString(point[0], point[1] + 8, f"{record['ndvi']:.3f}")
            p.drawCentredString(
                point[0],
                graph_y - 26,
                "S2" if record.get("source") == "sentinel-2" else "Estimate",
            )
    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica", 8)
    p.drawString(40, height - 674, "S2 = Sentinel-2 pixel observation. Estimate = coordinate-derived value or fallback.")
    quality_text = (
        f"Client-side blur-screen variance: {image_quality_variance:.1f} (heuristic, not forensic)"
        if image_quality_variance is not None
        else "Client-side image quality metric unavailable."
    )
    p.drawString(40, height - 688, quality_text)

    p.setFillColor(colors.HexColor("#0F172A"))
    p.setFont("Helvetica-Bold", 9)
    p.drawString(40, 112, "SHA-256 IMAGE DIGEST")
    p.setFont("Courier", 7)
    p.drawString(40, 99, image_sha256)
    p.setFont("Helvetica-Bold", 9)
    p.drawString(40, 78, "SHA-256 RECORD DIGEST")
    p.setFont("Courier", 7)
    p.drawString(40, 65, record_sha256)
    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica", 7)
    p.drawString(40, 49, "Integrity checksums are not digital signatures, identity proof, or government certification.")
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue()