import { useState, useEffect, useCallback } from "react";
import { Building2, Users, TrendingUp, AlertTriangle, Plus, Crown, ChevronLeft, Activity, BookOpen, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitution } from "@/hooks/useInstitution";
import { useToast } from "@/hooks/use-toast";

/* ──────────────── Types ──────────────── */

interface ClassData {
  id: string;
  name: string;
  period: number | null;
  year: number | null;
  invite_code: string;
  is_active: boolean;
  student_count: number;
  avg_approval: number;
  status: "boa" | "atencao" | "critica";
}

interface StudentRow {
  user_id: string;
  display_name: string;
  email: string;
  approval_score: number;
  streak: number;
  questions_answered: number;
  accuracy: number;
  last_activity: string | null;
  status: "adequado" | "atencao" | "risco";
  risk_reason: string | null;
}

interface WeakSpecialty {
  specialty: string;
  avg_score: number;
}

/* ──────────────── Helper ──────────────── */

function getStudentStatus(score: number, questions: number): { status: StudentRow["status"]; reason: string | null } {
  if (score < 50 && questions > 10) return { status: "risco", reason: "Aprovação abaixo de 50%" };
  if (score < 50 && questions <= 10) return { status: "atencao", reason: "Poucos dados, tendência baixa" };
  if (score >= 50 && score < 70) return { status: "atencao", reason: null };
  return { status: "adequado", reason: null };
}

function classStatus(avg: number): ClassData["status"] {
  if (avg >= 70) return "boa";
  if (avg >= 50) return "atencao";
  return "critica";
}

const statusBadge = (s: ClassData["status"]) => {
  if (s === "boa") return <Badge className="bg-primary/10 text-primary text-xs">Boa</Badge>;
  if (s === "atencao") return <Badge variant="outline" className="border-accent text-accent-foreground text-xs">Atenção</Badge>;
  return <Badge variant="destructive" className="text-xs">Crítica</Badge>;
};

const studentStatusBadge = (s: StudentRow["status"]) => {
  if (s === "adequado") return <Badge className="bg-primary/10 text-primary text-xs">Adequado</Badge>;
  if (s === "atencao") return <Badge variant="outline" className="text-xs">Atenção</Badge>;
  return <Badge variant="destructive" className="text-xs">Em risco</Badge>;
};

/* ──────────────── Component ──────────────── */

const InstitutionalDashboard = () => {
  const { user } = useAuth();
  const { membership, isCoordinator } = useInstitution();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [weakSpecialties, setWeakSpecialties] = useState<WeakSpecialty[]>([]);
  const [engagement, setEngagement] = useState(0);
  const [loading, setLoading] = useState(true);

  // Class detail view
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [classStudents, setClassStudents] = useState<StudentRow[]>([]);
  const [loadingClass, setLoadingClass] = useState(false);

  // New class dialog
  const [showNewClass, setShowNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassPeriod, setNewClassPeriod] = useState("");

  const institutionId = membership?.institution_id;

  /* ── Load institution data ── */
  const loadData = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);

    // 1. Get all student user_ids in institution
    const { data: members } = await supabase
      .from("institution_members")
      .select("user_id")
      .eq("institution_id", institutionId)
      .eq("role", "student")
      .eq("is_active", true);

    const userIds = (members || []).map(m => m.user_id);

    // 2. Load classes + counts in parallel
    const [classesRes, profilesRes, approvalsRes, gamRes, perfRes, domainRes, presenceRes] = await Promise.all([
      supabase.from("classes").select("*").eq("institution_id", institutionId).eq("is_active", true).order("name"),
      userIds.length ? supabase.from("profiles").select("user_id, display_name, email").in("user_id", userIds) : { data: [] },
      userIds.length ? supabase.from("approval_scores").select("user_id, score").in("user_id", userIds).order("created_at", { ascending: false }) : { data: [] },
      userIds.length ? supabase.from("user_gamification").select("user_id, current_streak, last_activity_date").in("user_id", userIds) : { data: [] },
      userIds.length ? supabase.from("study_performance").select("user_id, questoes_respondidas, taxa_acerto").in("user_id", userIds) : { data: [] },
      userIds.length ? supabase.from("medical_domain_map").select("user_id, specialty, domain_score").in("user_id", userIds) : { data: [] },
      userIds.length ? supabase.from("user_presence").select("user_id, last_seen_at").in("user_id", userIds) : { data: [] },
    ]);

    // Build maps
    const approvalMap = new Map<string, number>();
    ((approvalsRes as any).data || []).forEach((a: any) => {
      if (!approvalMap.has(a.user_id)) approvalMap.set(a.user_id, Number(a.score));
    });

    const streakMap = new Map<string, { streak: number; lastDate: string | null }>();
    ((gamRes as any).data || []).forEach((g: any) =>
      streakMap.set(g.user_id, { streak: g.current_streak, lastDate: g.last_activity_date })
    );

    const perfMap = new Map<string, { questions: number; accuracy: number }>();
    ((perfRes as any).data || []).forEach((p: any) =>
      perfMap.set(p.user_id, { questions: p.questoes_respondidas, accuracy: Number(p.taxa_acerto) })
    );

    const presenceMap = new Map<string, string>();
    ((presenceRes as any).data || []).forEach((p: any) => presenceMap.set(p.user_id, p.last_seen_at));

    // Build student list
    const students: StudentRow[] = ((profilesRes as any).data || []).map((p: any) => {
      const score = approvalMap.get(p.user_id) ?? 0;
      const perf = perfMap.get(p.user_id);
      const gam = streakMap.get(p.user_id);
      const { status, reason } = getStudentStatus(score, perf?.questions ?? 0);
      return {
        user_id: p.user_id,
        display_name: p.display_name || p.email || "Aluno",
        email: p.email || "",
        approval_score: Math.round(score),
        streak: gam?.streak ?? 0,
        questions_answered: perf?.questions ?? 0,
        accuracy: Math.round(perf?.accuracy ?? 0),
        last_activity: presenceMap.get(p.user_id) || gam?.lastDate || null,
        status,
        risk_reason: reason,
      };
    });

    setAllStudents(students);

    // Engagement: % who were active in last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const activeCount = students.filter(s => {
      if (!s.last_activity) return false;
      return new Date(s.last_activity) >= threeDaysAgo;
    }).length;
    setEngagement(students.length > 0 ? Math.round((activeCount / students.length) * 100) : 0);

    // Weak specialties (aggregate medical_domain_map)
    const specMap = new Map<string, { total: number; count: number }>();
    ((domainRes as any).data || []).forEach((d: any) => {
      const prev = specMap.get(d.specialty) || { total: 0, count: 0 };
      specMap.set(d.specialty, { total: prev.total + Number(d.domain_score), count: prev.count + 1 });
    });
    const specArr: WeakSpecialty[] = Array.from(specMap.entries())
      .map(([specialty, { total, count }]) => ({ specialty, avg_score: Math.round(total / count) }))
      .sort((a, b) => a.avg_score - b.avg_score);
    setWeakSpecialties(specArr.slice(0, 3));

    // Enrich classes with student counts + avg approval
    const classMembersPromises = ((classesRes as any).data || []).map(async (c: any) => {
      const { data: cm } = await supabase
        .from("class_members")
        .select("user_id")
        .eq("class_id", c.id)
        .eq("role", "student")
        .eq("is_active", true);

      const cmIds = (cm || []).map((m: any) => m.user_id);
      const classStudents = students.filter(s => cmIds.includes(s.user_id));
      const avg = classStudents.length > 0
        ? Math.round(classStudents.reduce((sum, s) => sum + s.approval_score, 0) / classStudents.length)
        : 0;

      return {
        ...c,
        student_count: cmIds.length,
        avg_approval: avg,
        status: classStatus(avg),
      } as ClassData;
    });

    setClasses(await Promise.all(classMembersPromises));
    setLoading(false);
  }, [institutionId]);

  useEffect(() => {
    if (institutionId) loadData();
  }, [institutionId, loadData]);

  /* ── Load class detail ── */
  const openClassDetail = async (cls: ClassData) => {
    setSelectedClass(cls);
    setLoadingClass(true);

    const { data: cm } = await supabase
      .from("class_members")
      .select("user_id")
      .eq("class_id", cls.id)
      .eq("role", "student")
      .eq("is_active", true);

    const cmIds = (cm || []).map((m: any) => m.user_id);
    const filtered = allStudents
      .filter(s => cmIds.includes(s.user_id))
      .sort((a, b) => a.approval_score - b.approval_score);

    setClassStudents(filtered);
    setLoadingClass(false);
  };

  /* ── Create class ── */
  const createClass = async () => {
    if (!newClassName.trim() || !institutionId || !user) return;
    const { error } = await supabase.from("classes").insert({
      institution_id: institutionId,
      name: newClassName.trim(),
      period: newClassPeriod ? parseInt(newClassPeriod) : null,
      created_by: user.id,
    });
    if (error) {
      toast({ title: "Erro ao criar turma", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Turma criada com sucesso!" });
      setShowNewClass(false);
      setNewClassName("");
      setNewClassPeriod("");
      loadData();
    }
  };

  /* ── Derived ── */
  const atRiskStudents = allStudents.filter(s => s.status === "risco");
  const totalStudents = allStudents.length;
  const avgApproval = totalStudents > 0
    ? Math.round(allStudents.reduce((s, st) => s + st.approval_score, 0) / totalStudents)
    : 0;

  /* ── No membership ── */
  if (!membership) {
    return (
      <div className="p-6 text-center">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Sem vínculo institucional</h2>
        <p className="text-muted-foreground">Você não está vinculado a nenhuma instituição.</p>
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  /* ── Class detail view ── */
  if (selectedClass) {
    const classAtRisk = classStudents.filter(s => s.status === "risco");
    const classAvg = classStudents.length > 0
      ? Math.round(classStudents.reduce((s, st) => s + st.approval_score, 0) / classStudents.length)
      : 0;

    return (
      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setSelectedClass(null)} className="mb-2">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>

        <div>
          <h1 className="text-xl font-bold">{selectedClass.name}</h1>
          <p className="text-sm text-muted-foreground">
            {selectedClass.period ? `${selectedClass.period}º período · ` : ""}
            {classStudents.length} alunos · Código: <code className="bg-muted px-1 rounded font-mono text-xs">{selectedClass.invite_code}</code>
          </p>
        </div>

        {/* Class summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{classAvg}%</p>
              <p className="text-xs text-muted-foreground">Aprovação média</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{classStudents.length}</p>
              <p className="text-xs text-muted-foreground">Alunos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{classAtRisk.length}</p>
              <p className="text-xs text-muted-foreground">Em risco</p>
            </CardContent>
          </Card>
        </div>

        {/* Student list sorted worst-first */}
        {loadingClass ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : classStudents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum aluno vinculado a esta turma.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Aprovação</TableHead>
                    <TableHead className="text-center">Acerto</TableHead>
                    <TableHead className="text-center">Streak</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map(s => (
                    <TableRow key={s.user_id}>
                      <TableCell>
                        <p className="font-medium text-sm">{s.display_name}</p>
                      </TableCell>
                      <TableCell className="text-center font-bold text-sm">{s.approval_score}%</TableCell>
                      <TableCell className="text-center text-sm">{s.accuracy}%</TableCell>
                      <TableCell className="text-center text-sm">{s.streak}d</TableCell>
                      <TableCell className="text-center">{studentStatusBadge(s.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  /* ── Main dashboard view ── */
  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Painel do Coordenador
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {membership.institution.name} · Visão institucional
          </p>
        </div>
        {isCoordinator && (
          <Button onClick={() => setShowNewClass(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nova Turma
          </Button>
        )}
      </div>

      {/* ── 4 Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">Alunos ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{avgApproval}%</p>
            <p className="text-xs text-muted-foreground">Aprovação média</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{engagement}%</p>
            <p className="text-xs text-muted-foreground">Engajamento (3 dias)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-destructive mb-1" />
            <p className="text-2xl font-bold">{atRiskStudents.length}</p>
            <p className="text-xs text-muted-foreground">Em risco</p>
          </CardContent>
        </Card>
      </div>

      {/* ── At-risk students ── */}
      {atRiskStudents.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Alunos que precisam de atenção ({atRiskStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {atRiskStudents.slice(0, 6).map(s => (
                <div key={s.user_id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5">
                  <div>
                    <p className="text-sm font-medium">{s.display_name}</p>
                    <p className="text-xs text-muted-foreground">{s.risk_reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">{s.approval_score}%</p>
                    <p className="text-xs text-muted-foreground">{s.questions_answered} questões</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Turmas ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Turmas ({classes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Nenhuma turma cadastrada ainda.</p>
              <Button onClick={() => setShowNewClass(true)} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Criar Turma
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {classes.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openClassDetail(c)}
                >
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.student_count} alunos · Aprovação: {c.avg_approval}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(c.status)}
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Weak specialties ── */}
      {weakSpecialties.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Pontos fracos coletivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakSpecialties.map(ws => (
              <div key={ws.specialty}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{ws.specialty}</p>
                  <p className="text-sm font-bold">{ws.avg_score}%</p>
                </div>
                <Progress value={ws.avg_score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ── */}
      {totalStudents === 0 && classes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-semibold">Sem dados suficientes ainda</p>
            <p className="text-sm text-muted-foreground">Crie turmas e vincule alunos para ver o painel completo.</p>
          </CardContent>
        </Card>
      )}

      {/* ── New Class Dialog ── */}
      <Dialog open={showNewClass} onOpenChange={setShowNewClass}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da turma</Label>
              <Input value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="Ex: Turma A - Internato 2026" />
            </div>
            <div>
              <Label>Período (opcional)</Label>
              <Select value={newClassPeriod} onValueChange={setNewClassPeriod}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => (
                    <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClass(false)}>Cancelar</Button>
            <Button onClick={createClass} disabled={!newClassName.trim()}>Criar Turma</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstitutionalDashboard;
