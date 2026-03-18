# Clicker

A lightweight PWA for manual event data collection, built with SvelteKit and hosted on GitHub Pages.

---

## Overview

Clicker lets users create named datasets ("clickers") and record timestamped events with a single tap. It works offline-first, stores data locally in the browser, and supports CSV export.

---

## Monorepo Structure

This repo is managed with [Nx](https://nx.dev).

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

On push to `main`, GitHub Actions runs a single workflow with two stages:

1. **Parallel:** `nx run-many` executes `validate` and `build` across all projects simultaneously — this covers schema validation, package builds, and the SvelteKit site build
2. **Deploy:** Only if stage 1 passes, deploy the built SvelteKit output to GitHub Pages

The workflow uses `nx run-many`, not a matrix strategy, to manage parallelism.

---

## Future Considerations

Not in scope for v1, but the architecture should not preclude:

- Additional event metadata (labels, values, notes)
- Cloud sync against a real PDS
- Data visualization
