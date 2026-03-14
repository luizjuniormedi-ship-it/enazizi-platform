import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  BookOpen, Brain, HelpCircle, MessageSquare, BarChart3,
  Send, Loader2, GraduationCap, Play, RotateCcw
} from "lucide-react";
import ReactMarkdown from "react-markdown";

type Phase = "start" | "lesson" | "active-recall" | "questions" | "discussion" | "performance";
type Msg = { role: "user" | "assistant"; content: string };

const PHASE_CONFIG: Record<Phase, { label: string; icon: typeof BookOpen; color: string }> = {
  start: { label: "Início", icon: Play, color: "bg-primary/10 text-primary" },
  lesson: { label: "📚 Aula", icon: BookOpen, color: "bg-blue-500/10 text-blue-400" },
  "active-recall": { label: "🧠 Active Recall", icon: Brain, color: "bg-purple-500/10 text-purple-400" },
  questions: { label: "📝 Questões", icon: HelpCircle, color: "bg-orange-500/10 text-orange-400" },
  discussion: { label: "🔬 Discussão", icon: MessageSquare, color: "bg-green-500/10 text-green-400" },
  performance: { label: "📊 Desempenho", icon: BarChart3, color: "bg-red-500/10 text-red-400" },
};

const PHASES: Phase[] = ["lesson", "active-recall", "questions", "discussion", "performance"];

const StudySession = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("start");
  const [topic, setTopic] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const streamChat = async (msgs: Msg[], currentPhase: Phase, currentTopic: string) => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-session`;

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: msgs, phase: currentPhase, topic: currentTopic }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast({ title: "Erro", description: err.error, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const startStudy = async () => {
    if (!topicInput.trim()) return;
    const t = topicInput.trim();
    setTopic(t);
    setPhase("lesson");
    const userMsg: Msg = { role: "user", content: `Quero estudar: ${t}` };
    setMessages([userMsg]);
    await streamChat([userMsg], "lesson", t);
  };

  const advancePhase = async () => {
    const currentIdx = PHASES.indexOf(phase);
    if (currentIdx < PHASES.length - 1) {
      const next = PHASES[currentIdx + 1];
      setPhase(next);
      const userMsg: Msg = { role: "user", content: `Estou pronto. Avançar para: ${PHASE_CONFIG[next].label}` };
      const newMsgs = [...messages, userMsg];
      setMessages(newMsgs);
      await streamChat(newMsgs, next, topic);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    await streamChat(newMsgs, phase, topic);
  };

  const resetSession = () => {
    setMessages([]);
    setPhase("start");
    setTopic("");
    setTopicInput("");
  };

  const currentPhaseIdx = PHASES.indexOf(phase);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">ENAZIZI — Sessão de Estudo</h1>
            {topic && <p className="text-xs text-muted-foreground">Tema: {topic}</p>}
          </div>
        </div>
        {phase !== "start" && (
          <Button variant="ghost" size="sm" onClick={resetSession}>
            <RotateCcw className="h-4 w-4 mr-1" /> Novo tema
          </Button>
        )}
      </div>

      {/* Phase Progress */}
      {phase !== "start" && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto">
          {PHASES.map((p, i) => {
            const cfg = PHASE_CONFIG[p];
            const isActive = p === phase;
            const isDone = i < currentPhaseIdx;
            return (
              <Badge
                key={p}
                variant={isActive ? "default" : isDone ? "secondary" : "outline"}
                className={`text-xs whitespace-nowrap ${isActive ? "ring-2 ring-primary/50" : ""}`}
              >
                {cfg.label}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Start Screen */}
      {phase === "start" && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center space-y-6">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Vamos estudar! 🎯</h2>
              <p className="text-muted-foreground">
                Digite o tema e o ENAZIZI vai guiar você pelo protocolo completo:
                <br />
                <span className="text-sm">Aula → Active Recall → Questões → Discussão → Desempenho</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Ex: Insuficiência Cardíaca, TEP, Diabetes..."
                onKeyDown={(e) => e.key === "Enter" && startStudy()}
                className="flex-1"
              />
              <Button onClick={startStudy} disabled={!topicInput.trim()}>
                <Play className="h-4 w-4 mr-1" /> Começar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Insuficiência Cardíaca", "TEP", "AVC", "Diabetes Mellitus", "Pneumonia", "Asma", "Apendicite", "Pré-eclâmpsia"].map((t) => (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => { setTopicInput(t); }}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      {phase !== "start" && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "glass-card"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="glass-card rounded-2xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="border-t border-border p-3 space-y-2">
            {!isLoading && currentPhaseIdx < PHASES.length - 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={advancePhase}
                className="w-full text-primary border-primary/30 hover:bg-primary/10"
              >
                Avançar para: {PHASE_CONFIG[PHASES[currentPhaseIdx + 1]].label} →
              </Button>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua resposta ou dúvida..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudySession;
