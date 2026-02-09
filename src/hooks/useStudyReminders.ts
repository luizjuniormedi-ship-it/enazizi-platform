import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  time: string;
  subject: string;
  duration: string;
  type?: string;
}

interface DaySchedule {
  day: string;
  tasks: Task[];
}

const DAY_MAP: Record<string, number> = {
  Dom: 0, Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, "Sáb": 6, Sab: 6,
};

const REMINDER_KEY = "study-reminders-enabled";
const REMINDER_MINUTES_BEFORE = 5;

export function useStudyReminders(schedule: DaySchedule[]) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(REMINDER_KEY) === "true");
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const timersRef = useRef<number[]>([]);
  const { toast } = useToast();

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      toast({ title: "Navegador não suporta notificações", variant: "destructive" });
      return false;
    }
    if (Notification.permission === "granted") {
      setPermission("granted");
      return true;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") {
      toast({ title: "Permissão de notificação negada", description: "Habilite nas configurações do navegador.", variant: "destructive" });
      return false;
    }
    return true;
  }, [toast]);

  const toggle = useCallback(async () => {
    if (!enabled) {
      const granted = await requestPermission();
      if (!granted) return;
      setEnabled(true);
      localStorage.setItem(REMINDER_KEY, "true");
      toast({ title: "Lembretes ativados! 🔔", description: `Você será notificado ${REMINDER_MINUTES_BEFORE} min antes de cada bloco.` });
    } else {
      setEnabled(false);
      localStorage.setItem(REMINDER_KEY, "false");
      clearTimers();
      toast({ title: "Lembretes desativados" });
    }
  }, [enabled, requestPermission, clearTimers, toast]);

  // Schedule notifications for today's tasks
  useEffect(() => {
    if (!enabled || permission !== "granted" || schedule.length === 0) return;
    clearTimers();

    const now = new Date();
    const todayDow = now.getDay();

    const todaySchedule = schedule.find((d) => DAY_MAP[d.day] === todayDow);
    if (!todaySchedule) return;

    todaySchedule.tasks.forEach((task) => {
      const match = task.time.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return;

      const taskTime = new Date(now);
      taskTime.setHours(Number(match[1]), Number(match[2]), 0, 0);

      const reminderTime = taskTime.getTime() - REMINDER_MINUTES_BEFORE * 60 * 1000;
      const delay = reminderTime - now.getTime();

      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        const timer = window.setTimeout(() => {
          new Notification("📚 Hora de estudar!", {
            body: `${task.subject} começa em ${REMINDER_MINUTES_BEFORE} min (${task.time} - ${task.duration})`,
            icon: "/favicon.ico",
            tag: `study-${task.time}-${task.subject}`,
          });
        }, delay);
        timersRef.current.push(timer);
      }
    });

    return clearTimers;
  }, [enabled, permission, schedule, clearTimers]);

  return { enabled, toggle, permission };
}
