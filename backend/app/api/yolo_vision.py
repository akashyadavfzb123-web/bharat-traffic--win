"""YOLO Vision API — camera feeds, vehicle detection, and traffic density."""

import random
import time
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/yolo", tags=["yolo-vision"])


# ── Models ──


class CameraFeed(BaseModel):
    id: str
    name: str
    location: str
    status: str  # online | offline
    resolution: str
    fps: float
    last_frame_time: str


class VehicleDetection(BaseModel):
    id: str
    type: str  # car, bus, truck, bike, auto, bicycle, person
    confidence: float
    x: float
    y: float
    width: float
    height: float


class VehicleCount(BaseModel):
    type: str
    count: int
    percentage: float
    trend: str  # up | down | stable


class YoloSnapshot(BaseModel):
    timestamp: str
    camera_id: str
    camera_name: str
    camera_status: str
    fps: float
    confidence: float
    total_vehicles: int
    vehicle_counts: list[VehicleCount]
    traffic_density: float
    queue_length: float
    detections: list[VehicleDetection]


class Alert(BaseModel):
    id: str
    type: str  # critical | warning | info | success
    title: str
    message: str
    timestamp: str


# ── Mock Data ──


MOCK_CAMERAS = [
    CameraFeed(
        id="cam-01",
        name="ITO Flyover Cam - 01",
        location="ITO, Delhi",
        status="online",
        resolution="1280x720",
        fps=22.4,
        last_frame_time=datetime.now().isoformat(),
    ),
    CameraFeed(
        id="cam-02",
        name="Connaught Place Cam - 02",
        location="CP, Delhi",
        status="online",
        resolution="1920x1080",
        fps=24.0,
        last_frame_time=datetime.now().isoformat(),
    ),
    CameraFeed(
        id="cam-03",
        name="AIIMS Junction Cam - 03",
        location="AIIMS, Delhi",
        status="offline",
        resolution="1280x720",
        fps=0.0,
        last_frame_time="",
    ),
    CameraFeed(
        id="cam-04",
        name="Chandni Chowk Cam - 04",
        location="Chandni Chowk, Delhi",
        status="online",
        resolution="1280x720",
        fps=20.1,
        last_frame_time=datetime.now().isoformat(),
    ),
]


def _generate_detections(count: int) -> list[VehicleDetection]:
    types = ["car", "bus", "truck", "bike", "auto", "bicycle", "person"]
    return [
        VehicleDetection(
            id=f"det-{i}",
            type=random.choice(types),
            confidence=round(random.uniform(0.70, 0.99), 2),
            x=round(random.uniform(0, 800), 1),
            y=round(random.uniform(0, 400), 1),
            width=round(random.uniform(40, 100), 1),
            height=round(random.uniform(30, 70), 1),
        )
        for i in range(count)
    ]


def _generate_snapshot(camera_id: str) -> YoloSnapshot:
    camera = next((c for c in MOCK_CAMERAS if c.id == camera_id), MOCK_CAMERAS[0])
    total = random.randint(55, 90)
    cars = int(total * random.uniform(0.50, 0.65))
    bikes = int(total * random.uniform(0.18, 0.30))
    buses = int(total * random.uniform(0.04, 0.10))
    trucks = total - cars - bikes - buses

    return YoloSnapshot(
        timestamp=datetime.now().isoformat(),
        camera_id=camera.id,
        camera_name=camera.name,
        camera_status=camera.status,
        fps=round(random.uniform(18.0, 28.0), 1),
        confidence=round(random.uniform(85.0, 98.0), 1),
        total_vehicles=total,
        vehicle_counts=[
            VehicleCount(type="Cars", count=cars, percentage=round(cars / total * 100, 1), trend=random.choice(["up", "down", "stable"])),
            VehicleCount(type="Bikes", count=bikes, percentage=round(bikes / total * 100, 1), trend=random.choice(["up", "down", "stable"])),
            VehicleCount(type="Buses", count=buses, percentage=round(buses / total * 100, 1), trend=random.choice(["up", "down", "stable"])),
            VehicleCount(type="Trucks", count=trucks, percentage=round(trucks / total * 100, 1), trend=random.choice(["up", "down", "stable"])),
        ],
        traffic_density=round(random.uniform(45, 95), 1),
        queue_length=round(random.uniform(80, 250), 0),
        detections=_generate_detections(random.randint(8, 20)),
    )


def _generate_alerts() -> list[Alert]:
    now = datetime.now()
    return [
        Alert(id="1", type="critical", title="High congestion detected", message="Density above 75% at ITO Flyover", timestamp=now.strftime("%H:%M:%S")),
        Alert(id="2", type="warning", title="Queue length increasing", message="Queue length 186m and growing", timestamp=now.strftime("%H:%M:%S")),
        Alert(id="3", type="info", title="Heavy truck detected", message="High truck count: 7", timestamp=now.strftime("%H:%M:%S")),
        Alert(id="4", type="success", title="Camera quality good", message="Detection confidence stable at 92%", timestamp=now.strftime("%H:%M:%S")),
    ]


# ── Endpoints ──


@router.get("/cameras", response_model=list[CameraFeed])
async def list_cameras():
    """List all available camera feeds."""
    return MOCK_CAMERAS


@router.get("/cameras/{camera_id}", response_model=CameraFeed)
async def get_camera(camera_id: str):
    """Get a specific camera feed."""
    camera = next((c for c in MOCK_CAMERAS if c.id == camera_id), None)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera


@router.get("/snapshot", response_model=YoloSnapshot)
async def get_snapshot(camera_id: str = Query(default="cam-01", description="Camera ID")):
    """Get a YOLO detection snapshot for a camera."""
    return _generate_snapshot(camera_id)


@router.get("/alerts", response_model=list[Alert])
async def get_alerts():
    """Get YOLO Vision alerts and events."""
    return _generate_alerts()


@router.get("/density-trend")
async def get_density_trend(camera_id: str = Query(default="cam-01")):
    """Get traffic density trend data for a camera."""
    now = datetime.now()
    points = []
    for i in range(12):
        hour = (now.hour - 2 + i // 4) % 24
        minute = (i % 4) * 15
        points.append({
            "time": f"{hour:02d}:{minute:02d}:00",
            "density": round(random.uniform(40, 90), 1),
            "queue": round(random.uniform(80, 220), 0),
        })
    return points


@router.get("/model-info")
async def get_model_info():
    """Get YOLO model information."""
    return {
        "model": "YOLOv8n",
        "dataset": "COCO + Custom Traffic",
        "last_updated": "2025-09-03T20:18:00",
        "inference_device": "Edge GPU (RTX 3050)",
        "input_size": 640,
        "classes": ["car", "bus", "truck", "bike", "auto", "bicycle", "person"],
    }
