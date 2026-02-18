.PHONY: dev infra up down logs clean

# Start infrastructure only (Postgres, Redis, Qdrant)
infra:
	docker-compose up -d postgres redis qdrant

# Start all services with Docker
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Dev mode: start infra + run services locally with hot reload
dev: infra
	@echo "Infrastructure started. Now run each service:"
	@echo "  Terminal 1: cd server && pnpm dev"
	@echo "  Terminal 2: cd rag-server && uvicorn src.main:app --reload --port 8001"
	@echo "  Terminal 3: cd voice-agent && python -m src.agent start"
	@echo "  Terminal 4: cd client && pnpm dev"

# Clean volumes
clean:
	docker-compose down -v
	rm -rf client/node_modules server/node_modules
