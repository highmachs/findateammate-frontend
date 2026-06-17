# Database Management Guide

## Problem: Database Not Persisting Across Devices

When you transfer your project via zip files, the Docker volume containing the PostgreSQL database is **NOT included**. This is why your test accounts disappear.

## Solution: Backup and Restore

### Quick Start

#### Windows (PowerShell)

```powershell
# Backup database
.\backup_db.ps1

# Restore database
.\restore_db.ps1 -BackupFile .\db_backups\findateammate_backup_YYYYMMDD_HHMMSS.zip
```

#### Linux/Mac (Bash)

```bash
# Backup database
./backup_db.sh

# Restore database
./restore_db.sh ./db_backups/findateammate_backup_YYYYMMDD_HHMMSS.sql.gz
```

## Workflow for Transferring to Another PC

### On Source PC:

1. **Backup the database**:
   ```powershell
   .\backup_db.ps1
   ```
2. **Include backup in zip**: Make sure to include the `db_backups` folder when zipping your project

### On Destination PC:

1. **Extract the zip file**
2. **Start Docker services**:
   ```powershell
   docker-compose up -d
   ```
3. **Restore the database**:
   ```powershell
   .\restore_db.ps1 -BackupFile .\db_backups\findateammate_backup_YYYYMMDD_HHMMSS.zip
   ```

## Creating Test Accounts

### Via API (Recommended)

```powershell
# Register a test user
curl -X POST http://localhost:5000/api/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"test123\",\"username\":\"testuser\"}'
```

### Via Database Direct Insert

```powershell
# Connect to database
docker-compose exec db psql -U postgres findateammate

# Insert test user (password: test123)
INSERT INTO users (email, password, username)
VALUES ('test@test.com', '$argon2id$v=19$m=65536,t=3,p=4$...', 'testuser');
```

## Automatic Backups

### Schedule Daily Backups (Windows Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2 AM
4. Action: Start a program
5. Program: `powershell.exe`
6. Arguments: `-File "C:\path\to\findateammate\backup_db.ps1"`

## Backup Location

Backups are stored in: `./db_backups/`

- Format: `findateammate_backup_YYYYMMDD_HHMMSS.zip` (Windows)
- Format: `findateammate_backup_YYYYMMDD_HHMMSS.sql.gz` (Linux)
- Retention: Last 10 backups are kept automatically

## Troubleshooting

### "Invalid email or password" after restore

- Make sure you restored the correct backup file
- Check that Docker services are running: `docker-compose ps`
- Verify database connection: `docker-compose exec db psql -U postgres findateammate -c "\dt"`

### Backup fails

- Ensure Docker services are running
- Check disk space
- Verify PostgreSQL container is healthy: `docker-compose ps`
