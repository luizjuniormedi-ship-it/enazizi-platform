import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Award, BarChart3, RotateCcw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistorySession {
  id: string;
  title: string;
  score: number | null;
  total_questions: number;
  created_at: string;
  finished_at: string | null;
  results_json: any;
  answers_json: any;
  status: string;
}

interface SimuladoHistoryProps {
  userId?: string;
  onRetryErrors: (sessionId: string) => void;
}

const SimuladoHistory = ({ userId, onRetryErrors }: SimuladoHistoryProps) => {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("exam_sessions")
        .select("id, title, score, total_questions, created_at, finished_at, results_json, answers_json, status")
        .eq("user_id", userId)
        .eq("status", "finished")
        .order("created_at", { ascending: false })
        .limit(20);
      setSessions((data as HistorySession[]) || []);
      setLoading(false);
    };
    fetchHistory();
  }, [userId]);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Carregando histórico...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">Nenhum simulado realizado ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">Complete seu primeiro simulado para ver o histórico aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map(s => {
        const score = Math.round(s.score ?? 0);
        const results = (typeof s.results_json === "object" && s.results_json) ? s.results_json as Record<string, { correct: number; total: number }> : {};
        const hasErrors = score < 100;
        const isExpanded = expandedId === s.id;

        return (
          <div key={s.id} className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  score >= 70 ? "bg-green-500/15 text-green-500" : score >= 50 ? "bg-yellow-500/15 text-yellow-500" : "bg-destructive/15 text-destructive"
                }`}>
                  {score}%
                </div>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(s.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    {" • "}{s.total_questions} questões
                  </p>
                </div>
              </div>
              {hasErrors && (
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={(e) => { e.stopPropagation(); onRetryErrors(s.id); }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Revisar erros
                </Button>
              )}
            </div>

            {isExpanded && Object.keys(results).length > 0 && (
              <div className="pt-2 border-t border-border mt-2 space-y-2">
                {Object.entries(results).map(([area, { correct, total }]) => {
                  const pct = Math.round((correct / total) * 100);
                  return (
                    <div key={area}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span>{area}</span>
                        <span className="text-muted-foreground">{correct}/{total} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary">
                        <div className={`h-full rounded-full ${pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-destructive"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SimuladoHistory;
