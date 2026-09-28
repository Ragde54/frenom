.PHONY: help install dev dev-backend dev-frontend docker-up docker-down docker-logs clean

# Default command showing available targets
help:
	@echo "======================================================================"
	@echo " 🇫🇷 French Name Frequency Explorer - Makefile Commands"
	@echo "======================================================================"
	@echo "  make install        - Install backend (uv) and frontend (npm) dependencies"
	@echo "  make dev-backend    - Run FastAPI backend locally with uv"
	@echo "  make dev-frontend   - Run Vite frontend dev server locally"
	@echo "  make docker-up      - Build and start full stack in Docker Compose"
	@echo "  make docker-down    - Stop Docker Compose services"
	@echo "  make docker-logs    - View Docker Compose live logs"
	@echo "  make clean          - Remove build caches, node_modules, and .venv"
	@echo "======================================================================"

# Install dependencies for both backend and frontend
install:
	@echo "📦 Installing backend dependencies with uv..."
	@cd backend && uv sync
	@echo "📦 Installing frontend dependencies with npm..."
	@cd frontend && npm install
	@echo "✅ All dependencies installed successfully!"

# Run local FastAPI backend using uv
dev-backend:
	@echo "🚀 Starting FastAPI backend at http://localhost:8000 ..."
	@cd backend && uv run uvicorn app.main:app --reload --port 8000

# Run local Vite frontend
dev-frontend:
	@echo "🚀 Starting Vite frontend at http://localhost:3000 ..."
	@cd frontend && npm run dev

# Run full stack in Docker Compose
docker-up:
	@echo "🐳 Building and starting Docker Compose containers..."
	@docker compose up --build

# Stop Docker Compose
docker-down:
	@echo "🛑 Stopping Docker Compose containers..."
	@docker compose down

# Stream Docker logs
docker-logs:
	@docker compose logs -f

# Clean cached files and dependencies
clean:
	@echo "🧹 Cleaning caches and virtual environments..."
	@rm -rf backend/.venv backend/__pycache__ backend/app/__pycache__
	@rm -rf frontend/node_modules frontend/dist frontend/.vite
	@echo "✨ Clean complete!"
