import type { PhysicalPosition, PhysicalSize } from "@tauri-apps/api/window";

type CornerWindowSnapshot = {
  position: PhysicalPosition;
  size: PhysicalSize;
  alwaysOnTop: boolean;
};

const CORNER_WINDOW_WIDTH = 360;
const CORNER_WINDOW_HEIGHT = 460;
const CORNER_WINDOW_MARGIN = 18;

let cornerWindowSnapshot: CornerWindowSnapshot | null = null;

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getAlwaysOnTopState(): Promise<boolean | null> {
  if (!isTauriRuntime()) return null;

  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow().isAlwaysOnTop();
}

export async function setAlwaysOnTopState(enabled: boolean): Promise<boolean | null> {
  if (!isTauriRuntime()) return null;

  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().setAlwaysOnTop(enabled);
  return getCurrentWindow().isAlwaysOnTop();
}

export async function enterCornerWindowMode(): Promise<boolean | null> {
  if (!isTauriRuntime()) return null;

  try {
    const { getCurrentWindow, currentMonitor, LogicalPosition, LogicalSize } = await import("@tauri-apps/api/window");
    const appWindow = getCurrentWindow();

    if (!cornerWindowSnapshot) {
      cornerWindowSnapshot = {
        position: await appWindow.outerPosition(),
        size: await appWindow.innerSize(),
        alwaysOnTop: await appWindow.isAlwaysOnTop(),
      };
    }

    await appWindow.setSize(new LogicalSize(CORNER_WINDOW_WIDTH, CORNER_WINDOW_HEIGHT));

    const monitor = await currentMonitor();
    if (monitor) {
      const scaleFactor = await appWindow.scaleFactor();
      const workPosition = monitor.workArea.position.toLogical(scaleFactor);
      const workSize = monitor.workArea.size.toLogical(scaleFactor);
      const x = Math.max(workPosition.x, workPosition.x + workSize.width - CORNER_WINDOW_WIDTH - CORNER_WINDOW_MARGIN);
      const y = Math.max(workPosition.y, workPosition.y + CORNER_WINDOW_MARGIN);
      await appWindow.setPosition(new LogicalPosition(x, y));
    }

    await appWindow.setAlwaysOnTop(true);
    return true;
  } catch (error) {
    console.error("Failed to enter corner window mode", error);
    return false;
  }
}

export async function exitCornerWindowMode(): Promise<boolean | null> {
  if (!isTauriRuntime()) return null;

  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const appWindow = getCurrentWindow();
    const snapshot = cornerWindowSnapshot;
    cornerWindowSnapshot = null;

    if (!snapshot) {
      await appWindow.setAlwaysOnTop(false);
      return true;
    }

    await appWindow.setSize(snapshot.size);
    await appWindow.setPosition(snapshot.position);
    await appWindow.setAlwaysOnTop(snapshot.alwaysOnTop);
    return true;
  } catch (error) {
    console.error("Failed to exit corner window mode", error);
    return false;
  }
}
