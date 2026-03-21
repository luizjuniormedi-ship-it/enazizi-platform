import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Activity, CheckCircle, XCircle, SkipForward, RotateCcw, Trophy, Clock, Filter, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MedicalImage = {
  id: string;
  category: string;
  subcategory: string | null;
  diagnosis: string;
  difficulty: number;
  image_url: string;
  image_source: string | null;
  explanation: string | null;
  options: string[];
  correct_index: number;
  tags: string[] | null;
};

const difficultyLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Fácil", color: "bg-green-500/20 text-green-400" },
  2: { label: "Médio", color: "bg-yellow-500/20 text-yellow-400" },
  3: { label: "Difícil", color: "bg-red-500/20 text-red-400" },
};

const MedicalImageQuiz = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [quizMode, setQuizMode] = useState<"browse" | "quiz">("browse");

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["medical-images", category, difficulty],
    queryFn: async () => {
      let query = supabase.from("medical_images").select("*").eq("is_active", true);
      if (category !== "all") query = query.eq("category", category);
      if (difficulty !== "all") query = query.eq("difficulty", parseInt(difficulty));
      const { data, error } = await query.order("difficulty").order("created_at");
      if (error) throw error;
      return (data || []).map((img: any) => ({
        ...img,
        options: Array.isArray(img.options) ? img.options : JSON.parse(img.options as string),
      })) as MedicalImage[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["image-quiz-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_image_attempts")
        .select("correct, image_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      const total = data?.length || 0;
      const correct = data?.filter((a: any) => a.correct).length || 0;
      const uniqueImages = new Set(data?.map((a: any) => a.image_id)).size;
      return { total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0, uniqueImages };
    },
  });

  const saveAttempt = useMutation({
    mutationFn: async (params: { imageId: string; selectedIndex: number; correct: boolean; timeSeconds: number }) => {
      const { error } = await supabase.from("medical_image_attempts").insert({
        user_id: user!.id,
        image_id: params.imageId,
        selected_index: params.selectedIndex,
        correct: params.correct,
        time_seconds: params.timeSeconds,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["image-quiz-stats"] }),
  });

  const currentImage = images[currentIndex];

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    const correct = index === currentImage.correct_index;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    const timeSeconds = Math.round((Date.now() - startTime) / 1000);
    if (user) {
      saveAttempt.mutate({ imageId: currentImage.id, selectedIndex: index, correct, timeSeconds });
    }
    if (correct) toast.success("Correto! 🎉");
    else toast.error(`Incorreto. Resposta: ${currentImage.options[currentImage.correct_index]}`);
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setStartTime(Date.now());
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore({ correct: 0, total: 0 });
    setStartTime(Date.now());
  };

  const shuffleAndStart = useCallback(() => {
    setQuizMode("quiz");
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore({ correct: 0, total: 0 });
    setStartTime(Date.now());
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-7 w-7 text-primary" />
            Quiz de Imagens Médicas
          </h1>
          <p className="text-muted-foreground">ECG e RX de Tórax com gabarito comentado — interprete e aprenda.</p>
        </div>
        {stats && (
          <div className="flex gap-3">
            <Card className="px-3 py-2 text-center">
              <p className="text-lg font-bold text-primary">{stats.uniqueImages}</p>
              <p className="text-[10px] text-muted-foreground">Imagens feitas</p>
            </Card>
            <Card className="px-3 py-2 text-center">
              <p className="text-lg font-bold text-green-400">{stats.accuracy}%</p>
              <p className="text-[10px] text-muted-foreground">Acertos</p>
            </Card>
            <Card className="px-3 py-2 text-center">
              <p className="text-lg font-bold text-amber-400">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Tentativas</p>
            </Card>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="ecg">❤️ ECG</SelectItem>
            <SelectItem value="rx_torax">🫁 RX de Tórax</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="1">🟢 Fácil</SelectItem>
            <SelectItem value="2">🟡 Médio</SelectItem>
            <SelectItem value="3">🔴 Difícil</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="self-center">
          {images.length} imagens
        </Badge>
        {quizMode === "browse" && images.length > 0 && (
          <Button onClick={shuffleAndStart} className="ml-auto">
            <Activity className="h-4 w-4 mr-2" /> Iniciar Quiz
          </Button>
        )}
      </div>

      {images.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhuma imagem encontrada com esses filtros.</p>
        </Card>
      ) : quizMode === "quiz" && currentImage ? (
        <>
          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">
              {currentIndex + 1}/{images.length}
            </span>
            <Progress value={((currentIndex + 1) / images.length) * 100} className="flex-1" />
            <Badge variant="outline" className="gap-1">
              <Trophy className="h-3 w-3" /> {score.correct}/{score.total}
            </Badge>
          </div>

          {/* Quiz Card */}
          <Card className="overflow-hidden">
            {/* Image */}
            <div className="relative bg-black/90 flex items-center justify-center min-h-[250px] sm:min-h-[350px]">
              <img
                src={currentImage.image_url}
                alt={`${currentImage.category} - Quiz`}
                className="max-w-full max-h-[400px] object-contain"
                loading="eager"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className={difficultyLabels[currentImage.difficulty]?.color || ""}>
                  {difficultyLabels[currentImage.difficulty]?.label}
                </Badge>
                <Badge variant="secondary">
                  {currentImage.category === "ecg" ? "❤️ ECG" : "🫁 RX Tórax"}
                </Badge>
                {currentImage.subcategory && (
                  <Badge variant="outline" className="bg-background/80">{currentImage.subcategory}</Badge>
                )}
              </div>
            </div>

            {/* Question & Options */}
            <div className="p-5 space-y-4">
              <p className="font-semibold text-lg">Qual é o diagnóstico?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentImage.options.map((option, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrect = i === currentImage.correct_index;
                  const showResult = selectedAnswer !== null;

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all font-medium",
                        !showResult && "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                        showResult && isCorrect && "border-green-500 bg-green-500/10 text-green-400",
                        showResult && isSelected && !isCorrect && "border-red-500 bg-red-500/10 text-red-400",
                        showResult && !isSelected && !isCorrect && "opacity-50",
                        !showResult && "border-border"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
                        {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                        <span className="text-muted-foreground mr-1">{String.fromCharCode(65 + i)}.</span>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && currentImage.explanation && (
                <Card className="p-4 bg-primary/5 border-primary/20 animate-fade-in">
                  <p className="text-sm font-semibold text-primary mb-2">💡 Explicação</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentImage.explanation}</p>
                  {currentImage.image_source && (
                    <p className="text-xs text-muted-foreground/60 mt-2">Fonte: {currentImage.image_source}</p>
                  )}
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handleRestart} size="sm">
                  <RotateCcw className="h-4 w-4 mr-1" /> Recomeçar
                </Button>
                {selectedAnswer !== null && currentIndex < images.length - 1 && (
                  <Button onClick={handleNext}>
                    Próxima <SkipForward className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {selectedAnswer !== null && currentIndex === images.length - 1 && (
                  <Card className="p-3 bg-primary/10 border-primary/20">
                    <p className="font-semibold">
                      🏆 Resultado: {score.correct}/{score.total} ({Math.round((score.correct / score.total) * 100)}%)
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </Card>
        </>
      ) : (
        /* Browse Mode - Grid of images */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <Card
              key={img.id}
              className="overflow-hidden cursor-pointer hover:border-primary/30 transition-all group"
              onClick={() => {
                setCurrentIndex(i);
                setQuizMode("quiz");
                setSelectedAnswer(null);
                setShowExplanation(false);
                setStartTime(Date.now());
              }}
            >
              <div className="relative bg-black/80 h-40 flex items-center justify-center">
                <img src={img.image_url} alt="Quiz" className="max-h-full max-w-full object-contain" loading="lazy" />
                <Badge className={cn("absolute top-2 left-2", difficultyLabels[img.difficulty]?.color)}>
                  {difficultyLabels[img.difficulty]?.label}
                </Badge>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {img.category === "ecg" ? "ECG" : "RX"}
                  </Badge>
                  {img.subcategory && (
                    <span className="text-[10px] text-muted-foreground">{img.subcategory}</span>
                  )}
                </div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  Toque para responder
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalImageQuiz;
