import { CalendarDays, Clock, BookOpen, Upload, Loader2, Settings2, Trash2, GraduationCap, Plus, Pencil, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Task {
  time: string;
  subject: string;
  duration: string;
  type?: string;
}

interface DaySchedule {
  day: string;
  tasks: Task[];
}

interface PlanJson {
  weeklySchedule?: DaySchedule[];
  subjects?: string[];
  tips?: string;
  config?: {
    examDate: string;
    hoursPerDay: number;
    daysPerWeek: number;
    hasEdital: boolean;
  };
}

const StudyPlan = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Config state
  const [examDate, setExamDate] = useState<Date>();
  const [hoursPerDay, setHoursPerDay] = useState("4");
  const [daysPerWeek, setDaysPerWeek] = useState("5");
  const [editalText, setEditalText] = useState("");
  const [editalFileName, setEditalFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plan state
  const [planId, setPlanId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [tips, setTips] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [editingTask, setEditingTask] = useState<{ day: number; task: number } | null>(null);
  const [editValues, setEditValues] = useState<Task>({ time: "", subject: "", duration: "" });

  // Load existing plan
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.plan_json) {
        const plan = data.plan_json as PlanJson;
        setPlanId(data.id);
        setSchedule(plan.weeklySchedule || []);
        setSubjects(plan.subjects || []);
        setTips(plan.tips || "");
        if (plan.config) {
          if (plan.config.examDate) setExamDate(new Date(plan.config.examDate));
          setHoursPerDay(String(plan.config.hoursPerDay || 4));
          setDaysPerWeek(String(plan.config.daysPerWeek || 5));
        }
      } else {
        setShowConfig(true);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleEditalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditalFileName(file.name);

    if (file.type === "text/plain") {
      const text = await file.text();
      setEditalText(text);
      toast({ title: "Edital carregado!", description: `${file.name} processado.` });
    } else if (file.type === "application/pdf") {
      // For PDF, upload to storage and use process-upload to extract
      if (!user) return;
      try {
        const ext = file.name.split(".").pop();
        const storagePath = `${user.id}/edital-${Date.now()}.${ext}`;
        const { error: storageError } = await supabase.storage.from("user-uploads").upload(storagePath, file);
        if (storageError) throw storageError;

        // Create upload record for processing
        const { data: uploadRecord, error: dbError } = await supabase
          .from("uploads")
          .insert({
            user_id: user.id,
            filename: file.name,
            file_type: ext || "pdf",
            category: "edital",
            storage_path: storagePath,
            status: "uploaded",
          })
          .select()
          .single();
        if (dbError) throw dbError;

        // Process to extract text
        const { data: session } = await supabase.auth.getSession();
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ uploadId: uploadRecord.id }),
        });

        if (resp.ok) {
          // Fetch the extracted text
          const { data: updated } = await supabase
            .from("uploads")
            .select("extracted_text")
            .eq("id", uploadRecord.id)
            .single();
          if (updated?.extracted_text) {
            setEditalText(updated.extracted_text);
          }
        }
        toast({ title: "Edital processado!", description: "Texto extraído do PDF." });
      } catch (err: any) {
        toast({ title: "Erro ao processar edital", description: err.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Formato não suportado", description: "Envie PDF ou TXT.", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generatePlan = async () => {
    if (!user || !examDate) {
      toast({ title: "Preencha a data da prova", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-study-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({
          examDate: format(examDate, "yyyy-MM-dd"),
          hoursPerDay: Number(hoursPerDay),
          daysPerWeek: Number(daysPerWeek),
          editalText: editalText || null,
          currentPlanId: planId,
        }),
      });

      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error);

      const plan = result.plan.plan_json as PlanJson;
      setPlanId(result.plan.id);
      setSchedule(plan.weeklySchedule || []);
      setSubjects(plan.subjects || []);
      setTips(plan.tips || "");
      setShowConfig(false);
      toast({ title: "Cronograma gerado!", description: "Você pode editar os blocos manualmente." });
    } catch (err: any) {
      toast({ title: "Erro ao gerar cronograma", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const savePlan = async (updatedSchedule: DaySchedule[]) => {
    if (planId) {
      await supabase.from("study_plans").update({
        plan_json: JSON.parse(JSON.stringify({ weeklySchedule: updatedSchedule, subjects, tips, config: { examDate: examDate?.toISOString() || "", hoursPerDay: Number(hoursPerDay), daysPerWeek: Number(daysPerWeek), hasEdital: !!editalText } })),
      }).eq("id", planId);
    }
  };

  const removeTask = async (dayIndex: number, taskIndex: number) => {
    const updated = schedule.map((day, di) => {
      if (di !== dayIndex) return day;
      return { ...day, tasks: day.tasks.filter((_, ti) => ti !== taskIndex) };
    });
    setSchedule(updated);
    await savePlan(updated);
  };

  const startEdit = (dayIndex: number, taskIndex: number) => {
    setEditingTask({ day: dayIndex, task: taskIndex });
    setEditValues({ ...schedule[dayIndex].tasks[taskIndex] });
  };

  const saveEdit = async () => {
    if (!editingTask) return;
    const updated = schedule.map((day, di) => {
      if (di !== editingTask.day) return day;
      return { ...day, tasks: day.tasks.map((t, ti) => ti === editingTask.task ? { ...t, ...editValues } : t) };
    });
    setSchedule(updated);
    setEditingTask(null);
    await savePlan(updated);
    toast({ title: "Bloco atualizado!" });
  };

  const daysUntilExam = examDate ? Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const typeColor = (type?: string) => {
    switch (type) {
      case "revisao": return "border-l-4 border-l-accent";
      case "simulado": return "border-l-4 border-l-warning";
      default: return "border-l-4 border-l-primary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Cronograma de Estudos
          </h1>
          <p className="text-muted-foreground">
            {daysUntilExam !== null && daysUntilExam > 0
              ? `${daysUntilExam} dias até a prova • ${hoursPerDay}h/dia • ${daysPerWeek} dias/semana`
              : "Configure seu plano de estudos personalizado."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button size="sm" onClick={() => {
            setPlanId(null);
            setSchedule([]);
            setSubjects([]);
            setTips("");
            setExamDate(undefined);
            setHoursPerDay("4");
            setDaysPerWeek("5");
            setEditalText("");
            setEditalFileName("");
            setShowConfig(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cronograma
          </Button>
        </div>
      </div>

      {/* Config Panel */}
      {showConfig && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Configurações do Plano
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Exam Date */}
            <div className="space-y-2">
              <Label>Data da prova</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !examDate && "text-muted-foreground")}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {examDate ? format(examDate, "dd/MM/yyyy") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={examDate}
                    onSelect={setExamDate}
                    disabled={(date) => date < new Date()}
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Hours per day */}
            <div className="space-y-2">
              <Label>Horas de estudo por dia</Label>
              <Select value={hoursPerDay} onValueChange={setHoursPerDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((h) => (
                    <SelectItem key={h} value={String(h)}>{h}h por dia</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Days per week */}
            <div className="space-y-2">
              <Label>Dias de estudo por semana</Label>
              <Select value={daysPerWeek} onValueChange={setDaysPerWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7].map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} dias</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Edital Upload */}
          <div className="space-y-2">
            <Label>Edital do concurso (opcional)</Label>
            <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleEditalUpload} />
            <div
              className="border-2 border-dashed border-primary/30 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {editalFileName ? (
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{editalFileName}</span>
                  <span className="text-xs text-muted-foreground">✓ carregado</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-primary/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Envie o edital (PDF ou TXT) para personalizar seu plano</p>
                </>
              )}
            </div>
          </div>

          <Button onClick={generatePlan} disabled={generating || !examDate} className="w-full">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando cronograma com IA...
              </>
            ) : (
              <>
                <CalendarDays className="h-4 w-4 mr-2" />
                {schedule.length > 0 ? "Regenerar Cronograma" : "Gerar Cronograma com IA"}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Tips */}
      {tips && (
        <div className="glass-card p-4 border-l-4 border-l-accent">
          <p className="text-sm text-muted-foreground">💡 {tips}</p>
        </div>
      )}

      {/* Schedule Grid */}
      {schedule.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schedule.map((day, dayIndex) => (
            <div key={day.day} className="glass-card p-5">
              <h3 className="font-semibold text-primary mb-3">{day.day}</h3>
              <div className="space-y-3">
                {day.tasks.map((task, taskIndex) => {
                  const isEditing = editingTask?.day === dayIndex && editingTask?.task === taskIndex;
                  return isEditing ? (
                    <div key={taskIndex} className={`p-3 rounded-lg bg-secondary/50 space-y-2 ${typeColor(task.type)}`}>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={editValues.time}
                          onChange={(e) => setEditValues(v => ({ ...v, time: e.target.value }))}
                          placeholder="08:00"
                          className="h-8 text-xs"
                        />
                        <Input
                          value={editValues.duration}
                          onChange={(e) => setEditValues(v => ({ ...v, duration: e.target.value }))}
                          placeholder="2h"
                          className="h-8 text-xs"
                        />
                      </div>
                      <Input
                        value={editValues.subject}
                        onChange={(e) => setEditValues(v => ({ ...v, subject: e.target.value }))}
                        placeholder="Matéria"
                        className="h-8 text-xs"
                      />
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTask(null)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="default" size="icon" className="h-7 w-7" onClick={saveEdit}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div key={taskIndex} className={`flex gap-3 items-start p-3 rounded-lg bg-secondary/50 ${typeColor(task.type)}`}>
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{task.subject}</div>
                        <div className="text-xs text-muted-foreground">{task.time} • {task.duration}</div>
                      </div>
                      <button aria-label="Editar bloco" title="Editar" onClick={() => startEdit(dayIndex, taskIndex)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Pencil className="h-4.5 w-4.5" />
                      </button>
                      <button aria-label="Remover bloco" title="Remover" onClick={() => removeTask(dayIndex, taskIndex)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : !showConfig ? (
        <div className="glass-card p-12 text-center">
          <GraduationCap className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Nenhum cronograma configurado</p>
          <p className="text-sm text-muted-foreground mb-4">Configure a data da prova e horas de estudo para gerar seu plano.</p>
          <Button onClick={() => setShowConfig(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Configurar agora
          </Button>
        </div>
      ) : null}

      {/* Subjects */}
      {subjects.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-3">Matérias do plano</h3>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
