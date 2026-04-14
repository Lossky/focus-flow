function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function notifyPomodoroComplete(taskContent?: string) {
  if (typeof window === "undefined") return;

  const title = "番茄钟完成";
  const body = taskContent ? `可以回来看一下：${taskContent}` : "这一轮专注结束了，可以回来收尾。";

  if (isTauriRuntime()) {
    try {
      const { isPermissionGranted, requestPermission, sendNotification } = await import("@tauri-apps/plugin-notification");
      const granted = await isPermissionGranted() || await requestPermission() === "granted";
      if (granted) sendNotification({ title, body });
      return;
    } catch (error) {
      console.error("Failed to send Tauri notification", error);
    }
  }

  if (!("Notification" in window)) return;
  try {
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission === "granted") new Notification(title, { body });
  } catch (error) {
    console.error("Failed to send browser notification", error);
  }
}

export async function notifyRestReminder(taskContent?: string) {
  if (typeof window === "undefined") return;

  const title = "该休息一下了";
  const body = taskContent ? `这轮已经结束，先离开一下：${taskContent}` : "你已经完成了一轮专注，先去休息一下吧。";

  if (isTauriRuntime()) {
    try {
      const { isPermissionGranted, requestPermission, sendNotification } = await import("@tauri-apps/plugin-notification");
      const granted = await isPermissionGranted() || await requestPermission() === "granted";
      if (granted) sendNotification({ title, body });
      return;
    } catch (error) {
      console.error("Failed to send Tauri rest reminder", error);
    }
  }

  if (!("Notification" in window)) return;
  try {
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission === "granted") new Notification(title, { body });
  } catch (error) {
    console.error("Failed to send browser rest reminder", error);
  }
}
