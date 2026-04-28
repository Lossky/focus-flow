# Focus Flow 0.1.12

## User-facing changes

- Added a rule-based 工作驾驶舱 for Today load, task aging, and weak task-expression reminders.
- Added project pressure analysis with active, Today, Review, blocked, and aging counts.
- Added suggested merge groups for fragmented tasks in the same project.
- Added task fields for estimate minutes, blockers, waiting-for, and merged-from context.
- Task cards now show workload, maturity warnings, aging warnings, blocked/waiting details, and merge source count.
- Task edit modal now supports estimate minutes, blocked reason, and waiting-for fields.
- Merge action creates a Review task and archives source tasks while preserving history.

## Technical changes

- Added optional Item fields: `estimateMinutes`, `blockedBy`, `waitingFor`, and `mergedFrom`.
- Added rule-based insight helpers in `src/lib/focus-flow-model.ts`:
  - `analyzeTaskMaturity`
  - `analyzeTodayLoad`
  - `getAgingLevel`
  - `summarizeProjectPressure`
  - `suggestMergeGroups`
- Added `mergeItems` in `src/hooks/use-items.ts`.
- Added Node test coverage for insight and merge-suggestion rules.
- Added `npm test` script.

## Verification

```bash
npm test
npm run lint
npm run build
```

All passed locally before release tagging.
