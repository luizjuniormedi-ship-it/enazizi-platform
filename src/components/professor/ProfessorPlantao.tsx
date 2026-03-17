import { useState, useEffect, useCallback } from "react";
import {
  Activity, Plus, Loader2, Eye, Users, CheckCircle, Clock,
  Sparkles, FileText, BarChart3, Trophy, XCircle, Target,
  Stethoscope, AlertTriangle, Award, Syringe, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Square } from "lucide-react";

const SPECIALTIES = [
  "Clínica Médica", "Cardiologia", "Pneumologia", "Gastroenterologia", "Neurologia",
  "Nefrologia", "Infectologia", "Pediatria", "Cirurgia", "Ginecologia e Obstetrícia",
  "Ortopedia", "Psiquiatria", "Emergência", "Dermatologia", "Angiologia",
];

const FACULDADES = ["UNIG", "Estácio", "Outra"];

const EVAL_LABELS: Record<string, string> = {
  anamnesis: "Anamnese", physical_exam: "Exame Físico",
  complementary_exams: "Exames Complementares", diagnosis: "Diagnóstico",
  prescription: "Prescrição", management: "Conduta", referral: "Parecer/Encaminhamento",
};

const EVAL_MAX_SCORES: Record<string, number> = {
  anamnesis: 15, physical_exam: 15, complementary_exams: 15,
  diagnosis: 15, prescription: 15, management: 15, referral: 10,
};

const ProfessorPlantao = () => {
  const { session } = useAuth();
  const { toast } = useToast();

  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form
  const [specialty, setSpecialty] = useState("Clínica Médica");
  const [difficulty, setDifficulty] = useState("intermediário");
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("20");
  const [faculdadeFilter, setFaculdadeFilter] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState("");
  const [generatedCase, setGeneratedCase] = useState<any>(null);

  // Students
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Results dialog
  const [resultsDialog, setResultsDialog] = useState<{ open: boolean; caseData: any; results: any[]; loading: boolean }>({ open: false, caseData: null, results: [], loading: false });
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-simulado`;

  const callAPI = useCallback(async (body: Record<string, unknown>) => {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Erro");
    return data;
  }, [session, API_URL]);

  const loadCases = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await callAPI({ action: "list_clinical_cases" });
      setCases(res.cases || []);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [session, callAPI, toast]);

  useEffect(() => { loadCases(); }, [loadCases]);

  const generateCase = async () => {
    setGenerating(true);
    try {
      const res = await callAPI({ action: "generate_clinical_case", specialty, difficulty });
      setGeneratedCase(res.case_data);
      toast({ title: "Caso gerado!", description: `${specialty} - ${difficulty}` });
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao gerar", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const previewMatchingStudents = async () => {
    setPreviewLoading(true);
    try {
      const res = await callAPI({
        action: "get_students",
        faculdade: faculdadeFilter && faculdadeFilter !== "all" ? faculdadeFilter : undefined,
        periodo: periodoFilter && periodoFilter !== "all" ? parseInt(periodoFilter) : undefined,
      });
      const students = res.students || [];
      setPreviewStudents(students);
      setSelectedStudentIds(students.map((s: any) => s.user_id));
    } catch {
      setPreviewStudents([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const createCase = async () => {
    if (!generatedCase) return;
    setCreating(true);
    try {
      const res = await callAPI({
        action: "create_clinical_case",
        title: title || `Plantão - ${specialty}`,
        specialty,
        difficulty,
        time_limit_minutes: parseInt(timeLimit),
        case_prompt: generatedCase,
        faculdade_filter: faculdadeFilter && faculdadeFilter !== "all" ? faculdadeFilter : null,
        periodo_filter: periodoFilter && periodoFilter !== "all" ? parseInt(periodoFilter) : null,
        student_ids: selectedStudentIds.length > 0 ? selectedStudentIds : undefined,
      });
      toast({ title: "Caso criado!", description: `Atribuído a ${res.students_assigned} aluno(s).` });
      setShowCreate(false);
      resetForm();
      loadCases();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const viewResults = async (caseData: any) => {
    setResultsDialog({ open: true, caseData, results: [], loading: true });
    try {
      const res = await callAPI({ action: "get_clinical_case_results", case_id: caseData.id });
      setResultsDialog((prev) => ({ ...prev, results: res.results || [], loading: false }));
    } catch {
      setResultsDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const resetForm = () => {
    setSpecialty("Clínica Médica");
    setDifficulty("intermediário");
    setTitle("");
    setTimeLimit("20");
    setFaculdadeFilter("");
    setPeriodoFilter("");
    setGeneratedCase(null);
    setPreviewStudents([]);
    setSelectedStudentIds([]);
  };

  const totalAssigned = cases.reduce((s, c) => s + (c.results_summary?.total || 0), 0);
  const totalCompleted = cases.reduce((s, c) => s + (c.results_summary?.completed || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Crie casos de plantão médico interativos e atribua aos alunos.</p>
        <Button onClick={() => setShowCreate(true)} className="gap-2" size="sm">
          <Plus className="h-4 w-4" /> Novo Caso Plantão
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Casos Criados</p>
            <p className="text-lg font-bold">{cases.length}</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Atribuídos</p>
            <p className="text-lg font-bold">{totalAssigned}</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Concluídos</p>
            <p className="text-lg font-bold">{totalCompleted}</p>
          </div>
        </CardContent></Card>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
      ) : cases.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum caso criado</h3>
            <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro caso de plantão médico interativo.</p>
            <Button onClick={() => setShowCreate(true)}>Criar Caso</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Card key={c.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{c.title}</h3>
                      <Badge variant="outline" className="text-[10px]">{c.specialty}</Badge>
                      <Badge variant="secondary" className="text-[10px] capitalize">{c.difficulty}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.time_limit_minutes}min</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.results_summary?.total || 0} alunos</span>
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />{c.results_summary?.completed || 0} concluídos</span>
                      {c.results_summary?.completed > 0 && (
                        <span className="flex items-center gap-1"><Trophy className="h-3 w-3" />Média: {c.results_summary.avgScore}pts</span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => viewResults(c)} className="gap-1.5 shrink-0">
                    <Eye className="h-3.5 w-3.5" /> Resultados
                  </Button>
                </div>
                {c.results_summary?.total > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <Progress value={c.results_summary.total > 0 ? (c.results_summary.completed / c.results_summary.total) * 100 : 0} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Case Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); resetForm(); } else setShowCreate(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-red-500" /> Criar Caso de Plantão</DialogTitle>
            <DialogDescription>Gere um caso clínico via IA e atribua aos alunos.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Config */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Título (opcional)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Plantão - ${specialty}`} />
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dificuldade</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="básico">Básico</SelectItem>
                    <SelectItem value="intermediário">Intermediário</SelectItem>
                    <SelectItem value="avançado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tempo Limite (min)</Label>
                <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} min="5" max="60" />
              </div>
            </div>

            {/* Generate */}
            <Button onClick={generateCase} disabled={generating} className="w-full gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Gerando caso..." : "🤖 Gerar Caso via IA"}
            </Button>

            {/* Preview */}
            {generatedCase && (
              <Card className="border-primary/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Stethoscope className="h-4 w-4 text-primary" /> Preview do Caso
                    </h4>
                    <Badge variant="outline" className="text-xs">{generatedCase.triage_color}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{generatedCase.patient_presentation}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedCase.vitals && Object.entries(generatedCase.vitals).map(([k, v]) => (
                      <Badge key={k} variant="outline" className="text-xs font-mono">{k}: {v as string}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">📍 {generatedCase.setting}</p>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-semibold text-amber-600">🔒 Diagnóstico (oculto ao aluno): {generatedCase.hidden_diagnosis}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student selection */}
            {generatedCase && (
              <div className="space-y-3">
                <Label className="font-semibold">Atribuir a Alunos</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={faculdadeFilter} onValueChange={setFaculdadeFilter}>
                    <SelectTrigger><SelectValue placeholder="Faculdade (todos)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {FACULDADES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                    <SelectTrigger><SelectValue placeholder="Período (todos)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={previewMatchingStudents} disabled={previewLoading} className="gap-2 w-full" size="sm">
                  {previewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
                  Buscar Alunos
                </Button>
                {previewStudents.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    <div className="p-2 border-b bg-muted/30 flex items-center justify-between">
                      <span className="text-xs font-medium">{selectedStudentIds.length}/{previewStudents.length} selecionados</span>
                      <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => {
                        if (selectedStudentIds.length === previewStudents.length) setSelectedStudentIds([]);
                        else setSelectedStudentIds(previewStudents.map((s: any) => s.user_id));
                      }}>
                        {selectedStudentIds.length === previewStudents.length ? "Desmarcar" : "Selecionar"} todos
                      </Button>
                    </div>
                    {previewStudents.map((s: any) => (
                      <div
                        key={s.user_id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 cursor-pointer border-b border-border/30 last:border-0"
                        onClick={() => setSelectedStudentIds(prev =>
                          prev.includes(s.user_id) ? prev.filter(id => id !== s.user_id) : [...prev, s.user_id]
                        )}
                      >
                        {selectedStudentIds.includes(s.user_id)
                          ? <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                          : <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                        }
                        <span className="text-sm truncate">{s.display_name || s.email}</span>
                        {s.faculdade && <Badge variant="secondary" className="text-[10px] ml-auto">{s.faculdade}</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={createCase} disabled={!generatedCase || creating} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {creating ? "Criando..." : "Criar e Atribuir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={resultsDialog.open} onOpenChange={(open) => { if (!open) { setResultsDialog({ open: false, caseData: null, results: [], loading: false }); setSelectedResult(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Resultados — {resultsDialog.caseData?.title}
            </DialogTitle>
            <DialogDescription>
              {resultsDialog.caseData?.specialty} • {resultsDialog.caseData?.difficulty}
            </DialogDescription>
          </DialogHeader>

          {resultsDialog.loading ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : selectedResult ? (
            // Detailed result view
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)} className="gap-1 text-xs">← Voltar à lista</Button>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedResult.student_name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedResult.student_email}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${selectedResult.grade === "A" ? "text-green-500" : selectedResult.grade === "B" ? "text-blue-500" : selectedResult.grade === "C" ? "text-amber-500" : "text-red-500"}`}>
                    {selectedResult.grade}
                  </p>
                  <p className="text-lg font-bold">{selectedResult.final_score}/100</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${selectedResult.student_got_diagnosis ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                <p className="text-xs font-semibold">Diagnóstico Correto: {selectedResult.correct_diagnosis || resultsDialog.caseData?.case_prompt?.hidden_diagnosis}</p>
                <p className="text-xs mt-1">{selectedResult.student_got_diagnosis ? "✅ Acertou" : "❌ Não acertou"}</p>
              </div>

              {selectedResult.final_evaluation && Object.keys(selectedResult.final_evaluation).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold">📊 Avaliação por Categoria</p>
                  {Object.entries(selectedResult.final_evaluation).map(([key, val]: [string, any]) => {
                    const maxScore = EVAL_MAX_SCORES[key] || 15;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{EVAL_LABELS[key] || key}</span>
                          <span className={`font-bold ${val.score >= maxScore * 0.7 ? "text-green-500" : val.score >= maxScore * 0.5 ? "text-amber-500" : "text-red-500"}`}>
                            {val.score}/{maxScore}
                          </span>
                        </div>
                        <Progress value={(val.score / maxScore) * 100} className="h-1" />
                        <p className="text-[10px] text-muted-foreground">{val.feedback}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Results list
            <div className="space-y-2">
              {resultsDialog.results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum resultado ainda.</p>
              ) : (
                resultsDialog.results.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => r.status === "completed" && setSelectedResult(r)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col items-center min-w-[40px]">
                        {r.status === "completed" ? (
                          <>
                            <span className={`text-lg font-black ${r.grade === "A" ? "text-green-500" : r.grade === "B" ? "text-blue-500" : r.grade === "C" ? "text-amber-500" : "text-red-500"}`}>
                              {r.grade}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{r.final_score}pts</span>
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">{r.status === "in_progress" ? "Em andamento" : "Pendente"}</Badge>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.student_name}</p>
                        <p className="text-xs text-muted-foreground">{r.student_email}</p>
                      </div>
                    </div>
                    {r.status === "completed" && (
                      <div className="flex items-center gap-2 shrink-0">
                        {r.student_got_diagnosis ? (
                          <Badge className="bg-green-500/20 text-green-500 text-[10px]">✓ Dx</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">✗ Dx</Badge>
                        )}
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessorPlantao;
