# Development Workflow

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and what the current state of progress is. Always implement against these specs — do not infer or invent behavior from scratch.

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated concerns in a single implementation step.

## When to Split Work

Split an implementation step if it combines:

- UI changes and WebRTC/connection logic changes
- PartyKit server changes and client-side changes
- Multiple unrelated components or routes
- Behavior that is not clearly defined in the context files

If a change cannot be verified end-to-end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## Protected Foundation Components

Do not modify generated third-party foundation components unless explicitly instructed.

This includes:
- `components/ui/*` (shadcn/ui components)
- Third-party library internals

Override styles at the app layer, not inside these files. Only modify them when a task explicitly requires it.

## Sketch Style Discipline

Every new component must follow the sketch style conventions in `ui-context.md`:
- Asymmetric border-radius on all bordered elements
- 2px dark ink border + hard offset shadow on cards and buttons
- No softening with blur, gradients, or rounded-off shadows
- Verify visually before marking the feature done

Mobile responsiveness is a hard requirement — every feature must be tested at mobile width before being marked complete.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:
- System architecture or boundaries
- Storage model decisions
- Code conventions or standards
- Feature scope or behavior

`progress-tracker.md` must reflect the actual state of the implementation, not the intended state.

## Before Moving to the Next Feature

1. The current feature works end-to-end within its defined scope.
2. No invariant defined in `architecture-context.md` was violated.
3. The sketch style is correctly applied on both mobile and desktop.
4. `progress-tracker.md` is updated to reflect the completed work.

## Invariants (Never Violate)

1. File content and clipboard data must never pass through any server — P2P only.
2. Sessions are ephemeral — no data persists after the session ends.
3. Maximum 2 devices per session — enforced in the PartyKit server.
4. All browser permissions (camera, clipboard) are requested only on explicit user action, never on page load.
5. The sketch visual style must be maintained on every new component — no plain Tailwind defaults.
