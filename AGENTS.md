# Repository Guidelines for Agents

This project is a task management dashboard built with React + Vite and a small Node.js backend using SQLite. It includes Tailwind CSS and Shadcn UI components.

## Structure
- **/src** – React front‑end written in TypeScript.
- **/server** – Node.js server (`index.js`) with HTTP endpoints and SQLite persistence.
- **/public** – static assets for the front‑end.
- **Dockerfile** and **docker-compose.yml** for building and running the app in production.

## Setup
1. Install Node.js 18 and npm.
2. Install dependencies with `npm install`.
3. Start development:
   - `npm run dev` – Vite dev server on port 8080 with API proxy to the Node server.
   - `npm start` – run the Node server on port 3002.
4. Build production assets with `npm run build`.
5. Lint code with `npm run lint` (uses ESLint with TypeScript config).

## Docker
Use `docker-compose up --build` to build and run the application in a container. Data is stored in `./server/data` and mapped as a volume.

## Coding Conventions
- TypeScript for the React codebase (`.tsx`, `.ts`).
- JavaScript (ES modules) for the server (`.js`).
- Use two spaces for indentation and end statements with semicolons.
- Keep code formatting consistent with the existing files and run `npm run lint` before committing.

## Commit Guidelines
- Provide clear commit messages in English describing what was changed and why.
- Ensure that `npm run lint` and `npm run build` succeed before committing.

