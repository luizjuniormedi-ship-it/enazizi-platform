import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import {
  MessageCircle, Send, Loader2, Clock, Award, RotateCcw,
  CheckCircle, XCircle, Star, Trophy, Target, ClipboardCheck,
  User, Heart, Pill, AlertTriangle, Users as UsersIcon, Activity,
  Stethoscope, Baby
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from "react-markdown";

const SPECIALTIES = [
  "Clínica Médica", "Cardiologia", "Pneumologia", "Gastroenterologia", "Neurologia",
  "Nefrologia", "Infectologia", "Pediatria", "Cirurgia", "Ginecologia e Obstetrícia",
  "Ortopedia", "Psiquiatria", "Emergência", "Dermatologia", "Semiologia",
];

const CATEGORIES = [
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

type Phase = "lobby" | "active" | "finishing" | "result";

interface ChatMessage {
  role: "doctor" | "patient";
  content: string;
  categories?: string[];
  quality?: number;
  timestamp: number;
}

interface EvalCategory {
  score: number;
  covered: boolean;
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
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [coveredCategories, setCoveredCategories] = useState<Set<string>>(new Set());
  const [patientData, setPatientData] = useState<any>(null);
  const [evalData, setEvalData] = useState<FinalEval | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer
  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [phase, startTime]);

  // Auto-scroll
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
      const data = await callEdgeFunction({ action: "start", specialty, difficulty });
      setPatientData(data);
      setMessages([{
        role: "patient",
        content: data.patient_presentation || "Doutor, eu tô passando mal...",
        timestamp: Date.now(),
      }]);
      setStartTime(Date.now());
      setCoveredCategories(new Set());
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

  const handleFinish = async () => {
    setPhase("finishing");
    setLoading(true);
    try {
      const data = await callEdgeFunction({
        action: "finish",
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
      });
      setEvalData(data);

      // Save to database
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
      setPhase("active");
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
                <li>• Ao finalizar, receba avaliação detalhada com anamnese ideal</li>
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

        {/* Categories Evaluation */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Avaliação por Categoria</h2>
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
              {/* Communication */}
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
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Raciocínio Clínico</h2>
              <div className="prose prose-sm prose-invert max-w-none text-sm">
                <ReactMarkdown>{evalData.clinical_reasoning}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // === ACTIVE / FINISHING ===
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] animate-fade-in">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
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
              onClick={handleFinish}
              disabled={loading || messages.length < 4}
              variant="destructive"
              size="sm"
            >
              {phase === "finishing" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Award className="h-4 w-4 mr-1" />}
              Encerrar Consulta
            </Button>
          </div>
        </div>

        {/* Messages */}
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

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Faça sua pergunta ao paciente..."
            disabled={loading || phase === "finishing"}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim() || phase === "finishing"} size="icon">
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
