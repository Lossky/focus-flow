# Focus Flow macOS Widget Plan

## Goal

Provide a small macOS widget that shows the current Today mainline and lets the user jump back into Focus Flow quickly.

## Recommended Approach

Focus Flow is a Tauri desktop app, but macOS widgets are native WidgetKit extensions. The safest path is to keep the Tauri app as the primary UI and add a small native Swift/WidgetKit companion target later.

## Data Boundary

- The Tauri app should continue to own task editing and persistence.
- A widget should read a compact snapshot only, for example `widget-snapshot.json`.
- The snapshot should include only the fields a widget needs: app version, exported time, Today items, counts, and storage health.
- If the app is sandboxed or distributed broadly, the shared file should live in an App Group container instead of the current app data directory.

## Widget Shapes

- Small: top 1 Today mainline item and current count.
- Medium: top 3 Today items, Inbox count, Review count.
- Large: Today, Inbox triage summary, and last export time.

## Interaction Model

- Tapping the widget opens Focus Flow.
- Quick-add from a widget should be deferred until a native extension exists. WidgetKit is not a replacement for the main input UI.
- Later we can add a custom URL scheme or Tauri deep-link plugin so a widget can open `focusflow://capture` or `focusflow://today`.

## Implementation Phases

1. Add a snapshot writer in the Tauri app that mirrors Today/counts to a widget-friendly JSON file. Status: implemented in the app as `focus-flow-widget-snapshot.json` under the current AppData directory.
2. Create a native macOS WidgetKit extension in Xcode that reads the snapshot and renders Today items. Status: pending; the current repo does not yet include an Xcode project or WidgetKit target.
3. Add App Group sharing when signing/notarization is ready.
4. Add deep links from widget taps into Focus Flow.

## Current Snapshot Contract

Prototype snapshot file:

```text
focus-flow-widget-snapshot.json
```

Current fields:

- `version`: snapshot schema version.
- `generatedAt`: ISO timestamp.
- `storage.mode`: `disk`, `local`, or `loading`.
- `storage.healthy`: `true` when the desktop app is using disk storage.
- `counts`: Inbox, Today, Review, Batch, and Mainline counts.
- `todayItems`: up to 6 Today items, sorted for widget display.
- `mainlineItems`: up to 6 mainline items.
- `nextItem`: first mainline item, falling back to first Today item.

For a real signed widget, this snapshot should move to an App Group container so the WidgetKit extension can read it reliably.

## Notes

This should not be implemented as web UI inside Tauri. It needs a native WidgetKit extension to behave like a real macOS widget.
