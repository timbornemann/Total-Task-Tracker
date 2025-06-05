# Task Tree Dashboard

Dieses Projekt ist eine kleine Aufgabenverwaltung auf Basis von React und Node.js. Du kannst Aufgaben in Kategorien organisieren, Unteraufgaben anlegen und deine Termine im Kalender oder in Statistiken betrachten. Die Daten werden serverseitig in einer JSON-Datei gespeichert.

## Voraussetzungen

* Node.js (empfohlen Version 18) und npm

## Installation

```bash
# Repository klonen
git clone <REPO_URL>
cd task-tree-dashboard-docked

# Abhängigkeiten installieren
npm install
```

## Entwicklung starten

Im Entwicklungsmodus läuft die React-Anwendung mit Vite auf Port **8080**. Für die Datenspeicherung kann gleichzeitig der Node-Server gestartet werden.

```bash
# Frontend mit automatischem Reload
npm run dev

# In zweitem Terminal: Backend starten
npm start
```

Rufe anschließend im Browser `http://localhost:8080` auf.

## Produktion / Docker

Für einen produktiven Build kannst du die Anwendung bauen und über den Node-Server bereitstellen oder ein Docker-Image verwenden.

```bash
# Build erstellen
npm run build

# Server startet die gebaute App auf Port 3002
npm start
```

Mit Docker geschieht das Ganze automatisch:

```bash
docker-compose up --build
```

Die Persistenz der Aufgaben erfolgt dabei im Verzeichnis `./server/data` auf dem Host.

## Funktionen

- Aufgaben anlegen, bearbeiten und in Kategorien sortieren
- Unteraufgaben, Prioritäten und Wiederholungen
- Kalenderansicht und Statistikseite
- Speicherung der Daten auf dem lokalen Server

Viel Spaß beim Ausprobieren!
