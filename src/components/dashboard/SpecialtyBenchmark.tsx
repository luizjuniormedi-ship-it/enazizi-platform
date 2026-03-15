import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Users, Award, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BenchmarkItem {
  specialty: string;
  userScore: number;
  percentile: number;
  average: number;
  median: number;
  totalUsers: number;
  userQuestions: number;
}

const getPercentileColor = (p: number) => {
  if (p >= 75) return "text-emerald-500";
  if (p >= 50) return "text-sky-500";
  if (p >= 25) return "text-amber-500";
  return "text-rose-500";
};

const getPercentileLabel = (p: number) => {
  if (p >= 90) return "Top 10%";
  if (p >= 75) return "Top 25%";
  if (p >= 50) return "Acima da média";
  if (p >= 25) return "Abaixo da média";
  return "Precisa melhorar";
};

const getProgressColor = (p: number) => {
  if (p >= 75) return "bg-emerald-500";
  if (p >= 50) return "bg-sky-500";
  if (p >= 25) return "bg-amber-500";
  return "bg-rose-500";
};

const SpecialtyBenchmark = () => {
  const { user } = useAuth();
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchBenchmarks = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;

        const res = await supabase.functions.invoke("benchmark-percentile");
        if (res.error) throw res.error;

        const data = res.data as { benchmarks: BenchmarkItem[] };
        setBenchmarks(data.benchmarks || []);
      } catch (err: any) {
        console.error("Benchmark error:", err);
        setError("Não foi possível carregar");
      } finally {
        setLoading(false);
      }
    };

    fetchBenchmarks();
  }, [user]);

  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Benchmark Comparativo</h3>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || benchmarks.length === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Benchmark Comparativo</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          {error || "Responda questões em pelo menos uma especialidade para ver seu benchmark. Dados comparativos requerem 2+ alunos."}
        </p>
      </div>
    );
  }

  // Global stats
  const avgPercentile = Math.round(benchmarks.reduce((a, b) => a + b.percentile, 0) / benchmarks.length);
  const bestSpecialty = benchmarks[0];
  const worstSpecialty = benchmarks[benchmarks.length - 1];
  const displayItems = expanded ? benchmarks : benchmarks.slice(0, 5);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Benchmark Comparativo</h3>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          Anônimo
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-primary/5 p-3 text-center">
          <div className={`text-2xl font-bold ${getPercentileColor(avgPercentile)}`}>
            P{avgPercentile}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">Percentil Médio</div>
        </div>
        <div className="rounded-lg bg-emerald-500/5 p-3 text-center">
          <div className="text-xs font-semibold text-emerald-600 truncate">{bestSpecialty.specialty}</div>
          <div className="text-lg font-bold text-emerald-500">P{bestSpecialty.percentile}</div>
          <div className="text-[10px] text-muted-foreground">Melhor</div>
        </div>
        <div className="rounded-lg bg-rose-500/5 p-3 text-center">
          <div className="text-xs font-semibold text-rose-600 truncate">{worstSpecialty.specialty}</div>
          <div className="text-lg font-bold text-rose-500">P{worstSpecialty.percentile}</div>
          <div className="text-[10px] text-muted-foreground">A melhorar</div>
        </div>
      </div>

      {/* Per-specialty list */}
      <div className="space-y-3">
        {displayItems.map((b) => (
          <div key={b.specialty} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate max-w-[55%]">{b.specialty}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${getPercentileColor(b.percentile)}`}>
                  {getPercentileLabel(b.percentile)}
                </span>
                <span className={`text-sm font-bold ${getPercentileColor(b.percentile)}`}>
                  P{b.percentile}
                </span>
              </div>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${getProgressColor(b.percentile)}`}
                style={{ width: `${b.percentile}%` }}
              />
              {/* Marker for average */}
              <div
                className="absolute top-0 h-full w-0.5 bg-foreground/30"
                style={{ left: `${Math.min(b.average, 100)}%` }}
                title={`Média: ${b.average}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Você: {b.userScore}pts • {b.userQuestions} questões</span>
              <span>Média: {b.average}pts • {b.totalUsers} alunos</span>
            </div>
          </div>
        ))}
      </div>

      {benchmarks.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>Mostrar menos <ChevronUp className="h-3 w-3 ml-1" /></>
          ) : (
            <>Ver todas ({benchmarks.length}) <ChevronDown className="h-3 w-3 ml-1" /></>
          )}
        </Button>
      )}
    </div>
  );
};

export default SpecialtyBenchmark;
