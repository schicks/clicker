# Claude Code Guidelines

## Running Commands

Always run commands (tests, builds, linting, etc.) from the **repo root** (`/home/user/clicker`), not from individual package or app directories. The monorepo uses Nx and Bun workspaces, so commands should be run at the root level.

```bash
# Correct
cd /home/user/clicker && bun run test

# Incorrect
cd /home/user/clicker/apps/clicker && bun run test
```
