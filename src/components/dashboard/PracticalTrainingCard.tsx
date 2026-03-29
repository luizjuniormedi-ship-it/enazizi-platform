import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, HeartPulse, ChevronRight } from "lucide-react";
import { useStudyEngine } from "@/hooks/useStudyEngine";

export default function PracticalTrainingCard() {
  const navigate = useNavigate();
  const { data: recommendations } = useStudyEngine();

  const clinical = (recommendations || []).filter((r) => r.type === "clinical");

  if (clinical.length === 0) return null;

  return (
    <Card className="border-teal-500/20">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Stethoscope className="h-4 w-4 text-teal-500" />
          Prática Clínica Sugerida
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {clinical.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/10 cursor-pointer transition-colors group"
            onClick={() => navigate(item.targetPath)}
          >
            {item.targetModule === "anamnese" ? (
              <HeartPulse className="h-4 w-4 text-rose-500 shrink-0" />
            ) : (
              <Stethoscope className="h-4 w-4 text-teal-500 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{item.topic}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.reason}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
