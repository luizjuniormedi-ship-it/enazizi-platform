import { useCallback, useEffect, useState } from "react";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [supported] = useState(() => "Notification" in window && "serviceWorker" in navigator);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [supported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!supported || permission !== "granted") return;

      // Use service worker if available for better reliability
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            icon: "/pwa-icon-192.png",
            badge: "/pwa-icon-192.png",
            vibrate: [100, 50, 100],
            ...options,
          });
        }).catch(() => {
          // Fallback to regular notification
          new Notification(title, { icon: "/pwa-icon-192.png", ...options });
        });
      } else {
        new Notification(title, { icon: "/pwa-icon-192.png", ...options });
      }
    },
    [supported, permission]
  );

  return { supported, permission, requestPermission, sendNotification };
}
