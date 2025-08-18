# Architektur & Design – TODO-Liste

Setze schritt für schritt die anstehenden verbesserungen um, immer wenn du eine sache fertig hast komme sofort zu dieser  TODO Datei zurück und makiere die ausgabe als erledigt, Commite danach die veränderungen. 


Diese Liste bündelt alle anstehenden Architektur-, Design- und Qualitätsmaßnahmen für Total-Task-Tracker. Die Kästchen können direkt in Pull Requests/Commits abgehakt werden.

## Phase 1 – Stabilität: Fehlerbehandlung und Testgrundlagen

- [x] Globale Error Boundary im Frontend einführen (`src/components/ErrorBoundary.tsx`) und in `src/App.tsx` einbinden
- [x] Zentrale Fehlerbehandlung für Fetch/API aufsetzen (`src/lib/apiClient.ts`)
  - [x] Einheitliche Fehlerobjekte und Logging
  - [x] Retry mit Exponential Backoff für idempotente Requests
  - [x] Timeouts und AbortController
- [x] Nutzerfreundliche Fehleranzeigen: Toasts/Dialoge für Netzwerk- und Speicherfehler
- [x] Offline-/Online-Status robust handhaben (Queue für Pending-Writes)
- [x] 404- und 500-Routen konsistent behandeln (bestehende `NotFound` nutzen, 500-Fallback ergänzen)
- [ ] Teststrategie (Testpyramide) dokumentieren (`docs/testing/strategy.md`)
- [ ] Unit-Tests für Stores/Hooks (Zustand/Context) aufsetzen (Vitest + React Testing Library)
- [ ] Komponententests für kritische UI-Komponenten
- [ ] Integrationstests für kritische Flows (Tasks, Notes, Flashcards)
- [ ] API-Tests für `server/controllers/*` (z. B. Supertest)
- [ ] Coverage-Ziele definieren und CI-Check hinzufügen (z. B. 80% global, 90% critical paths)

## Phase 2 – Foundation: State-Management vereinheitlichen

- [ ] Provider-Verschachtelung in `src/App.tsx` reduzieren (max. 3 Ebenen)
- [ ] Stores konsolidieren: große Stores aufteilen und fokussieren
  - [ ] `useTaskStore.tsx` (>1000 Zeilen) in Slices aufsplitten:
    - [ ] `useTasksStore.ts` (CRUD, Filter, Sortierung)
    - [ ] `useCategoriesStore.ts`
    - [ ] `useNotesStore.ts`
    - [ ] `useRecurringTasksStore.ts`
  - [ ] Selektoren nutzen, um Re-Renders zu minimieren
- [ ] Einheitliches Muster für Persistenz/Sync (Offline -> API -> Sync)
- [ ] Gemeinsame Typen und Utilities in `src/shared/` konsolidieren

## Phase 3 – Performance

- [ ] Route-basiertes Code-Splitting via `React.lazy`/`Suspense` für Seiten in `src/App.tsx`
- [ ] Bundle-Analyzer integrieren (z. B. `rollup-plugin-visualizer`) und Hotspots reduzieren
- [ ] Teure Berechnungen memoisieren (`useMemo`/`useCallback`, `React.memo`)
- [ ] Lange Listen virtualisieren (Tasks/Notes/Inventory) – Evaluierung `react-virtual`/`react-window`
- [ ] Debouncing/Throttling für Suche und Auto-Save
- [ ] Service Worker Caching überprüfen/erweitern (statische Assets, API-Fallbacks)

## Phase 4 – Backend-Modernisierung

- [ ] Service-Layer zwischen Controllern und Datenzugriff einführen (`server/services/*`)
- [ ] Eingabe-Validierung mit Zod/Joi (Request-Body/Params/Query)
- [ ] Rate-Limiting (`express-rate-limit`) und Security-Header (`helmet`)
- [ ] Request-Größenlimit und CORS-Konfiguration präzisieren
- [ ] Structured Logging (`pino`/`winston`) inkl. Korrelations-IDs
- [ ] Health-Check-Endpoint (`/health`) implementieren
- [ ] OpenAPI/Swagger-Doku generieren und unter `/docs` bereitstellen
- [ ] Migrationsmechanismus für SQLite einführen (`server/migrations/` + Skripte)

## Phase 5 – Code-Organisation und Lesbarkeit

- [ ] Feature-basierte Struktur unter `src/features/` einführen
  - [ ] `src/features/tasks`, `src/features/notes`, `src/features/flashcards`, `src/features/inventory`, `src/features/pomodoro`, `src/features/timers`
- [ ] Barrel-Exports für öffentliche Module (`index.ts` je Feature)
- [ ] Große Dateien aufteilen; Verantwortlichkeiten klar trennen
- [ ] Gemeinsame Konstanten/Helper nach `src/shared/` bzw. `src/utils/` auslagern
- [ ] Konsistente Naming-Konventionen festlegen und dokumentieren (`docs/conventions.md`)

## Type-Safety & Validierung

- [ ] Striktere TypeScript-Einstellungen aktivieren (z. B. `strict: true`, `noImplicitAny`, `noUncheckedIndexedAccess`)
- [ ] Zod-Schemas für API-Payloads und Responses definieren (Frontend/Backend geteilt)
- [ ] Generische API-Response-Typen und Fehlerobjekte definieren
- [ ] Form-Validation konsequent mit `react-hook-form` + Zod Resolver

## Security-Hardening

- [ ] Markdown-Rendering absichern: `rehype-raw` nur mit `rehype-sanitize` nutzen
- [ ] Input-Sanitization für user-generierte Inhalte (Notes, Titles, Descriptions)
- [ ] CSP/Sicherheits-Header via `helmet` setzen
- [ ] Cookies/Storage-Policies prüfen (falls relevant)

## Monitoring & Observability

- [ ] Fehlertracking integrieren (lokal optional, abstrahierter Logger mit Plug-in-Schnittstelle)
- [ ] Performance-Metriken (LCP/TTI) erfassen, einfache Telemetrie (opt-in)
- [ ] Server-Metriken (z. B. `/metrics`) vorbereiten

## Developer Experience

- [ ] Linting-Regeln schärfen und vereinheitlichen (ESLint + TypeScript ESLint)
- [ ] Pre-commit Hooks (Husky + `lint-staged`) einführen
- [ ] Konsistente Formatierung (Prettier) sicherstellen
- [ ] Lokale Dev-Doku aktualisieren (README + `DOKUMENTATIONS_CHECKLISTE.md` durcharbeiten)

## CI/CD

- [ ] GitHub Actions: Build- und Test-Pipeline
- [ ] Coverage-Bericht und Schranken in CI prüfen
- [ ] Docker-Image Build & Push (ghcr) automatisieren
- [ ] Optional: Release-Notes-Automatisierung

## Dokumentation & ADRs

- [ ] Architekturübersicht und Diagramme ergänzen (`docs/architecture/`)
- [ ] ADRs für wesentliche Entscheidungen anlegen (`docs/adrs/`)
- [ ] API-Dokumentation (OpenAPI) verlinken und pflegen

---

### Annahmekriterien (Definition of Done) pro Aufgabe

- [ ] Tests vorhanden (Unit/Integration, falls sinnvoll)
- [ ] Linter/Typecheck grün
- [ ] Doku/ADR aktualisiert
- [ ] Kein Regressionsbefund (Smoke-Tests)
