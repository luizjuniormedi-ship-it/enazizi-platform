import { useEffect, useState } from "react";
import { GraduationCap, ChevronRight, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  calculateSpecialtyLevel,
  getLevelColor,
  getLevelBgColor,
  CORE_SPECIALTIES,
  type SpecialtyLevel,
} from "@/lib/specialtyLevels";

const SpecialtyLevelsCard = () => {
  const { user } = useAuth();
  const [levels, setLevels] = useState<SpecialtyLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("medical_domain_map")
        .select("specialty, domain_score, questions_answered, correct_answers, reviews_count, errors_count, clinical_cases_score")
        .eq("user_id", user.id);

      if (!data) {
        setLoading(false);
        return;
      }

      // Map existing data
      const domainMap = new Map(data.map((d: any) => [d.specialty, d]));

      // Calculate levels for core specialties
      const result = CORE_SPECIALTIES.map((spec) => {
        const domain = domainMap.get(spec);
        if (domain) {
          return calculateSpecialtyLevel(domain);
        }
        // No data yet
        return {
          specialty: spec,
          level: 0,
          levelName: "Iniciante",
          progress: 0,
          compositeScore: 0,
          details: { accuracy: 0, volume: 0, retention: 0, consistency: 0, practical: 0 },
        };
      });

      // Sort: highest level first, then by composite score
      result.sort((a, b) => b.compositeScore - a.compositeScore);

      setLevels(result);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="glass-card p-5 space-y-3">
        <Skeleton className="h-5 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  const strongest = levels[0];
  const weakest = [...levels].sort((a, b) => a.compositeScore - b.compositeScore)[0];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Nível por Especialidade
        </h2>
        <Link
          to="/dashboard/mapa-dominio"
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
        >
          Ver detalhes <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {levels.map((spec) => {
          const isStrongest = spec === strongest && spec.compositeScore > 0;
          const isWeakest = spec === weakest && levels.length > 1 && spec.compositeScore < strongest?.compositeScore;

          return (
            <div
              key={spec.specialty}
              className={`rounded-xl p-3 transition-colors ${getLevelBgColor(spec.level)}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm font-medium truncate ${getLevelColor(spec.level)}`}>
                    {spec.specialty === "Ginecologia e Obstetrícia" ? "GO" : spec.specialty}
                  </span>
                  {isStrongest && spec.compositeScore > 0 && (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  )}
                  {isWeakest && spec.compositeScore > 0 && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                </div>
                <span className={`text-xs font-semibold ${getLevelColor(spec.level)}`}>
                  {spec.levelName}
                </span>
              </div>
              <Progress value={spec.progress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-1">
                Score: {spec.compositeScore} · {spec.progress}% para o próximo nível
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary insight */}
      {strongest && strongest.compositeScore > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            {strongest.compositeScore > weakest?.compositeScore + 20
              ? `${strongest.specialty === "Ginecologia e Obstetrícia" ? "GO" : strongest.specialty} está forte · ${weakest?.specialty === "Ginecologia e Obstetrícia" ? "GO" : weakest?.specialty} precisa de reforço`
              : "Evolução equilibrada entre as especialidades 👏"}
          </p>
        </div>
      )}
    </div>
  );
};

export default SpecialtyLevelsCard;
