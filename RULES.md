# Ban — Project Rules

> Canonical rules for every AI agent working in this repo. Managed via Ban.
> Each agent's native config (CLAUDE.md, AGENTS.md, …) points back here, so you
> write the rules once and every agent reads the same source of truth.

## Conventions

-

## Tasks & workflow

- Tasks live as markdown files under `Tasks/{status}/`. Statuses are folders:
  inbox → shape → ready → doing → review → done (and killed).
- To move a task, move its `.md` file into the target status folder.
- When you finish work on a task, move it to `review` for human approval.
- Plans live under `Plans/`.
