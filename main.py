from __future__ import annotations

import tf_keras
from io import BytesIO
from pathlib import Path
from typing import Annotated

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel, Field

try:
    import tensorflow as tf
except ImportError:  # Keep the API error readable before TensorFlow is installed.
    tf = None

ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "keras_model.h5"
LABELS_PATH = ROOT / "labels.txt"
FRONTEND_DIR = ROOT
MAX_FILE_BYTES = 10 * 1024 * 1024
IMAGE_SIZE = (224, 224)
THRESHOLD = 0.70


def read_labels() -> list[str]:
    labels: list[str] = []
    for line in LABELS_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split(maxsplit=1)
        labels.append(parts[1].strip() if len(parts) == 2 else parts[0])
    if len(labels) != 3:
        raise RuntimeError("labels.txt mesti mengandungi tepat tiga kelas.")
    return labels


LABELS = read_labels()
MODEL = None
MODEL_ERROR: str | None = None
if tf is not None:
    try:
        MODEL = tf_keras.models.load_model(MODEL_PATH, compile=False)
    except Exception as exc:  # The health endpoint explains setup issues clearly.
        MODEL_ERROR = f"Model tidak dapat dimuatkan: {exc.__class__.__name__}"
else:
    MODEL_ERROR = "TensorFlow belum dipasang. Gunakan Python 3.11 dan pasang requirements.txt."

app = FastAPI(title="SmartClassify API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class Score(BaseModel):
    label: str
    confidence: float = Field(ge=0.0, le=1.0)


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float = Field(ge=0.0, le=1.0)
    status: str
    scores: list[Score]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    labels: list[str]
    error: str | None = None


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ready" if MODEL is not None else "error",
        model_loaded=MODEL is not None,
        labels=LABELS,
        error=MODEL_ERROR,
    )


def prepare_image(raw: bytes) -> np.ndarray:
    try:
        image = Image.open(BytesIO(raw)).convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=415, detail="Fail bukan imej yang sah.") from exc
    image = ImageOps.fit(image, IMAGE_SIZE, Image.Resampling.LANCZOS)
    array = np.asarray(image, dtype=np.float32)
    return (array / 127.5 - 1.0)[None, ...]


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: Annotated[UploadFile, File(description="Imej JPG, PNG atau WebP")]) -> PredictionResponse:
    if MODEL is None:
        raise HTTPException(status_code=503, detail=MODEL_ERROR or "Model belum sedia digunakan.")
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail="Gunakan fail JPG, PNG atau WebP.")
    raw = await file.read(MAX_FILE_BYTES + 1)
    if len(raw) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="Saiz imej maksimum ialah 10 MB.")
    data = prepare_image(raw)
    try:
        output = np.asarray(MODEL.predict(data, verbose=0))[0].astype(float)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Inferens model gagal.") from exc
    if output.size != len(LABELS) or not np.isfinite(output).all():
        raise HTTPException(status_code=500, detail="Bentuk output model tidak sepadan dengan labels.txt.")
    # Teachable Machine Keras models return one score per label.
    scores = [Score(label=label, confidence=float(np.clip(score, 0.0, 1.0))) for label, score in zip(LABELS, output)]
    top = int(np.argmax(output))
    confidence = scores[top].confidence
    return PredictionResponse(
        prediction=LABELS[top],
        confidence=confidence,
        status="recognized" if confidence >= THRESHOLD else "uncertain",
        scores=scores,
    )


# API routes are declared before this mount. The same Uvicorn process serves the UI.
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
