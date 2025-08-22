# 🚀 Total-Task-Tracker Release

## Neue Features

- Erweiterte Lernkarten-Funktionalität mit Spaced Repetition
- Verbesserte Pomodoro-Timer Integration
- Optimierte Task-Verwaltung mit erweiterten Filtern

## Verbesserungen

- Performance-Optimierungen im Frontend
- Stabilere Backend-API
- Verbesserte Benutzeroberfläche
- Erweiterte Offline-Funktionalität

## Bugfixes

- Behoben: Synchronisation zwischen verschiedenen Browsertabs
- Behoben: Markdown-Rendering in Notizen
- Behoben: Timer-Persistierung bei Seitenneuladung

## Technische Änderungen

- Aktualisierte Dependencies
- Verbesserte Docker-Container
- Erweiterte CI/CD Pipeline
- Bessere Fehlerbehandlung

## Installation

### Docker (empfohlen)

```bash
docker pull ghcr.io/timbornemann/total-task-tracker:latest
docker run -d --name total-task-tracker -p 3002:3002 \
  -v total-task-tracker-data:/app/server/data \
  ghcr.io/timbornemann/total-task-tracker:latest
```

### Docker Compose

```bash
VERSION=$(git describe --tags --abbrev=0) docker-compose up --build
```

## Hinweise

- Daten werden automatisch migriert
- Backup vor dem Update empfohlen
- Kompatibel mit bestehenden Installationen

---

_Automatisch generierte Release Notes_
