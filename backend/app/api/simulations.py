"""What-If Simulation API endpoints.

Provides deterministic mock simulation results for seven scenario types:
  accident, road_closure, heavy_rain, festival, traffic_surge,
  signal_failure, vip_movement.

SUMO integration will replace the deterministic engine in future stages.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import AppError
from app.models.user import User
from app.schemas.simulation import (
    SimulationCreate,
    SimulationOut,
    SimulationResultOut,
    SimulationSummary,
    RoadSimResult,
)
from app.services import simulation_service

router = APIRouter(prefix="/api/simulations", tags=["simulations"])


@router.post("", response_model=SimulationResultOut, status_code=201)
def create_simulation(
    body: SimulationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create and run a What-If simulation.

    Executes deterministic mock simulation and returns results immediately.
    The simulation record and per-road results are persisted in the DB.
    """
    sim = simulation_service.create_simulation(
        db,
        city_id=body.city_id,
        user_id=user.id,
        name=body.name,
        scenario_type=body.scenario_type.value,
        parameters=body.parameters,
    )
    output = simulation_service.build_simulation_output(db, sim)
    return output


@router.get("/{simulation_id}", response_model=SimulationOut)
def get_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Retrieve a single simulation by ID."""
    sim = simulation_service.get_simulation_by_id(db, simulation_id)
    if sim is None:
        raise AppError(status_code=404, detail="Simulation not found")
    return sim


@router.get("/{simulation_id}/results", response_model=SimulationResultOut)
def get_simulation_results(
    simulation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Retrieve full simulation results including per-road breakdown."""
    sim = simulation_service.get_simulation_by_id(db, simulation_id)
    if sim is None:
        raise AppError(status_code=404, detail="Simulation not found")
    output = simulation_service.build_simulation_output(db, sim)
    return output
