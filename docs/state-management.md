# State Management

This project evaluated different libraries for global state handling. Redux Toolkit offers powerful tooling but introduces boilerplate. Zustand provides a minimal API, shallow learning curve and works well with React's hooks.

We standardize on **Zustand** for client-side state:

- Stores live in [`src/stores`](../src/stores).
- Context providers that persist or sync data reside in [`src/providers`](../src/providers).
- Components and hooks import stores directly, e.g. `import { useTimers } from "@/stores/timers"`.

Existing local stores were migrated into this structure. New global state should follow the same pattern.
