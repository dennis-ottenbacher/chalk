# Chalk Project Documentation Structure

The Chalk project follows the 'System State Materialization' pattern to keep documentation and task tracking available within the repository.

## Directory Structure

- `docs/README.md`: Central documentation hub with structured groupings.
- `docs/current_task.md`: Active task tracking (synced from agent state).
- `docs/implementation_plan.md`: Current execution plan (synced from agent state).
- `docs/implementation/`, `docs/development/`, `docs/data_model/`: Structured specifications synced from system Knowledge Items.

## Synchronization

The project uses an automated workflow `.agent/workflows/sync_docs.md`. This workflow materializes the system's Knowledge Items (the "leading" source of truth) into the repository. It includes recursive syncing and cleanup of redundant root files (e.g., removing `docs/tech_stack.md` in favor of `docs/development/tech_stack.md`).

## Historical Context

Originally, documentation was strictly managed within the agent's internal Knowledge Items. Following user feedback (Conversation `e8068d47-02ee-43ac-9958-0bfe221d9d01`), the transition to a hybrid model was made: long-term knowledge is preserved in system KIs (leading), while project-specific indices and active work are materialized into the repository's `docs/` folder for versioning and visibility. Cleanup of legacy standalone files in the `docs/` root was performed in January 2026 to align with the new structured model.
