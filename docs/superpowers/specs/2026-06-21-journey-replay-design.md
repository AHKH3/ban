# Ban Journey Replay Design

## Purpose

Ban needs one project-level feature that combines an application audit log with a playful timeline experience. The feature records important actions that happen inside Ban for the currently opened project, then presents card life as a fast, beautiful replay of the project journey.

This is not a Git replacement. Ban must not track arbitrary source-code file changes in the project folder. Git already owns that job. Ban only records actions that happen through Ban and the `.kanban` workspace.

## Product Shape

Add a Sidebar entry named `Journey`. It opens a read-only journey mode for the active Ban project.

The primary view is a Kanban replay, not a report. The user chooses a time range and watches cards appear, move, change, disappear, or finish in the same order recorded in the activity log. The experience should feel like Ban and Linear: clean, fast, spatial, calm, and legible.

The feature should avoid turning "serendipity" into random reminders. In this context, the delightful part comes from replaying the journey beautifully: subtle highlights, motion, event pulses, and the ability to scrub through time.

## Scope

Record all meaningful Ban application actions for future flexibility:

- Card created.
- Card updated.
- Card moved between statuses.
- Card deleted.
- Card restored if restore exists later.
- Project config changed.
- Project tags changed.
- Project-level settings changed if Ban stores project-local settings later.

For the first Journey UI, display only card-life events:

- Create.
- Move.
- Update.
- Delete.
- Restore, if present.

Non-card events may remain available for future audit or debug views, but they should not clutter the first Journey experience.

## Time Range Controls

Journey must support flexible ranges:

- Today.
- This week.
- This month.
- Custom start and end dates.
- All project history.

The user is not forced to pick a single day. A single-day view is just a special case of a custom range.

## Replay Modes

The replay should support two starting modes:

- `Start from range state`: reconstruct the board state immediately before the selected range, then replay only events inside the range.
- `Start empty`: start with an empty board and only show card events that happen inside the selected range.

`Start from range state` should be the default because it answers "what happened during this period?" without losing context.

## Journey View

The main area uses the existing Kanban columns as the stage:

- Columns remain visually familiar.
- Cards are read-only.
- Cards that existed before the range start are visible but quieter.
- Cards affected during the replay get a temporary highlight.
- Moves animate between columns.
- Creates fade or pop into their initial column.
- Updates pulse the card and may briefly show the changed field.
- Deletes fade the card out or move it into a small "removed" moment, depending on what looks clearest.

The bottom of the screen contains a compact Journey Strip:

- A chronological row of event pulses.
- A playhead that moves during replay.
- Scrubbing the playhead reconstructs the board at that point.
- Selecting an event pauses the replay and focuses the affected card.
- The selected event shows one short human sentence, such as `Moved "Fix auth redirect" from Doing to Review`.

The controls should be minimal:

- Range selector.
- Play / pause.
- Speed selector.
- Replay starting mode.

These controls exist to support the replay, not to become the personality of the feature.

## Data Model

Store activity in the project-local `.kanban` directory as append-only JSON Lines:

```text
.kanban/
  activity/
    2026-06.jsonl
```

Each line is one event:

```json
{
  "id": "evt_...",
  "projectPath": "C:\\dev\\Ban",
  "actor": "ban",
  "kind": "card.moved",
  "createdAt": "2026-06-21T13:22:00.000Z",
  "cardId": "abc123",
  "cardTitle": "Fix auth redirect",
  "before": { "status": "doing" },
  "after": { "status": "review" },
  "source": "app"
}
```

Rules:

- The log is append-only in normal operation.
- Events are project-local and versionable if the user wants that.
- The Markdown card files remain the source of truth for current board state.
- The activity log is the source of truth for journey reconstruction.
- Avoid logging full card bodies by default to keep the log readable and low-noise.
- Store enough fields to replay visible changes: title, status, type, priority, tags, timestamps, and deletion/restoration state.

## Data Flow

Ban writes activity events from Electron IPC handlers where app actions already pass through:

- `card:create`
- `card:update`
- `card:move`
- `card:delete`
- future project config or tag handlers

The renderer gets Journey data through new IPC calls:

- `activity:list(projectPath, range)`
- `activity:card-events(projectPath, range)`
- optional later: `activity:summary(projectPath, range)`

The Journey store loads events for the selected range, reconstructs board state at the range start, and derives replay frames on demand.

## Reconstruction

For `Start from range state`, Journey reconstructs card state before the range start by applying activity events from project creation until the range start. Then it applies range events during playback.

If old projects do not yet have activity history, the first implementation can treat existing cards as baseline cards at the time Journey is introduced. The UI should explain this softly only when needed, for example `Journey starts from the first recorded Ban activity for this project.`

## Error Handling

- If an activity file is missing, return an empty journey rather than failing the board.
- If one JSONL line is corrupt, skip it and continue reading later events.
- If a replay event references a missing card, show the event in the strip but do not crash the board stage.
- If reconstruction cannot know a previous value, display a generic phrase such as `Updated card`.

## Testing

Cover the feature at three levels:

- Unit tests for event writing, JSONL reading, corrupt-line tolerance, and range filtering.
- Unit tests for replay reconstruction from ordered events.
- UI verification for opening Journey, selecting ranges, playing, pausing, and scrubbing.

Manual verification should include:

- Create a card, move it through several statuses, edit metadata, delete it, then replay the range.
- Open an older project with no activity files and confirm Journey degrades gracefully.
- Confirm normal board editing still works and remains the source of truth.

## Out of Scope

- Tracking arbitrary source-code file changes in the project.
- Replacing Git history.
- Full visual "journey map" separate from Kanban.
- Random card reminder or serendipity feed.
- AI-generated summaries of the journey.

## Open Implementation Notes

- Prefer a small activity writer in Electron, close to the existing filesystem helpers.
- Keep event schema explicit and versioned if migrations become necessary.
- Add the Journey UI as a separate mode/page instead of overloading the editable Board component too much.
- Reuse existing card, status, tag, and animation primitives where possible.
