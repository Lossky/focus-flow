# Focus Flow

Focus Flow is a local-first desktop task flow app for macOS. It is designed around a simple daily loop: capture tasks quickly, choose a small Today mainline, and keep review or batch work out of the way until it is time to process it.

The app is built with Next.js, React, Tailwind CSS, and Tauri. It can run as a browser-based development app or as a packaged macOS desktop app.

## Highlights

- Quick capture with multi-line task input and keyboard shortcuts.
- Today mainline for the few tasks that should stay visible.
- Inbox, Today, Review, and Batch task lanes.
- Project and tag management.
- Collapsible Pomodoro timer and utility toolbox.
- Local-first persistence with browser fallback and Tauri disk storage.
- Manual disk backups, import/export, and configurable data directory.
- macOS desktop packaging with `.app` and `.dmg` outputs.
- Experimental widget snapshot writer for a future native WidgetKit companion.

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Tauri 2
- TypeScript
- Rust for the Tauri shell

## Development

Install dependencies:

```bash
npm install
```

Run the browser development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the Tauri desktop app in development mode:

```bash
npm run tauri:dev
```

Build the static frontend:

```bash
npm run build
```

Build the macOS desktop bundle and DMG:

```bash
npm run tauri:build
```

## Data Storage

Focus Flow does not store user data inside the `.app` bundle.

By default, the Tauri app stores data under the macOS Application Support directory:

```text
~/Library/Application Support/ai.openclaw.focusflow/
```

The app can also migrate data to a user-selected directory from the toolbox. Import, reset, and data-directory migration actions attempt to create a disk backup first.

## macOS Widget Status

The app currently writes a widget-friendly snapshot file for future integration:

```text
focus-flow-widget-snapshot.json
```

A real macOS widget still requires a native WidgetKit extension and an App Group data-sharing setup. See `MAC_WIDGET_PLAN.md` for the current plan.

## Release Flow

This project batches changes before packaging. A release should pass:

```bash
npm run lint
npm run build
npm run tauri:build
```

See `RELEASE_PLAN.md` and `RELEASE_CHECKLIST.md` for the current release process.

## License

MIT
