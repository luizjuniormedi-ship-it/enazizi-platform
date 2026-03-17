import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import {
  Activity, Loader2, Send, Stethoscope, Syringe, FileSearch,
  Clock, Heart, AlertTriangle, Award, ArrowRight, RotateCcw,
  MessageCircle, Thermometer, Zap, Star, CheckCircle, XCircle,
  Trophy, Target, HelpCircle, Users, ClipboardCheck, ShieldAlert, History, Eye, Maximize2, Minimize2
} from "lucide-react";
import VitalsChart, { parseVitalsToSnapshot } from "@/components/plantao/VitalsChart";
import ExamsPanel from "@/components/plantao/ExamsPanel";
import PrescriptionDialog from "@/components/plantao/PrescriptionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

const SPECIALTIES = [
  "Clínica Médica", "Cardiologia", "Pneumologia", "Gastroenterologia", "Neurologia",
  "Nefrologia", "Infectologia", "Pediatria", "Cirurgia", "Ginecologia e Obstetrícia",
  "Ortopedia", "Psiquiatria", "Emergência", "Dermatologia", "Angiologia",
  "Semiologia", "Anatomia", "Farmacologia",
];

const QUICK_ACTIONS = [
  { label: "Anamnese", icon: MessageCircle, prompt: "Quais são seus sintomas? Quando começou?" },
  { label: "Exame Físico", icon: Stethoscope, prompt: "Realizar exame físico completo do paciente" },
  { label: "Exames Lab", icon: FileSearch, prompt: "Solicitar exames laboratoriais: hemograma completo, bioquímica (TGO, TGP, ureia, creatinina, glicose, eletrólitos), coagulograma (TAP, INR, TTPA). Forneça os resultados completos com valores e referências." },
  { label: "Imagem", icon: FileSearch, prompt: "Solicitar exames de imagem conforme indicação clínica. Forneça os laudos completos com achados positivos e negativos." },
  { label: "Prescrever", icon: Syringe, prompt: "Prescrever medicação para o paciente" },
  { label: "Diagnóstico", icon: Target, prompt: "Com base nos achados clínicos e exames, meu diagnóstico é:" },
];

const DIFFICULTY_TIMER: Record<string, number> = {
  "básico": 30 * 60,       // 30 min
  "intermediário": 20 * 60, // 20 min
  "avançado": 15 * 60,      // 15 min
};

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

interface EvalCategory {
  score: number;
  feedback: string;
}

interface DifferentialDiagnosis {
  diagnosis: string;
  reasoning: string;
  how_to_rule_out: string;
  student_considered: boolean;
}

interface FinalEval {
  final_score: number;
  grade: string;
  correct_diagnosis: string;
  student_got_diagnosis: boolean;
  time_total_minutes: number;
  evaluation: Record<string, EvalCategory>;
  differential_diagnosis?: DifferentialDiagnosis[];
  strengths: string[];
  improvements: string[];
  ideal_approach: string;
  ideal_prescription?: string;
  xp_earned: number;
}

const EVAL_LABELS: Record<string, string> = {
  anamnesis: "Anamnese",
  physical_exam: "Exame Físico",
  complementary_exams: "Exames Complementares",
  diagnosis: "Diagnóstico",
  prescription: "Prescrição",
  management: "Conduta",
  referral: "Parecer/Encaminhamento",
};

const EVAL_MAX_SCORES: Record<string, number> = {
  anamnesis: 15,
  physical_exam: 15,
  complementary_exams: 15,
  diagnosis: 15,
  prescription: 15,
  management: 15,
  referral: 10,
};

const ClinicalSimulation = () => {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const { addXp } = useGamification();
  const [searchParams] = useSearchParams();
  const teacherCaseId = searchParams.get("teacher_case_id");

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

  // Countdown timer
  const [countdown, setCountdown] = useState(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Specialist dialog
  const [specialistDialogOpen, setSpecialistDialogOpen] = useState(false);
  const [specialistArea, setSpecialistArea] = useState("");

  // Prescription dialog
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);

  // Vitals snapshots for chart
  const [vitalsSnapshots, setVitalsSnapshots] = useState<any[]>([]);

  // Exam results panel
  const [examResults, setExamResults] = useState<Array<{ type: "lab" | "imaging"; content: string; timestamp: number }>>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clinical-simulation`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Countdown timer effect
  useEffect(() => {
    if (phase === "active" && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            setTimerExpired(true);
            toast({
              title: "⏰ Tempo esgotado!",
              description: "O tempo do plantão acabou! Encerre o atendimento agora.",
              variant: "destructive",
            });
            // Play alert sound
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              gain.gain.value = 0.3;
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            } catch {}
            return 0;
          }
          // Warning at 2 min remaining
          if (prev === 121) {
            toast({
              title: "⚠️ 2 minutos restantes!",
              description: "Finalize seu atendimento rapidamente.",
            });
          }
          // Warning at 5 min remaining
          if (prev === 301) {
            toast({
              title: "⏱️ 5 minutos restantes",
              description: "Considere fechar seu diagnóstico e prescrição.",
            });
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [phase, countdown > 0]);

  // Fetch history on mount
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("simulation_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setHistory(data || []);
    } catch (e) {
      console.error("Error fetching history:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Auto-start if teacher_case_id is in URL
  useEffect(() => {
    if (teacherCaseId && phase === "lobby" && !loading) {
      startSimulation();
    }
  }, [teacherCaseId]);

  const saveSimulationToHistory = async (evalData: FinalEval) => {
    if (!user) return;
    try {
      await supabase.from("simulation_history").insert({
        user_id: user.id,
        specialty,
        difficulty,
        final_score: evalData.final_score,
        grade: evalData.grade,
        correct_diagnosis: evalData.correct_diagnosis,
        student_got_diagnosis: evalData.student_got_diagnosis,
        time_total_minutes: evalData.time_total_minutes,
        evaluation: evalData.evaluation as any,
        differential_diagnosis: (evalData.differential_diagnosis || []) as any,
        strengths: evalData.strengths as any,
        improvements: evalData.improvements as any,
        ideal_approach: evalData.ideal_approach,
        ideal_prescription: evalData.ideal_prescription || null,
        xp_earned: evalData.xp_earned,
      });
    } catch (e) {
      console.error("Error saving simulation:", e);
    }
  };

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
      const res = await callAPI({
        action: "start",
        specialty,
        difficulty,
        ...(teacherCaseId ? { teacher_case_id: teacherCaseId } : {}),
      });

      setVitals(res.vitals);
      setSetting(res.setting || "Pronto-Socorro");
      setTriageColor(res.triage_color || "amarelo");
      setPatientStatus("estável");
      setScore(50);
      setTimeElapsed(0);
      setTimerExpired(false);
      setCountdown(DIFFICULTY_TIMER[difficulty] || 20 * 60);
      setExamResults([]);

      // Initial vitals snapshot
      if (res.vitals) {
        setVitalsSnapshots([parseVitalsToSnapshot(res.vitals, 0)]);
      }

      const patientMsg = res.patient_presentation;
      const simMsg: ChatMessage = {
        role: "simulation",
        content: `📍 **${res.setting || "Pronto-Socorro"}** | Triagem: ${getTriageEmoji(res.triage_color)}\n\n${patientMsg}`,
        type: "presentation",
        timestamp: Date.now(),
      };

      setMessages([simMsg]);

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
      const newTimeElapsed = res.time_elapsed_minutes || timeElapsed + 5;
      setTimeElapsed(newTimeElapsed);
      if (res.patient_status) setPatientStatus(res.patient_status);

      // Track exam results for side panel - detect by response_type or content patterns
      const rt = (res.response_type || "").toLowerCase();
      const responseText = (res.response || "").toLowerCase();
      const isLabResult = rt === "lab_result" || rt === "lab_results" || rt === "lab" || 
        (responseText.includes("g/dl") || responseText.includes("mg/dl") || responseText.includes("mm³") || 
         responseText.includes("ref:") || responseText.includes("referência") || responseText.includes("hemograma") && responseText.includes("leucócitos"));
      const isImagingResult = rt === "imaging" || rt === "imaging_result" || rt === "image" ||
        (responseText.includes("laudo") && (responseText.includes("tomografia") || responseText.includes("radiografia") || responseText.includes("ultrassonografia") || responseText.includes("ressonância")));
      
      if (isLabResult && res.response) {
        setExamResults((prev) => [...prev, { type: "lab", content: res.response, timestamp: Date.now() }]);
      }
      if (isImagingResult && res.response) {
        setExamResults((prev) => [...prev, { type: "imaging", content: res.response, timestamp: Date.now() }]);
      }

      // Add vitals snapshot if vitals changed
      if (res.vitals) {
        setVitals(res.vitals);
        setVitalsSnapshots((prev) => [...prev, parseVitalsToSnapshot(res.vitals, newTimeElapsed)]);
      } else if (vitals && res.patient_status && res.patient_status !== patientStatus) {
        // Status changed - add snapshot with current vitals
        setVitalsSnapshots((prev) => [...prev, parseVitalsToSnapshot(vitals as any, newTimeElapsed)]);
      }

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

  const requestPreceptorHint = async () => {
    if (loading) return;
    setLoading(true);

    const doctorMsg: ChatMessage = {
      role: "doctor",
      content: "🆘 Solicitando ajuda do preceptor...",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, doctorMsg]);

    try {
      const res = await callAPI({
        action: "hint",
        conversation_history: conversationHistory,
      });

      let content = res.response || "";
      if (res.clinical_reasoning_tips?.length) {
        content += "\n\n💡 **Dicas de raciocínio clínico:**\n" + res.clinical_reasoning_tips.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n");
      }
      if (res.suggested_next_steps?.length) {
        content += "\n\n➡️ **Próximos passos sugeridos:**\n" + res.suggested_next_steps.map((s: string) => `• ${s}`).join("\n");
      }

      const simMsg: ChatMessage = {
        role: "simulation",
        content,
        type: "preceptor_hint",
        scoreDelta: res.score_delta || 0,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, simMsg]);
      setConversationHistory([
        ...conversationHistory,
        { role: "user", content: "Solicito ajuda do preceptor" },
        { role: "assistant", content: JSON.stringify(res) },
      ]);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const requestSpecialistOpinion = async () => {
    if (loading || !specialistArea.trim()) return;
    setSpecialistDialogOpen(false);
    setLoading(true);

    const doctorMsg: ChatMessage = {
      role: "doctor",
      content: `📋 Solicitando parecer de ${specialistArea}...`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, doctorMsg]);

    try {
      const res = await callAPI({
        action: "specialist",
        specialist_area: specialistArea,
        conversation_history: conversationHistory,
      });

      let content = `**Parecer - ${res.specialist || specialistArea}**\n\n${res.response || ""}`;
      if (res.recommendations?.length) {
        content += "\n\n📌 **Recomendações:**\n" + res.recommendations.map((r: string) => `• ${r}`).join("\n");
      }
      if (res.relevance) {
        const relevanceMap: Record<string, string> = {
          alta: "✅ Parecer altamente relevante",
          média: "⚠️ Parecer de relevância moderada",
          baixa: "❌ Especialidade pouco relevante para este caso",
        };
        content += `\n\n${relevanceMap[res.relevance] || ""}`;
      }

      const simMsg: ChatMessage = {
        role: "simulation",
        content,
        type: "specialist_opinion",
        scoreDelta: res.score_delta || 0,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, simMsg]);
      setScore((prev) => Math.max(0, Math.min(100, prev + (res.score_delta || 0))));
      setConversationHistory([
        ...conversationHistory,
        { role: "user", content: `Solicito parecer de ${specialistArea}` },
        { role: "assistant", content: JSON.stringify(res) },
      ]);
      setSpecialistArea("");
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const finishSimulation = async () => {
    setLoading(true);
    setPhase("finishing");
    try {
      const res = await callAPI({
        action: "finish",
        conversation_history: conversationHistory,
        ...(teacherCaseId ? { teacher_case_id: teacherCaseId } : {}),
      });
      setFinalEval(res);
      setPhase("result");
      await addXp(XP_REWARDS.plantao_completed);
      await saveSimulationToHistory(res);

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
    setCountdown(0);
    setTimerExpired(false);
    setVitalsSnapshots([]);
    setExamResults([]);
    if (countdownRef.current) clearInterval(countdownRef.current);
    fetchHistory();
  };

  const getTriageEmoji = (color: string) => {
    const map: Record<string, string> = { vermelho: "🔴 Vermelho", amarelo: "🟡 Amarelo", verde: "🟢 Verde" };
    return map[color] || "🟡 Amarelo";
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timerExpired || countdown === 0) return "text-red-500";
    if (countdown <= 120) return "text-red-500 animate-pulse";
    if (countdown <= 300) return "text-amber-500";
    return "text-primary";
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
      preceptor_hint: HelpCircle,
      specialist_opinion: Users,
    };
    return map[type || ""] || Activity;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in">
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
        <div className="space-y-4">
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

        {/* History */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Histórico de Plantões
              </h4>
              <Button variant="ghost" size="sm" onClick={fetchHistory} disabled={historyLoading} className="text-xs gap-1">
                <RotateCcw className={`h-3 w-3 ${historyLoading ? "animate-spin" : ""}`} /> Atualizar
              </Button>
            </div>

            {historyLoading && history.length === 0 && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum plantão concluído ainda. Inicie seu primeiro plantão!
              </p>
            )}

            {history.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {history.map((h) => {
                  const gradeColor: Record<string, string> = { A: "text-green-500", B: "text-blue-500", C: "text-amber-500", D: "text-orange-500", F: "text-red-500" };
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedHistory(h)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col items-center">
                          <span className={`text-lg font-black ${gradeColor[h.grade] || "text-muted-foreground"}`}>{h.grade}</span>
                          <span className="text-[10px] text-muted-foreground">{h.final_score}/100</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{h.specialty}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{h.difficulty}</span>
                            <span>•</span>
                            <span>{h.time_total_minutes} min</span>
                            <span>•</span>
                            <span>{new Date(h.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {h.student_got_diagnosis ? (
                          <Badge className="bg-green-500/20 text-green-500 text-[10px] gap-0.5"><CheckCircle className="h-2.5 w-2.5" /> ✓</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] gap-0.5"><XCircle className="h-2.5 w-2.5" /> ✗</Badge>
                        )}
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      )}

      {/* History detail dialog */}
      <Dialog open={!!selectedHistory} onOpenChange={() => setSelectedHistory(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedHistory && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {selectedHistory.specialty} — Conceito {selectedHistory.grade}
                </DialogTitle>
                <DialogDescription>
                  {new Date(selectedHistory.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {" • "}{selectedHistory.difficulty} • {selectedHistory.time_total_minutes} min • {selectedHistory.final_score}/100 pts • +{selectedHistory.xp_earned} XP
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Diagnosis */}
                <div className={`p-3 rounded-lg border ${selectedHistory.student_got_diagnosis ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                  <p className="text-xs font-semibold mb-1">Diagnóstico Correto</p>
                  <p className="text-sm font-bold">{selectedHistory.correct_diagnosis}</p>
                  <p className="text-xs mt-1">{selectedHistory.student_got_diagnosis ? "✅ Você acertou" : "❌ Você não acertou"}</p>
                </div>

                {/* Differential diagnosis */}
                {selectedHistory.differential_diagnosis?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-purple-500" /> Diferenciais</p>
                    {selectedHistory.differential_diagnosis.map((dd: any, i: number) => (
                      <div key={i} className={`p-2.5 rounded-lg border text-xs ${dd.student_considered ? "bg-green-500/5 border-green-500/30" : "bg-muted/30 border-border/50"}`}>
                        <div className="flex items-center gap-1.5 font-semibold">
                          {dd.student_considered ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                          {dd.diagnosis}
                        </div>
                        <p className="text-muted-foreground mt-1"><strong>Razão:</strong> {dd.reasoning}</p>
                        <p className="text-muted-foreground"><strong>Descartar:</strong> {dd.how_to_rule_out}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Evaluation categories */}
                {selectedHistory.evaluation && Object.keys(selectedHistory.evaluation).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold">📊 Avaliação por Categoria</p>
                    {Object.entries(selectedHistory.evaluation).map(([key, val]: [string, any]) => {
                      const maxScore = EVAL_MAX_SCORES[key] || 25;
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

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedHistory.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold flex items-center gap-1 mb-1"><CheckCircle className="h-3 w-3 text-green-500" /> Pontos Fortes</p>
                      <ul className="space-y-0.5">{selectedHistory.strengths.map((s: string, i: number) => <li key={i} className="text-[10px] text-muted-foreground">• {s}</li>)}</ul>
                    </div>
                  )}
                  {selectedHistory.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Melhorar</p>
                      <ul className="space-y-0.5">{selectedHistory.improvements.map((s: string, i: number) => <li key={i} className="text-[10px] text-muted-foreground">• {s}</li>)}</ul>
                    </div>
                  )}
                </div>

                {/* Ideal approach */}
                {selectedHistory.ideal_approach && (
                  <div>
                    <p className="text-xs font-semibold flex items-center gap-1 mb-1"><Award className="h-3 w-3 text-primary" /> Abordagem Ideal</p>
                    <p className="text-xs text-muted-foreground bg-primary/5 rounded-lg p-3 border border-primary/20">{selectedHistory.ideal_approach}</p>
                  </div>
                )}

                {selectedHistory.ideal_prescription && (
                  <div>
                    <p className="text-xs font-semibold flex items-center gap-1 mb-1"><Syringe className="h-3 w-3 text-blue-500" /> Prescrição Modelo</p>
                    <p className="text-xs text-muted-foreground bg-blue-500/5 rounded-lg p-3 border border-blue-500/20 font-mono whitespace-pre-wrap">{selectedHistory.ideal_prescription}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
            <Card className={timerExpired ? "border-red-500/50 bg-red-500/5" : countdown <= 120 ? "border-amber-500/50" : ""}>
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className={`h-4 w-4 ${getTimerColor()}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{timerExpired ? "Tempo Esgotado!" : "Tempo Restante"}</p>
                  <p className={`text-sm font-bold font-mono ${getTimerColor()}`}>
                    {timerExpired ? "00:00" : formatCountdown(countdown)}
                  </p>
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

          {/* Main layout: Chat + Side panels */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">

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
                            : msg.type === "preceptor_hint"
                            ? "bg-amber-500/10 border-2 border-amber-500/30 rounded-bl-md"
                            : msg.type === "specialist_opinion"
                            ? "bg-blue-500/10 border-2 border-blue-500/30 rounded-bl-md"
                            : "bg-muted/50 border border-border/50 rounded-bl-md"
                        }`}
                      >
                        {msg.role === "simulation" && msg.type && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <TypeIcon className="h-3.5 w-3.5 opacity-60" />
                            <span className="text-xs opacity-60 capitalize">
                              {msg.type === "preceptor_hint" ? "Preceptor" : msg.type === "specialist_opinion" ? "Parecer Especialista" : msg.type?.replace("_", " ")}
                            </span>
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

              {/* Quick actions + new buttons */}
              {phase === "active" && (
                <div className="border-t border-border/50 p-2 space-y-1.5">
                  {/* Standard clinical actions */}
                  <div className="flex gap-1.5 overflow-x-auto">
                    {QUICK_ACTIONS.filter((qa) => qa.label !== "Prescrever").map((qa) => (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs shrink-0 gap-1.5 h-8"
                      disabled={loading}
                      onClick={() => setPrescriptionDialogOpen(true)}
                    >
                      <Syringe className="h-3.5 w-3.5" />
                      Prescrever
                    </Button>
                  </div>
                  {/* Pedagogical + finish actions */}
                  <div className="flex gap-1.5 overflow-x-auto border-t border-border/30 pt-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0 gap-1.5 h-8 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                      disabled={loading}
                      onClick={requestPreceptorHint}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      Ajuda do Preceptor
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0 gap-1.5 h-8 border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
                      disabled={loading}
                      onClick={() => setSpecialistDialogOpen(true)}
                    >
                      <Users className="h-3.5 w-3.5" />
                      Parecer de Especialista
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-xs shrink-0 gap-1.5 h-8"
                      disabled={loading}
                      onClick={finishSimulation}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Encerrar Plantão
                    </Button>
                  </div>
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

            {/* Side panels */}
            <div className="space-y-3 hidden lg:block">
              <VitalsChart snapshots={vitalsSnapshots} />
              <ExamsPanel exams={examResults} />
            </div>
          </div>
        </div>
      )}

      {/* Prescription Dialog */}
      <PrescriptionDialog
        open={prescriptionDialogOpen}
        onOpenChange={setPrescriptionDialogOpen}
        onSubmit={(text) => sendMessage(text)}
        disabled={loading}
      />

      {/* Specialist Dialog */}
      <Dialog open={specialistDialogOpen} onOpenChange={setSpecialistDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Solicitar Parecer de Especialista
            </DialogTitle>
            <DialogDescription>
              Escolha a especialidade para a interconsulta. A IA responderá como o médico especialista.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <select
              value={specialistArea}
              onChange={(e) => setSpecialistArea(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione a especialidade...</option>
              {SPECIALTIES.filter((s) => s !== specialty).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Dermatologia">Dermatologia</option>
              <option value="Hematologia">Hematologia</option>
              <option value="Endocrinologia">Endocrinologia</option>
              <option value="Reumatologia">Reumatologia</option>
              <option value="Urologia">Urologia</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpecialistDialogOpen(false)}>Cancelar</Button>
            <Button onClick={requestSpecialistOpinion} disabled={!specialistArea.trim()} className="gap-1.5">
              <Users className="h-4 w-4" />
              Solicitar Parecer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

          {/* Correct diagnosis with detailed correction */}
          <Card className="border-2 border-primary/30">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-base font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Correção Diagnóstica
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase">Diagnóstico Correto</p>
                    <p className="text-sm font-bold">{finalEval.correct_diagnosis}</p>
                  </div>
                </div>
                <div className={`flex items-start gap-2 p-3 rounded-lg ${finalEval.student_got_diagnosis ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                  {finalEval.student_got_diagnosis ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className={`text-xs font-semibold uppercase ${finalEval.student_got_diagnosis ? "text-green-500" : "text-red-500"}`}>
                      Seu Diagnóstico
                    </p>
                    <p className="text-sm font-medium">
                      {finalEval.student_got_diagnosis
                        ? "✅ Você acertou o diagnóstico!"
                        : "❌ Você não chegou ao diagnóstico correto. Revise a abordagem ideal abaixo."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Differential Diagnosis */}
          {finalEval.differential_diagnosis && finalEval.differential_diagnosis.length > 0 && (
            <Card className="border border-purple-500/30">
              <CardContent className="p-5 space-y-4">
                <h4 className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-purple-500" /> Diagnósticos Diferenciais
                </h4>
                <p className="text-xs text-muted-foreground">
                  Diagnósticos que deveriam ser considerados neste caso. Verde = você considerou, cinza = não considerado.
                </p>
                <div className="space-y-3">
                  {finalEval.differential_diagnosis.map((dd, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        dd.student_considered
                          ? "bg-green-500/5 border-green-500/30"
                          : "bg-muted/30 border-border/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {dd.student_considered ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm font-bold">{dd.diagnosis}</span>
                        <Badge
                          variant={dd.student_considered ? "default" : "outline"}
                          className={`text-[10px] ml-auto ${dd.student_considered ? "bg-green-500/20 text-green-600" : ""}`}
                        >
                          {dd.student_considered ? "Considerado" : "Não considerado"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6 mb-1">
                        <span className="font-semibold">Por que considerar:</span> {dd.reasoning}
                      </p>
                      <p className="text-xs text-muted-foreground ml-6">
                        <span className="font-semibold">Como descartar:</span> {dd.how_to_rule_out}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category scores - dynamic */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h4 className="text-sm font-semibold">📊 Avaliação por Categoria</h4>
              {Object.entries(finalEval.evaluation).map(([key, val]) => {
                const maxScore = EVAL_MAX_SCORES[key] || 25;
                const goodThreshold = maxScore * 0.7;
                const midThreshold = maxScore * 0.5;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{EVAL_LABELS[key] || key}</span>
                      <span className={`font-bold ${val.score >= goodThreshold ? "text-green-500" : val.score >= midThreshold ? "text-amber-500" : "text-red-500"}`}>
                        {val.score}/{maxScore}
                      </span>
                    </div>
                    <Progress value={(val.score / maxScore) * 100} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{val.feedback}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Ideal Prescription */}
          {finalEval.ideal_prescription && (
            <Card className="border border-blue-500/30">
              <CardContent className="p-5 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Syringe className="h-4 w-4 text-blue-500" /> Prescrição Modelo
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground bg-blue-500/5 rounded-lg p-4 border border-blue-500/20 whitespace-pre-wrap font-mono">
                  {finalEval.ideal_prescription}
                </p>
              </CardContent>
            </Card>
          )}

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
