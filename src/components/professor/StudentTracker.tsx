import { useState, useCallback, useEffect } from "react";
import { User, Search, Loader2, BarChart3, AlertTriangle, BookOpen, Target, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const FACULDADES = ["UNIG", "Estácio", "Outra"];

interface StudentProfile {
  user_id: string;
  display_name: string;
  email: string;
  faculdade: string | null;
  periodo: number | null;
}

interface StudentDetail {
  profile: StudentProfile;
  domain_scores: { specialty: string; domain_score: number; questions_answered: number; correct_answers: number; errors_count: number }[];
  error_topics: { tema: string; vezes_errado: number; categoria_erro: string | null }[];
  study_performance: { questoes_respondidas: number; taxa_acerto: number } | null;
  gamification: { xp: number; level: number; current_streak: number } | null;
  simulado_results: { title: string; score: number | null; status: string; finished_at: string | null }[];
  quotas: { questions_used: number; questions_limit: number } | null;
}

const StudentTracker = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [faculdade, setFaculdade] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-simulado`;

  const callAPI = useCallback(async (body: Record<string, unknown>) => {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Erro");
    return data;
  }, [session, API_URL]);

  const loadStudents = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await callAPI({
        action: "get_students",
        faculdade: faculdade && faculdade !== "all" ? faculdade : undefined,
        periodo: periodo && periodo !== "all" ? parseInt(periodo) : undefined,
      });
      setStudents(res.students || []);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [session, callAPI, faculdade, periodo, toast]);

  // Auto-load students on mount and when filters change
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const loadStudentDetail = useCallback(async (userId: string) => {
    if (!session) return;
    setLoadingDetail(true);
    setSelectedStudent(userId);
    try {
      const res = await callAPI({ action: "student_detail", student_id: userId });
      setDetail(res);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setLoadingDetail(false);
    }
  }, [session, callAPI, toast]);

  const filteredStudents = students.filter((s) =>
    (s.display_name || s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgDomain = detail?.domain_scores && detail.domain_scores.length > 0
    ? Math.round(detail.domain_scores.reduce((s, d) => s + d.domain_score, 0) / detail.domain_scores.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Filters + Search */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Faculdade</label>
          <Select value={faculdade} onValueChange={setFaculdade}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {FACULDADES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Período</label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={loadStudents} disabled={loading} size="sm" className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Buscar Alunos
        </Button>
      </div>

      {students.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Student list */}
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {students.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Clique em "Buscar Alunos" para listar.</p>
              </CardContent>
            </Card>
          )}
          {filteredStudents.map((s) => (
            <button
              key={s.user_id}
              onClick={() => loadStudentDetail(s.user_id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedStudent === s.user_id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <p className="font-medium text-sm truncate">{s.display_name || s.email}</p>
              <p className="text-[11px] text-muted-foreground">
                {s.faculdade || "Sem faculdade"}{s.periodo ? ` • ${s.periodo}º período` : ""}
              </p>
            </button>
          ))}
        </div>

        {/* Student detail */}
        <div className="lg:col-span-2 space-y-4">
          {loadingDetail && (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
          )}

          {!loadingDetail && !detail && (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Selecione um aluno para ver os detalhes.</p>
              </CardContent>
            </Card>
          )}

          {!loadingDetail && detail && (
            <>
              {/* Header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{detail.profile.display_name || detail.profile.email}</h3>
                      <p className="text-sm text-muted-foreground">
                        {detail.profile.faculdade || "—"}{detail.profile.periodo ? ` • ${detail.profile.periodo}º período` : ""} • {detail.profile.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <Target className="h-4 w-4 mx-auto text-primary mb-1" />
                    <p className="text-lg font-bold">{avgDomain}%</p>
                    <p className="text-[10px] text-muted-foreground">Score Médio</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <BookOpen className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                    <p className="text-lg font-bold">{detail.study_performance?.questoes_respondidas || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Questões</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <TrendingUp className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                    <p className="text-lg font-bold">{detail.gamification?.current_streak || 0}d</p>
                    <p className="text-[10px] text-muted-foreground">Streak</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <AlertTriangle className="h-4 w-4 mx-auto text-destructive mb-1" />
                    <p className="text-lg font-bold">{detail.error_topics.reduce((s, e) => s + e.vezes_errado, 0)}</p>
                    <p className="text-[10px] text-muted-foreground">Total Erros</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quotas */}
              {detail.quotas && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Uso de Cota</span>
                      <span className="font-medium">{detail.quotas.questions_used}/{detail.quotas.questions_limit} questões</span>
                    </div>
                    <Progress value={(detail.quotas.questions_used / Math.max(detail.quotas.questions_limit, 1)) * 100} className="h-2" />
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Domain scores */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Maestria por Especialidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                    {detail.domain_scores.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem dados</p>
                    ) : (
                      detail.domain_scores
                        .sort((a, b) => b.domain_score - a.domain_score)
                        .map((d) => (
                          <div key={d.specialty}>
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span className="truncate">{d.specialty}</span>
                              <span className={`font-bold ${d.domain_score >= 70 ? "text-emerald-500" : d.domain_score >= 50 ? "text-amber-500" : "text-destructive"}`}>
                                {d.domain_score}%
                              </span>
                            </div>
                            <Progress value={d.domain_score} className="h-1.5" />
                          </div>
                        ))
                    )}
                  </CardContent>
                </Card>

                {/* Error topics */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Principais Erros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                    {detail.error_topics.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum erro registrado</p>
                    ) : (
                      detail.error_topics.slice(0, 10).map((e, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm truncate flex-1">{e.tema}</span>
                          <Badge variant="destructive" className="text-[10px] ml-2">{e.vezes_errado}x</Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Simulado results */}
              {detail.simulado_results.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Simulados Realizados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {detail.simulado_results.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{r.title}</p>
                            {r.finished_at && <p className="text-[10px] text-muted-foreground">{new Date(r.finished_at).toLocaleDateString("pt-BR")}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={r.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                              {r.status === "completed" ? "Concluído" : "Pendente"}
                            </Badge>
                            {r.score !== null && (
                              <span className={`text-sm font-bold ${r.score >= 70 ? "text-emerald-500" : r.score >= 50 ? "text-amber-500" : "text-destructive"}`}>
                                {r.score}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentTracker;
