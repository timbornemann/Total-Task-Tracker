# Architecture Overview

Total-Task-Tracker consists of a TypeScript/React frontend and a Node.js backend that communicate over HTTP.

- **Frontend (`/src`)** – built with Vite and React 18. Styling uses Tailwind CSS and Shadcn UI components.
- **Backend (`/server`)** – an Express application written in TypeScript. Data is persisted in SQLite via the `better-sqlite3` library.
- **Static assets (`/public`)** – images, icons and other files served directly by the server.

The backend exposes REST endpoints through controller modules in [`server/controllers`](../server/controllers). `server/app.ts` registers these controllers with Express, while `server/index.ts` boots the server and configures services like synchronization and settings loading.

The frontend communicates with the backend using standard `fetch` requests and manages state with Zustand stores. Navigation links are defined in [`src/components/Navbar.tsx`](../src/components/Navbar.tsx) and routed via React Router.

Database files live under `server/data`, and schema changes are managed with migration files in [`server/migrations`](../server/migrations).

## Data Flow

User interactions in the browser trigger component state updates and `fetch` requests.
The backend routes these requests to controllers, which delegate to service and repository layers before touching the SQLite database.
Changes are persisted and, when required, background services like `syncService` notify the client to refresh its state.

## Build & Deployment

During development run `npm run dev` for the Vite server and `npm start` for the Express API.
`npm run build` produces a production-ready bundle that the backend can serve.
A `Dockerfile` and `docker-compose.yml` are provided for container deployments.

## Related Guides

For detailed information on each side of the stack, see the [Frontend Guide](frontend.md), the [Backend Guide](backend.md) and the [Database Guide](database.md).
