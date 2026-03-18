import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import {
  MessageCircle, Send, Loader2, Clock, Award, RotateCcw,
  CheckCircle, XCircle, Star, Trophy, Target, ClipboardCheck,
  User, Heart, Pill, AlertTriangle, Users as UsersIcon, Activity,
  Stethoscope, Baby, Brain, ListChecks, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from "react-markdown";

const SPECIALTIES = [
  "Clínica Médica", "Cardiologia", "Pneumologia", "Gastroenterologia", "Neurologia",
  "Nefrologia", "Infectologia", "Pediatria", "Cirurgia", "Ginecologia e Obstetrícia",
  "Ortopedia", "Psiquiatria", "Emergência", "Dermatologia", "Semiologia",
];

const PEDIATRIC_AGE_RANGES = [
  { key: "neonato", label: "Neonato (0-28 dias)" },
  { key: "lactente", label: "Lactente (1-24 meses)" },
  { key: "pre_escolar", label: "Pré-escolar (2-6 anos)" },
  { key: "escolar", label: "Escolar (7-12 anos)" },
  { key: "adolescente", label: "Adolescente (13-17 anos)" },
  { key: "aleatorio", label: "Aleatório" },
];

const BASE_CATEGORIES = [
  { key: "identification", label: "Identificação", icon: User },
  { key: "chief_complaint", label: "Queixa Principal", icon: MessageCircle },
  { key: "hda", label: "HDA", icon: Activity },
  { key: "past_medical", label: "Antecedentes", icon: ClipboardCheck },
  { key: "medications", label: "Medicações", icon: Pill },
  { key: "allergies", label: "Alergias", icon: AlertTriangle },
  { key: "family_history", label: "Hist. Familiar", icon: UsersIcon },
  { key: "social_history", label: "Hábitos de Vida", icon: Heart },
  { key: "review_of_systems", label: "Rev. Sistemas", icon: Stethoscope },
  { key: "gynecological", label: "Ginecológica", icon: Baby },
];

const PEDIATRIC_EXTRA_CATEGORIES = [
  { key: "gestational_history", label: "Hist. Gestacional", icon: Heart },
  { key: "birth_history", label: "Hist. Neonatal", icon: Baby },
  { key: "development", label: "DNPM", icon: Activity },
  { key: "vaccination", label: "Vacinação", icon: ClipboardCheck },
  { key: "feeding", label: "Alimentação", icon: Stethoscope },
];

const DIAGNOSIS_CATEGORIES = [
  { key: "hypothesis", label: "Hipótese Diagnóstica", icon: Brain },
  { key: "differentials", label: "Diferenciais", icon: ListChecks },
  { key: "conduct", label: "Conduta", icon: FileText },
];

type Phase = "lobby" | "active" | "diagnosis" | "finishing" | "result";

interface ChatMessage {
  role: "doctor" | "patient";
  content: string;
  categories?: string[];
  quality?: number;
  timestamp: number;
}

interface EvalCategory {
  score: number;
  covered?: boolean;
  correct?: boolean;
  appropriate?: boolean;
  relevant_count?: number;
  feedback: string;
}

interface FinalEval {
  final_score: number;
  grade: string;
  time_total_minutes: number;
  evaluation: Record<string, EvalCategory>;
  categories_summary: { covered: string[]; missed: string[]; partially_covered: string[] };
  ideal_anamnesis: string;
  clinical_reasoning: string;
  correct_diagnosis: string;
  ideal_conduct: string;
  diagnostic_reasoning: string;
  strengths: string[];
  improvements: string[];
  xp_earned: number;
}

const AnamnesisTrainer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addXp } = useGamification();

  const [phase, setPhase] = useState<Phase>("lobby");
  const [specialty, setSpecialty] = useState("Clínica Médica");
  const [difficulty, setDifficulty] = useState("intermediário");
  const [pediatricAge, setPediatricAge] = useState("aleatorio");

  const isPediatrics = specialty === "Pediatria";
  const CATEGORIES = isPediatrics
    ? [...BASE_CATEGORIES.filter(c => c.key !== "gynecological" && c.key !== "social_history"), ...PEDIATRIC_EXTRA_CATEGORIES]
    : BASE_CATEGORIES;
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [coveredCategories, setCoveredCategories] = useState<Set<string>>(new Set());
  const [patientData, setPatientData] = useState<any>(null);
  const [evalData, setEvalData] = useState<FinalEval | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Diagnosis phase fields
  const [hypothesis, setHypothesis] = useState("");
  const [differentials, setDifferentials] = useState("");
  const [proposedConduct, setProposedConduct] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [phase, startTime]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const callEdgeFunction = async (body: any) => {
    const { data, error } = await supabase.functions.invoke("anamnesis-trainer", { body });
    if (error) throw new Error(error.message);
    return data;
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await callEdgeFunction({
        action: "start",
        specialty,
        difficulty,
        ...(isPediatrics && pediatricAge !== "aleatorio" ? { pediatric_age_range: pediatricAge } : {}),
      });
      setPatientData(data);
      setMessages([{
        role: "patient",
        content: data.patient_presentation || "Doutor, eu tô passando mal...",
        timestamp: Date.now(),
      }]);
      setStartTime(Date.now());
      setCoveredCategories(new Set());
      setHypothesis("");
      setDifferentials("");
      setProposedConduct("");
      setPhase("active");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "doctor", content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const allMessages = [...messages, userMsg];
      const data = await callEdgeFunction({
        action: "interact",
        messages: [{ role: "user", content: userMsg.content }],
        conversationHistory: allMessages.map(m => ({ role: m.role, content: m.content })),
      });

      const patientMsg: ChatMessage = {
        role: "patient",
        content: data.response || "...",
        categories: data.categories_touched || [],
        quality: data.question_quality,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, patientMsg]);

      if (data.categories_touched?.length) {
        setCoveredCategories(prev => {
          const next = new Set(prev);
          data.categories_touched.forEach((c: string) => next.add(c));
          return next;
        });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleGoToDiagnosis = () => {
    setPhase("diagnosis");
  };

  const handleSubmitDiagnosis = async () => {
    setPhase("finishing");
    setLoading(true);
    try {
      const data = await callEdgeFunction({
        action: "finish",
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        hypothesis,
        differentials,
        proposed_conduct: proposedConduct,
      });
      setEvalData(data);

      if (user) {
        await supabase.from("anamnesis_results" as any).insert({
          user_id: user.id,
          specialty,
          difficulty,
          categories_covered: data.categories_summary || {},
          final_score: data.final_score || 0,
          grade: data.grade || "F",
          ideal_anamnesis: data.ideal_anamnesis || "",
          conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
          time_total_minutes: Math.round(elapsed / 60),
          xp_earned: data.xp_earned || 0,
        } as any);

        if (data.xp_earned) {
          addXp(data.xp_earned);
        }
      }

      setPhase("result");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      setPhase("diagnosis");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhase("lobby");
    setMessages([]);
    setCoveredCategories(new Set());
    setPatientData(null);
    setEvalData(null);
    setElapsed(0);
    setHypothesis("");
    setDifferentials("");
    setProposedConduct("");
  };

  // === LOBBY ===
  if (phase === "lobby") {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Treino de Anamnese
          </h1>
          <p className="text-muted-foreground">Pratique sua técnica de entrevista clínica com pacientes simulados por IA.</p>
        </div>

        <Card className="glass-card">
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Especialidade</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map(s => (
                  <Badge
                    key={s}
                    variant={specialty === s ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => setSpecialty(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Dificuldade</label>
              <div className="flex gap-2">
                {["básico", "intermediário", "avançado"].map(d => (
                  <Badge
                    key={d}
                    variant={difficulty === d ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors capitalize"
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">📋 Como funciona:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• A IA simula um paciente real — só responde ao que você perguntar</li>
                <li>• Conduza a anamnese completa: identificação, QP, HDA, antecedentes...</li>
                <li>• O checklist lateral mostra quais categorias você já cobriu</li>
                <li>• Ao finalizar, proponha hipótese diagnóstica e conduta</li>
                <li>• Receba avaliação detalhada com anamnese ideal e raciocínio clínico</li>
              </ul>
            </div>

            <Button onClick={handleStart} disabled={loading} className="w-full" size="lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Stethoscope className="h-4 w-4 mr-2" />}
              Iniciar Consulta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === DIAGNOSIS PHASE ===
  if (phase === "diagnosis" || phase === "finishing") {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Raciocínio Clínico
          </h1>
          <p className="text-muted-foreground">
            Com base na anamnese que você realizou, proponha sua hipótese diagnóstica e conduta.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Badge variant="outline">{specialty}</Badge>
          <Badge variant="outline" className="capitalize">{difficulty}</Badge>
          <div className="flex items-center gap-1 font-mono text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatTime(elapsed)}
          </div>
          <Badge variant="secondary">{coveredCategories.size}/{CATEGORIES.length} categorias</Badge>
        </div>

        <Card className="glass-card">
          <CardContent className="p-6 space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Hipótese Diagnóstica Principal *
              </label>
              <Textarea
                value={hypothesis}
                onChange={e => setHypothesis(e.target.value)}
                placeholder="Ex: Infarto Agudo do Miocárdio com supradesnivelamento de ST em parede anterior..."
                className="min-h-[80px]"
                disabled={phase === "finishing"}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                Diagnósticos Diferenciais (até 3)
              </label>
              <Textarea
                value={differentials}
                onChange={e => setDifferentials(e.target.value)}
                placeholder="Ex: 1. Angina instável 2. Dissecção aórtica 3. Pericardite aguda..."
                className="min-h-[80px]"
                disabled={phase === "finishing"}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Conduta Proposta (exames, tratamento, orientações)
              </label>
              <Textarea
                value={proposedConduct}
                onChange={e => setProposedConduct(e.target.value)}
                placeholder="Ex: Solicitar ECG 12 derivações, troponina, hemograma, eletrólitos. Iniciar AAS 300mg, Clopidogrel 300mg..."
                className="min-h-[100px]"
                disabled={phase === "finishing"}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setPhase("active")}
                disabled={phase === "finishing"}
              >
                Voltar à Anamnese
              </Button>
              <Button
                onClick={handleSubmitDiagnosis}
                disabled={phase === "finishing" || !hypothesis.trim()}
                className="flex-1"
              >
                {phase === "finishing" ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Avaliando...</>
                ) : (
                  <><Award className="h-4 w-4 mr-2" /> Enviar para Avaliação</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === RESULT ===
  if (phase === "result" && evalData) {
    const gradeColor: Record<string, string> = { A: "text-green-400", B: "text-blue-400", C: "text-yellow-400", D: "text-orange-400", F: "text-red-400" };
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" /> Resultado da Anamnese
          </h1>
          <Button onClick={handleReset} variant="outline"><RotateCcw className="h-4 w-4 mr-2" /> Nova Consulta</Button>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card text-center p-4">
            <div className={`text-4xl font-bold ${gradeColor[evalData.grade] || "text-foreground"}`}>{evalData.grade}</div>
            <p className="text-xs text-muted-foreground mt-1">Nota</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <div className="text-4xl font-bold text-primary">{evalData.final_score}</div>
            <p className="text-xs text-muted-foreground mt-1">Pontuação</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <div className="text-4xl font-bold text-foreground">{Math.round(elapsed / 60)}min</div>
            <p className="text-xs text-muted-foreground mt-1">Tempo</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <div className="text-4xl font-bold text-yellow-400">+{evalData.xp_earned}</div>
            <p className="text-xs text-muted-foreground mt-1">XP</p>
          </Card>
        </div>

        {/* Anamnese Categories */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Avaliação da Anamnese</h2>
            <div className="space-y-3">
              {CATEGORIES.map(cat => {
                const evalCat = evalData.evaluation?.[cat.key];
                if (!evalCat) return null;
                const Icon = cat.icon;
                return (
                  <div key={cat.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{cat.label}</span>
                        {evalCat.covered ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <span className="text-sm font-bold">{evalCat.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">{evalCat.feedback}</p>
                  </div>
                );
              })}
              {evalData.evaluation?.communication && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Comunicação</span>
                    </div>
                    <span className="text-sm font-bold">{evalData.evaluation.communication.score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">{evalData.evaluation.communication.feedback}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Diagnosis/Conduct Evaluation */}
        <Card className="glass-card border-primary/20">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Avaliação do Raciocínio Clínico</h2>
            <div className="space-y-4">
              {DIAGNOSIS_CATEGORIES.map(cat => {
                const evalCat = evalData.evaluation?.[cat.key];
                if (!evalCat) return null;
                const Icon = cat.icon;
                const isCorrect = evalCat.correct ?? evalCat.appropriate;
                return (
                  <div key={cat.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{cat.label}</span>
                        {isCorrect !== undefined && (
                          isCorrect ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <span className="text-sm font-bold">{evalCat.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">{evalCat.feedback}</p>
                  </div>
                );
              })}
            </div>

            {/* Correct diagnosis and ideal conduct */}
            {evalData.correct_diagnosis && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-green-400 mb-1">✅ Diagnóstico Correto</h3>
                  <p className="text-sm bg-muted/30 rounded-lg p-3">{evalData.correct_diagnosis}</p>
                </div>
                {evalData.diagnostic_reasoning && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-1">🧠 Raciocínio Diagnóstico</h3>
                    <div className="text-sm bg-muted/30 rounded-lg p-3 prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{evalData.diagnostic_reasoning}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {evalData.ideal_conduct && (
                  <div>
                    <h3 className="text-sm font-semibold text-blue-400 mb-1">📋 Conduta Ideal</h3>
                    <div className="text-sm bg-muted/30 rounded-lg p-3 prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{evalData.ideal_conduct}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missed / Strengths / Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evalData.categories_summary?.missed?.length > 0 && (
            <Card className="glass-card border-red-500/20">
              <CardContent className="p-4">
                <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2"><XCircle className="h-4 w-4" /> Categorias Não Abordadas</h3>
                <ul className="text-sm space-y-1">{evalData.categories_summary.missed.map((c, i) => <li key={i}>• {c}</li>)}</ul>
              </CardContent>
            </Card>
          )}
          {evalData.strengths?.length > 0 && (
            <Card className="glass-card border-green-500/20">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2"><Star className="h-4 w-4" /> Pontos Fortes</h3>
                <ul className="text-sm space-y-1">{evalData.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </CardContent>
            </Card>
          )}
          {evalData.improvements?.length > 0 && (
            <Card className="glass-card border-yellow-500/20">
              <CardContent className="p-4">
                <h3 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2"><Target className="h-4 w-4" /> Pontos a Melhorar</h3>
                <ul className="text-sm space-y-1">{evalData.improvements.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ideal Anamnesis */}
        {evalData.ideal_anamnesis && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Anamnese Ideal</h2>
              <div className="prose prose-sm prose-invert max-w-none text-sm bg-muted/30 rounded-lg p-4">
                <ReactMarkdown>{evalData.ideal_anamnesis}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {evalData.clinical_reasoning && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Raciocínio Clínico Completo</h2>
              <div className="prose prose-sm prose-invert max-w-none text-sm">
                <ReactMarkdown>{evalData.clinical_reasoning}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // === ACTIVE ===
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] animate-fade-in">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{specialty}</Badge>
            <Badge variant="outline" className="capitalize">{difficulty}</Badge>
            {patientData?.patient_name && (
              <span className="text-sm text-muted-foreground">Paciente: {patientData.patient_name}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm font-mono">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {formatTime(elapsed)}
            </div>
            <Button
              onClick={handleGoToDiagnosis}
              disabled={loading || messages.length < 4}
              variant="default"
              size="sm"
            >
              <Brain className="h-4 w-4 mr-1" />
              Finalizar e Diagnosticar
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 bg-muted/20 rounded-lg p-4 mb-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "doctor" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "doctor"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border rounded-bl-md"
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.categories && msg.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {msg.categories.map((c, j) => (
                      <Badge key={j} variant="secondary" className="text-[10px] py-0">
                        {CATEGORIES.find(cat => cat.key === c)?.label || c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Faça sua pergunta ao paciente..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar Checklist */}
      <div className="w-full lg:w-64 shrink-0">
        <Card className="glass-card h-full">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Checklist da Anamnese
            </h3>
            <div className="space-y-2">
              {CATEGORIES.map(cat => {
                const covered = coveredCategories.has(cat.key);
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.key}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      covered ? "bg-green-500/10 text-green-400" : "text-muted-foreground"
                    }`}
                  >
                    {covered ? (
                      <CheckCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <Icon className="h-4 w-4 shrink-0 opacity-50" />
                    )}
                    <span className={covered ? "font-medium" : ""}>{cat.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{coveredCategories.size}/{CATEGORIES.length}</span>
              </div>
              <Progress value={(coveredCategories.size / CATEGORIES.length) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnamnesisTrainer;
