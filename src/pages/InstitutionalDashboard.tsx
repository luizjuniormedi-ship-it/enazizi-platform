import { useState, useEffect } from "react";
import { Building2, Users, BookOpen, TrendingUp, AlertTriangle, Plus, UserPlus, Crown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitution } from "@/hooks/useInstitution";
import { useToast } from "@/hooks/use-toast";

interface ClassData {
  id: string;
  name: string;
  period: number | null;
  year: number | null;
  invite_code: string;
  is_active: boolean;
  student_count?: number;
}

interface StudentOverview {
  user_id: string;
  display_name: string;
  email: string;
  approval_score: number;
  streak: number;
  questions_answered: number;
  accuracy: number;
  at_risk: boolean;
}

const InstitutionalDashboard = () => {
  const { user } = useAuth();
  const { membership, isCoordinator } = useInstitution();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<StudentOverview[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, avgApproval: 0, atRisk: 0, avgStreak: 0 });
  const [showNewClass, setShowNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassPeriod, setNewClassPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const institutionId = membership?.institution_id;

  useEffect(() => {
    if (!institutionId) return;
    loadData();
  }, [institutionId]);

  const loadData = async () => {
    if (!institutionId) return;
    setLoading(true);

    // Load classes
    const { data: classesData } = await supabase
      .from("classes")
      .select("*")
      .eq("institution_id", institutionId)
      .eq("is_active", true)
      .order("name");

    const enrichedClasses: ClassData[] = [];
    for (const c of classesData || []) {
      const { count } = await supabase
        .from("class_members")
        .select("*", { count: "exact", head: true })
        .eq("class_id", c.id)
        .eq("role", "student");
      enrichedClasses.push({ ...c, student_count: count || 0 });
    }
    setClasses(enrichedClasses);

    // Load all institution students
    const { data: members } = await supabase
      .from("institution_members")
      .select("user_id")
      .eq("institution_id", institutionId)
      .eq("role", "student")
      .eq("is_active", true);

    const userIds = (members || []).map(m => m.user_id);
    if (userIds.length === 0) {
      setStudents([]);
      setStats({ totalStudents: 0, avgApproval: 0, atRisk: 0, avgStreak: 0 });
      setLoading(false);
      return;
    }

    // Load profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);

    // Load approval scores (latest per user)
    const { data: approvals } = await supabase
      .from("approval_scores")
      .select("user_id, score")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    // Load gamification
    const { data: gamification } = await supabase
      .from("user_gamification")
      .select("user_id, current_streak")
      .in("user_id", userIds);

    // Load performance
    const { data: performance } = await supabase
      .from("study_performance")
      .select("user_id, questoes_respondidas, taxa_acerto")
      .in("user_id", userIds);

    const approvalMap = new Map<string, number>();
    (approvals || []).forEach(a => {
      if (!approvalMap.has(a.user_id)) approvalMap.set(a.user_id, Number(a.score));
    });

    const streakMap = new Map<string, number>();
    (gamification || []).forEach(g => streakMap.set(g.user_id, g.current_streak));

    const perfMap = new Map<string, { questions: number; accuracy: number }>();
    (performance || []).forEach(p => perfMap.set(p.user_id, {
      questions: p.questoes_respondidas,
      accuracy: Number(p.taxa_acerto),
    }));

    const studentList: StudentOverview[] = (profiles || []).map(p => {
      const score = approvalMap.get(p.user_id) ?? 0;
      const perf = perfMap.get(p.user_id);
      return {
        user_id: p.user_id,
        display_name: p.display_name || p.email || "Aluno",
        email: p.email || "",
        approval_score: score,
        streak: streakMap.get(p.user_id) ?? 0,
        questions_answered: perf?.questions ?? 0,
        accuracy: perf?.accuracy ?? 0,
        at_risk: score < 50 && (perf?.questions ?? 0) > 10,
      };
    });

    setStudents(studentList);

    const avgApproval = studentList.length > 0
      ? Math.round(studentList.reduce((s, st) => s + st.approval_score, 0) / studentList.length)
      : 0;
    const avgStreak = studentList.length > 0
      ? Math.round(studentList.reduce((s, st) => s + st.streak, 0) / studentList.length)
      : 0;

    setStats({
      totalStudents: studentList.length,
      avgApproval,
      atRisk: studentList.filter(s => s.at_risk).length,
      avgStreak,
    });

    setLoading(false);
  };

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

  const filteredStudents = selectedClassId
    ? students // TODO: filter by class membership
    : students;

  if (!membership) {
    return (
      <div className="p-6 text-center">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Sem vínculo institucional</h2>
        <p className="text-muted-foreground">Você não está vinculado a nenhuma instituição.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {membership.institution.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Painel institucional · {membership.role === "coordinator" ? "Coordenador" : membership.role === "institutional_admin" ? "Administrador" : "Professor"}
          </p>
        </div>
        {isCoordinator && (
          <Button onClick={() => setShowNewClass(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nova Turma
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{stats.totalStudents}</p>
            <p className="text-xs text-muted-foreground">Alunos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{stats.avgApproval}%</p>
            <p className="text-xs text-muted-foreground">Aprovação média</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-destructive mb-1" />
            <p className="text-2xl font-bold">{stats.atRisk}</p>
            <p className="text-xs text-muted-foreground">Em risco</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{stats.avgStreak}</p>
            <p className="text-xs text-muted-foreground">Streak médio</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="classes">Turmas</TabsTrigger>
          <TabsTrigger value="students">Alunos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* At-risk students */}
          {stats.atRisk > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Alunos em risco ({stats.atRisk})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredStudents.filter(s => s.at_risk).slice(0, 5).map(s => (
                    <div key={s.user_id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5">
                      <div>
                        <p className="text-sm font-medium">{s.display_name}</p>
                        <p className="text-xs text-muted-foreground">Aprovação: {s.approval_score}%</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">Atenção</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top performers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Destaques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...filteredStudents].sort((a, b) => b.approval_score - a.approval_score).slice(0, 5).map((s, i) => (
                  <div key={s.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}.</span>
                      <p className="text-sm font-medium">{s.display_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{s.approval_score}%</p>
                      <p className="text-xs text-muted-foreground">{s.questions_answered} questões</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4 mt-4">
          {classes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-semibold">Nenhuma turma cadastrada</p>
                <p className="text-sm text-muted-foreground mb-4">Crie uma turma para começar a acompanhar seus alunos.</p>
                <Button onClick={() => setShowNewClass(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Criar Turma
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {classes.map(c => (
                <Card key={c.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{c.name}</h3>
                        {c.period && <p className="text-xs text-muted-foreground">{c.period}º período</p>}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {c.student_count} alunos
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{c.invite_code}</code>
                      <span className="text-xs text-muted-foreground">Código de convite</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Aprovação</TableHead>
                    <TableHead className="text-center">Questões</TableHead>
                    <TableHead className="text-center">Acerto</TableHead>
                    <TableHead className="text-center">Streak</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum aluno encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map(s => (
                      <TableRow key={s.user_id}>
                        <TableCell>
                          <p className="font-medium text-sm">{s.display_name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${s.approval_score >= 70 ? "text-green-600" : s.approval_score >= 50 ? "text-amber-600" : "text-destructive"}`}>
                            {s.approval_score}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm">{s.questions_answered}</TableCell>
                        <TableCell className="text-center text-sm">{s.accuracy}%</TableCell>
                        <TableCell className="text-center text-sm">{s.streak} dias</TableCell>
                        <TableCell className="text-center">
                          {s.at_risk ? (
                            <Badge variant="destructive" className="text-xs">Em risco</Badge>
                          ) : s.approval_score >= 70 ? (
                            <Badge className="bg-green-500/10 text-green-700 text-xs">Bom</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Regular</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Class Dialog */}
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
