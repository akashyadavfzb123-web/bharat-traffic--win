"""Schemas for What-If simulation API."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ── Supported scenario types ─────────────────────────────────────────

class ScenarioType(str, Enum):
    ACCIDENT = "accident"
    ROAD_CLOSURE = "road_closure"
    HEAVY_RAIN = "heavy_rain"
    FESTIVAL = "festival"
    TRAFFIC_SURGE = "traffic_surge"
    SIGNAL_FAILURE = "signal_failure"
    VIP_MOVEMENT = "vip_movement"


# ── Request schemas ───────────────────────────────────────────────────

class SimulationCreate(BaseModel):
    """Create a new What-If simulation."""
    city_id: int
    name: str = Field(..., min_length=1, max_length=255)
    scenario_type: ScenarioType
    parameters: dict | None = None  # scenario-specific params (road_id, intersection_id, etc.)


# ── Response schemas ──────────────────────────────────────────────────

class SimulationOut(BaseModel):
    """A stored simulation record."""
    id: int
    city_id: int
    user_id: int | None
    name: str
    scenario_type: str
    status: str
    parameters: dict | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime | None

    model_config = {"from_attributes": True}


class RoadSimResult(BaseModel):
    """Simulation result for a single road."""
    road_id: int
    road_name: str
    original_speed_kmph: float
    simulated_speed_kmph: float
    original_vehicles: int
    simulated_vehicles: int
    original_congestion: str
    simulated_congestion: str
    queue_change_pct: float
    travel_time_change_pct: float


class SimulationSummary(BaseModel):
    """High-level summary of simulation results."""
    total_roads_affected: int
    avg_speed_change_pct: float
    total_vehicles_impacted: int
    worst_road_name: str
    worst_speed_reduction_pct: float
    scenario_description: str


class SimulationResultOut(BaseModel):
    """Full simulation output with results."""
    simulation: SimulationOut
    summary: SimulationSummary
    road_results: list[RoadSimResult]

    model_config = {"from_attributes": True}
