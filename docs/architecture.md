# Architecture Overview

Total-Task-Tracker consists of a TypeScript/React frontend and a Node.js backend that communicate over HTTP.

- **Frontend (`/src`)** – built with Vite and React 18. Styling uses Tailwind CSS and Shadcn UI components.
- **Backend (`/server`)** – an Express application written in TypeScript. Data is persisted in SQLite via the `better-sqlite3` library.
- **Static assets (`/public`)** – images, icons and other files served directly by the server.

The backend exposes REST endpoints through controller modules in [`server/controllers`](../server/controllers). `server/app.ts` registers these controllers with Express, while `server/index.ts` boots the server and configures services like synchronization and settings loading.

The frontend communicates with the backend using standard `fetch` requests and manages state with Zustand stores. Navigation links are defined in [`src/components/Navbar.tsx`](../src/components/Navbar.tsx) and routed via React Router.

Database files live under `server/data`, and schema changes are managed with migration files in [`server/migrations`](../server/migrations).

For detailed information on each side of the stack, see the [Frontend Guide](frontend.md) and [Backend Guide](backend.md).
