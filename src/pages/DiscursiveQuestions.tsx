import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import ResumeSessionBanner from "@/components/layout/ResumeSessionBanner";
import { updateDomainMap } from "@/lib/updateDomainMap";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import {
  PenLine, Loader2, Send, CheckCircle, Star, AlertTriangle,
  ChevronDown, History, BookOpen, Target, ArrowRight, Maximize2, Minimize2, MoreVertical, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const SPECIALTIES = [
  "Cardiologia", "Pneumologia", "Gastroenterologia", "Neurologia", "Nefrologia",
  "Endocrinologia", "Infectologia", "Reumatologia", "Hematologia", "Dermatologia",
  "Pediatria", "Ginecologia e Obstetrícia", "Cirurgia", "Ortopedia", "Urologia",
  "Psiquiatria", "Medicina Preventiva", "Semiologia", "Anatomia", "Farmacologia",
];

type Phase = "setup" | "answering" | "correcting" | "result" | "history";

interface CriteriaScore {
  criterion: string;
  score: number;
  max: number;
  feedback: string;
}

interface Correction {
  total_score: number;
  max_score: number;
  criteria_scores: CriteriaScore[];
  strengths: string[];
  weaknesses: string[];
  model_answer: string;
  overall_feedback: string;
}

interface HistoryItem {
  id: string;
  specialty: string;
  score: number;
  max_score: number;
  status: string;
  created_at: string;
}

const DiscursiveQuestions = () => {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const { addXp } = useGamification();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { pendingSession, checked, completeSession, abandonSession, registerAutoSave, clearPending } = useSessionPersistence({ moduleKey: "discursive" });

  const [phase, setPhase] = useState<Phase>("setup");
  const [specialty, setSpecialty] = useState("");
  const [difficulty, setDifficulty] = useState("intermediário");
  const [generating, setGenerating] = useState(false);
  const [correcting, setCorrecting] = useState(false);

  // Question state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [clinicalCase, setClinicalCase] = useState("");
  const [question, setQuestion] = useState("");
  const [gradingCriteria, setGradingCriteria] = useState<any[]>([]);
  const [answer, setAnswer] = useState("");

  // Correction
  const [correction, setCorrection] = useState<Correction | null>(null);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Auto-save session
  useEffect(() => {
    registerAutoSave(() => {
      if (phase === "setup") return {};
      return { phase, specialty, difficulty, attemptId, clinicalCase, question, gradingCriteria, answer, correction };
    });
  }, [phase, specialty, difficulty, attemptId, clinicalCase, question, gradingCriteria, answer, correction, registerAutoSave]);

  const handleResumeSession = () => {
    if (!pendingSession) return;
    const d = pendingSession.session_data as any;
    if (d.phase) setPhase(d.phase);
    if (d.specialty) setSpecialty(d.specialty);
    if (d.difficulty) setDifficulty(d.difficulty);
    if (d.attemptId) setAttemptId(d.attemptId);
    if (d.clinicalCase) setClinicalCase(d.clinicalCase);
    if (d.question) setQuestion(d.question);
    if (d.gradingCriteria) setGradingCriteria(d.gradingCriteria);
    if (d.answer) setAnswer(d.answer);
    if (d.correction) setCorrection(d.correction);
    clearPending();
  };

  const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discursive-questions`;

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

  const generateQuestion = async () => {
    if (!specialty) {
      toast({ title: "Selecione uma especialidade", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const res = await callAPI({ action: "generate", specialty, difficulty });
      setAttemptId(res.id);
      setClinicalCase(res.case);
      setQuestion(res.question);
      setGradingCriteria(res.grading_criteria || []);
      setAnswer("");
      setCorrection(null);
      setPhase("answering");
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao gerar", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !attemptId) return;
    setCorrecting(true);
    setPhase("correcting");
    try {
      const res = await callAPI({ action: "correct", attempt_id: attemptId, answer: answer.trim() });
      setCorrection(res.correction);
      setPhase("result");
      // Award XP for discursive completion
      await addXp(XP_REWARDS.discursive_completed);

      // Update medical domain map
      if (user) {
        const passed = res.correction && res.correction.total_score >= (res.correction.max_score * 0.5);
        await updateDomainMap(user.id, [{ topic: specialty, correct: !!passed }]);
      }
      
      // Log to error_bank if score < 70%
      if (user && res.correction && res.correction.total_score < (res.correction.max_score * 0.7)) {
        const weaknesses = res.correction.weaknesses || [];
        await logErrorToBank({
          userId: user.id,
          tema: specialty,
          tipoQuestao: "discursiva",
          conteudo: question?.slice(0, 500) || clinicalCase?.slice(0, 500),
          motivoErro: weaknesses.length > 0 
            ? `Pontos fracos: ${weaknesses.join("; ")}` 
            : `Nota ${res.correction.total_score}/${res.correction.max_score}`,
          categoriaErro: "conceito",
          dificuldade: difficulty === "avançado" ? 5 : difficulty === "intermediário" ? 3 : 1,
        });
      }
    } catch (e) {
      toast({ title: "Erro na correção", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
      setPhase("answering");
    } finally {
      setCorrecting(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await callAPI({ action: "history" });
      setHistory(res.attempts || []);
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
  };

  const showHistory = () => {
    setPhase("history");
    loadHistory();
  };

  const reset = () => {
    completeSession();
    setPhase("setup");
    setAttemptId(null);
    setClinicalCase("");
    setQuestion("");
    setAnswer("");
    setCorrection(null);
  };

  const scoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 70) return "text-green-500";
    if (pct >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const content = (
    <div className={`animate-fade-in ${isFullscreen ? "fixed inset-0 z-[100] bg-background p-2 sm:p-4 overflow-auto" : "max-w-3xl mx-auto space-y-6"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PenLine className="h-6 w-6 text-primary" />
            Questões Discursivas
          </h1>
          <p className="text-sm text-muted-foreground">Escreva sua resposta e receba correção detalhada por IA</p>
        </div>
        <div className="flex gap-1.5 items-center">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {phase !== "setup" && (
                <DropdownMenuItem onClick={reset}><Plus className="h-4 w-4 mr-2" /> Nova Questão</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={showHistory}><History className="h-4 w-4 mr-2" /> Histórico</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* SETUP PHASE */}
      {phase === "setup" && (
        <>
          {pendingSession && (
            <ResumeSessionBanner
              updatedAt={pendingSession.updated_at}
              onResume={handleResumeSession}
              onDiscard={abandonSession}
            />
          )}
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <PenLine className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Treine Questões Discursivas</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                A IA gera um caso clínico realista e depois corrige sua resposta com critérios de banca de residência.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Especialidade</label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger><SelectValue placeholder="Escolha..." /></SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dificuldade</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="básico">Básico</SelectItem>
                    <SelectItem value="intermediário">Intermediário</SelectItem>
                    <SelectItem value="avançado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={generateQuestion} disabled={generating || !specialty} className="w-full gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {generating ? "Gerando caso clínico..." : "Gerar Questão"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ANSWERING PHASE */}
      {phase === "answering" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="text-xs">{specialty}</Badge>
                <Badge variant="outline" className="text-xs">{difficulty}</Badge>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary" /> Caso Clínico
                </h3>
                <p className="text-sm leading-relaxed bg-muted/30 rounded-lg p-4 border border-border/50">
                  {clinicalCase}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-primary" /> Pergunta
                </h3>
                <p className="text-sm font-medium bg-primary/5 rounded-lg p-3 border border-primary/20">
                  {question}
                </p>
              </div>

              {gradingCriteria.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Critérios de avaliação: </span>
                  {gradingCriteria.map((c: any) => `${c.criterion} (${c.max_points}pts)`).join(" • ")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-sm">✍️ Sua Resposta</h3>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Escreva sua resposta discursiva aqui. Inclua diagnóstico, diagnósticos diferenciais, conduta e justificativa..."
                rows={10}
                className="text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{answer.length} caracteres</span>
                <Button onClick={submitAnswer} disabled={!answer.trim() || answer.length < 50} className="gap-2">
                  <Send className="h-4 w-4" /> Enviar para Correção
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CORRECTING PHASE */}
      {phase === "correcting" && (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="font-semibold">Corrigindo sua resposta...</h3>
              <p className="text-sm text-muted-foreground">A IA está avaliando com critérios de banca de residência</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RESULT PHASE */}
      {phase === "result" && correction && (
        <div className="space-y-4">
          {/* Score header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Resultado da Correção</h3>
                  <p className="text-sm text-muted-foreground">{specialty} • {difficulty}</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${scoreColor(correction.total_score, correction.max_score)}`}>
                    {correction.total_score.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">de {correction.max_score} pontos</p>
                </div>
              </div>
              <Progress value={(correction.total_score / correction.max_score) * 100} className="h-2" />
            </CardContent>
          </Card>

          {/* Criteria breakdown */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" /> Avaliação por Critério
              </h3>
              <div className="space-y-3">
                {correction.criteria_scores.map((cs, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cs.criterion}</span>
                      <span className={`font-bold ${scoreColor(cs.score, cs.max)}`}>
                        {cs.score}/{cs.max}
                      </span>
                    </div>
                    <Progress value={(cs.score / cs.max) * 100} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{cs.feedback}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Pontos Fortes
                </h4>
                <ul className="space-y-1">
                  {correction.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Star className="h-3 w-3 text-green-500 mt-0.5 shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Pontos a Melhorar
                </h4>
                <ul className="space-y-1">
                  {correction.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" /> {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Overall feedback */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-sm">💬 Feedback Geral</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{correction.overall_feedback}</p>
            </CardContent>
          </Card>

          {/* Model answer */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" /> Resposta Modelo
              </h3>
              <p className="text-sm leading-relaxed bg-primary/5 rounded-lg p-4 border border-primary/20">
                {correction.model_answer}
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={reset} className="flex-1 gap-2">
              <ArrowRight className="h-4 w-4" /> Nova Questão
            </Button>
          </div>
        </div>
      )}

      {/* HISTORY PHASE */}
      {phase === "history" && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <History className="h-4 w-4 text-primary" /> Últimas Tentativas
            </h3>
            {historyLoading ? (
              <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma tentativa ainda.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{h.specialty}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      {h.status === "corrected" ? (
                        <p className={`text-lg font-bold ${scoreColor(h.score, h.max_score)}`}>
                          {h.score?.toFixed(1)}/{h.max_score}
                        </p>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Pendente</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" onClick={reset} className="w-full">Voltar</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (isFullscreen) return createPortal(content, document.body);
  return content;
};

export default DiscursiveQuestions;
