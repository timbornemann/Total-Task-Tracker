# 🧠 AGENTS.md – Leitfaden für KI-Agenten

Diese Datei dient als Anleitung für automatisierte Agenten (z. B. Codex), wie sie mit diesem Projekt interagieren sollen. Sie beschreibt Konventionen, Arbeitsabläufe und wichtige Anforderungen für eine reibungslose Integration.

---

## 1. Projektübersicht

* **Frontend**: React + Vite, TypeScript, Tailwind CSS, Shadcn UI
* **Backend**: Node.js (ES Modules) mit SQLite
* **Struktur**:

  * `/src` → Frontend (React/TS)
  * `/server` → Backend (Node.js + SQLite)
  * `/public` → Statische Assets
  * `Dockerfile`, `docker-compose.yml` → Container Setup

---

## 2. Setup & Entwicklung

```bash
npm run dev           # Frontend (Vite) auf Port 8080
npm start             # Backend (Node.js) auf Port 3002
```

---

## 3. Docker-Unterstützung

```bash
docker-compose up --build
```

* SQLite-Daten werden unter `./server/data` gespeichert und als Volume gemountet.

---

## 4. Codekonventionen

* **Frontend**: TypeScript (`.tsx`, `.ts`)
* **Backend**: JavaScript (ES Modules, `.js`)
* **Formatierung**: 2 Leerzeichen, Semikolons am Ende

---

## 5. Navigation & Feature-Integration

* Neue Features **müssen** in die **Navigationsleiste** integriert werden.
* Die Navbar befindet sich unter `src/components/Navbar.tsx`.
* Links werden über React Router konfiguriert.

---

## 6. Dokumentation & README

* Bei **größeren Änderungen** (z. B. neue Features, API-Struktur, neue Befehle) **README.md aktualisieren**.
* Neue Umgebungsvariablen, Setup-Anleitungen und Screenshots sollten dokumentiert werden.

---

## 7. Commit- & PR-Richtlinien

* Commit-Nachrichten auf **Englisch**, klar und aussagekräftig
* Beschreiben, **was** geändert wurde und **warum**
* Pull Requests sollten nachvollziehbare Änderungen enthalten (inkl. Screenshots bei UI-Updates)

---


## 8. Pflege & Erweiterung

* Diese Datei darf bei Bedarf erweitert werden
* Unterverzeichnisse können eigene AGENTS.md verwenden, um spezifische Regeln zu setzen
