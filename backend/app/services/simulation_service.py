"""SimulationService — deterministic What-If simulation engine.

Supports seven scenario types with deterministic impact models:

  • accident          — localized blockage on a road
  • road_closure      — full closure, traffic diverted
  • heavy_rain        — city-wide speed reduction
  • festival          — area-specific traffic surge
  • traffic_surge     — city-wide volume increase
  • signal_failure    — intersection-level breakdown
  • vip_movement      — corridor-level diversion

SUMO integration will replace this in future stages.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.intersection import Intersection
from app.models.road import Road
from app.models.simulation import Simulation
from app.models.simulation_result import SimulationResult
from app.models.traffic_record import TrafficRecord

# Congestion severity ordered least → most severe
_CONGESTION_ORDER = ["free_flow", "moderate", "slow", "congested", "gridlock"]


def _congestion_rank(level: str) -> int:
    try:
        return _CONGESTION_ORDER.index(level)
    except ValueError:
        return -1


def _shift_congestion(level: str, steps: int) -> str:
    idx = _congestion_rank(level)
    if idx < 0:
        return level
    return _CONGESTION_ORDER[min(max(idx + steps, 0), len(_CONGESTION_ORDER) - 1)]


def _latest_record(db: Session, road_id: int) -> TrafficRecord | None:
    return db.scalar(
        select(TrafficRecord)
        .where(TrafficRecord.road_id == road_id)
        .order_by(TrafficRecord.timestamp.desc())
        .limit(1)
    )


def _scenario_impact(scenario_type: str, params: dict | None) -> dict:
    """Return deterministic impact factors for a scenario type.

    Returns a dict with keys:
      speed_factor    — multiplier on original speed (0–1)
      vehicle_factor  — multiplier on vehicle count
      congestion_shift — integer shift on congestion level
      description     — human-readable scenario description
    """
    p = params or {}

    if scenario_type == "accident":
        return {
            "speed_factor": 0.40,
            "vehicle_factor": 1.20,
            "congestion_shift": 2,
            "description": p.get("description", "Road accident causing localized blockage"),
            "scope": "single_road",
        }

    if scenario_type == "road_closure":
        return {
            "speed_factor": 0.0,  # closed road
            "vehicle_factor": 0.0,  # no vehicles on closed road
            "congestion_shift": 3,
            "description": p.get("description", "Road closure — all traffic diverted"),
            "scope": "single_road",
            "diversion_factor": 1.30,  # nearby roads get 30% more traffic
        }

    if scenario_type == "heavy_rain":
        return {
            "speed_factor": 0.70,
            "vehicle_factor": 0.90,  # fewer people drive in heavy rain
            "congestion_shift": 1,
            "description": p.get("description", "Heavy rain — city-wide speed reduction"),
            "scope": "city",
        }

    if scenario_type == "festival":
        return {
            "speed_factor": 0.75,
            "vehicle_factor": 1.50,
            "congestion_shift": 1,
            "description": p.get("description", "Festival — area traffic surge"),
            "scope": "area",
        }

    if scenario_type == "traffic_surge":
        return {
            "speed_factor": 0.65,
            "vehicle_factor": 1.40,
            "congestion_shift": 2,
            "description": p.get("description", "Traffic surge — demand exceeds capacity"),
            "scope": "city",
        }

    if scenario_type == "signal_failure":
        return {
            "speed_factor": 0.30,
            "vehicle_factor": 1.10,
            "congestion_shift": 3,
            "description": p.get("description", "Signal failure at intersection"),
            "scope": "intersection",
        }

    if scenario_type == "vip_movement":
        return {
            "speed_factor": 0.85,
            "vehicle_factor": 1.10,
            "congestion_shift": 1,
            "description": p.get("description", "VIP movement — corridor diversion"),
            "scope": "corridor",
        }

    # Default / unknown scenario
    return {
        "speed_factor": 0.80,
        "vehicle_factor": 1.10,
        "congestion_shift": 1,
        "description": p.get("description", "Unknown scenario"),
        "scope": "city",
    }


def _simulate_road(road: Road, impact: dict, record: TrafficRecord | None, scenario_type: str, params: dict | None) -> dict:
    """Build a deterministic simulation result dict for one road."""
    p = params or {}

    if record is None:
        original_speed = 30.0
        original_vehicles = 50
        original_congestion = "moderate"
    else:
        original_speed = record.avg_speed_kmph
        original_vehicles = record.vehicle_count
        original_congestion = record.congestion_level

    scope = impact["scope"]

    # Determine if this road is affected
    affected = True
    target_road_id = p.get("road_id")
    target_intersection_id = p.get("intersection_id")

    if scope == "single_road" and target_road_id is not None:
        affected = road.id == target_road_id
    elif scope == "intersection" and target_intersection_id is not None:
        # Check if road connects to the target intersection
        affected = any(ix.id == target_intersection_id for ix in road.intersections)
    elif scope == "corridor" and target_road_id is not None:
        # Corridor affects roads sharing the same corridor
        target_road = p.get("road_id")
        affected = road.corridor_id is not None and road.corridor_id == (
            _get_road_corridor(road, target_road) if target_road else None
        )

    if not affected:
        # Road not in scope — no change
        return {
            "road_id": road.id,
            "road_name": road.name,
            "original_speed_kmph": original_speed,
            "simulated_speed_kmph": original_speed,
            "original_vehicles": original_vehicles,
            "simulated_vehicles": original_vehicles,
            "original_congestion": original_congestion,
            "simulated_congestion": original_congestion,
            "queue_change_pct": 0.0,
            "travel_time_change_pct": 0.0,
        }

    # Apply impact
    sf = impact["speed_factor"]
    vf = impact["vehicle_factor"]

    # Road closure special case: if this IS the closed road
    if scenario_type == "road_closure" and target_road_id is not None and road.id == target_road_id:
        simulated_speed = 0.0
        simulated_vehicles = 0
    else:
        simulated_speed = round(original_speed * sf, 1)
        simulated_vehicles = int(original_vehicles * vf)

    simulated_congestion = _shift_congestion(original_congestion, impact["congestion_shift"])

    # Queue change: inverse of speed change
    if original_speed > 0:
        speed_change_pct = ((simulated_speed - original_speed) / original_speed) * 100
    else:
        speed_change_pct = 0.0
    queue_change_pct = round(-speed_change_pct * 2.5, 1)  # queue grows as speed drops
    travel_time_change_pct = round(-speed_change_pct, 1) if original_speed > 0 else 0.0

    return {
        "road_id": road.id,
        "road_name": road.name,
        "original_speed_kmph": original_speed,
        "simulated_speed_kmph": simulated_speed,
        "original_vehicles": original_vehicles,
        "simulated_vehicles": simulated_vehicles,
        "original_congestion": original_congestion,
        "simulated_congestion": simulated_congestion,
        "queue_change_pct": queue_change_pct,
        "travel_time_change_pct": travel_time_change_pct,
    }


def _get_road_corridor(road: Road, target_road_id: int | None) -> int | None:
    """Get corridor_id of the target road."""
    # This is only called when we need to find which corridor a reference road belongs to.
    # In practice the params already have the info; this is a fallback.
    return road.corridor_id


# ── Public service functions ──────────────────────────────────────────

def create_simulation(
    db: Session,
    *,
    city_id: int,
    user_id: int,
    name: str,
    scenario_type: str,
    parameters: dict | None = None,
) -> Simulation:
    """Create and run a deterministic What-If simulation.

    Returns the completed Simulation record with results persisted.
    """
    sim = Simulation(
        city_id=city_id,
        user_id=user_id,
        name=name,
        scenario_type=scenario_type,
        parameters=parameters,
        status="running",
        started_at=datetime.now(timezone.utc),
    )
    db.add(sim)
    db.flush()  # get sim.id

    # Get impact factors
    impact = _scenario_impact(scenario_type, parameters)

    # Get all roads in the city
    roads = db.scalars(
        select(Road).where(Road.city_id == city_id)
    ).all()

    # Simulate each road
    road_results = []
    for road in roads:
        record = _latest_record(db, road.id)
        result_dict = _simulate_road(road, impact, record, scenario_type, parameters)

        db.add(SimulationResult(
            simulation_id=sim.id,
            road_id=road.id,
            avg_speed_kmph=result_dict["simulated_speed_kmph"],
            avg_travel_time_seconds=round(3600 / max(result_dict["simulated_speed_kmph"], 0.1), 1) if result_dict["simulated_speed_kmph"] > 0 else None,
            total_vehicles=result_dict["simulated_vehicles"],
            max_queue_length=int(abs(result_dict["queue_change_pct"]) / 5),
            metrics={
                "original_speed_kmph": result_dict["original_speed_kmph"],
                "original_vehicles": result_dict["original_vehicles"],
                "original_congestion": result_dict["original_congestion"],
                "simulated_congestion": result_dict["simulated_congestion"],
                "queue_change_pct": result_dict["queue_change_pct"],
                "travel_time_change_pct": result_dict["travel_time_change_pct"],
            },
        ))
        road_results.append(result_dict)

    # Mark completed
    sim.status = "completed"
    sim.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(sim)

    return sim


def get_simulation_by_id(db: Session, simulation_id: int) -> Simulation | None:
    """Retrieve a simulation by ID."""
    return db.get(Simulation, simulation_id)


def get_simulation_results(db: Session, simulation_id: int) -> list[SimulationResult]:
    """Retrieve all road results for a simulation."""
    return list(
        db.scalars(
            select(SimulationResult)
            .where(SimulationResult.simulation_id == simulation_id)
            .order_by(SimulationResult.road_id)
        ).all()
    )


def build_simulation_output(db: Session, sim: Simulation) -> dict:
    """Build full output dict for a completed simulation."""
    results = get_simulation_results(db, sim.id)

    # Build road result list
    road_results = []
    total_original_vehicles = 0
    total_simulated_vehicles = 0
    speed_changes = []
    worst_name = ""
    worst_reduction = 0.0

    for r in results:
        m = r.metrics or {}
        original_speed = m.get("original_speed_kmph", 30.0)
        original_vehicles = m.get("original_vehicles", 0)
        original_congestion = m.get("original_congestion", "moderate")
        simulated_congestion = m.get("simulated_congestion", "moderate")

        total_original_vehicles += original_vehicles
        total_simulated_vehicles += r.total_vehicles or 0

        if original_speed > 0:
            speed_change_pct = ((r.avg_speed_kmph - original_speed) / original_speed) * 100
        else:
            speed_change_pct = 0.0
        speed_changes.append(speed_change_pct)

        if speed_change_pct < worst_reduction:
            worst_reduction = speed_change_pct
            worst_name = r.road.name if r.road else f"Road #{r.road_id}"

        road_results.append({
            "road_id": r.road_id,
            "road_name": r.road.name if r.road else f"Road #{r.road_id}",
            "original_speed_kmph": original_speed,
            "simulated_speed_kmph": r.avg_speed_kmph or 0.0,
            "original_vehicles": original_vehicles,
            "simulated_vehicles": r.total_vehicles or 0,
            "original_congestion": original_congestion,
            "simulated_congestion": simulated_congestion,
            "queue_change_pct": m.get("queue_change_pct", 0.0),
            "travel_time_change_pct": m.get("travel_time_change_pct", 0.0),
        })

    avg_speed_change = round(sum(speed_changes) / len(speed_changes), 1) if speed_changes else 0.0

    scenario_desc = _scenario_impact(sim.scenario_type, sim.parameters)["description"]

    return {
        "simulation": sim,
        "summary": {
            "total_roads_affected": len(results),
            "avg_speed_change_pct": avg_speed_change,
            "total_vehicles_impacted": total_simulated_vehicles,
            "worst_road_name": worst_name,
            "worst_speed_reduction_pct": round(worst_reduction, 1),
            "scenario_description": scenario_desc,
        },
        "road_results": road_results,
    }


def list_simulations(
    db: Session,
    city_id: int | None = None,
    user_id: int | None = None,
) -> list[Simulation]:
    """List simulations with optional filters."""
    q = select(Simulation)
    if city_id is not None:
        q = q.where(Simulation.city_id == city_id)
    if user_id is not None:
        q = q.where(Simulation.user_id == user_id)
    q = q.order_by(Simulation.created_at.desc())
    return list(db.scalars(q).all())
