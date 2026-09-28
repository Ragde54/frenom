from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from app.data_loader import search_names, get_name_time_series, get_top_names

app = FastAPI(
    title="French Name Frequency API",
    description="High-performance API powered by DuckDB for 1900-2025 French name frequencies",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "French Historical Name Frequency API (1900-2025)",
        "docs": "/docs"
    }

@app.get("/api/search")
def api_search_names(
    q: str = Query(..., min_length=1, description="Search term for baby name"),
    sexe: Optional[str] = Query(None, description="Gender filter: 1=Male, 2=Female"),
    limit: int = Query(15, ge=1, le=100)
):
    results = search_names(query=q, sexe=sexe, limit=limit)
    return {"query": q, "count": len(results), "results": results}

@app.get("/api/names/stats")
def api_name_stats(
    names: str = Query(..., description="Comma-separated list of names e.g. GABRIEL,NOAH"),
    sexe: Optional[str] = Query(None, description="Gender filter: 1=Male, 2=Female"),
    geo: str = Query("FRANCE", description="Geographic level: FRANCE, REG, DEP")
):
    name_list = [n.strip() for n in names.split(",") if n.strip()]
    data = get_name_time_series(names=name_list, sexe=sexe, geo_level=geo)
    return {"names": name_list, "sexe": sexe, "geo": geo, "data": data}

@app.get("/api/rankings/top")
def api_top_names(
    year: int = Query(2025, ge=1900, le=2025),
    sexe: str = Query("1", description="1=Male, 2=Female"),
    limit: int = Query(50, ge=1, le=100)
):
    rankings = get_top_names(year=year, sexe=sexe, limit=limit)
    return {"year": year, "sexe": sexe, "rankings": rankings}
