# Drishti API deployment

Deploy this directory as the backend service root. Install dependencies with:

```sh
pip install -r requirements.txt
```

Use this start command on hosts that provide a `PORT` environment variable:

```sh
uvicorn main:app --host 0.0.0.0 --port $PORT
```

The API exposes `GET /health` for the host's health check. The YOLO weights
(`yolov8n.pt`) must be included in this directory; the classifier loads them
relative to its source file.

For a separately hosted frontend, set the frontend build environment variable
`VITE_API_BASE_URL` to the public HTTPS base URL of this API (for example,
`https://your-api-host.example`), then rebuild and redeploy the frontend. Do
not include `/api` at the end of the value. If the frontend and API share a
domain behind a reverse proxy, the variable may be left unset so API requests
use the frontend origin.

For local development, the frontend defaults to `http://127.0.0.1:8000`.

Field reports are Drishti-generated informational documents, not government
certificates or digital signatures. They include SHA-256 checksums for the
submitted image and canonical report data; checksums can detect changes when
compared with a trusted copy but do not prove who captured or signed a record.
The browser-side image sharpness and exposure checks are heuristic screening
only. A verified micro-watershed boundary and hardware-backed GPS attestation
are not currently configured.
