import { useState, useEffect, useMemo } from "react";
import {
  BookMarked, Users, CheckCircle, AlertTriangle, Clock, TrendingUp,
  ChevronDown, ChevronUp, Loader2, Calendar, Target, XCircle, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface MentorPlan {
  id: string;
  name: string;
  description: string | null;
  exam_date: string | null;
  status: string;
  topics?: { id: string; topic: string; subtopic: string | null; priority: number }[];
  targets?: { id: string; target_type: string; target_id: string }[];
}

interface StudentRow {
  user_id: string;
  name: string;
  topicsStarted: number;
  topicsCompleted: number;
  totalTopics: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  studyMinutes: number;
  status: "concluiu" | "andamento" | "nao_iniciou" | "atrasado";
}

interface TopicPerf {
  topic: string;
  subtopic: string | null;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
  studentsStarted: number;
  totalStudents: number;
}

interface Props {
  plan: MentorPlan;
  onBack: () => void;
}

const MentorshipReport = ({ plan, onBack }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [topicPerfs, setTopicPerfs] = useState<TopicPerf[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const daysUntilExam = plan.exam_date
    ? Math.ceil((new Date(plan.exam_date).getTime() - Date.now()) / 86400000)
    : null;

  useEffect(() => {
    loadReport();
  }, [plan.id]);

  const loadReport = async () => {
    setLoading(true);

    // Get all progress entries for this plan
    const { data: progressRows } = await supabase
      .from("mentor_theme_plan_progress")
      .select("*, mentor_theme_plan_topics(topic, subtopic)")
      .eq("plan_id", plan.id);

    if (!progressRows || progressRows.length === 0) {
      setStudents([]);
      setTopicPerfs([]);
      setLoading(false);
      return;
    }

    // Get student names
    const userIds = [...new Set(progressRows.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);
    const nameMap: Record<string, string> = {};
    (profiles || []).forEach(p => { nameMap[p.user_id] = p.display_name || "Aluno"; });

    const totalTopics = plan.topics?.length || 0;

    // Build student rows
    const studentMap: Record<string, StudentRow> = {};
    for (const row of progressRows) {
      if (!studentMap[row.user_id]) {
        studentMap[row.user_id] = {
          user_id: row.user_id,
          name: nameMap[row.user_id] || "Aluno",
          topicsStarted: 0,
          topicsCompleted: 0,
          totalTopics,
          questionsAnswered: 0,
          correctAnswers: 0,
          accuracy: 0,
          studyMinutes: 0,
          status: "nao_iniciou",
        };
      }
      const s = studentMap[row.user_id];
      s.questionsAnswered += row.questions_answered || 0;
      s.correctAnswers += row.correct_answers || 0;
      s.studyMinutes += row.study_time_minutes || 0;
      if (row.status === "completed") s.topicsCompleted++;
      if (row.status !== "pending") s.topicsStarted++;
    }

    const studentList = Object.values(studentMap).map(s => {
      s.accuracy = s.questionsAnswered > 0 ? Math.round((s.correctAnswers / s.questionsAnswered) * 100) : 0;
      if (s.topicsCompleted === s.totalTopics && s.totalTopics > 0) s.status = "concluiu";
      else if (s.topicsStarted > 0) s.status = "andamento";
      else s.status = "nao_iniciou";
      // Mark as "atrasado" if exam is close and not started
      if (daysUntilExam !== null && daysUntilExam <= 7 && s.topicsStarted === 0) s.status = "atrasado";
      return s;
    });

    // Build topic performance
    const topicMap: Record<string, TopicPerf> = {};
    for (const row of progressRows) {
      const t = (row as any).mentor_theme_plan_topics;
      const key = t?.topic || "Tema";
      if (!topicMap[key]) {
        topicMap[key] = {
          topic: t?.topic || "Tema",
          subtopic: t?.subtopic || null,
          totalQuestions: 0,
          totalCorrect: 0,
          accuracy: 0,
          studentsStarted: 0,
          totalStudents: userIds.length,
        };
      }
      topicMap[key].totalQuestions += row.questions_answered || 0;
      topicMap[key].totalCorrect += row.correct_answers || 0;
      if (row.status !== "pending") topicMap[key].studentsStarted++;
    }
    const topicList = Object.values(topicMap).map(t => {
      t.accuracy = t.totalQuestions > 0 ? Math.round((t.totalCorrect / t.totalQuestions) * 100) : 0;
      return t;
    });

    setStudents(studentList.sort((a, b) => a.name.localeCompare(b.name)));
    setTopicPerfs(topicList);
    setLoading(false);
  };

  const groups = useMemo(() => {
    const g = {
      concluiu: students.filter(s => s.status === "concluiu"),
      andamento: students.filter(s => s.status === "andamento"),
      nao_iniciou: students.filter(s => s.status === "nao_iniciou"),
      atrasado: students.filter(s => s.status === "atrasado"),
    };
    return g;
  }, [students]);

  const totalStudents = students.length;
  const startedPct = totalStudents > 0
    ? Math.round(((groups.concluiu.length + groups.andamento.length) / totalStudents) * 100) : 0;
  const completedPct = totalStudents > 0
    ? Math.round((groups.concluiu.length / totalStudents) * 100) : 0;

  // Alerts
  const alerts: string[] = [];
  const lowAccuracy = students.filter(s => s.questionsAnswered >= 5 && s.accuracy < 50);
  if (lowAccuracy.length > 0) alerts.push(`⚠️ ${lowAccuracy.length} aluno(s) com acurácia abaixo de 50%`);
  if (groups.atrasado.length > 0) alerts.push(`🔴 ${groups.atrasado.length} aluno(s) atrasado(s) com prova próxima`);
  if (groups.nao_iniciou.length > 0) alerts.push(`🟡 ${groups.nao_iniciou.length} aluno(s) não iniciaram`);
  const weakTopics = topicPerfs.filter(t => t.totalQuestions >= 5 && t.accuracy < 50);
  if (weakTopics.length > 0) alerts.push(`📉 Tema(s) crítico(s): ${weakTopics.map(t => `${t.topic} (${t.accuracy}%)`).join(", ")}`);

  const toggleGroup = (g: string) => setExpandedGroup(expandedGroup === g ? null : g);

  const groupConfig = [
    { key: "concluiu", label: "Concluíram", icon: "🟢", color: "text-emerald-600" },
    { key: "andamento", label: "Em andamento", icon: "🟡", color: "text-amber-600" },
    { key: "nao_iniciou", label: "Não iniciaram", icon: "🔴", color: "text-red-600" },
    { key: "atrasado", label: "Atrasados", icon: "⚠️", color: "text-destructive" },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-primary" />
            {plan.name}
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            {plan.exam_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Prova: {new Date(plan.exam_date).toLocaleDateString("pt-BR")}
                {daysUntilExam !== null && ` (${daysUntilExam <= 0 ? "HOJE!" : `${daysUntilExam}d`})`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" /> {plan.topics?.length || 0} temas
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>Voltar</Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{totalStudents}</div>
            <div className="text-[10px] text-muted-foreground">Total alunos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
            <div className="text-xl font-bold">{startedPct}%</div>
            <div className="text-[10px] text-muted-foreground">Iniciaram</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <div className="text-xl font-bold">{completedPct}%</div>
            <div className="text-[10px] text-muted-foreground">Concluíram</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-destructive" />
            <div className="text-xl font-bold">{groups.atrasado.length + groups.nao_iniciou.length}</div>
            <div className="text-[10px] text-muted-foreground">Precisam atenção</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso geral</span>
          <span>{completedPct}%</span>
        </div>
        <Progress value={completedPct} className="h-2" />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 space-y-1">
            <h4 className="text-xs font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              Alertas
            </h4>
            {alerts.map((a, i) => (
              <p key={i} className="text-xs text-muted-foreground">{a}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Student groups */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Status dos alunos</h3>
        {groupConfig.map(({ key, label, icon, color }) => {
          const list = groups[key];
          if (list.length === 0) return null;
          const isOpen = expandedGroup === key;
          return (
            <Card key={key}>
              <button
                className="w-full flex items-center justify-between p-3 text-left"
                onClick={() => toggleGroup(key)}
              >
                <span className={`text-sm font-medium flex items-center gap-2 ${color}`}>
                  <span>{icon}</span> {label} ({list.length})
                </span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {isOpen && (
                <CardContent className="pt-0 px-3 pb-3 space-y-2">
                  {list.map(s => (
                    <div key={s.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{s.name}</p>
                        <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                          <span>{s.topicsStarted}/{s.totalTopics} temas</span>
                          {s.questionsAnswered > 0 && (
                            <>
                              <span>•</span>
                              <span>{s.accuracy}% acurácia</span>
                              <span>•</span>
                              <span>{s.questionsAnswered} questões</span>
                            </>
                          )}
                          {s.studyMinutes > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" /> {s.studyMinutes}min
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 w-12">
                        <Progress value={s.totalTopics > 0 ? (s.topicsStarted / s.totalTopics) * 100 : 0} className="h-1" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Topic performance */}
      {topicPerfs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-primary" />
            Desempenho por tema
          </h3>
          <div className="space-y-1.5">
            {topicPerfs.map((t, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">
                        {t.topic}{t.subtopic ? ` → ${t.subtopic}` : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.studentsStarted}/{t.totalStudents} alunos iniciaram • {t.totalQuestions} questões
                      </p>
                    </div>
                    <Badge
                      variant={t.accuracy >= 70 ? "default" : t.accuracy >= 50 ? "secondary" : "destructive"}
                      className="text-[10px]"
                    >
                      {t.totalQuestions > 0 ? `${t.accuracy}%` : "—"}
                    </Badge>
                  </div>
                  {t.totalQuestions > 0 && (
                    <Progress value={t.accuracy} className="h-1 mt-2" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalStudents === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Nenhum progresso registrado</p>
            <p className="text-xs">Os alunos verão os temas sugeridos no Dashboard e o Study Engine priorizará automaticamente.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MentorshipReport;
