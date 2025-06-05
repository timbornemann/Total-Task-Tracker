# Contribution Guidelines

This project contains a React/TypeScript front end built with Vite and a small Node.js server.

## Development checks

Run the following commands before committing any change:

```bash
npm run lint
npm run build
```

Both commands must succeed with no errors.

## Code style

* Use 2 spaces for indentation.
* Prefer single quotes in TypeScript/JavaScript files.
* Keep import statements ordered by path.
* Commit messages must be short (max 50 characters) and written in English imperative mood.

## Other notes

Do not commit the `dist/` directory, `node_modules/` or `server/data/`.
Update `README.md` when adding new environment variables or configuration.
