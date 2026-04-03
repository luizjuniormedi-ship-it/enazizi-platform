import { BookOpen, CheckCircle2, Circle } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCurriculumBySpecialty, CURRICULUM_TOTAL_TOPICS } from "@/constants/baseCurriculum";

const CurriculumCoverageCard = () => {
  const { user } = useAuth();
  const [studiedTopics, setStudiedTopics] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("temas_estudados")
      .select("tema")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setStudiedTopics(data.map((t: any) => (t.tema || "").toLowerCase()));
      });
  }, [user]);

  const curriculumBySpec = useMemo(() => getCurriculumBySpecialty(), []);

  const coverage = useMemo(() => {
    let covered = 0;
    const specCoverage: { name: string; total: number; done: number }[] = [];

    for (const [spec, topics] of Object.entries(curriculumBySpec)) {
      let done = 0;
      for (const topic of topics) {
        const isCovered = studiedTopics.some(
          (st) => st.includes(topic.toLowerCase().slice(0, 10)) || topic.toLowerCase().includes(st.slice(0, 10))
        );
        if (isCovered) {
          done++;
          covered++;
        }
      }
      specCoverage.push({ name: spec, total: topics.length, done });
    }

    specCoverage.sort((a, b) => (a.done / a.total) - (b.done / b.total));
    return { covered, total: CURRICULUM_TOTAL_TOPICS, specCoverage };
  }, [studiedTopics, curriculumBySpec]);

  const pct = coverage.total > 0 ? Math.round((coverage.covered / coverage.total) * 100) : 0;

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Cobertura do Cronograma</h3>
        </div>
        <span className="text-xs font-medium text-primary">{pct}%</span>
      </div>

      <Progress value={pct} className="h-2" />

      <p className="text-xs text-muted-foreground">
        {coverage.covered} de {coverage.total} temas cobertos
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-primary hover:underline"
      >
        {expanded ? "Ocultar detalhes" : "Ver por especialidade"}
      </button>

      {expanded && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {coverage.specCoverage.map((s) => {
            const specPct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
            return (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                {specPct === 100 ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-muted-foreground">{s.done}/{s.total}</span>
                <div className="w-16">
                  <Progress value={specPct} className="h-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CurriculumCoverageCard;
