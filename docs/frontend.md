# Frontend Guide

The frontend lives in the `src` directory and is built with React 18, TypeScript and Vite. Tailwind CSS and Shadcn UI components provide styling and UI primitives.

## Entry Points

- [`src/main.tsx`](../src/main.tsx) bootstraps the application and mounts `<App />`.
- [`src/App.tsx`](../src/App.tsx) sets up routing and shared layout elements.

## Key Folders

- [`src/components`](../src/components) – reusable UI components such as [`Navbar.tsx`](../src/components/Navbar.tsx) and [`MarkdownEditor.tsx`](../src/components/MarkdownEditor.tsx).
- [`src/pages`](../src/pages) – route components; each page represents a top-level feature like tasks, notes or the pomodoro timer.
- [`src/hooks`](../src/hooks) – custom React hooks for shared logic.
- [`src/providers`](../src/providers) – context providers for state like themes or query clients.
- [`src/locales`](../src/locales) – translation files in German and English consumed by `react-i18next`.
- [`src/utils`](../src/utils) and [`src/lib`](../src/lib) – helper functions and abstractions.
- [`src/shared`](../src/shared) – Zustand stores and shared types.

State management relies on Zustand and `@tanstack/react-query`. Routing is handled by React Router, with navigation links defined in [`src/components/Navbar.tsx`](../src/components/Navbar.tsx).

For a broader look at how the frontend communicates with the server, see the [Architecture Overview](architecture.md) or jump to the [Backend Guide](backend.md).
