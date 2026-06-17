# Docker Deployment Guide

## Prerequisites
- Docker Desktop installed and running
- Git (optional, if cloning)

## Quick Start
1. Open a terminal in the project root.
2. Run the following command to build and start the application:
   ```bash
   docker-compose up --build
   ```
3. The build process may take a few minutes (installing dependencies, building frontend).
4. Once running, access the application at: http://localhost:5000

## Services
- **App**: Node.js backend serving React frontend (Port 5000)
- **DB**: PostgreSQL 15 database (Port 5432, exposed globally)

## Troubleshooting
- **Database Connection Error**: The app waits for the DB to be ready. If it hangs, check Docker logs.
- **Port Conflicts**: Ensure ports 5000 and 5432 are not in use.
- **Rebuilding**: If you make code changes, stop the containers (`Ctrl+C`) and run `docker-compose up --build` again.

## Data Persistence
Database data is persisted in a Docker volume named `findateammate_postgres_data` (or similar, depending on folder name). To reset the DB, run `docker-compose down -v`.
