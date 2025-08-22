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

Database files are stored under `server/data`, and all database interaction uses the `better-sqlite3` package for synchronous access. The API is exposed via JSON endpoints that the React frontend consumes.

To see how this server integrates with the client side, check the [Architecture Overview](architecture.md) or the [Frontend Guide](frontend.md).
