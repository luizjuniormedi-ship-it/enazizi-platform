import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare, BookOpen, Layers, ClipboardList,
  Stethoscope, HeartPulse, ChevronRight,
} from "lucide-react";

const MODULES = [
  { label: "Tutor IA", path: "/dashboard/chatgpt", icon: MessageSquare, color: "text-primary" },
  { label: "Questões", path: "/dashboard/banco-questoes", icon: BookOpen, color: "text-blue-500" },
  { label: "Flashcards", path: "/dashboard/flashcards", icon: Layers, color: "text-violet-500" },
  { label: "Simulados", path: "/dashboard/simulados", icon: ClipboardList, color: "text-emerald-500" },
  { label: "Plantão", path: "/dashboard/simulacao-clinica", icon: Stethoscope, color: "text-teal-500" },
  { label: "Anamnese", path: "/dashboard/anamnese", icon: HeartPulse, color: "text-rose-500" },
];

export default function FreeStudyCard() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">Estudo Livre</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.path}
                onClick={() => navigate(mod.path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted hover:border-primary/30 transition-all group"
              >
                <Icon className={`h-5 w-5 ${mod.color}`} />
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight text-center">
                  {mod.label}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
