import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Database, Clock, CheckCircle2, AlertTriangle, Loader2, Globe, Bot } from "lucide-react";
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

interface BankTotals {
  total: number;
  real: number;
  ai: number;
}

const AdminDailyGenerationAlert = () => {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [difficultyDist, setDifficultyDist] = useState<DifficultyCount>({ easy: 0, medium: 0, hard: 0 });
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [totalToday, setTotalToday] = useState(0);
  const [todayReal, setTodayReal] = useState(0);
  const [todayAI, setTodayAI] = useState(0);
  const [bankTotals, setBankTotals] = useState<BankTotals>({ total: 0, real: 0, ai: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [logsRes, questionsRes, totalRes, realRes] = await Promise.all([
        supabase
          .from("daily_generation_log")
          .select("*")
          .eq("run_date", today)
          .order("created_at", { ascending: false }),
        supabase
          .from("questions_bank")
          .select("difficulty, topic, exam_bank_id, source_type, source_url")
          .eq("is_global", true)
          .gte("created_at", `${today}T00:00:00`),
        supabase
          .from("questions_bank")
          .select("*", { count: "exact", head: true })
          .eq("is_global", true),
        supabase
          .from("questions_bank")
          .select("*", { count: "exact", head: true })
          .eq("is_global", true)
          .or("exam_bank_id.not.is.null,source_type.eq.indexed_external,source_url.not.is.null"),
      ]);

      const logData = (logsRes.data || []) as GenerationLog[];
      setLogs(logData);

      const questions = questionsRes.data || [];
      setTotalToday(questions.length);

      let realCount = 0;
      let aiCount = 0;
      const diff: DifficultyCount = { easy: 0, medium: 0, hard: 0 };
      const topics: Record<string, number> = {};

      for (const q of questions) {
        const isReal = q.exam_bank_id || q.source_type === "indexed_external" || q.source_url;
        if (isReal) realCount++;
        else aiCount++;

        const d = q.difficulty ?? 3;
        if (d <= 2) diff.easy++;
        else if (d <= 3) diff.medium++;
        else diff.hard++;
        const t = q.topic || "Sem tópico";
        topics[t] = (topics[t] || 0) + 1;
      }

      setTodayReal(realCount);
      setTodayAI(aiCount);
      setDifficultyDist(diff);
      setTopicCounts(topics);

      const bankTotal = totalRes.count || 0;
      const bankReal = realRes.count || 0;
      setBankTotals({ total: bankTotal, real: bankReal, ai: bankTotal - bankReal });

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return null;

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

  const realPct = bankTotals.total > 0 ? ((bankTotals.real / bankTotals.total) * 100).toFixed(1) : "0";

  return (
    <div className="glass-card p-4 sm:p-5 border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold">Questões no Banco Hoje</h2>
        </div>
        <div className="sm:ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          {statusIcon}
          <span className="capitalize">{lastStatus === "success" ? "Concluído" : lastStatus === "error" ? "Erro" : lastStatus === "pending" ? "Pendente" : "Sem execução"}</span>
        </div>
      </div>

      {totalToday === 0 && logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma questão adicionada ao banco hoje.</p>
      ) : (
        <div className="space-y-3">
          {/* Main metrics with real vs AI */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalToday}</span>
              <span className="text-sm text-muted-foreground">questões hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{logs.length} execuç{logs.length === 1 ? "ão" : "ões"}</span>
            </div>
          </div>

          {/* Real vs AI breakdown */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs gap-1">
              <Globe className="h-3 w-3" />
              Reais (provas oficiais): {todayReal}
            </Badge>
            <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs gap-1">
              <Bot className="h-3 w-3" />
              Geradas por IA: {todayAI}
            </Badge>
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

      {/* Bank totals summary */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground font-medium">Total no banco:</span>
          <span className="font-bold text-sm">{bankTotals.total.toLocaleString()}</span>
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
            <Globe className="h-2.5 w-2.5" />
            {bankTotals.real.toLocaleString()} reais
          </Badge>
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] gap-1">
            <Bot className="h-2.5 w-2.5" />
            {bankTotals.ai.toLocaleString()} IA
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {realPct}% real
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default AdminDailyGenerationAlert;
