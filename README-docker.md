# Docker Setup for Total Task Tracker

This repository includes a Docker setup that creates a MySQL database and phpMyAdmin for the Total Task Tracker application.

## Getting Started

### Prerequisites
- Docker and Docker Compose installed on your system

### Starting the Services
To start the MySQL database and phpMyAdmin, run:

```bash
docker-compose up -d
```

This will:
- Start a MySQL 8.0 database server on port 3306
- Automatically create the database and apply the schema from `src/database/dbschema.sql`
- Start phpMyAdmin on port 3002

### Accessing phpMyAdmin
- URL: http://localhost:3002 (accessible from all network interfaces)
- Server: mysql
- Username: root
- Password: password

### Database Connection Details
The database connection details are configured in `config/db_config.ini`:
- Host: localhost
- Username: root
- Password: password
- Database: total_task_tracker

### Stopping the Services
To stop the Docker containers, run:

```bash
docker-compose down
```

To stop and remove volumes (this will delete all database data), run:

```bash
docker-compose down -v
``` 