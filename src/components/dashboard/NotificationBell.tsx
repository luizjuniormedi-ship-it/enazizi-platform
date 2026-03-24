import { useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

const NotificationBell = () => {
  const { supported, permission, requestPermission, sendNotification } = usePushNotifications();
  const { toast } = useToast();
  const [animating, setAnimating] = useState(false);

  if (!supported) return null;

  const handleClick = async () => {
    if (permission === "granted") {
      // Send test notification
      setAnimating(true);
      sendNotification("🎓 ENAZIZI", {
        body: "Notificações ativas! Você receberá lembretes de estudo e conquistas.",
        tag: "test",
      });
      setTimeout(() => setAnimating(false), 1000);
      return;
    }

    if (permission === "denied") {
      toast({
        title: "Notificações bloqueadas",
        description: "Ative as notificações nas configurações do navegador.",
        variant: "destructive",
      });
      return;
    }

    const result = await requestPermission();
    if (result === "granted") {
      toast({ title: "Notificações ativadas! 🔔", description: "Você receberá lembretes de estudo." });
      sendNotification("🎓 ENAZIZI", { body: "Notificações configuradas com sucesso!", tag: "welcome" });
    } else {
      toast({ title: "Notificações negadas", description: "Você pode ativar depois nas configurações.", variant: "destructive" });
    }
  };

  const Icon = permission === "granted" ? (animating ? BellRing : Bell) : BellOff;

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-lg transition-colors ${
        permission === "granted"
          ? "text-primary hover:bg-primary/10"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${animating ? "animate-bounce" : ""}`}
      title={permission === "granted" ? "Notificações ativas" : "Ativar notificações"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

export default NotificationBell;
