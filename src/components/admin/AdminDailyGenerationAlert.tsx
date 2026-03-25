import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Database, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface GenerationLog {
  id: string;
  run_date: string;
  questions_generated: number;
  specialties_processed: any;
  status: string;
  created_at: string;
}

interface DifficultyCount {
  easy: number;
  medium: number;
  hard: number;
}

const AdminDailyGenerationAlert = () => {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [difficultyDist, setDifficultyDist] = useState<DifficultyCount>({ easy: 0, medium: 0, hard: 0 });
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [totalToday, setTotalToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [logsRes, questionsRes] = await Promise.all([
        supabase
          .from("daily_generation_log")
          .select("*")
          .eq("run_date", today)
          .order("created_at", { ascending: false }),
        supabase
          .from("questions_bank")
          .select("difficulty, topic")
          .eq("is_global", true)
          .gte("created_at", `${today}T00:00:00`),
      ]);

      const logData = (logsRes.data || []) as GenerationLog[];
      setLogs(logData);

      const questions = questionsRes.data || [];
      setTotalToday(questions.length);

      const diff: DifficultyCount = { easy: 0, medium: 0, hard: 0 };
      const topics: Record<string, number> = {};
      for (const q of questions) {
        const d = q.difficulty ?? 3;
        if (d <= 2) diff.easy++;
        else if (d <= 3) diff.medium++;
        else diff.hard++;
        const t = q.topic || "Sem tópico";
        topics[t] = (topics[t] || 0) + 1;
      }
      setDifficultyDist(diff);
      setTopicCounts(topics);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return null;

  const totalFromLogs = logs.reduce((s, l) => s + l.questions_generated, 0);
  const allSpecialties: string[] = [];
  for (const log of logs) {
    const sp = log.specialties_processed;
    if (Array.isArray(sp)) {
      for (const s of sp) allSpecialties.push(typeof s === "string" ? s : String(s));
    }
  }
  const uniqueSpecialties = [...new Set(allSpecialties)];

  const lastStatus = logs[0]?.status || "nenhum";
  const statusIcon = lastStatus === "success"
    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    : lastStatus === "error"
      ? <AlertTriangle className="h-4 w-4 text-destructive" />
      : <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;

  return (
    <div className="glass-card p-4 sm:p-5 border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold">Questões Geradas Hoje</h2>
        </div>
        <div className="sm:ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          {statusIcon}
          <span className="capitalize">{lastStatus === "success" ? "Concluído" : lastStatus === "error" ? "Erro" : lastStatus === "pending" ? "Pendente" : "Sem execução"}</span>
        </div>
      </div>

      {totalToday === 0 && logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma questão gerada automaticamente hoje.</p>
      ) : (
        <div className="space-y-3">
          {/* Main metrics */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalToday}</span>
              <span className="text-sm text-muted-foreground">questões</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{logs.length} execuç{logs.length === 1 ? "ão" : "ões"}</span>
            </div>
          </div>

          {/* Difficulty */}
          {totalToday > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Dificuldade:</span>
              {difficultyDist.easy > 0 && (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
                  Fácil: {difficultyDist.easy}
                </Badge>
              )}
              {difficultyDist.medium > 0 && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs">
                  Média: {difficultyDist.medium}
                </Badge>
              )}
              {difficultyDist.hard > 0 && (
                <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 text-xs">
                  Difícil: {difficultyDist.hard}
                </Badge>
              )}
            </div>
          )}

          {/* Specialties */}
          {uniqueSpecialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Especialidades:</span>
              {uniqueSpecialties.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          )}

          {/* Topic breakdown */}
          {Object.keys(topicCounts).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Tópicos:</span>
              {Object.entries(topicCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([t, c]) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t} ({c})
                  </Badge>
                ))}
              {Object.keys(topicCounts).length > 8 && (
                <span className="text-xs text-muted-foreground">+{Object.keys(topicCounts).length - 8} mais</span>
              )}
            </div>
          )}

          {/* Execution times */}
          {logs.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Horários:</span>
              {logs.map((l) => (
                <span key={l.id} className="font-mono">
                  {format(new Date(l.created_at), "HH:mm")} ({l.questions_generated}q)
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDailyGenerationAlert;
