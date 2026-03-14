import { useState } from "react";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, Award, GraduationCap, Play, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const ALL_TOPICS = [
  "Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia", "Gastroenterologia",
  "Nefrologia", "Infectologia", "Hematologia", "Reumatologia", "Dermatologia",
  "Pediatria", "Ginecologia e Obstetrícia", "Cirurgia Geral", "Cirurgia do Trauma",
  "Ortopedia", "Urologia", "Psiquiatria", "Oftalmologia", "Otorrinolaringologia",
  "Medicina Preventiva", "Medicina de Emergência", "Terapia Intensiva",
  "Clínica Médica", "Saúde da Família",
];

interface SimQuestion {
  statement: string;
  options: string[];
  correct: number;
  topic: string;
  explanation?: string;
}

const Simulados = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Setup state
  const [phase, setPhase] = useState<"setup" | "loading" | "exam" | "finished">("setup");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [customCount, setCustomCount] = useState("");

  // Exam state
  const [questions, setQuestions] = useState<SimQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const startSimulado = async () => {
    if (selectedTopics.length === 0) {
      toast({ title: "Selecione pelo menos um assunto", variant: "destructive" });
      return;
    }
    const count = customCount ? parseInt(customCount) : questionCount;
    if (!count || count < 1 || count > 100) {
      toast({ title: "Número de questões inválido (1-100)", variant: "destructive" });
      return;
    }

    setPhase("loading");
    try {
      const topicsStr = selectedTopics.join(", ");
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/question-generator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `Gere exatamente ${count} questões de múltipla escolha para simulado de residência médica sobre: ${topicsStr}. 
Formato OBRIGATÓRIO: JSON array puro, sem markdown, sem texto extra.
[{"statement":"caso clínico...", "options":["a","b","c","d","e"], "correct_index": 0, "topic":"Área", "explanation":"explicação detalhada"}]
Distribua igualmente entre os temas solicitados. Nível intermediário a difícil com casos clínicos.`
            }],
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Erro ao conectar com o gerador de questões");
      }

      // Read SSE stream and accumulate full text
      let fullText = "";
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullText += content;
            } catch {}
          }
        }
      }

      let parsed: SimQuestion[] = [];
      try {
        const match = fullText.match(/\[[\s\S]*\]/);
        if (match) {
          const arr = JSON.parse(match[0]);
          parsed = (Array.isArray(arr) ? arr : []).map((q: any) => ({
            statement: String(q.statement || ""),
            options: Array.isArray(q.options) ? q.options.map(String) : [],
            correct: Number.isInteger(q.correct_index) ? q.correct_index : 0,
            topic: String(q.topic || selectedTopics[0]),
            explanation: String(q.explanation || ""),
          })).filter((q: SimQuestion) => q.options.length >= 4 && q.statement.length > 10);
        }
      } catch {}

      if (parsed.length === 0) {
        toast({ title: "Erro ao gerar questões. Tente novamente.", variant: "destructive" });
        setPhase("setup");
        return;
      }

      setQuestions(parsed.slice(0, count));
      setCurrent(0);
      setSelected(null);
      setAnswered(false);
      setScore({ correct: 0, total: 0 });
      setPhase("exam");
    } catch (err: any) {
      toast({ title: "Erro ao gerar simulado", description: err.message, variant: "destructive" });
      setPhase("setup");
    }
  };

  const handleAnswer = () => {
    if (selected === null) return;
    setAnswered(true);
    const q = questions[current];
    const isCorrect = selected === q.correct;
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));

    if (!isCorrect && user) {
      logErrorToBank({
        userId: user.id,
        tema: q.topic || "Clínica Médica",
        tipoQuestao: "simulado",
        conteudo: q.statement,
        motivoErro: `Marcou "${q.options[selected]}" — Correta: "${q.options[q.correct]}"`,
        categoriaErro: "conceito",
      });
    }
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setPhase("finished");
    }
  };

  const handleStudyWithTutor = () => {
    const q = questions[current];
    const topic = q.topic || "Clínica Médica";
    navigate("/dashboard/chatgpt", {
      state: {
        initialMessage: `Errei uma questão sobre "${topic}". O enunciado era: "${q.statement.slice(0, 200)}". A resposta correta era "${q.options[q.correct]}". Me explique este tema em detalhes seguindo o protocolo ENAZIZI.`,
        fromErrorBank: true,
      },
    });
  };

  // SETUP PHASE
  if (phase === "setup") {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        <div className="text-center py-4">
          <FileText className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Simulados</h1>
          <p className="text-muted-foreground">Escolha o assunto e quantidade de questões para treinar.</p>
        </div>

        <div className="glass-card p-6 space-y-6">
          {/* Topic selection */}
          <div>
            <label className="text-sm font-semibold mb-3 block">Selecione os assuntos</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    selectedTopics.includes(topic)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedTopics([...ALL_TOPICS])}>
                Selecionar todos
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedTopics([])}>
                Limpar
              </Button>
            </div>
          </div>

          {/* Question count */}
          <div>
            <label className="text-sm font-semibold mb-3 block">Quantas questões?</label>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 15, 20, 30].map(n => (
                <Button
                  key={n}
                  variant={questionCount === n && !customCount ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setQuestionCount(n); setCustomCount(""); }}
                >
                  {n}
                </Button>
              ))}
              <Input
                type="number"
                placeholder="Outro..."
                className="w-24 h-9"
                min={1}
                max={100}
                value={customCount}
                onChange={e => setCustomCount(e.target.value)}
              />
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={startSimulado} disabled={selectedTopics.length === 0}>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Simulado ({customCount || questionCount} questões)
          </Button>
        </div>
      </div>
    );
  }

  // LOADING
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Gerando {customCount || questionCount} questões sobre {selectedTopics.join(", ")}...</p>
        <p className="text-xs text-muted-foreground mt-2">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  // FINISHED
  if (phase === "finished") {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
        <div className="text-center py-8">
          <Award className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Simulado Concluído!</h1>
          <div className="text-5xl font-black text-primary">{pct}%</div>
          <p className="text-muted-foreground mt-2">{score.correct} de {score.total} questões corretas</p>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={() => setPhase("setup")}>Novo Simulado</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  // EXAM PHASE
  const q = questions[current];
  if (!q) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Simulados
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{q.topic}</span>
          <span className="text-sm text-muted-foreground">{current + 1}/{questions.length}</span>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="glass-card p-6">
        <p className="text-base font-medium mb-6">{q.statement}</p>

        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !answered && setSelected(i)}
              className={`w-full text-left p-4 rounded-lg border text-sm transition-all ${
                answered && i === q.correct
                  ? "border-success bg-success/10"
                  : answered && i === selected && i !== q.correct
                  ? "border-destructive bg-destructive/10"
                  : selected === i
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/30"
              }`}
            >
              <span className="font-semibold mr-2">{String.fromCharCode(65 + i)})</span>
              {opt}
            </button>
          ))}
        </div>

        {answered && q.explanation && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm"><strong>Explicação:</strong> {q.explanation}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {!answered ? (
            <Button onClick={handleAnswer} disabled={selected === null}>Confirmar</Button>
          ) : (
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleNext}>
                {current < questions.length - 1 ? "Próxima" : "Finalizar"} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              {selected !== q.correct && (
                <Button variant="outline" onClick={handleStudyWithTutor} className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Estudar com Tutor IA
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulados;
