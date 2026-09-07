from __future__ import annotations

import os
from math import atan2, cos, radians, sin, sqrt
from typing import Any, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="REBUILD AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("REBUILD_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample resource points for the Recovery Map (Mumbai area).
MAP_RESOURCES = {
    "hospitals": [
        {"id": "h1", "name": "City Emergency Hospital", "lat": 19.076, "lng": 72.8777},
        {"id": "h2", "name": "Harbor Trauma Center", "lat": 19.0544, "lng": 72.8405},
    ],
    "aidCenters": [
        {"id": "a1", "name": "Relief Aid Center", "lat": 19.0896, "lng": 72.8656},
        {"id": "a2", "name": "Community Aid Hub", "lat": 19.0596, "lng": 72.8295},
    ],
    "waterPoints": [
        {"id": "w1", "name": "Water Distribution Point A", "lat": 19.0825, "lng": 72.881},
        {"id": "w2", "name": "Water Distribution Point B", "lat": 19.046, "lng": 72.86},
    ],
}


class PriorityInput(BaseModel):
    members: Any = 0
    injuredMembers: Any = 0
    missingMembers: Any = 0
    houseCondition: Optional[str] = None
    foodNeed: Any = False
    waterNeed: Any = False
    shelterNeed: Any = False
    medicalNeed: Any = False


class ShelterItem(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    capacity: int = 0
    occupied: int = 0
    amenities: list[str] = Field(default_factory=list)
    city: Optional[str] = None


class FamilyMatchInput(BaseModel):
    members: Any = 1
    injuredMembers: Any = 0
    missingMembers: Any = 0
    houseCondition: Optional[str] = None
    foodNeed: Any = False
    waterNeed: Any = False
    shelterNeed: Any = True
    medicalNeed: Any = False
    lat: Optional[float] = None
    lng: Optional[float] = None
    city: Optional[str] = None


class ShelterMatchInput(BaseModel):
    family: FamilyMatchInput
    shelters: list[ShelterItem] = Field(default_factory=list)


class FamilySnapshot(BaseModel):
    members: Any = 0
    injuredMembers: Any = 0
    missingMembers: Any = 0
    houseCondition: Optional[str] = None
    foodNeed: Any = False
    waterNeed: Any = False
    shelterNeed: Any = False
    medicalNeed: Any = False
    status: Optional[str] = None
    sheltered: Any = False


class BottleneckInput(BaseModel):
    families: list[FamilySnapshot] = Field(default_factory=list)
    shelters: list[ShelterItem] = Field(default_factory=list)


def _truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value > 0
    if isinstance(value, str):
        return value.strip().lower() in {"true", "yes", "1", "need", "needed"}
    if isinstance(value, (list, tuple, set, dict)):
        return len(value) > 0
    return False


def _count(value: Any, status: Optional[str] = None) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str) and value.strip().isdigit():
        return int(value.strip())
    if isinstance(value, list):
        if status:
            return sum(
                1
                for item in value
                if str(_member_status(item)).lower() == status
            )
        return len(value)
    return 0


def _member_status(item: Any) -> str:
    if isinstance(item, dict):
        return str(item.get("status") or "")
    return ""


def _severe_damage(house_condition: Optional[str]) -> bool:
    text = (house_condition or "").strip().lower()
    return text in {"destroyed", "severe", "severe damage", "collapsed", "uninhabitable"}


def _people_count(members: Any) -> int:
    count = _count(members)
    return count if count > 0 else 1


def _priority_label(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


def _derive_counts(payload: Any) -> tuple[int, int]:
    missing = _count(getattr(payload, "missingMembers", 0))
    injured = _count(getattr(payload, "injuredMembers", 0))
    members = getattr(payload, "members", 0)
    if missing == 0:
        missing = _count(members, "missing")
    if injured == 0:
        injured = _count(members, "injured")
    return missing, injured


def calculate_priority(payload: Any) -> dict:
    missing, injured = _derive_counts(payload)
    score = 0
    if missing > 0:
        score += 30
    if injured > 0:
        score += 25
    if _truthy(payload.medicalNeed):
        score += 25
    if _truthy(payload.shelterNeed):
        score += 20
    if _severe_damage(payload.houseCondition):
        score += 20
    if _truthy(payload.foodNeed):
        score += 10
    if _truthy(payload.waterNeed):
        score += 10
    score = max(0, min(100, score))
    return {"score": score, "priority": _priority_label(score)}


def calculate_risk(payload: Any) -> dict:
    result = calculate_priority(payload)
    missing, injured = _derive_counts(payload)
    sheltered = _truthy(getattr(payload, "sheltered", False)) or (
        str(getattr(payload, "status", "") or "").lower() in {"sheltered", "reunited", "resolved"}
    )
    risk_score = result["score"]
    factors = []
    if missing > 0:
        factors.append("missing person")
    if injured > 0:
        factors.append("injured member")
    if _truthy(payload.medicalNeed):
        factors.append("medical need")
    if _severe_damage(payload.houseCondition):
        factors.append("severe housing damage")
        if not sheltered:
            risk_score = min(100, risk_score + 10)
            factors.append("unsheltered after severe damage")
    if _truthy(payload.shelterNeed) and not sheltered:
        factors.append("no shelter")
    if _truthy(payload.foodNeed):
        factors.append("food shortage")
    if _truthy(payload.waterNeed):
        factors.append("water shortage")
    if sheltered and risk_score >= 10:
        risk_score -= 10
        factors.append("currently sheltered")
    risk_score = max(0, min(100, risk_score))
    if risk_score >= 70:
        risk = "HIGH"
    elif risk_score >= 40:
        risk = "MEDIUM"
    else:
        risk = "LOW"
    return {
        "riskScore": risk_score,
        "risk": risk,
        "priorityScore": result["score"],
        "priority": result["priority"],
        "factors": factors,
    }


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lng / 2) ** 2
    return r * 2 * atan2(sqrt(a), sqrt(1 - a))


def match_shelters(family: FamilyMatchInput, shelters: list[ShelterItem]) -> dict:
    people = _people_count(family.members)
    ranked = []
    for shelter in shelters:
        available = max(0, shelter.capacity - shelter.occupied)
        if available < people:
            continue
        distance = None
        if None not in (family.lat, family.lng, shelter.lat, shelter.lng):
            distance = round(haversine_km(family.lat, family.lng, shelter.lat, shelter.lng), 2)
        amenities = [str(item).lower() for item in shelter.amenities]
        suitable = True
        reasons = [f"{available} spaces available"]
        if _truthy(family.medicalNeed):
            if any(token in amenities for token in ("medical", "clinic", "first-aid", "first aid")):
                reasons.append("medical support on site")
            else:
                suitable = False
                reasons.append("no medical amenity")
        if family.city and shelter.city and family.city.strip().lower() == shelter.city.strip().lower():
            reasons.append("same city")
        if distance is not None:
            reasons.append(f"{distance} km away")
        # Prefer nearby + suitable: lower sort key is better.
        distance_key = distance if distance is not None else 10_000
        suitable_key = 0 if suitable else 1
        ranked.append(
            {
                "shelterId": shelter.id,
                "name": shelter.name,
                "available": available,
                "capacity": shelter.capacity,
                "occupied": shelter.occupied,
                "distanceKm": distance,
                "suitable": suitable,
                "reason": "; ".join(reasons),
                "_sort": (suitable_key, distance_key, -available),
            }
        )
    ranked.sort(key=lambda item: item["_sort"])
    matches = [{k: v for k, v in item.items() if k != "_sort"} for item in ranked]
    selected = next((match for match in matches if match["suitable"]), None)
    return {
        "people": people,
        "selected": selected,
        "matches": matches,
    }


@app.get("/health")
def health():
    return {"ok": True, "service": "rebuild-ai"}


@app.post("/ai/priority")
def ai_priority(payload: PriorityInput):
    return calculate_priority(payload)


@app.post("/ai/risk")
def ai_risk(payload: FamilySnapshot):
    return calculate_risk(payload)


@app.post("/ai/bottlenecks")
def ai_bottlenecks(payload: BottleneckInput):
    families = payload.families
    shelters = payload.shelters
    total_people = sum(_people_count(family.members) for family in families)
    shelter_need_people = sum(
        _people_count(family.members)
        for family in families
        if _truthy(family.shelterNeed)
        and not _truthy(family.sheltered)
        and str(family.status or "").lower() not in {"sheltered", "reunited", "resolved"}
    )
    open_beds = sum(max(0, s.capacity - s.occupied) for s in shelters)
    food_need = sum(1 for family in families if _truthy(family.foodNeed))
    water_need = sum(1 for family in families if _truthy(family.waterNeed))
    medical_need = sum(1 for family in families if _truthy(family.medicalNeed))
    missing_cases = sum(1 for family in families if _derive_counts(family)[0] > 0)

    bottlenecks = []

    shelter_gap = max(0, shelter_need_people - open_beds)
    if shelter_gap > 0:
        severity = "CRITICAL" if shelter_gap >= 20 or open_beds == 0 else "HIGH"
        bottlenecks.append(
            {
                "type": "shelter",
                "severity": severity,
                "gap": shelter_gap,
                "message": f"{shelter_need_people} people need shelter; {open_beds} beds open.",
            }
        )

    if food_need >= max(3, len(families) * 0.4 if families else 3):
        bottlenecks.append(
            {
                "type": "food",
                "severity": "HIGH" if food_need >= 8 else "MEDIUM",
                "gap": food_need,
                "message": f"{food_need} families report no food.",
            }
        )

    if water_need >= max(3, len(families) * 0.4 if families else 3):
        bottlenecks.append(
            {
                "type": "water",
                "severity": "HIGH" if water_need >= 8 else "MEDIUM",
                "gap": water_need,
                "message": f"{water_need} families report no water.",
            }
        )

    if medical_need >= 3:
        bottlenecks.append(
            {
                "type": "medical",
                "severity": "CRITICAL" if medical_need >= 6 else "HIGH",
                "gap": medical_need,
                "message": f"{medical_need} families need medical care.",
            }
        )

    if missing_cases >= 2:
        bottlenecks.append(
            {
                "type": "search",
                "severity": "CRITICAL",
                "gap": missing_cases,
                "message": f"{missing_cases} families have a missing person.",
            }
        )

    return {
        "totals": {
            "families": len(families),
            "people": total_people,
            "openBeds": open_beds,
            "shelterNeedPeople": shelter_need_people,
            "foodNeed": food_need,
            "waterNeed": water_need,
            "medicalNeed": medical_need,
        },
        "bottlenecks": bottlenecks,
    }


@app.post("/ai/shelter-match")
def ai_shelter_match(payload: ShelterMatchInput):
    return match_shelters(payload.family, payload.shelters)


@app.get("/ai/map-resources")
def ai_map_resources():
    return MAP_RESOURCES


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
