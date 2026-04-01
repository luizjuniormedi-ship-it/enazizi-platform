import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, CartesianGrid } from "recharts";
import { Loader2, TrendingDown, TrendingUp, Sparkles, AlertTriangle, CheckCircle, Users, FileText, Target, Brain, Download, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportProfessorBIReport } from "@/lib/exportPdf";

interface Props {
  callAPI: (body: Record<string, unknown>) => Promise<any>;
}

const ProfessorBIPanel = ({ callAPI }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const loadBI = async (sid?: string) => {
    setLoading(true);
    try {
      const res = await callAPI({
        action: "professor_bi",
        student_id: sid && sid !== "all" ? sid : undefined,
      });
      setData(res);
    } catch (e) {
      toast({ title: "Erro ao carregar BI", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBI(); }, []);

  const handleStudentChange = (val: string) => {
    setStudentFilter(val);
    loadBI(val);
  };

  const generateSuggestions = async () => {
    if (!data) return;
    setLoadingSuggestions(true);
    try {
      const res = await callAPI({
        action: "professor_bi_suggestion",
        summary: {
          deficient_topics: data.proficiency?.deficient_topics?.slice(0, 10),
          mastered_topics: data.proficiency?.mastered_topics?.slice(0, 5),
          kpis: data.proficiency?.kpis,
          platform_kpis: data.platform?.kpis,
          top_errors: data.platform?.top_errors?.slice(0, 5),
          at_risk_students: data.at_risk_students?.slice(0, 5),
        },
      });
      setSuggestions(res.suggestions || []);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao gerar sugestões", variant: "destructive" });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleExportPDF = () => {
    if (!data) return;
    const prof = data.proficiency || {};
    const plat = data.platform || {};
    const selectedStudent = studentFilter !== "all"
      ? data.students?.find((s: any) => s.user_id === studentFilter)?.display_name
      : null;

    exportProfessorBIReport({
      kpis: {
        "Atividades Criadas": prof.kpis?.total_activities ?? 0,
        "Taxa de Conclusão": `${prof.kpis?.completion_rate ?? 0}%`,
        "Média Geral": `${prof.kpis?.avg_score ?? 0}%`,
        "Pendentes": prof.kpis?.pending ?? 0,
        ...(plat?.kpis ? {
          "Questões Respondidas": plat.kpis.total_questions,
          "Acurácia Média": `${plat.kpis.avg_accuracy}%`,
          "Streak Médio": `${plat.kpis.avg_streak} dias`,
          "Inativos (>7d)": plat.kpis.inactive_count,
        } : {}),
      },
      topicBreakdown: prof.topic_breakdown,
      deficientTopics: prof.deficient_topics,
      masteredTopics: prof.mastered_topics,
      atRiskStudents: data.at_risk_students,
      studentEngagement: plat?.student_engagement,
      studentPercentile: data.student_percentile,
    }, selectedStudent ? `BI_Aluno_${selectedStudent}` : "BI_Turma_Professor");

    toast({ title: "PDF exportado com sucesso!" });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data) return <p className="text-center text-muted-foreground py-8">Sem dados disponíveis.</p>;

  const prof = data.proficiency || {};
  const plat = data.platform || {};
  const students = data.students || [];
  const atRisk = data.at_risk_students || [];
  const weeklyEvo = data.weekly_evolution || [];
  const percentile = data.student_percentile;

  return (
    <div className="space-y-6">
      {/* Filter + Export */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={studentFilter} onValueChange={handleStudentChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Todos os alunos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os alunos</SelectItem>
            {students.map((s: any) => (
              <SelectItem key={s.user_id} value={s.user_id}>{s.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
          <Download className="h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      {/* At-Risk Students Alert */}
      {atRisk.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" /> Alunos em Risco ({atRisk.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {atRisk.map((s: any, i: number) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${s.criticality === "critico" ? "border-destructive/40 bg-destructive/10" : "border-amber-500/40 bg-amber-500/10"}`}>
                  <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${s.criticality === "critico" ? "text-destructive" : "text-amber-500"}`} />
                  <div>
                    <p className="text-sm font-semibold">{s.display_name}</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {s.reasons.map((r: string, j: number) => <li key={j}>• {r}</li>)}
                    </ul>
                    <Badge variant={s.criticality === "critico" ? "destructive" : "secondary"} className="text-[10px] mt-1">
                      {s.criticality === "critico" ? "Crítico" : "Atenção"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Percentile Card */}
      {percentile && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">P{percentile.percentile}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{percentile.display_name}</p>
              <p className="text-xs text-muted-foreground">
                Percentil {percentile.percentile} da turma • Acurácia {percentile.accuracy}% •
                Posição {percentile.rank}/{percentile.total_students}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="proficiency">
        <TabsList>
          <TabsTrigger value="proficiency">🎯 BI Proficiência</TabsTrigger>
          <TabsTrigger value="platform">📊 BI Plataforma Geral</TabsTrigger>
          <TabsTrigger value="suggestions">💡 Sugestões Pedagógicas</TabsTrigger>
        </TabsList>

        {/* ===== PROFICIENCY BI ===== */}
        <TabsContent value="proficiency" className="space-y-6 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard icon={<FileText className="h-5 w-5 text-primary" />} label="Atividades Criadas" value={prof.kpis?.total_activities ?? 0} />
            <KPICard icon={<Target className="h-5 w-5 text-emerald-500" />} label="Taxa de Conclusão" value={`${prof.kpis?.completion_rate ?? 0}%`} />
            <KPICard icon={<TrendingUp className="h-5 w-5 text-blue-500" />} label="Média Geral" value={`${prof.kpis?.avg_score ?? 0}%`} />
            <KPICard icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} label="Pendentes" value={prof.kpis?.pending ?? 0} />
          </div>

          {/* Weekly Evolution Chart */}
          {weeklyEvo.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Evolução Semanal da Acurácia</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weeklyEvo}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: number) => `${v}%`} labelFormatter={(v) => {
                      const d = new Date(v);
                      return `Semana de ${d.toLocaleDateString("pt-BR")}`;
                    }} />
                    <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Topic Performance Chart */}
          {prof.topic_breakdown?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Desempenho por Tópico (Simulados)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(200, prof.topic_breakdown.length * 32)}>
                  <BarChart data={prof.topic_breakdown.slice(0, 15)} layout="vertical" margin={{ left: 120 }}>
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="topic" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Deficient + Mastered */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" /> Assuntos Deficitários
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prof.deficient_topics?.length > 0 ? (
                  <div className="space-y-2">
                    {prof.deficient_topics.map((t: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-destructive/5">
                        <span className="text-sm font-medium">{t.topic}</span>
                        <Badge variant="destructive">{t.accuracy}% ({t.total} q)</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">Nenhum tópico com acerto &lt; 50%</p>}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> Assuntos Dominados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prof.mastered_topics?.length > 0 ? (
                  <div className="space-y-2">
                    {prof.mastered_topics.map((t: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-emerald-500/5">
                        <span className="text-sm font-medium">{t.topic}</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{t.accuracy}% ({t.total} q)</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">Nenhum tópico com acerto ≥ 80%</p>}
              </CardContent>
            </Card>
          </div>

          {/* Activity Table with pending days */}
          {prof.activity_table?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Resultados por Atividade</CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Atividade</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prof.activity_table.slice(0, 50).map((r: any, i: number) => (
                        <TableRow key={i} className={r.status === "pending" ? "bg-amber-500/5" : ""}>
                          <TableCell><Badge variant="outline" className="text-[10px]">{r.type}</Badge></TableCell>
                          <TableCell className="text-sm">{r.title}</TableCell>
                          <TableCell className="text-sm">{r.student_name}</TableCell>
                          <TableCell className="text-sm font-medium">{r.score != null ? `${r.score}%` : "—"}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "completed" ? "default" : "secondary"} className={`text-[10px] ${r.status === "pending" ? "bg-amber-500/20 text-amber-700 border-amber-500/30" : ""}`}>
                              {r.status === "completed" ? "Concluído" : r.status === "pending" ? "Pendente" : r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== PLATFORM BI ===== */}
        <TabsContent value="platform" className="space-y-6 mt-4">
          {plat?.kpis ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPICard icon={<Brain className="h-5 w-5 text-primary" />} label="Questões Respondidas" value={plat.kpis.total_questions} />
                <KPICard icon={<CheckCircle className="h-5 w-5 text-emerald-500" />} label="Acurácia Média" value={`${plat.kpis.avg_accuracy}%`} />
                <KPICard icon={<TrendingUp className="h-5 w-5 text-amber-500" />} label="Streak Médio" value={`${plat.kpis.avg_streak} dias`} />
                <KPICard icon={<Users className="h-5 w-5 text-destructive" />} label="Inativos (>7d)" value={plat.kpis.inactive_count} />
              </div>

              {/* Top Errors */}
              {plat.top_errors?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Top 10 Temas com Mais Erros</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={Math.max(200, plat.top_errors.length * 32)}>
                      <BarChart data={plat.top_errors} layout="vertical" margin={{ left: 120 }}>
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="tema" width={110} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Erros" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Specialty Radar */}
              {plat.specialty_accuracy?.length >= 3 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Acurácia por Especialidade</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <RadarChart data={plat.specialty_accuracy.map((s: any) => ({
                        ...s,
                        label: s.specialty.length > 12 ? s.specialty.slice(0, 11) + "…" : s.specialty,
                      }))}>
                        <PolarGrid className="stroke-border" />
                        <PolarAngleAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar name="Acurácia" dataKey="accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Student Engagement */}
              {plat.student_engagement?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Engajamento dos Alunos</CardTitle></CardHeader>
                  <CardContent>
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Aluno</TableHead>
                            <TableHead>XP</TableHead>
                            <TableHead>Streak</TableHead>
                            <TableHead>Questões</TableHead>
                            <TableHead>Acurácia</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {plat.student_engagement.map((s: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="text-sm font-medium">{s.display_name}</TableCell>
                              <TableCell className="text-sm">{s.xp}</TableCell>
                              <TableCell className="text-sm">{s.streak} dias</TableCell>
                              <TableCell className="text-sm">{s.questions_answered}</TableCell>
                              <TableCell className="text-sm">{s.accuracy}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sem dados de plataforma disponíveis. Crie atividades primeiro.</p>
          )}
        </TabsContent>

        {/* ===== SUGGESTIONS ===== */}
        <TabsContent value="suggestions" className="space-y-6 mt-4">
          <div className="flex justify-center">
            <Button onClick={generateSuggestions} disabled={loadingSuggestions} className="gap-2">
              {loadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Gerar Sugestões Pedagógicas
            </Button>
          </div>

          {suggestions.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {suggestions.map((s: any, i: number) => (
                <Card key={i} className={`border-l-4 ${s.priority === "alta" ? "border-l-destructive" : s.priority === "media" ? "border-l-amber-500" : "border-l-emerald-500"}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{s.title}</CardTitle>
                      <div className="flex gap-1">
                        <Badge variant={s.priority === "alta" ? "destructive" : "secondary"} className="text-[10px]">
                          {s.priority}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{s.target}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const KPICard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default ProfessorBIPanel;
