import { useState, useEffect } from "react";
import SmartPopup from "./SmartPopup";
import { Target, BarChart3, CalendarDays, Stethoscope, ClipboardList } from "lucide-react";

/**
 * Shows contextual popups ONE AT A TIME after the v2 onboarding.
 * Each popup has its own localStorage key so it only shows once.
 */
export default function DashboardSmartPopups() {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const popups = [
    { id: "v2_dashboard", priority: 1 },
    { id: "v2_approval", priority: 2 },
    { id: "v2_planner", priority: 3 },
    { id: "v2_diagnostic", priority: 4 },
    { id: "v2_clinical", priority: 5 },
  ];

  useEffect(() => {
    // Only show after v2 onboarding is done
    if (localStorage.getItem("enazizi_v2_onboarding_done") !== "true") return;

    // Find first popup not yet seen/dismissed
    for (const p of popups) {
      const key = `enazizi_popup_${p.id}`;
      const state = localStorage.getItem(key);
      if (!state || state === "seen") {
        setActivePopup(p.id);
        break;
      }
    }
  }, []);

  if (!activePopup) return null;

  return (
    <>
      {activePopup === "v2_dashboard" && (
        <SmartPopup
          id="v2_dashboard"
          title="Plano automático de estudo 📋"
          description="Agora o ENAZIZI gera seu plano diário automaticamente. O card 'Hoje você deve estudar' mostra exatamente o que fazer — é só clicar e começar!"
          icon={<Target className="h-5 w-5 text-primary" />}
          ctaLabel="Legal, vamos lá!"
        />
      )}
      {activePopup === "v2_approval" && (
        <SmartPopup
          id="v2_approval"
          title="Sua chance de aprovação 📊"
          description="O Approval Score calcula sua probabilidade de aprovação baseado em desempenho, consistência, simulados e revisões. Acompanhe-o diariamente!"
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
          ctaLabel="Quero ver meu score!"
        />
      )}
      {activePopup === "v2_planner" && (
        <SmartPopup
          id="v2_planner"
          title="Você está estudando… mas certo? 🤔"
          description="O Planner garante que você estude os temas certos, na ordem certa, no momento certo. Sem ele, tempo de estudo pode virar tempo perdido."
          icon={<CalendarDays className="h-5 w-5 text-primary" />}
          ctaLabel="Quero estudar certo!"
        />
      )}
      {activePopup === "v2_diagnostic" && (
        <SmartPopup
          id="v2_diagnostic"
          title="Plano mais preciso com nivelamento 🎯"
          description="Faça o diagnóstico para que o sistema identifique seus pontos fortes e fracos. Seu plano ficará muito mais personalizado!"
          icon={<Stethoscope className="h-5 w-5 text-primary" />}
          ctaLabel="Vou fazer!"
        />
      )}
      {activePopup === "v2_clinical" && (
        <SmartPopup
          id="v2_clinical"
          title="Treino clínico dentro do plano 🩺"
          description="Agora Plantão e Anamnese podem ser parte do seu plano guiado. O sistema sugere casos práticos baseados no seu progresso!"
          icon={<ClipboardList className="h-5 w-5 text-primary" />}
          ctaLabel="Entendi!"
        />
      )}
    </>
  );
}
