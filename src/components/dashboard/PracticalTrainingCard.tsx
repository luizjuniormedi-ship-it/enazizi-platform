import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, HeartPulse, ClipboardCheck, ChevronRight } from "lucide-react";
import { useStudyEngine } from "@/hooks/useStudyEngine";
import { buildStudyPath } from "@/lib/studyRouter";

const CLINICAL_MODULES = [
  {
    label: "Plantão",
    desc: "Simulação de plantão com casos clínicos",
    path: "/dashboard/simulacao-clinica",
    icon: Stethoscope,
    iconColor: "text-teal-500",
    bgColor: "bg-teal-500/5 hover:bg-teal-500/10 border-teal-500/10",
  },
  {
    label: "Anamnese",
    desc: "Treino de anamnese com paciente virtual",
    path: "/dashboard/anamnese",
    icon: HeartPulse,
    iconColor: "text-rose-500",
    bgColor: "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/10",
  },
];

export default function PracticalTrainingCard() {
  const navigate = useNavigate();
  const { data: recommendations } = useStudyEngine();

  const clinicalRecs = (recommendations || []).filter((r) => r.type === "clinical");
  const hasRecommendation = clinicalRecs.length > 0;

  return (
    <Card className="border-teal-500/15">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardCheck className="h-4 w-4 text-teal-500" />
          Treino Clínico
          {hasRecommendation && (
            <span className="text-[10px] text-teal-500 font-normal ml-1">
              • Recomendado pelo sistema
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Recommendation banner */}
        {clinicalRecs.length > 0 && (
          <div
            className="mb-3 p-2.5 rounded-lg bg-teal-500/5 border border-teal-500/15 cursor-pointer hover:bg-teal-500/10 transition-colors"
            onClick={() => navigate(buildStudyPath(clinicalRecs[0]))}
          >
            <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
              📋 {clinicalRecs[0].topic}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{clinicalRecs[0].reason}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {CLINICAL_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.path}
                onClick={() => navigate(mod.path)}
                className={`flex flex-col items-start gap-2 p-3 rounded-xl border transition-all text-left ${mod.bgColor}`}
              >
                <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                <div>
                  <p className="text-xs font-semibold">{mod.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{mod.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
