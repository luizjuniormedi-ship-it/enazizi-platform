import { useState, useRef, useEffect, useCallback } from "react";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import {
  Activity, Loader2, Send, Stethoscope, Syringe, FileSearch,
  Clock, Heart, AlertTriangle, Award, ArrowRight, RotateCcw,
  MessageCircle, Thermometer, Zap, Star, CheckCircle, XCircle,
  Trophy, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const SPECIALTIES = [
  "Clínica Médica", "Cardiologia", "Pneumologia", "Gastroenterologia", "Neurologia",
  "Nefrologia", "Infectologia", "Pediatria", "Cirurgia", "Ginecologia e Obstetrícia",
  "Ortopedia", "Psiquiatria", "Emergência",
];

const QUICK_ACTIONS = [
  { label: "Anamnese", icon: MessageCircle, prompt: "Quais são seus sintomas? Quando começou?" },
  { label: "Exame Físico", icon: Stethoscope, prompt: "Realizar exame físico completo do paciente" },
  { label: "Exames Lab", icon: FileSearch, prompt: "Solicitar hemograma, bioquímica, coagulograma" },
  { label: "Imagem", icon: FileSearch, prompt: "Solicitar exames de imagem: radiografia, tomografia, ultrassonografia ou ressonância conforme indicação clínica" },
  { label: "Prescrever", icon: Syringe, prompt: "Prescrever medicação para o paciente" },
  { label: "Diagnóstico", icon: Target, prompt: "Com base nos achados clínicos e exames, meu diagnóstico é:" },
];

type Phase = "lobby" | "active" | "finishing" | "result";

interface Vitals {
  PA: string;
  FC: string;
  FR: string;
  Temp: string;
  SpO2: string;
}

interface ChatMessage {
  role: "doctor" | "simulation";
  content: string;
  type?: string;
  scoreDelta?: number;
  timestamp: number;
}

interface FinalEval {
  final_score: number;
  grade: string;
  correct_diagnosis: string;
  student_got_diagnosis: boolean;
  time_total_minutes: number;
  evaluation: {
    anamnesis: { score: number; feedback: string };
    physical_exam: { score: number; feedback: string };
    complementary_exams: { score: number; feedback: string };
    management: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  ideal_approach: string;
  xp_earned: number;
}

const ClinicalSimulation = () => {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const { addXp } = useGamification();

  const [phase, setPhase] = useState<Phase>("lobby");
  const [specialty, setSpecialty] = useState("Clínica Médica");
  const [difficulty, setDifficulty] = useState("intermediário");
  const [loading, setLoading] = useState(false);

  // Simulation state
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [setting, setSetting] = useState("");
  const [triageColor, setTriageColor] = useState("");
  const [patientStatus, setPatientStatus] = useState("estável");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(50);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [finalEval, setFinalEval] = useState<FinalEval | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clinical-simulation`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const startSimulation = async () => {
    setLoading(true);
    try {
      const res = await callAPI({ action: "start", specialty, difficulty });

      setVitals(res.vitals);
      setSetting(res.setting || "Pronto-Socorro");
      setTriageColor(res.triage_color || "amarelo");
      setPatientStatus("estável");
      setScore(50);
      setTimeElapsed(0);

      const patientMsg = res.patient_presentation;
      const simMsg: ChatMessage = {
        role: "simulation",
        content: `📍 **${res.setting || "Pronto-Socorro"}** | Triagem: ${getTriageEmoji(res.triage_color)}\n\n${patientMsg}`,
        type: "presentation",
        timestamp: Date.now(),
      };

      setMessages([simMsg]);

      // Store hidden data in conversation history for AI context
      const startHistory = [
        { role: "assistant", content: JSON.stringify(res) },
      ];
      setConversationHistory(startHistory);
      setPhase("active");

      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao iniciar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const doctorMsg: ChatMessage = { role: "doctor", content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, doctorMsg]);
    setLoading(true);

    try {
      const updatedHistory = [
        ...conversationHistory,
        { role: "user", content: msg },
      ];

      const res = await callAPI({
        action: "interact",
        message: msg,
        conversation_history: updatedHistory,
      });

      const simMsg: ChatMessage = {
        role: "simulation",
        content: res.response,
        type: res.response_type,
        scoreDelta: res.score_delta,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, simMsg]);
      setScore((prev) => Math.max(0, Math.min(100, prev + (res.score_delta || 0))));
      setTimeElapsed(res.time_elapsed_minutes || timeElapsed + 5);
      if (res.patient_status) setPatientStatus(res.patient_status);

      setConversationHistory([
        ...updatedHistory,
        { role: "assistant", content: JSON.stringify(res) },
      ]);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const finishSimulation = async () => {
    setLoading(true);
    setPhase("finishing");
    try {
      const res = await callAPI({
        action: "finish",
        conversation_history: conversationHistory,
      });
      setFinalEval(res);
      setPhase("result");
      // Award XP for completing plantão
      await addXp(XP_REWARDS.plantao_completed);

      // Log to error_bank if score < 70
      if (user && res.final_score < 70) {
        const weakAreas = res.weak_areas || res.areas_to_improve || [];
        await logErrorToBank({
          userId: user.id,
          tema: specialty,
          tipoQuestao: "simulado",
          conteudo: `Modo Plantão - ${specialty} (${difficulty})`,
          motivoErro: weakAreas.length > 0
            ? `Áreas fracas: ${Array.isArray(weakAreas) ? weakAreas.join("; ") : weakAreas}`
            : `Nota ${res.final_score}/100 - Conceito ${res.grade}`,
          categoriaErro: "conduta",
          dificuldade: difficulty === "avançado" ? 5 : difficulty === "intermediário" ? 3 : 1,
        });
      }
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
      setPhase("active");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhase("lobby");
    setMessages([]);
    setConversationHistory([]);
    setScore(50);
    setTimeElapsed(0);
    setFinalEval(null);
    setVitals(null);
  };

  const getTriageEmoji = (color: string) => {
    const map: Record<string, string> = { vermelho: "🔴 Vermelho", amarelo: "🟡 Amarelo", verde: "🟢 Verde" };
    return map[color] || "🟡 Amarelo";
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      estável: "text-green-500",
      instável: "text-amber-500",
      grave: "text-orange-500",
      crítico: "text-red-500",
    };
    return map[status] || "text-muted-foreground";
  };

  const getGradeColor = (grade: string) => {
    const map: Record<string, string> = { A: "text-green-500", B: "text-blue-500", C: "text-amber-500", D: "text-orange-500", F: "text-red-500" };
    return map[grade] || "text-muted-foreground";
  };

  const getTypeIcon = (type?: string) => {
    const map: Record<string, typeof Stethoscope> = {
      anamnesis: MessageCircle,
      physical_exam: Stethoscope,
      lab_result: FileSearch,
      imaging: FileSearch,
      prescription: Syringe,
      diagnosis_attempt: Target,
    };
    return map[type || ""] || Activity;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-500" />
            Modo Plantão
          </h1>
          <p className="text-sm text-muted-foreground">Simulação interativa de atendimento clínico</p>
        </div>
        {phase === "active" && (
          <Button variant="destructive" size="sm" onClick={finishSimulation} disabled={loading}>
            Encerrar Plantão
          </Button>
        )}
      </div>

      {/* LOBBY */}
      {phase === "lobby" && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="h-20 w-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                <Activity className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">🏥 Plantão Clínico</h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Atenda um paciente virtual em tempo real. Faça anamnese, peça exames, 
                defina diagnóstico e prescreva o tratamento. Cada decisão afeta sua pontuação!
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { icon: MessageCircle, label: "Anamnese", desc: "Interrogue o paciente" },
                { icon: Stethoscope, label: "Exame Físico", desc: "Examine o paciente" },
                { icon: FileSearch, label: "Exames", desc: "Peça complementares" },
                { icon: Syringe, label: "Conduta", desc: "Prescreva e trate" },
              ].map((step, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <step.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-semibold">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Especialidade do Caso</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dificuldade</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="básico">Básico</option>
                  <option value="intermediário">Intermediário</option>
                  <option value="avançado">Avançado</option>
                </select>
              </div>
            </div>

            <Button onClick={startSimulation} disabled={loading} className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {loading ? "Preparando plantão..." : "🚨 Iniciar Plantão"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ACTIVE SIMULATION */}
      {(phase === "active" || phase === "finishing") && (
        <div className="space-y-3">
          {/* Status bar */}
          <div className="grid grid-cols-4 gap-2">
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Heart className={`h-4 w-4 ${getStatusColor(patientStatus)}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Paciente</p>
                  <p className={`text-sm font-bold capitalize ${getStatusColor(patientStatus)}`}>{patientStatus}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Tempo</p>
                  <p className="text-sm font-bold">{timeElapsed} min</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-sm font-bold">{score}/100</p>
                </div>
              </CardContent>
            </Card>
            {vitals && (
              <Card>
                <CardContent className="p-3 flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-red-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sinais Vitais</p>
                    <p className="text-xs font-mono">
                      PA:{vitals.PA} FC:{vitals.FC}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Vitals detail */}
          {vitals && (
            <div className="flex gap-2 flex-wrap">
              {Object.entries(vitals).map(([k, v]) => (
                <Badge key={k} variant="outline" className="text-xs font-mono gap-1">
                  {k}: {v}
                </Badge>
              ))}
            </div>
          )}

          {/* Chat area */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => {
                  const TypeIcon = getTypeIcon(msg.type);
                  return (
                    <div
                      key={i}
                      className={`flex ${msg.role === "doctor" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                          msg.role === "doctor"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted/50 border border-border/50 rounded-bl-md"
                        }`}
                      >
                        {msg.role === "simulation" && msg.type && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <TypeIcon className="h-3.5 w-3.5 opacity-60" />
                            <span className="text-xs opacity-60 capitalize">{msg.type?.replace("_", " ")}</span>
                            {msg.scoreDelta !== undefined && msg.scoreDelta !== 0 && (
                              <Badge
                                variant={msg.scoreDelta > 0 ? "default" : "destructive"}
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                {msg.scoreDelta > 0 ? `+${msg.scoreDelta}` : msg.scoreDelta}
                              </Badge>
                            )}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}

                {loading && phase === "active" && (
                  <div className="flex justify-start">
                    <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}

                {phase === "finishing" && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Avaliando seu desempenho...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick actions */}
              {phase === "active" && (
                <div className="border-t border-border/50 p-2 flex gap-1.5 overflow-x-auto">
                  {QUICK_ACTIONS.map((qa) => (
                    <Button
                      key={qa.label}
                      variant="ghost"
                      size="sm"
                      className="text-xs shrink-0 gap-1.5 h-8"
                      disabled={loading}
                      onClick={() => sendMessage(qa.prompt)}
                    >
                      <qa.icon className="h-3.5 w-3.5" />
                      {qa.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Input */}
              {phase === "active" && (
                <div className="border-t border-border/50 p-3 flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Conduza o atendimento... (pergunte, examine, peça exames, prescreva)"
                    disabled={loading}
                    className="text-sm"
                  />
                  <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* RESULT */}
      {phase === "result" && finalEval && (
        <div className="space-y-4">
          {/* Score header */}
          <Card className="overflow-hidden">
            <div className={`p-1 ${finalEval.final_score >= 70 ? "bg-green-500/20" : finalEval.final_score >= 50 ? "bg-amber-500/20" : "bg-red-500/20"}`} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Plantão Encerrado</h3>
                    <p className="text-sm text-muted-foreground">{specialty} • {difficulty}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {finalEval.student_got_diagnosis ? (
                        <Badge className="bg-green-500/20 text-green-500 text-xs gap-1"><CheckCircle className="h-3 w-3" /> Diagnóstico correto</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" /> Diagnóstico incorreto</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">⏱️ {finalEval.time_total_minutes} min</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-black ${getGradeColor(finalEval.grade)}`}>{finalEval.grade}</p>
                  <p className="text-2xl font-bold">{finalEval.final_score}/100</p>
                  <p className="text-xs text-amber-500 font-semibold">+{finalEval.xp_earned} XP</p>
                </div>
              </div>
              <Progress value={finalEval.final_score} className="h-2" />
            </CardContent>
          </Card>

          {/* Correct diagnosis */}
          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" /> Diagnóstico Correto
              </h4>
              <p className="text-sm font-medium text-primary">{finalEval.correct_diagnosis}</p>
            </CardContent>
          </Card>

          {/* Category scores */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h4 className="text-sm font-semibold">📊 Avaliação por Categoria</h4>
              {Object.entries(finalEval.evaluation).map(([key, val]) => {
                const labels: Record<string, string> = {
                  anamnesis: "Anamnese",
                  physical_exam: "Exame Físico",
                  complementary_exams: "Exames Complementares",
                  management: "Conduta",
                };
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{labels[key] || key}</span>
                      <span className={`font-bold ${val.score >= 18 ? "text-green-500" : val.score >= 12 ? "text-amber-500" : "text-red-500"}`}>
                        {val.score}/25
                      </span>
                    </div>
                    <Progress value={(val.score / 25) * 100} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{val.feedback}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Pontos Fortes
                </h4>
                <ul className="space-y-1">
                  {finalEval.strengths.map((s, i) => (
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
                  {finalEval.improvements.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" /> {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Ideal approach */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" /> Abordagem Ideal
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground bg-primary/5 rounded-lg p-4 border border-primary/20">
                {finalEval.ideal_approach}
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={reset} className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white">
              <RotateCcw className="h-4 w-4" /> Novo Plantão
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalSimulation;
