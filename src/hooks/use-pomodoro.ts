"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POMODORO_SECONDS, type PomodoroState } from "@/lib/focus-flow-model";
import { notifyPomodoroComplete, notifyRestReminder } from "@/lib/notifications";

type UsePomodoroOptions = {
  onFocusComplete: (taskLabel?: string) => void;
  getTaskLabel: (taskId: string) => string | undefined;
};

export function usePomodoro({ onFocusComplete, getTaskLabel }: UsePomodoroOptions) {
  const [pomodoro, setPomodoro] = useState<PomodoroState>({ running: false, secondsLeft: POMODORO_SECONDS });
  const [showRestReminder, setShowRestReminder] = useState(false);
  const [restReminderTask, setRestReminderTask] = useState("");
  const notificationSentRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    if (!pomodoro.running) return;
    const timer = setInterval(
      () =>
        setPomodoro((prev) =>
          prev.secondsLeft <= 1
            ? { ...prev, running: false, secondsLeft: 0 }
            : { ...prev, secondsLeft: prev.secondsLeft - 1 },
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, [pomodoro.running]);

  // Scroll to top when focus starts
  useEffect(() => {
    if (!pomodoro.running) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pomodoro.running]);

  // Completion notification
  useEffect(() => {
    if (pomodoro.secondsLeft !== 0 || notificationSentRef.current) return;
    notificationSentRef.current = true;
    const taskLabel = pomodoro.taskId ? getTaskLabel(pomodoro.taskId) : undefined;
    onFocusComplete(taskLabel);
    queueMicrotask(() => {
      setRestReminderTask(taskLabel || "");
      setShowRestReminder(true);
    });
    void notifyRestReminder(taskLabel);
    void notifyPomodoroComplete(taskLabel);
  }, [pomodoro.secondsLeft, pomodoro.taskId, getTaskLabel, onFocusComplete]);

  const startPomodoro = useCallback((taskId?: string) => {
    notificationSentRef.current = false;
    setShowRestReminder(false);
    setRestReminderTask("");
    setPomodoro({ running: true, secondsLeft: POMODORO_SECONDS, taskId });
  }, []);

  const stopPomodoro = useCallback(() => {
    setPomodoro((prev) => ({ ...prev, running: false }));
  }, []);

  const resetPomodoro = useCallback(() => {
    notificationSentRef.current = false;
    setPomodoro({ running: false, secondsLeft: POMODORO_SECONDS });
  }, []);

  const acknowledgeRest = useCallback(() => {
    setShowRestReminder(false);
    setRestReminderTask("");
  }, []);

  const dismissRest = useCallback(() => {
    setShowRestReminder(false);
    setRestReminderTask("");
  }, []);

  return {
    pomodoro,
    showRestReminder,
    restReminderTask,
    startPomodoro,
    stopPomodoro,
    resetPomodoro,
    acknowledgeRest,
    dismissRest,
  };
}
