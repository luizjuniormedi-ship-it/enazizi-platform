import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StudentRow } from "./MonitoringTypes";
import { Users, Search, ArrowUpDown } from "lucide-react";

const statusConfig = {
  green: { label: "Ativo", className: "bg-emerald-500" },
  yellow: { label: "Atenção", className: "bg-yellow-500" },
  red: { label: "Risco", className: "bg-destructive" },
};

function StudentDetailSheet({ student, open, onClose }: { student: StudentRow | null; open: boolean; onClose: () => void }) {
  if (!student) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${statusConfig[student.status].className}`} />
            {student.display_name}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <p className="text-xs text-muted-foreground">{student.email}</p>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Approval Score</span>
                <span className="font-bold text-primary">{student.approval_score}%</span>
              </div>
              <Progress value={student.approval_score} className="h-2" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-black">{student.accuracy}%</p>
                <p className="text-[10px] text-muted-foreground">Acurácia</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-black">{student.tasks_completed}</p>
                <p className="text-[10px] text-muted-foreground">Tarefas concluídas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-black text-destructive">{student.tasks_overdue}</p>
                <p className="text-[10px] text-muted-foreground">Tarefas atrasadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-black">{Math.round(student.total_study_minutes / 60)}h</p>
                <p className="text-[10px] text-muted-foreground">Tempo de estudo</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-xs text-muted-foreground">
            Última atividade: {student.last_seen_at ? new Date(student.last_seen_at).toLocaleString("pt-BR") : "Nunca"}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function StudentsTab({ students }: { students: StudentRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "green" | "yellow" | "red">("all");
  const [sortBy, setSortBy] = useState<"name" | "score" | "activity">("score");
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);

  const filtered = students
    .filter(s => statusFilter === "all" || s.status === statusFilter)
    .filter(s => !search || s.display_name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "score") return b.approval_score - a.approval_score;
      if (sortBy === "activity") return (b.last_seen_at || "").localeCompare(a.last_seen_at || "");
      return a.display_name.localeCompare(b.display_name);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <div className="flex gap-1">
          {(["all", "red", "yellow", "green"] as const).map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="text-xs">
              {s === "all" ? "Todos" : statusConfig[s].label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => setSortBy(sortBy === "score" ? "activity" : sortBy === "activity" ? "name" : "score")} className="text-xs gap-1">
          <ArrowUpDown className="h-3 w-3" />
          {sortBy === "score" ? "Score" : sortBy === "activity" ? "Atividade" : "Nome"}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhum aluno encontrado</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.user_id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedStudent(s)}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full shrink-0 ${statusConfig[s.status].className}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.display_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{s.approval_score}%</p>
                  <p className="text-[10px] text-muted-foreground">{s.accuracy}% acerto</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {s.last_seen_at ? new Date(s.last_seen_at).toLocaleDateString("pt-BR") : "—"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StudentDetailSheet student={selectedStudent} open={!!selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}
