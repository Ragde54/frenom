import os
import duckdb
from pathlib import Path
from typing import List, Dict, Any, Optional

PARQUET_PATH = os.getenv(
    "PARQUET_PATH",
    str(Path(__file__).resolve().parents[2] / "prenoms-2025.parquet")
)

_conn = None

def get_connection() -> duckdb.DuckDBPyConnection:
    global _conn
    if _conn is None:
        _conn = duckdb.connect(database=":memory:", read_only=False)
        _conn.execute(f"CREATE VIEW IF NOT EXISTS prenoms AS SELECT * FROM '{PARQUET_PATH}'")
    return _conn

def search_names(query: str, sexe: Optional[str] = None, limit: int = 15) -> List[Dict[str, Any]]:
    conn = get_connection()
    clean_query = query.strip().upper()
    
    where_clauses = [
        "prenom LIKE ?",
        "prenom != '_PRENOMS_RARES'",
        "TRY_CAST(periode AS INTEGER) IS NOT NULL"
    ]
    params: list = [f"%{clean_query}%"]
    
    if sexe in ("1", "2"):
        where_clauses.append("sexe = ?")
        params.append(sexe)
        
    where_sql = " WHERE " + " AND ".join(where_clauses)
    
    sql = f"""
        SELECT 
            prenom, 
            sexe, 
            SUM(valeur) as total_births,
            MIN(periode) as first_year,
            MAX(periode) as last_year
        FROM prenoms
        {where_sql}
        GROUP BY prenom, sexe
        ORDER BY total_births DESC
        LIMIT {limit}
    """
    
    result = conn.execute(sql, params).fetchall()
    return [
        {
            "prenom": row[0],
            "sexe": row[1],
            "total_births": int(row[2]),
            "first_year": row[3],
            "last_year": row[4]
        }
        for row in result
    ]

def get_name_time_series(names: List[str], sexe: Optional[str] = None, geo_level: str = "FRANCE") -> List[Dict[str, Any]]:
    conn = get_connection()
    if not names:
        return []
        
    clean_names = [n.strip().upper() for n in names if n.strip()]
    placeholders = ", ".join(["?"] * len(clean_names))
    params: list = list(clean_names)
    
    where_clauses = [
        f"prenom IN ({placeholders})",
        "niveau_geographique = ?",
        "TRY_CAST(periode AS INTEGER) IS NOT NULL"
    ]
    params.append(geo_level)
    
    if sexe in ("1", "2"):
        where_clauses.append("sexe = ?")
        params.append(sexe)
        
    where_sql = " WHERE " + " AND ".join(where_clauses)
    
    sql = f"""
        SELECT 
            prenom,
            sexe,
            CAST(periode AS INTEGER) as year,
            SUM(valeur) as total_births,
            MIN(rang) as rank
        FROM prenoms
        {where_sql}
        GROUP BY prenom, sexe, year
        ORDER BY year ASC
    """
    
    result = conn.execute(sql, params).fetchall()
    return [
        {
            "prenom": row[0],
            "sexe": row[1],
            "year": int(row[2]),
            "births": int(row[3]),
            "rank": int(row[4]) if row[4] is not None else None
        }
        for row in result
    ]

def get_top_names(year: int, sexe: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
    conn = get_connection()
    where_clauses = [
        "periode = ?",
        "niveau_geographique = 'FRANCE'",
        "prenom != '_PRENOMS_RARES'"
    ]
    params: list = [str(year)]
    
    if sexe in ("1", "2"):
        where_clauses.append("sexe = ?")
        params.append(sexe)
        
    where_sql = " WHERE " + " AND ".join(where_clauses)
    
    sql = f"""
        SELECT prenom, sexe, SUM(valeur) as births
        FROM prenoms
        {where_sql}
        GROUP BY prenom, sexe
        ORDER BY births DESC
        LIMIT {limit}
    """
    result = conn.execute(sql, params).fetchall()
    return [
        {
            "rank": idx + 1,
            "prenom": row[0],
            "sexe": row[1],
            "births": int(row[2])
        }
        for idx, row in enumerate(result)
    ]
