# 🇫🇷 Frénom — Historical French Name Frequency Explorer (1900–2025)

An interactive, high-performance web application to search, visualize, and compare baby names given in France over more than a century (1900–2025).

---

## 🚀 Quick Start (Makefile)

A [`Makefile`](Makefile) is provided for fast, simple commands:

| Command | Description |
| :--- | :--- |
| `make install` | Install backend dependencies with `uv` and frontend with `npm` |
| `make dev-backend` | Run FastAPI backend locally (`http://localhost:8000`) |
| `make dev-frontend` | Run Vite React frontend locally (`http://localhost:3000`) |
| `make docker-up` | Build and launch full stack via Docker Compose |
| `make docker-down` | Stop Docker Compose containers |
| `make docker-logs` | Stream live Docker Compose logs |
| `make clean` | Clean build artifacts, `.venv`, and `node_modules` |

---

## ⚡ Tech Stack

- **Backend**: FastAPI + DuckDB (sub-10ms queries over 6.6M Parquet rows)
- **Package Manager**: [`uv`](https://github.com/astral-sh/uv) (fast Python environment management)
- **Frontend**: Vite + React 18 + Chart.js + Lucide Icons
- **Containerization**: Multi-stage Docker + Docker Compose

---

## 📊 Dataset Summary

The application queries `prenoms-2025.parquet`, containing **6,622,949 records**:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `sexe` | String | `1` (Male) / `2` (Female) |
| `prenom` | String | Uppercase name (e.g. `GABRIEL`, `LÉO`, `MAËL`, `MARIE`) |
| `periode` | String | Year (`1900` to `2025`) |
| `niveau_geographique` | String | `FRANCE` (National), `REG` (Region), `DEP` (Department) |
| `geographie` | String | Geographic code (`F` for National, or department code e.g. `75`) |
| `valeur` | Int32 | Total number of births for that name, gender, year & location |
| `rang` | Int32 | Popularity rank for that year & location |

---

## 📁 Directory Structure

```
frenom/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI server & route handlers
│   │   └── data_loader.py    # Sub-10ms Parquet querying using DuckDB
│   ├── pyproject.toml        # Backend dependencies & uv setup
│   └── Dockerfile            # Container build using uv
├── frontend/
│   ├── src/
│   │   ├── components/       # Chart, SearchBar, GenderFilter, StatsCards
│   │   ├── App.jsx           # Main UI dashboard with Chart.js
│   │   ├── index.css         # Glassmorphism dark theme design system
│   │   └── main.jsx          # React DOM entrypoint
│   ├── index.html
│   ├── package.json          # React, Chart.js, Lucide icons
│   ├── vite.config.js        # Vite build & API proxy setup
│   ├── nginx.conf            # Nginx config for Docker
│   └── Dockerfile            # Multi-stage production container
├── docker-compose.yml        # Docker Compose configuration
├── Makefile                  # Simple build & run shortcuts
├── prenoms-2025.parquet      # Core historical dataset (6.62M rows)
└── README.md
```
