export async function getAlwaysOnTopState(): Promise<boolean | null> {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return null;

  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow().isAlwaysOnTop();
}

export async function setAlwaysOnTopState(enabled: boolean): Promise<boolean | null> {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return null;

  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().setAlwaysOnTop(enabled);
  return getCurrentWindow().isAlwaysOnTop();
}
