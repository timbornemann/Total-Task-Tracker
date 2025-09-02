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
- [`src/stores`](../src/stores) – Zustand stores for global state.
- [`src/locales`](../src/locales) – translation files in German and English consumed by `react-i18next`.
- [`src/utils`](../src/utils) and [`src/lib`](../src/lib) – helper functions and abstractions.
- [`src/shared`](../src/shared) – shared utilities and types.

## Routing

Routing is configured in [`src/App.tsx`](../src/App.tsx) using `react-router-dom`.
Top-level pages live in [`src/pages`](../src/pages), and navigation links are
defined in [`src/components/Navbar.tsx`](../src/components/Navbar.tsx).

## State Management

Local state is handled with Zustand stores. For example,
the [timers store](../src/stores/timers.ts) persists timer state to local storage
and syncs it to the server via the [TimersProvider](../src/providers/TimersProvider.tsx).
Server state and caching are provided by `@tanstack/react-query` via context
providers in [`src/providers`](../src/providers).

## Styling and Theming

Tailwind CSS supplies utility classes and design tokens. Shadcn UI components
offer accessible primitives. Theme definitions live in
[`src/lib/themes.ts`](../src/lib/themes.ts) and are exposed via a settings
provider so users can switch appearance at runtime.

## Internationalization

All user-facing text comes from translation files under
[`src/locales`](../src/locales). `react-i18next` loads the German and English
JSON dictionaries and provides hooks like `useTranslation`.

## Testing

Vitest with `@testing-library/react` covers unit and component tests. Test files
reside in the [`tests`](../tests) directory and run with `npm test`.

For a broader look at how the frontend communicates with the server, see the
[Architecture Overview](architecture.md) or jump to the [Backend Guide](backend.md).
