import { useState, useEffect, useMemo } from "react";
import { Database, Filter, Play, Trash2, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface Question {
  id: string;
  statement: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  topic: string | null;
  source: string | null;
  created_at: string;
}

function parseOptions(raw: Json | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

const QuestionsBank = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Practice mode
  const [practicing, setPracticing] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Expanded explanations
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("questions_bank")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setQuestions(
          data.map((q) => ({
            ...q,
            options: parseOptions(q.options),
            correct_index: q.correct_index ?? 0,
          }))
        );
      }
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLoading(false);
    };
    load();
  }, [user]);

  const topics = useMemo(() => {
    const set = new Set(questions.map((q) => q.topic).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [questions]);

  const sources = useMemo(() => {
    const set = new Set(questions.map((q) => q.source).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (topicFilter !== "all" && q.topic !== topicFilter) return false;
      if (sourceFilter !== "all" && q.source !== sourceFilter) return false;
      if (searchTerm && !q.statement.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [questions, topicFilter, sourceFilter, searchTerm]);

  const handleDelete = async (id: string) => {
    await supabase.from("questions_bank").delete().eq("id", id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast({ title: "Questão removida." });
  };

  // Practice mode logic
  const startPractice = () => {
    if (filtered.length === 0) return;
    setPracticing(true);
    setPracticeIdx(0);
    setSelected(null);
    setAnswered(false);
    setScore({ correct: 0, total: 0 });
  };

  const practiceQuestion = filtered[practiceIdx];

  const confirmAnswer = () => {
    if (selected === null) return;
    setAnswered(true);
    setScore((s) => ({
      correct: s.correct + (selected === practiceQuestion.correct_index ? 1 : 0),
      total: s.total + 1,
    }));
  };

  const nextQuestion = () => {
    if (practiceIdx + 1 >= filtered.length) {
      setPracticing(false);
      toast({
        title: "Prática finalizada!",
        description: `Você acertou ${score.correct + (selected === practiceQuestion.correct_index ? 1 : 0)} de ${score.total + 1} questões.`,
      });
      return;
    }
    setPracticeIdx((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  };

  if (practicing && practiceQuestion) {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Play className="h-6 w-6 text-primary" /> Modo Prática
          </h1>
          <Button variant="outline" size="sm" onClick={() => setPracticing(false)}>
            Voltar ao Banco
          </Button>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Questão {practiceIdx + 1} de {filtered.length}</span>
          <span>Acertos: {score.correct}/{score.total}</span>
        </div>

        <div className="glass-card p-6">
          {practiceQuestion.topic && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary mb-3 inline-block">
              {practiceQuestion.topic}
            </span>
          )}
          <p className="text-base font-medium mb-6">{practiceQuestion.statement}</p>

          <div className="space-y-3">
            {practiceQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => !answered && setSelected(i)}
                className={`w-full text-left p-4 rounded-lg border text-sm transition-all ${
                  answered && i === practiceQuestion.correct_index
                    ? "border-green-500 bg-green-500/10"
                    : answered && i === selected && i !== practiceQuestion.correct_index
                    ? "border-destructive bg-destructive/10"
                    : selected === i
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/50 hover:border-primary/30"
                }`}
              >
                <span className="font-semibold mr-2">
                  {practiceQuestion.options.length === 2 ? "" : `${String.fromCharCode(65 + i)}) `}
                </span>
                {opt}
              </button>
            ))}
          </div>

          {answered && practiceQuestion.explanation && (
            <div className="mt-4 p-4 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-1">Explicação:</p>
              <p className="text-muted-foreground">{practiceQuestion.explanation}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {!answered ? (
              <Button onClick={confirmAnswer} disabled={selected === null}>Confirmar</Button>
            ) : (
              <Button onClick={nextQuestion}>
                {practiceIdx + 1 >= filtered.length ? "Finalizar" : "Próxima"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Banco de Questões
          </h1>
          <p className="text-muted-foreground">
            {questions.length} questão(ões) salva(s) no total
          </p>
        </div>
        <Button onClick={startPractice} disabled={filtered.length === 0} className="gap-2">
          <Play className="h-4 w-4" /> Praticar ({filtered.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar questões..."
            className="pl-9 bg-secondary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {topics.length > 0 && (
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-[180px] bg-secondary">
              <SelectValue placeholder="Tópico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tópicos</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {sources.length > 0 && (
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px] bg-secondary">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fontes</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Database className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            {questions.length === 0
              ? "Nenhuma questão salva. Use o Gerador de Questões para criar e salvar questões."
              : "Nenhuma questão encontrada com os filtros atuais."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div key={q.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {q.topic && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {q.topic}
                      </span>
                    )}
                    {q.source && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {q.source}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-2">{q.statement}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {q.options.map((opt, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded border ${
                          i === q.correct_index
                            ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                            : "border-border bg-secondary text-muted-foreground"
                        }`}
                      >
                        {q.options.length > 2 && `${String.fromCharCode(65 + i)}) `}{opt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  >
                    {expandedId === q.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(q.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {expandedId === q.id && q.explanation && (
                <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Explicação:</p>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsBank;
