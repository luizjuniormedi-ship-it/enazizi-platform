import { useState, useEffect, useCallback } from "react";
import { GraduationCap, Plus, Users, FileText, BarChart3, Loader2, Clock, CheckCircle, Send, Sparkles, Database, ChevronDown, ChevronUp, Eye, Trash2, PenLine, CheckSquare, Square, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ClassAnalytics from "@/components/professor/ClassAnalytics";
import ProfessorPlantao from "@/components/professor/ProfessorPlantao";
import StudentTracker from "@/components/professor/StudentTracker";
import VideoRoom from "@/components/professor/VideoRoom";
import TeacherStudyAssignments from "@/components/professor/TeacherStudyAssignments";

import { ALL_SPECIALTIES as SPECIALTIES } from "@/constants/specialties";
import CycleFilter, { getFilteredSpecialties } from "@/components/CycleFilter";

import { FACULDADES } from "@/constants/faculdades";

const ProfessorDashboard = () => {
  const { session } = useAuth();
  const { toast } = useToast();

  const [simulados, setSimulados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("Simulado");
  const [description, setDescription] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [cycleFilter, setCycleFilter] = useState<string | null>(null);
  const [subtopics, setSubtopics] = useState<Record<string, string>>({});
  const [faculdadeFilter, setFaculdadeFilter] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [timeLimit, setTimeLimit] = useState("60");
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [useAI, setUseAI] = useState(true);
  const [questionMode, setQuestionMode] = useState<"ai" | "manual">("ai");

  // Manual question form
  const [manualStatement, setManualStatement] = useState("");
  const [manualOptions, setManualOptions] = useState(["", "", "", "", ""]);
  const [manualCorrect, setManualCorrect] = useState("0");
  const [manualTopic, setManualTopic] = useState("");
  const [manualQuestions, setManualQuestions] = useState<any[]>([]);

  // Bank questions
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Results dialog
  const [resultsDialog, setResultsDialog] = useState<{ open: boolean; simulado: any; results: any[]; loading: boolean }>({ open: false, simulado: null, results: [], loading: false });

  // Students preview
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

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
    if (!resp.ok) throw new Error(data.error || "Erro na operação");
    return data;
  }, [session, API_URL]);

  const loadSimulados = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await callAPI({ action: "list_simulados" });
      setSimulados(res.simulados || []);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [session, callAPI, toast]);

  useEffect(() => { loadSimulados(); }, [loadSimulados]);

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
      // Auto-select all students
      setSelectedStudentIds(students.map((s: any) => s.user_id));
    } catch {
      setPreviewStudents([]);
      setSelectedStudentIds([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleStudentSelection = (userId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleAllStudents = () => {
    if (selectedStudentIds.length === previewStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(previewStudents.map((s: any) => s.user_id));
    }
  };

  const generateQuestionsAI = async () => {
    if (selectedTopics.length === 0) {
      toast({ title: "Selecione temas", description: "Escolha pelo menos um tema para gerar questões.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const topicsWithSubs = selectedTopics.map((t) => {
        const subs = subtopics[t]?.trim();
        return subs ? `${t} (${subs})` : t;
      });
      const res = await callAPI({ action: "generate_questions", topics: topicsWithSubs, count: parseInt(questionCount) });
      setGeneratedQuestions(res.questions || []);
      toast({ title: "Questões geradas!", description: `${res.questions?.length || 0} questões criadas pela IA.` });
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao gerar", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const createSimulado = async () => {
    const questions = questionMode === "manual" ? manualQuestions : (useAI ? generatedQuestions : bankQuestions.filter((q) => selectedBankQuestions.includes(q.id)));
    if (questions.length === 0) {
      toast({ title: "Sem questões", description: "Gere ou selecione questões primeiro.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await callAPI({
        action: "create_simulado",
        title,
        description,
        topics: selectedTopics,
        faculdade_filter: faculdadeFilter && faculdadeFilter !== "all" ? faculdadeFilter : null,
        periodo_filter: periodoFilter && periodoFilter !== "all" ? parseInt(periodoFilter) : null,
        total_questions: questions.length,
        time_limit_minutes: parseInt(timeLimit),
        questions_json: questions,
      });
      toast({ title: "Simulado criado!", description: `Atribuído a ${res.students_assigned} aluno(s).` });
      setShowCreate(false);
      resetForm();
      loadSimulados();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deleteSimulado = async (simuladoId: string, simuladoTitle: string) => {
    if (!confirm(`Tem certeza que deseja apagar o simulado "${simuladoTitle}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await callAPI({ action: "delete_simulado", simulado_id: simuladoId });
      toast({ title: "Simulado apagado", description: `"${simuladoTitle}" foi removido com sucesso.` });
      loadSimulados();
    } catch (e) {
      toast({ title: "Erro ao apagar", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    }
  };


    setResultsDialog({ open: true, simulado, results: [], loading: true });
    try {
      const res = await callAPI({ action: "get_simulado_results", simulado_id: simulado.id });
      setResultsDialog((prev) => ({ ...prev, results: res.results || [], loading: false }));
    } catch {
      setResultsDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const resetForm = () => {
    setTitle("Simulado");
    setDescription("");
    setSelectedTopics([]);
    setSubtopics({});
    setPeriodoFilter("");
    setQuestionCount("10");
    setTimeLimit("60");
    setGeneratedQuestions([]);
    setPreviewStudents([]);
    setSelectedBankQuestions([]);
    setSelectedStudentIds([]);
    setQuestionMode("ai");
    setManualStatement("");
    setManualOptions(["", "", "", "", ""]);
    setManualCorrect("0");
    setManualTopic("");
    setManualQuestions([]);
  };

  const addManualQuestion = () => {
    if (!manualStatement.trim()) return;
    const filledOptions = manualOptions.filter((o) => o.trim());
    if (filledOptions.length < 2) return;

    setManualQuestions((prev) => [...prev, {
      statement: manualStatement.trim(),
      options: manualOptions.map((o, i) => `${String.fromCharCode(65 + i)}) ${o.trim()}`).filter((_, i) => manualOptions[i].trim()),
      correct_index: parseInt(manualCorrect),
      topic: manualTopic || selectedTopics[0] || "Geral",
      explanation: "",
    }]);
    setManualStatement("");
    setManualOptions(["", "", "", "", ""]);
    setManualCorrect("0");
    setManualTopic("");
  };

  const removeManualQuestion = (idx: number) => {
    setManualQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]);
  };

  const totalStudentsAssigned = simulados.reduce((s, sim) => s + (sim.results_summary?.total || 0), 0);
  const totalCompleted = simulados.reduce((s, sim) => s + (sim.results_summary?.completed || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Painel do Professor
          </h1>
          <p className="text-muted-foreground text-sm">Crie simulados, acompanhe alunos e gerencie turmas</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Simulado
        </Button>
      </div>

      <Tabs defaultValue="simulados">
        <TabsList>
          <TabsTrigger value="simulados">📝 Simulados</TabsTrigger>
          <TabsTrigger value="plantao">🏥 Casos Plantão</TabsTrigger>
          <TabsTrigger value="video" className="gap-1"><Video className="h-3.5 w-3.5" /> Sala de Aula</TabsTrigger>
          <TabsTrigger value="temas">📖 Temas de Estudo</TabsTrigger>
          <TabsTrigger value="alunos">👤 Aluno Individual</TabsTrigger>
          <TabsTrigger value="analytics">📊 Análise da Turma</TabsTrigger>
        </TabsList>

        <TabsContent value="simulados" className="space-y-4 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Simulados</p>
              <p className="text-lg font-bold">{simulados.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alunos Atribuídos</p>
              <p className="text-lg font-bold">{totalStudentsAssigned}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Concluídos</p>
              <p className="text-lg font-bold">{totalCompleted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa Conclusão</p>
              <p className="text-lg font-bold">{totalStudentsAssigned > 0 ? Math.round((totalCompleted / totalStudentsAssigned) * 100) : 0}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulados List */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
      ) : simulados.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum simulado criado</h3>
            <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro simulado e atribua aos alunos.</p>
            <Button onClick={() => setShowCreate(true)}>Criar Simulado</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {simulados.map((sim) => (
            <Card key={sim.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{sim.title}</h3>
                      <Badge variant={sim.status === "published" ? "default" : "secondary"} className="text-[10px]">
                        {sim.status === "published" ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                    {sim.description && <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{sim.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(sim.topics || []).slice(0, 3).map((t: string) => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                      {(sim.topics || []).length > 3 && <Badge variant="outline" className="text-[10px]">+{sim.topics.length - 3}</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{sim.total_questions} questões</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{sim.time_limit_minutes}min</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{sim.results_summary?.total || 0} alunos</span>
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />{sim.results_summary?.completed || 0} concluídos</span>
                      {sim.faculdade_filter && <Badge variant="secondary" className="text-[10px]">{sim.faculdade_filter}</Badge>}
                      {sim.periodo_filter && <Badge variant="secondary" className="text-[10px]">{sim.periodo_filter}º período</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => viewResults(sim)} className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Resultados
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteSimulado(sim.id, sim.title)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                {sim.results_summary?.completed > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{sim.results_summary.completed}/{sim.results_summary.total} • Média: {sim.results_summary.avgScore}%</span>
                    </div>
                    <Progress value={(sim.results_summary.completed / sim.results_summary.total) * 100} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </TabsContent>

      {/* Create Simulado Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); resetForm(); } else setShowCreate(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Criar Simulado</DialogTitle>
            <DialogDescription>Configure o simulado, gere questões e atribua aos alunos.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do simulado" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição (opcional)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instruções para os alunos..." rows={2} />
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Filtrar Alunos</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Faculdade</Label>
                  <Select value={faculdadeFilter} onValueChange={setFaculdadeFilter}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {FACULDADES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Período</Label>
                  <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                        <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={previewMatchingStudents} disabled={previewLoading} className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> {previewLoading ? "Buscando..." : "Ver alunos que receberão"}
              </Button>
              {previewStudents.length > 0 && (
                <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{selectedStudentIds.length}/{previewStudents.length} aluno(s) selecionado(s)</p>
                    <button
                      onClick={toggleAllStudents}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      {selectedStudentIds.length === previewStudents.length ? "Desmarcar todos" : "Selecionar todos"}
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {previewStudents.map((s: any) => {
                      const isSelected = selectedStudentIds.includes(s.user_id);
                      return (
                        <button
                          key={s.user_id}
                          onClick={() => toggleStudentSelection(s.user_id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-background/50 border border-border hover:border-primary/20"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate font-medium">{s.display_name || s.email}</span>
                          {s.periodo && <span className="text-muted-foreground ml-auto shrink-0">{s.periodo}º</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Topics */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Temas ({selectedTopics.length} selecionados)</Label>
              <CycleFilter activeCycle={cycleFilter} onCycleChange={setCycleFilter} className="mb-2" />
              <div className="flex flex-wrap gap-1.5">
                {getFilteredSpecialties(cycleFilter).map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      toggleTopic(topic);
                      if (selectedTopics.includes(topic)) {
                        setSubtopics((prev) => { const next = { ...prev }; delete next[topic]; return next; });
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedTopics.includes(topic)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-border hover:border-primary/40"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Subtopics for selected topics */}
              {selectedTopics.length > 0 && (
                <div className="space-y-2 bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Subtemas específicos (opcional) — ex: IAM, TEP, Pré-eclâmpsia
                  </p>
                  {selectedTopics.map((topic) => (
                    <div key={topic} className="flex items-center gap-2">
                      <Badge variant="outline" className="shrink-0 text-[10px]">{topic}</Badge>
                      <Input
                        value={subtopics[topic] || ""}
                        onChange={(e) => setSubtopics((prev) => ({ ...prev, [topic]: e.target.value }))}
                        placeholder={`Subtemas de ${topic} (separados por vírgula)`}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generation method */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Questões</Label>

              {/* Mode toggle */}
              <div className="flex gap-2">
                <Button
                  variant={questionMode === "ai" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuestionMode("ai")}
                  className="gap-1.5 flex-1"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Gerar com IA
                </Button>
                <Button
                  variant={questionMode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuestionMode("manual")}
                  className="gap-1.5 flex-1"
                >
                  <PenLine className="h-3.5 w-3.5" /> Criar Manual
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Quantidade (IA)</Label>
                  <Select value={questionCount} onValueChange={setQuestionCount} disabled={questionMode === "manual"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 30, 40, 50, 60, 80, 100].map((n) => <SelectItem key={n} value={String(n)}>{n} questões</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tempo limite</Label>
                  <Select value={timeLimit} onValueChange={setTimeLimit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[30, 60, 90, 120, 180].map((m) => <SelectItem key={m} value={String(m)}>{m} minutos</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {questionMode === "ai" && (
                <Button onClick={generateQuestionsAI} disabled={generating || selectedTopics.length === 0} className="gap-2 w-full">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? "Gerando..." : "Gerar Questões com IA"}
                </Button>
              )}

              {/* Manual question form */}
              {questionMode === "manual" && (
                <div className="space-y-3 border border-border rounded-lg p-3 bg-muted/20">
                  <div className="space-y-2">
                    <Label className="text-xs">Enunciado / Caso Clínico</Label>
                    <Textarea
                      value={manualStatement}
                      onChange={(e) => setManualStatement(e.target.value)}
                      placeholder="Paciente de 55 anos, hipertenso, apresenta dor precordial..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Alternativas</Label>
                    {["A", "B", "C", "D", "E"].map((letter, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                          manualCorrect === String(i) ? "bg-primary text-primary-foreground border-primary" : "border-border"
                        }`}>
                          {letter}
                        </span>
                        <Input
                          value={manualOptions[i]}
                          onChange={(e) => {
                            const copy = [...manualOptions];
                            copy[i] = e.target.value;
                            setManualOptions(copy);
                          }}
                          placeholder={`Alternativa ${letter}`}
                          className="flex-1 h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Gabarito (resposta correta)</Label>
                      <Select value={manualCorrect} onValueChange={setManualCorrect}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["A", "B", "C", "D", "E"].map((l, i) => (
                            <SelectItem key={i} value={String(i)}>Alternativa {l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Tema</Label>
                      <Select value={manualTopic} onValueChange={setManualTopic}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={addManualQuestion}
                    disabled={!manualStatement.trim() || manualOptions.filter((o) => o.trim()).length < 2}
                    variant="secondary"
                    className="w-full gap-1.5"
                    size="sm"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Questão
                  </Button>
                </div>
              )}
            </div>

            {/* Generated / manual questions preview */}
            {(questionMode === "ai" ? generatedQuestions : manualQuestions).length > 0 && (() => {
              const allQs = questionMode === "ai" ? generatedQuestions : manualQuestions;
              const grouped = allQs.reduce<Record<string, typeof allQs>>((acc, q) => {
                const block = q.block || q.topic || "Geral";
                if (!acc[block]) acc[block] = [];
                acc[block].push(q);
                return acc;
              }, {});
              const blocks = Object.entries(grouped);
              return (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-primary">
                    ✅ {allQs.length} questão(ões) {questionMode === "ai" ? "geradas" : "criadas"} {blocks.length > 1 ? `em ${blocks.length} blocos` : ""}
                  </Label>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {blocks.map(([block, questions]) => (
                      <div key={block}>
                        {blocks.length > 1 && (
                          <div className="flex items-center gap-2 py-1.5 px-2 bg-primary/10 rounded-md mb-1.5">
                            <span className="text-xs font-semibold text-primary">📋 Bloco: {block} — {questions.length} questão(ões)</span>
                          </div>
                        )}
                        {questions.map((q, i) => {
                          const globalIdx = allQs.indexOf(q);
                          return (
                            <div key={globalIdx} className="bg-secondary/50 rounded-lg p-3 text-xs flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium mb-1">Q{globalIdx + 1}: {q.statement?.slice(0, 120)}...</p>
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[9px]">{q.topic || block}</Badge>
                                  <span className="text-muted-foreground">Gabarito: {String.fromCharCode(65 + q.correct_index)}</span>
                                </div>
                              </div>
                              {questionMode === "manual" && (
                                <button onClick={() => removeManualQuestion(globalIdx)} className="text-muted-foreground hover:text-destructive shrink-0">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancelar</Button>
            <Button
              onClick={createSimulado}
              disabled={creating || (questionMode === "ai" ? generatedQuestions.length === 0 : manualQuestions.length === 0)}
              className="gap-2"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {creating ? "Criando..." : "Criar e Atribuir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={resultsDialog.open} onOpenChange={(open) => !open && setResultsDialog({ open: false, simulado: null, results: [], loading: false })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Resultados: {resultsDialog.simulado?.title}
            </DialogTitle>
          </DialogHeader>

          {resultsDialog.loading ? (
            <div className="py-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
          ) : resultsDialog.results.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum resultado ainda.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{resultsDialog.results.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Concluídos</p>
                    <p className="text-lg font-bold text-emerald-500">{resultsDialog.results.filter((r) => r.status === "completed").length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Média</p>
                    <p className="text-lg font-bold text-primary">
                      {(() => {
                        const completed = resultsDialog.results.filter((r) => r.status === "completed");
                        return completed.length > 0 ? Math.round(completed.reduce((s, r) => s + (r.score || 0), 0) / completed.length) : 0;
                      })()}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {resultsDialog.results.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.student_name}</p>
                      <p className="text-xs text-muted-foreground">{r.student_email}{r.faculdade ? ` • ${r.faculdade}` : ""}{r.periodo ? ` • ${r.periodo}º` : ""}</p>
                    </div>
                    <div className="text-right">
                      {r.status === "completed" ? (
                        <>
                          <p className={`text-lg font-bold ${(r.score || 0) >= 70 ? "text-emerald-500" : (r.score || 0) >= 50 ? "text-amber-500" : "text-destructive"}`}>
                            {Math.round(r.score || 0)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">{r.finished_at ? new Date(r.finished_at).toLocaleDateString("pt-BR") : ""}</p>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {r.status === "in_progress" ? "Em andamento" : "Pendente"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

        <TabsContent value="plantao" className="mt-4">
          <ProfessorPlantao />
        </TabsContent>

        <TabsContent value="temas" className="mt-4">
          <TeacherStudyAssignments />
        </TabsContent>

        <TabsContent value="video" className="mt-4">
          <VideoRoom />
        </TabsContent>

        <TabsContent value="alunos" className="mt-4">
          <StudentTracker />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <ClassAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfessorDashboard;
