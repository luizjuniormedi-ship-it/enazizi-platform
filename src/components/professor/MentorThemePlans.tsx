import { useState, useEffect, useCallback } from "react";
import { BookMarked, Plus, Loader2, Users, Trash2, Eye, Calendar, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react";
import MentorshipReport from "@/components/professor/MentorshipReport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FACULDADES } from "@/constants/faculdades";
import { ALL_SPECIALTIES } from "@/constants/specialties";
import { SPECIALTY_SUBTOPICS } from "@/constants/subtopics";
import CycleFilter, { getFilteredSpecialties } from "@/components/CycleFilter";

interface MentorPlan {
  id: string;
  name: string;
  description: string | null;
  exam_date: string | null;
  status: string;
  created_at: string;
  topics?: { id: string; topic: string; subtopic: string | null; priority: number }[];
  targets?: { id: string; target_type: string; target_id: string }[];
}

const MentorThemePlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [plans, setPlans] = useState<MentorPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [examDate, setExamDate] = useState("");
  const [cycleFilter, setCycleFilter] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<{ topic: string; subtopic: string }[]>([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentSubtopic, setCurrentSubtopic] = useState("");

  // Target
  const [targetType, setTargetType] = useState<"student" | "class" | "institution">("class");
  const [faculdadeFilter, setFaculdadeFilter] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState("");
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Detail view — full report
  const [reportPlan, setReportPlan] = useState<MentorPlan | null>(null);

  const loadPlans = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: plansData } = await supabase
      .from("mentor_theme_plans")
      .select("*")
      .eq("professor_id", user.id)
      .order("created_at", { ascending: false });

    if (plansData && plansData.length > 0) {
      const planIds = plansData.map(p => p.id);
      const [{ data: topics }, { data: targets }] = await Promise.all([
        supabase.from("mentor_theme_plan_topics").select("*").in("plan_id", planIds),
        supabase.from("mentor_theme_plan_targets").select("*").in("plan_id", planIds),
      ]);

      const enriched = plansData.map(p => ({
        ...p,
        topics: (topics || []).filter(t => t.plan_id === p.id),
        targets: (targets || []).filter(t => t.plan_id === p.id),
      }));
      setPlans(enriched);
    } else {
      setPlans([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  useEffect(() => {
    if (!user) return;
    supabase.from("classes")
      .select("id, name, institution_id")
      .then(({ data }) => setClasses(data || []));
  }, [user]);

  const addTopic = () => {
    if (!currentTopic) return;
    setSelectedTopics(prev => [...prev, { topic: currentTopic, subtopic: currentSubtopic }]);
    setCurrentTopic("");
    setCurrentSubtopic("");
  };

  const removeTopic = (idx: number) => {
    setSelectedTopics(prev => prev.filter((_, i) => i !== idx));
  };

  const searchStudents = async () => {
    if (studentSearch.length < 3) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, faculdade, periodo")
      .ilike("display_name", `%${studentSearch}%`)
      .eq("user_type", "estudante")
      .limit(10);
    setSearchResults(data || []);
  };

  const handleCreate = async () => {
    if (!user || !name.trim() || selectedTopics.length === 0) {
      toast({ title: "Preencha nome e temas", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      // Create plan
      const { data: plan, error: planErr } = await supabase
        .from("mentor_theme_plans")
        .insert({
          professor_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          exam_date: examDate || null,
          status: "active",
        })
        .select("id")
        .single();
      if (planErr || !plan) throw planErr;

      // Insert topics
      const topicRows = selectedTopics.map((t, i) => ({
        plan_id: plan.id,
        topic: t.topic,
        subtopic: t.subtopic || null,
        priority: selectedTopics.length - i,
      }));
      await supabase.from("mentor_theme_plan_topics").insert(topicRows);

      // Insert targets
      let targetId = "";
      if (targetType === "class" && selectedClassId) {
        targetId = selectedClassId;
      } else if (targetType === "student" && selectedStudentId) {
        targetId = selectedStudentId;
      } else if (targetType === "institution") {
        const { data: inst } = await supabase
          .from("institution_members")
          .select("institution_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .single();
        if (inst) targetId = inst.institution_id;
      }

      if (targetId) {
        await supabase.from("mentor_theme_plan_targets").insert({
          plan_id: plan.id,
          target_type: targetType,
          target_id: targetId,
        });
      }

      // Initialize progress for targeted students so Study Engine picks up changes
      let studentIds: string[] = [];
      if (targetType === "student" && selectedStudentId) {
        studentIds = [selectedStudentId];
      } else if (targetType === "class" && selectedClassId) {
        const { data: members } = await supabase
          .from("class_members")
          .select("user_id")
          .eq("class_id", selectedClassId)
          .eq("is_active", true);
        studentIds = (members || []).map(m => m.user_id);
      } else if (targetType === "institution" && targetId) {
        const { data: members } = await supabase
          .from("institution_members")
          .select("user_id")
          .eq("institution_id", targetId)
          .eq("is_active", true)
          .limit(200);
        studentIds = (members || []).map(m => m.user_id);
      }

      // Create progress entries so students see the mentorship immediately
      if (studentIds.length > 0 && topicRows.length > 0) {
        const { data: insertedTopics } = await supabase
          .from("mentor_theme_plan_topics")
          .select("id")
          .eq("plan_id", plan.id);
        
        if (insertedTopics && insertedTopics.length > 0) {
          const progressRows = studentIds.flatMap(uid =>
            insertedTopics.map(t => ({
              plan_id: plan.id,
              topic_id: t.id,
              user_id: uid,
              status: "pending" as const,
            }))
          );
          // Insert in batches of 100
          for (let i = 0; i < progressRows.length; i += 100) {
            await supabase.from("mentor_theme_plan_progress").insert(progressRows.slice(i, i + 100));
          }
        }
      }

      toast({ title: "Mentoria criada!", description: `"${name}" publicada para ${studentIds.length} aluno(s). O plano de estudo será atualizado automaticamente.` });
      setShowCreate(false);
      resetForm();
      loadPlans();
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Erro ao criar", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setExamDate("");
    setSelectedTopics([]);
    setCurrentTopic("");
    setCurrentSubtopic("");
    setTargetType("class");
    setSelectedClassId("");
    setSelectedStudentId("");
  };

  const deletePlan = async (planId: string) => {
    if (!confirm("Tem certeza que deseja apagar esta mentoria?")) return;
    await supabase.from("mentor_theme_plans").delete().eq("id", planId);
    toast({ title: "Mentoria removida" });
    loadPlans();
  };

  const viewProgress = async (plan: MentorPlan) => {
  const viewProgress = (plan: MentorPlan) => {
    setReportPlan(plan);
  };

  const subtopicOptions = currentTopic ? (SPECIALTY_SUBTOPICS as Record<string, string[]>)[currentTopic] || [] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-primary" />
          Mentoria de Temas
        </h2>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Nova Mentoria
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <BookMarked className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">Nenhuma mentoria criada</p>
            <p className="text-xs">Crie uma mentoria para sugerir temas e data da prova aos seus alunos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {plans.map(plan => (
            <Card key={plan.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{plan.name}</h3>
                      <Badge variant={plan.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {plan.status === "active" ? "Ativa" : "Rascunho"}
                      </Badge>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{plan.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {plan.topics?.map(t => (
                        <Badge key={t.id} variant="outline" className="text-[10px]">
                          {t.topic}{t.subtopic ? ` → ${t.subtopic}` : ""}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      {plan.exam_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Prova: {new Date(plan.exam_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {plan.targets?.length || 0} alvo(s)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewProgress(plan)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePlan(plan.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Mentoria de Temas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da mentoria</Label>
              <Input placeholder="Ex: Preparatório Clínica Médica" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea placeholder="Objetivos e orientações..." value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Data da prova</Label>
              <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <Label>Temas</Label>
              <CycleFilter activeCycle={cycleFilter} onCycleChange={setCycleFilter} className="mb-1" />
              <div className="flex gap-2">
                <Select value={currentTopic} onValueChange={v => { setCurrentTopic(v); setCurrentSubtopic(""); }}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione o tema" /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {getFilteredSpecialties(cycleFilter).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={addTopic} disabled={!currentTopic}>Adicionar</Button>
              </div>
              {subtopicOptions.length > 0 && (
                <Select value={currentSubtopic} onValueChange={setCurrentSubtopic}>
                  <SelectTrigger><SelectValue placeholder="Subtópico (opcional)" /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {subtopicOptions.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex flex-wrap gap-1.5">
                {selectedTopics.map((t, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTopic(i)}>
                    {t.topic}{t.subtopic ? ` → ${t.subtopic}` : ""} ✕
                  </Badge>
                ))}
              </div>
            </div>

            {/* Target */}
            <div className="space-y-2">
              <Label>Público-alvo</Label>
              <Select value={targetType} onValueChange={v => setTargetType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Turma</SelectItem>
                  <SelectItem value="student">Aluno individual</SelectItem>
                  <SelectItem value="institution">Instituição</SelectItem>
                </SelectContent>
              </Select>

              {targetType === "class" && (
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {targetType === "student" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Buscar aluno por nome..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                    <Button size="sm" variant="outline" onClick={searchStudents}>Buscar</Button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {searchResults.map(s => (
                        <button
                          key={s.user_id}
                          className={`w-full text-left p-2 rounded-lg border text-xs transition-colors ${
                            selectedStudentId === s.user_id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                          }`}
                          onClick={() => setSelectedStudentId(s.user_id)}
                        >
                          <span className="font-medium">{s.display_name}</span>
                          <span className="text-muted-foreground ml-2">{s.faculdade} • {s.periodo}° período</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-1.5">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar e Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress detail dialog */}
      <Dialog open={!!detailPlan} onOpenChange={() => setDetailPlan(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailPlan?.name} — Acompanhamento</DialogTitle>
          </DialogHeader>
          {progressLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : progressData.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum progresso registrado ainda.</p>
              <p className="text-xs">Os alunos verão os temas sugeridos no dashboard e o Study Engine priorizará automaticamente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Group by student */}
              {[...new Set(progressData.map(d => d.user_id))].map(uid => {
                const studentProgress = progressData.filter(d => d.user_id === uid);
                const studentName = studentProgress[0]?.student_name || "Aluno";
                const totalQ = studentProgress.reduce((s, p) => s + (p.questions_answered || 0), 0);
                const totalC = studentProgress.reduce((s, p) => s + (p.correct_answers || 0), 0);
                const accuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;

                return (
                  <Card key={uid}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{studentName}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {totalQ > 0 ? `${accuracy}% • ${totalQ} questões` : "Sem atividade"}
                        </Badge>
                      </div>
                      {studentProgress.map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-xs">
                          {p.questions_answered > 0 ? (
                            <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                          <span className="flex-1">{p.mentor_theme_plan_topics?.topic || "Tema"}</span>
                          {p.questions_answered > 0 && (
                            <span className="text-muted-foreground">
                              {p.correct_answers}/{p.questions_answered}
                            </span>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorThemePlans;
