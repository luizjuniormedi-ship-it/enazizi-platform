import { useState, useEffect } from "react";
import { AlertTriangle, BookOpen, BarChart3, Trash2, RefreshCw, ArrowRight, Brain, HelpCircle, Stethoscope, ListChecks, FlipVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ErrorEntry {
  id: string;
  tema: string;
  subtema: string | null;
  tipo_questao: string;
  conteudo: string | null;
  motivo_erro: string | null;
  categoria_erro: string | null;
  dificuldade: number | null;
  vezes_errado: number;
  created_at: string;
}

interface ThemeStats {
  tema: string;
  total: number;
  subtemas: { subtema: string; count: number }[];
  categorias: { cat: string; count: number }[];
}

const CATEGORIA_LABELS: Record<string, string> = {
  conceito: "Erro de Conceito",
  fisiopatologia: "Erro de Fisiopatologia",
  diagnostico: "Erro de Diagnóstico",
  conduta: "Erro de Conduta",
  interpretacao: "Erro de Interpretação Clínica",
  pegadinha: "Erro de Prova / Pegadinha",
};

const REVIEW_MODES = [
  { id: "revisar", label: "Revisar um tema específico", icon: BookOpen, description: "Explicação técnica + leiga + conduta + active recall", color: "text-primary" },
  { id: "questoes", label: "Questões baseadas nos erros", icon: HelpCircle, description: "Questões objetivas dos temas com mais erros", color: "text-amber-400" },
  { id: "casos", label: "Mini casos clínicos dos erros", icon: Stethoscope, description: "Casos clínicos para treinar raciocínio", color: "text-emerald-400" },
  { id: "completa", label: "Revisão completa dos erros", icon: ListChecks, description: "Revisa todos os temas fracos sequencialmente", color: "text-accent" },
];

const ErrorBank = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTema, setSelectedTema] = useState<string | null>(null);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadErrors();
  }, [user]);

  const loadErrors = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("error_bank")
      .select("*")
      .eq("user_id", user.id)
      .order("vezes_errado", { ascending: false });
    if (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao carregar banco de erros.", variant: "destructive" });
    }
    setErrors((data as ErrorEntry[]) || []);
    setLoading(false);
  };

  const deleteError = async (id: string) => {
    await supabase.from("error_bank").delete().eq("id", id);
    setErrors((prev) => prev.filter((e) => e.id !== id));
    toast({ title: "Removido", description: "Erro removido do banco." });
  };

  const clearAll = async () => {
    if (!user) return;
    await supabase.from("error_bank").delete().eq("user_id", user.id);
    setErrors([]);
    toast({ title: "Banco limpo", description: "Todos os erros foram removidos." });
  };

  // Build error summary for AI context
  const buildErrorContext = (mode: string, tema?: string) => {
    const relevantErrors = tema ? errors.filter((e) => e.tema === tema) : errors;
    const summary = relevantErrors.slice(0, 20).map((e) =>
      `- ${e.tema}${e.subtema ? ` > ${e.subtema}` : ""}: ${e.vezes_errado}x errado${e.categoria_erro ? ` (${CATEGORIA_LABELS[e.categoria_erro] || e.categoria_erro})` : ""}${e.motivo_erro ? ` — ${e.motivo_erro}` : ""}`
    ).join("\n");

    const prompts: Record<string, string> = {
      revisar: tema
        ? `[BANCO DE ERROS - REVISÃO DE TEMA]\n\nO aluno quer revisar o tema "${tema}" onde apresentou os seguintes erros:\n${summary}\n\nInicie a revisão seguindo: 1) Explicação técnica 2) Tradução leiga 3) Aplicação clínica 4) Conduta baseada em protocolos 5) Active recall. Foque nos pontos onde o aluno errou.`
        : `[BANCO DE ERROS - REVISÃO]\n\nMostrar os temas com mais erros e perguntar qual o aluno quer revisar:\n${summary}`,
      questoes: `[BANCO DE ERROS - QUESTÕES BASEADAS NOS ERROS]\n\nGere questões objetivas (A-E) baseadas nos temas onde o aluno mais errou${tema ? ` (foco em ${tema})` : ""}. Apresente UMA questão por vez. Após resposta, explique: alternativa correta, explicação leiga, explicação técnica, motivo do erro/acerto, ponto clássico de prova.\n\nErros do aluno:\n${summary}`,
      casos: `[BANCO DE ERROS - MINI CASOS CLÍNICOS]\n\nGere mini casos clínicos baseados nos temas onde o aluno errou${tema ? ` (foco em ${tema})` : ""}. Estrutura: paciente com sintomas do tema → pergunta (diagnóstico provável ou conduta inicial). Após resposta: explicar raciocínio clínico, conduta correta, revisar conceito do erro.\n\nErros do aluno:\n${summary}`,
      completa: `[BANCO DE ERROS - REVISÃO COMPLETA]\n\nInicie uma revisão completa sequencial dos temas com mais erros. Para cada tema: 1) revisar rapidamente o conteúdo 2) apresentar uma questão 3) corrigir 4) passar para o próximo tema.\n\nErros do aluno (em ordem de prioridade):\n${summary}`,
    };

    return prompts[mode] || prompts.revisar;
  };

  const startReviewMode = (mode: string, tema?: string) => {
    const context = buildErrorContext(mode, tema);
    // Navigate to ChatGPT with the error context as initial message
    navigate("/dashboard/chatgpt", { state: { initialMessage: context, fromErrorBank: true } });
  };

  // Aggregate stats by theme
  const themeStats: ThemeStats[] = (() => {
    const map = new Map<string, { total: number; subtemas: Map<string, number>; categorias: Map<string, number> }>();
    for (const e of errors) {
      if (!map.has(e.tema)) map.set(e.tema, { total: 0, subtemas: new Map(), categorias: new Map() });
      const s = map.get(e.tema)!;
      s.total += e.vezes_errado;
      if (e.subtema) s.subtemas.set(e.subtema, (s.subtemas.get(e.subtema) || 0) + e.vezes_errado);
      if (e.categoria_erro) s.categorias.set(e.categoria_erro, (s.categorias.get(e.categoria_erro) || 0) + e.vezes_errado);
    }
    return Array.from(map.entries())
      .map(([tema, v]) => ({
        tema,
        total: v.total,
        subtemas: Array.from(v.subtemas.entries()).map(([subtema, count]) => ({ subtema, count })).sort((a, b) => b.count - a.count),
        categorias: Array.from(v.categorias.entries()).map(([cat, count]) => ({ cat, count })).sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.total - a.total);
  })();

  const generateFlashcardsFromErrors = async () => {
    if (!user || errors.length === 0) return;
    setGeneratingFlashcards(true);
    try {
      const topErrors = errors.slice(0, 15);
      const errorSummary = topErrors.map(e =>
        `Tema: ${e.tema}${e.subtema ? ` > ${e.subtema}` : ""}${e.motivo_erro ? ` | Motivo: ${e.motivo_erro}` : ""}${e.conteudo ? ` | Conteúdo: ${e.conteudo.slice(0, 100)}` : ""}`
      ).join("\n");

      const response = await supabase.functions.invoke("generate-flashcards", {
        body: {
          topic: "Revisão dos Erros Mais Frequentes",
          content: `Gere flashcards de revisão para os seguintes temas onde o aluno errou:\n${errorSummary}\n\nCrie flashcards focados nos conceitos-chave que o aluno precisa revisar para não errar novamente.`,
          count: Math.min(topErrors.length, 10),
        },
      });

      if (response.error) throw response.error;
      const flashcards = response.data?.flashcards || response.data || [];
      if (Array.isArray(flashcards) && flashcards.length > 0) {
        const inserts = flashcards.map((fc: any) => ({
          user_id: user.id,
          question: fc.question || fc.front || fc.pergunta,
          answer: fc.answer || fc.back || fc.resposta,
          topic: fc.topic || "Banco de Erros",
        })).filter((fc: any) => fc.question && fc.answer);

        if (inserts.length > 0) {
          await supabase.from("flashcards").insert(inserts);
          toast({ title: "Flashcards gerados!", description: `${inserts.length} flashcards criados a partir dos seus erros.` });
        }
      } else {
        toast({ title: "Nenhum flashcard gerado", description: "Tente novamente.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar flashcards", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const filteredErrors = selectedTema ? errors.filter((e) => e.tema === selectedTema) : errors;
  const totalErrors = errors.reduce((s, e) => s + e.vezes_errado, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Banco de Erros
          </h1>
          <p className="text-muted-foreground text-sm">Revisão ativa e personalizada dos seus pontos fracos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadErrors} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          {errors.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearAll} className="gap-1.5">
              <Trash2 className="h-4 w-4" /> Limpar tudo
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Erros</p>
              <p className="text-lg font-bold">{totalErrors}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Temas com Erros</p>
              <p className="text-lg font-bold">{themeStats.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Questões Distintas</p>
              <p className="text-lg font-bold">{errors.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tema Mais Fraco</p>
              <p className="text-sm font-bold truncate">{themeStats[0]?.tema || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Mode Selection */}
      {errors.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              O que deseja fazer com seus erros?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REVIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => startReviewMode(mode.id, selectedTema || undefined)}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-secondary/50 transition-all text-left group"
                >
                  <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors`}>
                    <mode.icon className={`h-4.5 w-4.5 ${mode.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{mode.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
                    {selectedTema && (
                      <p className="text-[10px] text-primary mt-1">Foco: {selectedTema}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : errors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum erro registrado</h3>
            <p className="text-sm text-muted-foreground">
              Seus erros serão registrados automaticamente durante as sessões de estudo com o Tutor IA.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Theme List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Temas com mais erros</h2>
            <button
              onClick={() => setSelectedTema(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !selectedTema ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary"
              }`}
            >
              Todos os temas ({totalErrors} erros)
            </button>
            {themeStats.map((s) => (
              <button
                key={s.tema}
                onClick={() => setSelectedTema(s.tema)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedTema === s.tema ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{s.tema}</span>
                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{s.total}x</span>
                </div>
                {s.subtemas.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.subtemas.slice(0, 3).map((sub) => (
                      <span key={sub.subtema} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {sub.subtema} ({sub.count})
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}

            {/* Quick review buttons per theme */}
            {selectedTema && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">📌 Ações para {selectedTema}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs" onClick={() => startReviewMode("revisar", selectedTema)}>
                    Revisar conceitos <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs" onClick={() => startReviewMode("questoes", selectedTema)}>
                    Fazer questões <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs" onClick={() => startReviewMode("casos", selectedTema)}>
                    Casos clínicos <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Error Details */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {selectedTema ? `Erros em ${selectedTema}` : "Todos os erros"} ({filteredErrors.length})
            </h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {filteredErrors.map((e) => (
                <Card
                  key={e.id}
                  className="group cursor-pointer hover:border-primary/40 hover:bg-secondary/30 transition-all"
                  onClick={() => {
                    const prompt = `[BANCO DE ERROS - REVISÃO DIRECIONADA]\n\nO aluno errou ${e.vezes_errado}x no tema "${e.tema}"${e.subtema ? ` (subtema: ${e.subtema})` : ""}.${e.conteudo ? `\n\nConteúdo da questão: ${e.conteudo}` : ""}${e.motivo_erro ? `\nMotivo do erro: ${e.motivo_erro}` : ""}${e.categoria_erro ? `\nCategoria: ${CATEGORIA_LABELS[e.categoria_erro] || e.categoria_erro}` : ""}\n\nFaça uma revisão completa deste ponto: 1) Explicação técnica 2) Tradução leiga 3) Aplicação clínica 4) Conduta correta baseada em protocolos 5) Pergunta de active recall para fixação.`;
                    navigate("/dashboard/chatgpt", { state: { initialMessage: prompt, fromErrorBank: true } });
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                            {e.tema}
                          </span>
                          {e.subtema && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{e.subtema}</span>
                          )}
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{e.tipo_questao}</span>
                          {e.categoria_erro && (
                            <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                              {CATEGORIA_LABELS[e.categoria_erro] || e.categoria_erro}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {e.vezes_errado}x errado
                          </span>
                        </div>
                        {e.conteudo && (
                          <p className="text-sm text-foreground line-clamp-2">{e.conteudo}</p>
                        )}
                        {e.motivo_erro && (
                          <p className="text-xs text-muted-foreground mt-1">💡 {e.motivo_erro}</p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(e.created_at).toLocaleDateString("pt-BR")}
                          </p>
                          <span className="text-[10px] text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Revisar com Tutor IA <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(ev) => { ev.stopPropagation(); deleteError(e.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorBank;
