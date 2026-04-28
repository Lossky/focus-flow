# Focus Flow v0.1.13

## User-facing changes

- Removed the homepage "工作驾驶舱" section.
- Removed the homepage "项目压力 & 合并建议" section.
- Simplified the main page so it returns to the core workflow:
  - Today mainline
  - Quick capture
  - Flow processing / project overview
- Reduced page height and removed noisy rule-based suggestion panels that were not useful in daily use.

## Technical changes

- Removed unused homepage computations and imports for the deleted dashboard UI.
- Kept the underlying task insight data model and rule helpers available for future, better-scoped entry points.
- No data migration required.

## Verification

- `npm test`
- `npm run lint`
- `npm run build`
