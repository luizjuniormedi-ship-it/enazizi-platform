import { useState, useCallback } from "react";
import { BarChart3, Users, AlertTriangle, Trophy, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const FACULDADES = ["UNIG", "Estácio", "Outra"];

interface StudentStat {
  user_id: string;
  display_name: string;
  faculdade: string | null;
  periodo: number | null;
  avg_domain_score: number;
  questions_answered: number;
  accuracy: number;
  total_errors: number;
  specialties_studied: number;
}

interface ClassData {
  students: StudentStat[];
  weakTopics: { topic: string; error_count: number }[];
  topPerformers: StudentStat[];
}

const ClassAnalytics = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [faculdade, setFaculdade] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [data, setData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-simulado`;

  const loadAnalytics = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          action: "class_analytics",
          faculdade: faculdade && faculdade !== "all" ? faculdade : undefined,
          periodo: periodo && periodo !== "all" ? parseInt(periodo) : undefined,
        }),
      });
      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error);
      setData(res);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [session, faculdade, periodo, toast, API_URL]);

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const M = 15;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório da Turma", M, y); y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`MedStudy AI — ${new Date().toLocaleDateString("pt-BR")}${faculdade && faculdade !== "all" ? ` — ${faculdade}` : ""}${periodo && periodo !== "all" ? ` — ${periodo}º período` : ""}`, M, y);
    doc.setTextColor(0); y += 10;

    // Summary
    const avgScore = data.students.length > 0 ? Math.round(data.students.reduce((s, st) => s + st.avg_domain_score, 0) / data.students.length) : 0;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo", M, y); y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de alunos: ${data.students.length}`, M, y); y += 5;
    doc.text(`Média da turma: ${avgScore}%`, M, y); y += 10;

    // Weak topics
    if (data.weakTopics.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Temas Fracos da Turma", M, y); y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      data.weakTopics.forEach((t) => {
        doc.text(`• ${t.topic}: ${t.error_count} erros`, M, y); y += 5;
      });
      y += 5;
    }

    // Student table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Desempenho Individual", M, y); y += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Aluno", M, y);
    doc.text("Score", M + 70, y);
    doc.text("Questões", M + 90, y);
    doc.text("Acerto", M + 115, y);
    doc.text("Erros", M + 135, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setDrawColor(200);
    doc.line(M, y - 2, M + 165, y - 2);

    data.students.forEach((s) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(s.display_name.slice(0, 30), M, y);
      doc.text(`${s.avg_domain_score}%`, M + 70, y);
      doc.text(`${s.questions_answered}`, M + 90, y);
      doc.text(`${s.accuracy}%`, M + 115, y);
      doc.text(`${s.total_errors}`, M + 135, y);
      y += 4.5;
    });

    doc.save(`Relatorio_Turma_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const avgClassScore = data && data.students.length > 0
    ? Math.round(data.students.reduce((s, st) => s + st.avg_domain_score, 0) / data.students.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
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
        <Button onClick={loadAnalytics} disabled={loading} size="sm" className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          {loading ? "Carregando..." : "Carregar"}
        </Button>
        {data && (
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5">
            <Download className="h-4 w-4" /> PDF da Turma
          </Button>
        )}
      </div>

      {!data && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Selecione os filtros e clique em "Carregar" para ver os dados da turma.</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alunos</p>
                  <p className="text-lg font-bold">{data.students.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média Turma</p>
                  <p className="text-lg font-bold">{avgClassScore}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temas Fracos</p>
                  <p className="text-lg font-bold">{data.weakTopics.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Melhor Score</p>
                  <p className="text-lg font-bold">{data.topPerformers[0]?.avg_domain_score || 0}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weak topics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Temas Fracos da Turma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.weakTopics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
                ) : (
                  data.weakTopics.map((t) => (
                    <div key={t.topic} className="flex items-center justify-between">
                      <span className="text-sm truncate">{t.topic}</span>
                      <Badge variant="destructive" className="text-[10px]">{t.error_count} erros</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top performers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Top Alunos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.topPerformers.map((s, i) => (
                  <div key={s.user_id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}º</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{s.display_name}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{s.avg_domain_score}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Score distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Distribuição de Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Excelente (80-100%)", min: 80, max: 100, color: "bg-emerald-500" },
                  { label: "Bom (60-79%)", min: 60, max: 79, color: "bg-primary" },
                  { label: "Regular (40-59%)", min: 40, max: 59, color: "bg-amber-500" },
                  { label: "Fraco (0-39%)", min: 0, max: 39, color: "bg-destructive" },
                ].map((range) => {
                  const count = data.students.filter((s) => s.avg_domain_score >= range.min && s.avg_domain_score <= range.max).length;
                  const pct = data.students.length > 0 ? Math.round((count / data.students.length) * 100) : 0;
                  return (
                    <div key={range.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{range.label}</span>
                        <span className="font-medium">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${range.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Full student list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Todos os Alunos ({data.students.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left py-2 pr-4">Aluno</th>
                      <th className="text-center py-2 px-2">Score</th>
                      <th className="text-center py-2 px-2">Questões</th>
                      <th className="text-center py-2 px-2">Acerto</th>
                      <th className="text-center py-2 px-2">Erros</th>
                      <th className="text-center py-2 pl-2">Espec.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students
                      .sort((a, b) => b.avg_domain_score - a.avg_domain_score)
                      .map((s) => (
                        <tr key={s.user_id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 pr-4">
                            <p className="font-medium truncate max-w-[200px]">{s.display_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {s.faculdade || ""}{s.periodo ? ` • ${s.periodo}º` : ""}
                            </p>
                          </td>
                          <td className="text-center py-2 px-2">
                            <span className={`font-bold ${s.avg_domain_score >= 70 ? "text-emerald-500" : s.avg_domain_score >= 50 ? "text-amber-500" : "text-destructive"}`}>
                              {s.avg_domain_score}%
                            </span>
                          </td>
                          <td className="text-center py-2 px-2">{s.questions_answered}</td>
                          <td className="text-center py-2 px-2">{s.accuracy}%</td>
                          <td className="text-center py-2 px-2">{s.total_errors}</td>
                          <td className="text-center py-2 pl-2">{s.specialties_studied}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ClassAnalytics;
