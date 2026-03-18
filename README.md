# Clicker

A lightweight PWA for manual event data collection, built with SvelteKit and hosted on GitHub Pages.

---

## Overview

Clicker lets users create named datasets ("clickers") and record timestamped events with a single tap. It works offline-first, stores data locally in the browser, and supports CSV export.

---

## Getting Started

This project uses [Bun](https://bun.sh) as the package manager. Install it with:

```sh
curl -fsSL https://bun.sh/install | bash
```

Then install dependencies and run the dev server:

```sh
bun install
bunx nx run clicker:dev
```

Common tasks:

| Command | Description |
|---|---|
| `bunx nx run-many --target=validate` | Lint + test all projects |
| `bunx nx run-many --target=build` | Build all projects |
| `bunx nx run clicker:dev` | Start the SvelteKit dev server |

---

## Monorepo Structure

This repo is managed with [Nx](https://nx.dev) and [Bun workspaces](https://bun.sh/docs/install/workspaces).

```
/
├── packages/
│   └── atproto-idb/        # Framework-agnostic AT Protocol IndexedDB adapter
└── apps/
    └── clicker/             # SvelteKit PWA (owns the Lexicon schemas)
```

---

## Packages

### `packages/atproto-idb`

A framework-agnostic library that accepts a set of AT Protocol Lexicon schemas and exposes a PDS-like interface for acting against them — creates, reads, queries — backed by IndexedDB. It should feel like a local PDS: you register schemas, and get back typed actions.

This package has its own `build` and `validate` Nx targets.

### `apps/clicker`

The SvelteKit application, built as a static site for GitHub Pages. Lexicon schemas for the clicker data model live here and are passed into `atproto-idb` at runtime. Consumes `packages/atproto-idb` for all data access.

---

## Data Model

Schemas are defined as AT Protocol Lexicons in the `clicker` app and cover:

- **Clicker** — a named dataset
- **Event** — a recorded occurrence within a clicker, capturing at minimum a timestamp; the schema should be forward-compatible with additional metadata fields

---

## Features

### Clicker Management (Home Screen)
- Create a new clicker by name
- Open an existing clicker
- Delete a clicker (and all its events)
- Export a clicker's data to CSV

### Recording Screen
- Displays the clicker name
- One large, prominent button to record an event (captures timestamp)
- Running count of recorded events

### PWA
- Installable on mobile and desktop
- Fully functional offline after first load (cache-first service worker)

---

## CI/CD

Both workflows use `oven-sh/setup-bun` and `bun install --frozen-lockfile` for fast, reproducible installs.

**PR checks** (`pr.yml`): runs `nx run-many --target=validate` (lint + test) on every pull request.

**Deploy** (`deploy.yml`): on push to `main`, runs `nx run-many --target=build` then deploys the SvelteKit static output to GitHub Pages.

Both use `nx run-many` (not a matrix strategy) to manage parallelism across projects.

---

## Future Considerations

Not in scope for v1, but the architecture should not preclude:

- Additional event metadata (labels, values, notes)
- Cloud sync against a real PDS
- Data visualization
