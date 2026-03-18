import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Clock, CheckCircle, XCircle, ChevronRight, Trophy, Filter, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { logErrorToBank } from "@/lib/errorBankLogger";

const BANCAS = ["ENARE", "USP", "UNIFESP", "UNICAMP", "Santa Casa", "AMRIGS", "SUS-SP", "UERJ", "Revalida", "FMUSP"];

interface Question {
  id: string;
  statement: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic: string;
  difficulty: number;
  source: string;
}

export default function PreviousExams() {
  const { user } = useAuth();
  const [selectedBanca, setSelectedBanca] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [examMode, setExamMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState<number | null>(null);

  // Fetch available sources to extract bancas/years
  const { data: availableSources } = useQuery({
    queryKey: ["exam-sources"],
    queryFn: async () => {
      const { data } = await supabase
        .from("questions_bank")
        .select("source, topic")
        .not("source", "is", null)
        .eq("is_global", true);
      return data || [];
    },
  });

  // Get unique years from sources
  const availableYears = [...new Set(
    (availableSources || [])
      .map((s) => {
        const match = s.source?.match(/\d{4}/);
        return match ? match[0] : null;
      })
      .filter(Boolean)
  )].sort().reverse();

  const availableTopics = [...new Set(
    (availableSources || []).map((s) => s.topic).filter(Boolean)
  )].sort();

  // Fetch questions based on filters
  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ["exam-questions", selectedBanca, selectedYear, selectedTopic],
    queryFn: async () => {
      let query = supabase
        .from("questions_bank")
        .select("id, statement, options, correct_index, explanation, topic, difficulty, source")
        .eq("is_global", true)
        .not("source", "is", null);

      if (selectedBanca) {
        query = query.ilike("source", `%${selectedBanca}%`);
      }
      if (selectedYear) {
        query = query.ilike("source", `%${selectedYear}%`);
      }
      if (selectedTopic) {
        query = query.eq("topic", selectedTopic);
      }

      const { data } = await query.order("created_at", { ascending: false }).limit(100);
      return (data || []) as Question[];
    },
    enabled: !!(selectedBanca || selectedYear || selectedTopic),
  });

  const startExam = () => {
    if (!questions || questions.length === 0) {
      toast.error("Nenhuma questão encontrada com os filtros selecionados");
      return;
    }
    setExamMode(true);
    setCurrentIndex(0);
    setAnswers({});
    setShowResult(false);
    setShowExplanation(null);
  };

  const handleAnswer = (optionIndex: number) => {
    if (answers[currentIndex] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));

    const q = questions![currentIndex];
    const correct = optionIndex === q.correct_index;

    // Log attempt
    if (user) {
      supabase.from("practice_attempts").insert({
        user_id: user.id,
        question_id: q.id,
        correct,
      }).then(() => {});

      if (!correct) {
        logErrorToBank({
          userId: user.id,
          tema: q.topic || "Geral",
          tipoQuestao: "objetiva",
          conteudo: q.statement?.slice(0, 500),
          dificuldade: q.difficulty || 3,
        });
      }
    }
  };

  const finishExam = () => {
    setShowResult(true);
    setExamMode(false);
  };

  const correctCount = questions
    ? Object.entries(answers).filter(([idx, ans]) => questions[Number(idx)]?.correct_index === ans).length
    : 0;
  const totalAnswered = Object.keys(answers).length;

  if (examMode && questions && questions.length > 0) {
    const q = questions[currentIndex];
    const answered = answers[currentIndex] !== undefined;
    const options = Array.isArray(q.options) ? q.options.map(String) : [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            Questão {currentIndex + 1} / {questions.length}
          </Badge>
          <div className="flex gap-2">
            <Badge variant="secondary">{q.topic}</Badge>
            <Badge variant={q.difficulty <= 2 ? "default" : q.difficulty <= 3 ? "secondary" : "destructive"}>
              {q.difficulty <= 2 ? "Fácil" : q.difficulty <= 3 ? "Médio" : "Difícil"}
            </Badge>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-6">{q.statement}</p>

            <div className="space-y-2">
              {options.map((opt, i) => {
                const isSelected = answers[currentIndex] === i;
                const isCorrect = q.correct_index === i;
                let variant = "outline" as "outline" | "default" | "destructive";
                let extraClass = "";

                if (answered) {
                  if (isCorrect) {
                    variant = "default";
                    extraClass = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                  } else if (isSelected && !isCorrect) {
                    variant = "destructive";
                    extraClass = "border-red-500 bg-red-500/10";
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={answered}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                      answered
                        ? extraClass
                        : "border-border hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    } ${isSelected && !answered ? "border-primary bg-primary/5" : ""}`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + i)})</span>
                    {opt.replace(/^[A-E]\)\s*/, "")}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  {answers[currentIndex] === q.correct_index ? (
                    <Badge className="bg-green-500">✅ Correto!</Badge>
                  ) : (
                    <Badge variant="destructive">❌ Incorreto — Resposta: {String.fromCharCode(65 + q.correct_index)}</Badge>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExplanation(showExplanation === currentIndex ? null : currentIndex)}
                >
                  {showExplanation === currentIndex ? "Ocultar explicação" : "Ver explicação"}
                </Button>

                {showExplanation === currentIndex && q.explanation && (
                  <div className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                    {q.explanation}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() => { setCurrentIndex((p) => p - 1); setShowExplanation(null); }}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {correctCount}/{totalAnswered} corretas
          </span>
          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => { setCurrentIndex((p) => p + 1); setShowExplanation(null); }}>
              Próxima <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={finishExam} className="bg-green-600 hover:bg-green-700">
              <Trophy className="h-4 w-4 mr-2" /> Finalizar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary" />
          Provas Anteriores
        </h1>
        <p className="text-muted-foreground mt-1">
          Resolva questões reais de provas de residência médica filtradas por banca e ano
        </p>
      </div>

      {showResult && questions && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Trophy className="h-12 w-12 mx-auto text-primary" />
              <h2 className="text-xl font-bold">Resultado da Prova</h2>
              <div className="text-3xl font-bold text-primary">
                {correctCount} / {totalAnswered}
              </div>
              <p className="text-muted-foreground">
                Taxa de acerto: {totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%
              </p>
              <Button variant="outline" onClick={() => setShowResult(false)}>
                Voltar aos filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filtrar Provas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Banca</label>
              <Select value={selectedBanca} onValueChange={setSelectedBanca}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as bancas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {BANCAS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Ano</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableYears.map((y) => (
                    <SelectItem key={y!} value={y!}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Especialidade</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {availableTopics.map((t) => (
                    <SelectItem key={t!} value={t!}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {questions ? `${questions.length} questões encontradas` : "Selecione filtros para buscar questões"}
            </p>
            <Button onClick={startExam} disabled={!questions || questions.length === 0 || isLoading}>
              <Clock className="h-4 w-4 mr-2" />
              {isLoading ? "Carregando..." : "Iniciar Prova"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {questions && questions.length > 0 && !examMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Questões Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {questions.slice(0, 20).map((q, i) => (
                  <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{q.statement.slice(0, 120)}...</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{q.topic}</Badge>
                        {q.source && <Badge variant="outline" className="text-xs">{q.source}</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
                {questions.length > 20 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    e mais {questions.length - 20} questões...
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
