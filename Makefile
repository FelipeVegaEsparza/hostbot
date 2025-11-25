.PHONY: help install dev build up down logs clean migrate

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies for all services"
	@echo "  make dev        - Start all services in development mode"
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services with Docker Compose"
	@echo "  make down       - Stop all services"
	@echo "  make logs       - View logs from all services"
	@echo "  make clean      - Remove all containers, volumes, and images"
	@echo "  make migrate    - Run database migrations"

install:
	cd backend && npm install
	cd dashboard && npm install
	cd widget && npm install
	cd whatsapp-qr-service && npm install

dev:
	docker-compose up

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --rmi all

migrate:
	docker-compose exec api npm run prisma:migrate
