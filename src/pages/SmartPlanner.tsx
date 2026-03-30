import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target, BookOpen, CalendarDays, History,
  Loader2, Brain, AlertTriangle, GraduationCap, Clock, TrendingUp, BarChart3
} from "lucide-react";

// Reuse existing cronograma components
import CronogramaNovoTema from "@/components/cronograma/CronogramaNovoTema";
import CronogramaTemas from "@/components/cronograma/CronogramaTemas";
import CronogramaHistorico from "@/components/cronograma/CronogramaHistorico";
import { useNavigate } from "react-router-dom";
import StudyPlanContent from "@/components/cronograma/StudyPlanContent";
import { syncTemasToModules, updateStudyPerformanceContext } from "@/lib/cronogramaSync";

// Import types and algorithms from cronograma
import {
  type TemaEstudado, type Revisao, type Desempenho, type CronogramaConfig,
  type PesosAlgoritmo, type TemaComputado,
  computeTema, calcPreparation, getPreparationLevel,
  generateReviewsByError, REVIEW_DAYS, SPECIALTIES,
} from "@/pages/CronogramaInteligente";

const DEFAULT_PESOS: PesosAlgoritmo = { erro: 0.3, tempo: 0.2, atraso: 0.2, dificuldade: 0.15, confianca: 0.15 };

const SmartPlanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [temas, setTemas] = useState<TemaEstudado[]>([]);
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);
  const [desempenhos, setDesempenhos] = useState<Desempenho[]>([]);
  const [config, setConfig] = useState<CronogramaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("objetivo");

  const loadData = useCallback(async () => {
    if (!user) return;
    const [temasRes, revisoesRes, desRes, configRes] = await Promise.all([
      supabase.from("temas_estudados").select("*").eq("user_id", user.id).order("data_estudo", { ascending: false }),
      supabase.from("revisoes").select("*").eq("user_id", user.id).order("data_revisao", { ascending: true }),
      supabase.from("desempenho_questoes").select("*").eq("user_id", user.id).order("data_registro", { ascending: false }),
      supabase.from("cronograma_config").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setTemas((temasRes.data as any[]) || []);
    setRevisoes((revisoesRes.data as any[]) || []);
    setDesempenhos((desRes.data as any[]) || []);
    setConfig((configRes.data as any) || null);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const pesos = config?.pesos_algoritmo || DEFAULT_PESOS;
  const temasComputados = temas.map(t => computeTema(t, revisoes, desempenhos, pesos as PesosAlgoritmo));

  // Derived stats
  const today = new Date().toISOString().split("T")[0];
  const revisoesHoje = revisoes.filter(r => r.data_revisao <= today && r.status === "pendente");
  const revisoesAtrasadas = revisoes.filter(r => r.data_revisao < today && r.status === "pendente");
  const totalQuestoes = desempenhos.reduce((s, d) => s + d.questoes_feitas, 0);
  const totalErros = desempenhos.reduce((s, d) => s + d.questoes_erradas, 0);
  const taxaGeralAcerto = totalQuestoes > 0 ? Math.round(((totalQuestoes - totalErros) / totalQuestoes) * 100) : 0;
  const preparation = calcPreparation(temas, revisoes, desempenhos);
  const prepLevel = getPreparationLevel(preparation);

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const revisoesSemana = revisoes.filter(r => r.status === "concluida" && r.concluida_em && new Date(r.concluida_em) >= weekAgo).length;

  // Specialty performance
  const specPerf: Record<string, { feitas: number; erros: number }> = {};
  desempenhos.forEach(d => {
    const t = temas.find(t => t.id === d.tema_id);
    if (!t) return;
    if (!specPerf[t.especialidade]) specPerf[t.especialidade] = { feitas: 0, erros: 0 };
    specPerf[t.especialidade].feitas += d.questoes_feitas;
    specPerf[t.especialidade].erros += d.questoes_erradas;
  });
  const specEntries = Object.entries(specPerf).filter(([, v]) => v.feitas > 0).map(([name, v]) => ({
    name, taxa: Math.round(((v.feitas - v.erros) / v.feitas) * 100), feitas: v.feitas
  }));

  // Handlers (reused from cronograma)
  const handleAddTema = async (
    tema: string, especialidade: string, subtopico: string, dataEstudo: string,
    fonte: string, dificuldade: string, observacoes: string,
    questoesFeitas: number, questoesErradas: number,
    files?: File[]
  ) => {
    if (!user) return;
    let anexos: { name: string; path: string }[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const filePath = `${user.id}/cronograma/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("user-uploads").upload(filePath, file);
        if (!upErr) anexos.push({ name: file.name, path: filePath });
      }
    }

    const { data, error } = await supabase.from("temas_estudados").insert({
      user_id: user.id, tema, especialidade, subtopico: subtopico || null,
      data_estudo: dataEstudo, fonte, dificuldade,
      observacoes: observacoes || null, status: "ativo",
      anexos: anexos.length > 0 ? anexos : [],
    } as any).select().single();
    if (error || !data) { toast({ title: "Erro", description: "Não foi possível salvar o tema.", variant: "destructive" }); return; }

    const temaId = (data as any).id;
    const taxaErro = questoesFeitas > 0 ? Math.round((questoesErradas / questoesFeitas) * 100) : 0;
    const taxaAcerto = questoesFeitas > 0 ? Math.round(((questoesFeitas - questoesErradas) / questoesFeitas) * 100) : 0;

    if (questoesFeitas > 0) {
      await supabase.from("desempenho_questoes").insert({
        user_id: user.id, tema_id: temaId,
        questoes_feitas: questoesFeitas, questoes_erradas: questoesErradas,
        taxa_acerto: taxaAcerto, nivel_confianca: "parcial",
      } as any);
    }

    const configExtras = config?.revisoes_extras_ativas !== false;
    const reviews = configExtras ? generateReviewsByError(dataEstudo, taxaErro) : generateReviewsByError(dataEstudo, 0);
    const reviewRows = reviews.map(r => ({
      user_id: user.id, tema_id: temaId, tipo_revisao: r.tipo,
      data_revisao: r.data, status: "pendente", prioridade: 50, risco_esquecimento: "baixo",
    }));
    await supabase.from("revisoes").insert(reviewRows as any);

    toast({ title: "✅ Tema registrado!", description: `${reviews.length} revisões agendadas.` });
    setActiveTab("conteudo");
    loadData();
  };

  const handleCompleteRevisao = async (
    revisao: Revisao, questoesFeitas: number, questoesErradas: number,
    tempoGasto: number, nivelConfianca: string, obs: string
  ) => {
    if (!user) return;
    const acertos = questoesFeitas - questoesErradas;
    const taxa = questoesFeitas > 0 ? Math.round((acertos / questoesFeitas) * 100) : 0;
    const taxaErro = questoesFeitas > 0 ? Math.round((questoesErradas / questoesFeitas) * 100) : 0;

    await supabase.from("revisoes").update({ status: "concluida", concluida_em: new Date().toISOString() } as any).eq("id", revisao.id);
    await supabase.from("desempenho_questoes").insert({
      user_id: user.id, tema_id: revisao.tema_id, revisao_id: revisao.id,
      questoes_feitas: questoesFeitas, questoes_erradas: questoesErradas,
      taxa_acerto: taxa, tempo_gasto: tempoGasto,
      nivel_confianca: nivelConfianca, observacoes: obs || null,
    } as any);

    const configExtras = config?.revisoes_extras_ativas !== false;
    if (configExtras && taxaErro > 20) {
      const tema = temas.find(t => t.id === revisao.tema_id);
      if (tema) {
        const existingTypes = revisoes.filter(r => r.tema_id === tema.id).map(r => r.tipo_revisao);
        let extrasNeeded: string[] = [];
        if (taxaErro > 60) extrasNeeded = ["D2", "D4", "D5"].filter(t => !existingTypes.includes(t));
        else if (taxaErro > 40) extrasNeeded = ["D2", "D5"].filter(t => !existingTypes.includes(t));
        else extrasNeeded = ["D5"].filter(t => !existingTypes.includes(t));

        if (extrasNeeded.length > 0) {
          const extraRows = extrasNeeded.map(tipo => {
            const d = new Date(tema.data_estudo + "T12:00:00");
            d.setDate(d.getDate() + REVIEW_DAYS[tipo]);
            return { user_id: user.id, tema_id: tema.id, tipo_revisao: tipo, data_revisao: d.toISOString().split("T")[0], status: "pendente", prioridade: 70, risco_esquecimento: "alto" };
          });
          await supabase.from("revisoes").insert(extraRows as any);
        }
      }
    }

    if (nivelConfianca === "nao_sei") {
      const nextPending = revisoes.find(r => r.tema_id === revisao.tema_id && r.status === "pendente" && r.id !== revisao.id);
      if (nextPending) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await supabase.from("revisoes").update({ data_revisao: tomorrow.toISOString().split("T")[0], prioridade: 90 } as any).eq("id", nextPending.id);
      }
    }

    toast({ title: "✅ Revisão concluída!", description: `Acerto: ${taxa}%` });
    setActiveRevisao(null);
    const tema = temas.find(t => t.id === revisao.tema_id);
    if (tema) {
      updateStudyPerformanceContext(user.id, [{ id: tema.id, tema: tema.tema, especialidade: tema.especialidade }]).catch(() => {});
    }
    loadData();
  };

  const handleDeleteTema = async (temaId: string) => {
    await supabase.from("desempenho_questoes").delete().eq("tema_id", temaId);
    await supabase.from("revisoes").delete().eq("tema_id", temaId);
    await supabase.from("temas_estudados").delete().eq("id", temaId);
    toast({ title: "Tema removido" });
    loadData();
  };

  // Redirect to Daily Plan instead of inline execution
  const startRevisao = (_revisao: Revisao) => {
    navigate("/dashboard/plano-dia");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (activeRevisao) {
    const temaComp = temasComputados.find(t => t.id === activeRevisao.tema_id);
    return (
      <CronogramaRevisaoAtiva
        revisao={activeRevisao}
        temaComputado={temaComp || null}
        desempenhos={desempenhos.filter(d => d.tema_id === activeRevisao.tema_id)}
        onComplete={handleCompleteRevisao}
        onBack={() => setActiveRevisao(null)}
      />
    );
  }

  // Count topics per specialty
  const specTopicCount: Record<string, number> = {};
  temas.forEach(t => { specTopicCount[t.especialidade] = (specTopicCount[t.especialidade] || 0) + 1; });
  const totalRevisoesPendentes = revisoes.filter(r => r.status === "pendente").length;
  const totalRevisoesConcluidas = revisoes.filter(r => r.status === "concluida").length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Plano Geral
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estratégia macro de estudos — planeje aqui, execute no Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          {revisoesAtrasadas.length > 0 && (
            <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {revisoesAtrasadas.length} atrasadas
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs — 4 seções claras */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="objetivo" className="text-xs py-2 flex flex-col gap-0.5 items-center">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Prova & Objetivo</span>
            <span className="sm:hidden">Objetivo</span>
          </TabsTrigger>
          <TabsTrigger value="conteudo" className="text-xs py-2 flex flex-col gap-0.5 items-center">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Conteúdo</span>
            <span className="sm:hidden">Temas</span>
          </TabsTrigger>
          <TabsTrigger value="calendario" className="text-xs py-2 flex flex-col gap-0.5 items-center">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Calendário</span>
            <span className="sm:hidden">Agenda</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-xs py-2 flex flex-col gap-0.5 items-center">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
            <span className="sm:hidden">Hist.</span>
          </TabsTrigger>
        </TabsList>

        {/* ──────────────────────────────────────── */}
        {/* SEÇÃO 1 — PROVA E OBJETIVO */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="objetivo" className="space-y-4 mt-4">
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <GraduationCap className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{temas.length}</p>
                <p className="text-[10px] text-muted-foreground">Temas cadastrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{preparation}%</p>
                <p className="text-[10px] text-muted-foreground">Preparação ({typeof prepLevel === 'object' ? prepLevel.label : prepLevel})</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <BarChart3 className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{taxaGeralAcerto}%</p>
                <p className="text-[10px] text-muted-foreground">Acerto geral ({totalQuestoes} Q)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <CalendarDays className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{totalRevisoesPendentes}</p>
                <p className="text-[10px] text-muted-foreground">Revisões pendentes</p>
              </CardContent>
            </Card>
          </div>

          {/* Importar edital / configurar prova */}
          <StudyPlanContent
            onSyncComplete={async () => { await loadData(); setActiveTab("conteudo"); }}
            onSubjectsGenerated={async (subjects: string[]) => {
              if (!user) return;
              const today = new Date().toISOString().split("T")[0];

              await supabase.from("desempenho_questoes").delete().eq("user_id", user.id);
              await supabase.from("revisoes").delete().eq("user_id", user.id);
              await supabase.from("temas_estudados").delete().eq("user_id", user.id);
              setTemas([]);

              if (subjects.length === 0) return { temasRegistrados: 0, flashcardsCriados: 0, questoesVinculadas: 0, revisoesAgendadas: 0 };

              const { data: latestPlan } = await supabase
                .from("study_plans").select("plan_json")
                .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
              const topicMap: { topic: string; subtopics: string[] }[] = (latestPlan?.plan_json as any)?.topicMap || [];

              const registeredTemas: { id: string; tema: string; especialidade: string }[] = [];
              let totalReviews = 0;
              for (const subject of subjects) {
                const especialidade = (await import("@/lib/mapTopicToSpecialty")).mapTopicToSpecialty(subject) || "Medicina Preventiva";
                const topicEntry = topicMap.find(t => t.topic.toLowerCase() === subject.toLowerCase());
                const subtopico = topicEntry?.subtopics?.join(", ") || null;

                const { data, error } = await supabase.from("temas_estudados").insert({
                  user_id: user.id, tema: subject, especialidade,
                  data_estudo: today, fonte: "plano_estudos", dificuldade: "medio",
                  subtopico, observacoes: "Registrado pelo Plano Geral", status: "ativo",
                } as any).select().single();
                if (error || !data) continue;
                const temaId = (data as any).id;
                registeredTemas.push({ id: temaId, tema: subject, especialidade });
                const reviews = generateReviewsByError(today, 0);
                totalReviews += reviews.length;
                const reviewRows = reviews.map(r => ({
                  user_id: user.id, tema_id: temaId, tipo_revisao: r.tipo,
                  data_revisao: r.data, status: "pendente", prioridade: 50, risco_esquecimento: "baixo",
                }));
                await supabase.from("revisoes").insert(reviewRows as any);
              }

              let flashcardsCriados = 0;
              let questoesVinculadas = 0;
              if (registeredTemas.length > 0) {
                try {
                  const syncResult = await syncTemasToModules(user.id, registeredTemas);
                  flashcardsCriados = syncResult.flashcardsCriados;
                  questoesVinculadas = syncResult.questoesVinculadas;
                } catch (err) { console.error("Sync error:", err); }
                await loadData();
              }

              return { temasRegistrados: registeredTemas.length, flashcardsCriados, questoesVinculadas, revisoesAgendadas: totalReviews };
            }}
          />

          {/* Specialty distribution */}
          {specEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold">Desempenho por Especialidade</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {specEntries.sort((a, b) => a.taxa - b.taxa).map(s => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate max-w-[60%]">{s.name}</span>
                      <span className="text-xs font-medium">{s.taxa}% ({s.feitas} Q)</span>
                    </div>
                    <Progress value={s.taxa} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Week summary */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Revisões concluídas esta semana</span>
                <span className="font-bold">{revisoesSemana}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Total de revisões concluídas</span>
                <span className="font-bold">{totalRevisoesConcluidas}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────────────────────────────────── */}
        {/* SEÇÃO 2 — DISTRIBUIÇÃO DE CONTEÚDO */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="conteudo" className="space-y-4 mt-4">
          <CronogramaNovoTema specialties={SPECIALTIES} onAdd={handleAddTema} />
          <CronogramaTemas
            temasComRisco={temasComputados} revisoes={revisoes} desempenhos={desempenhos}
            onDelete={handleDeleteTema} onStartRevisao={startRevisao}
          />
        </TabsContent>

        {/* ──────────────────────────────────────── */}
        {/* SEÇÃO 3 — CALENDÁRIO MACRO */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="calendario" className="space-y-4 mt-4">
          <PlannerCalendarView revisoes={revisoes} temas={temas} />
        </TabsContent>

        {/* ──────────────────────────────────────── */}
        {/* SEÇÃO 4 — HISTÓRICO E AJUSTES */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          <CronogramaHistorico
            temas={temas} revisoes={revisoes} desempenhos={desempenhos}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Macro calendar view — strategy overview, no execution buttons
function PlannerCalendarView({ revisoes, temas }: { revisoes: Revisao[]; temas: TemaEstudado[] }) {
  const today = new Date();
  const days: { date: string; label: string; reviews: (Revisao & { temaNome: string })[] }[] = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayReviews = revisoes
      .filter(r => r.data_revisao === dateStr && r.status === "pendente")
      .map(r => ({
        ...r,
        temaNome: temas.find(t => t.id === r.tema_id)?.tema || "Tema",
      }));

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    days.push({
      date: dateStr,
      label: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`,
      reviews: dayReviews,
    });
  }

  // Only show days with reviews or first 7 days
  const visibleDays = days.filter((d, i) => i < 7 || d.reviews.length > 0);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" />
        Visão macro — Próximos 30 dias
      </h3>
      <p className="text-[10px] text-muted-foreground">
        Planejamento de revisões. Para executar, acesse o Dashboard ou Plano do Dia.
      </p>
      {visibleDays.map(day => (
        <Card key={day.date} className={`${day.reviews.length > 0 ? "border-primary/20" : "border-border/50"}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">{day.label}</span>
              {day.reviews.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {day.reviews.length} {day.reviews.length === 1 ? "revisão" : "revisões"}
                </Badge>
              )}
            </div>
            {day.reviews.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">Sem revisões agendadas</p>
            ) : (
              <div className="space-y-1">
                {day.reviews.slice(0, 5).map(r => (
                  <div key={r.id} className="text-[11px] flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      r.risco_esquecimento === "alto" ? "bg-destructive" : r.risco_esquecimento === "medio" ? "bg-amber-500" : "bg-emerald-500"
                    }`} />
                    <span className="truncate">{r.temaNome}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">{r.tipo_revisao}</span>
                  </div>
                ))}
                {day.reviews.length > 5 && (
                  <p className="text-[10px] text-muted-foreground">+{day.reviews.length - 5} mais</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default SmartPlanner;
