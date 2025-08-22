# Backend Guide

The backend resides in the `server` directory and uses an Express application with SQLite for persistence.

## Entry Points

- [`server/index.ts`](../server/index.ts) boots the server, loads user settings and starts background services like synchronization.
- [`server/app.ts`](../server/app.ts) configures Express, registers middleware and attaches the various route controllers.

## Structure

- [`server/controllers`](../server/controllers) – route handlers for features such as tasks, notes, flashcards and more.
- [`server/services`](../server/services) – business logic utilities, including the synchronization logic in `syncService.ts` and data helpers in `dataService.ts`.
- [`server/repositories`](../server/repositories) – data access modules wrapping SQLite queries.
- [`server/migrations`](../server/migrations) – schema migrations executed on startup.
- [`server/middleware`](../server/middleware) – security features like request limits and sanitization.
- [`server/lib`](../server/lib) – shared libraries such as `swagger.js` for API documentation and logging helpers.

## Controllers and Routes

Each module in [`server/controllers`](../server/controllers) registers a set of
REST endpoints. For example, `notes.ts` manages note CRUD operations while
`timers.ts` exposes timer synchronization. `server/app.ts` mounts these
controllers under the `/api` path.

## Services and Repositories

`server/services` contains domain-specific logic such as the synchronization
engine in [`syncService.ts`](../server/services/syncService.ts). Data access is
abstracted behind repository modules that issue SQL queries via `better-sqlite3`.

## Database and Migrations

The SQLite database lives in `server/data` and is initialised by
[`server/lib/db.ts`](../server/lib/db.ts). Schema migrations reside in
[`server/migrations`](../server/migrations) and run automatically on startup.
See the [Database Guide](database.md) for table details.

## Background Jobs

Background services handle periodic tasks such as syncing and cleanup. They are
started in [`server/index.ts`](../server/index.ts) after the Express app is
initialised.

## Testing

Backend logic is covered by Vitest tests alongside frontend tests in the
[`tests`](../tests) directory. Run `npm test` to execute the suite.

To see how this server integrates with the client side, check the [Architecture Overview](architecture.md) or the [Frontend Guide](frontend.md).
