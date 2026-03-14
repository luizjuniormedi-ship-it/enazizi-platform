import { useState, useEffect } from "react";
import { AlertTriangle, BookOpen, BarChart3, Trash2, RefreshCw, ArrowRight } from "lucide-react";
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

const ErrorBank = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTema, setSelectedTema] = useState<string | null>(null);

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

  const filteredErrors = selectedTema ? errors.filter((e) => e.tema === selectedTema) : errors;
  const totalErrors = errors.reduce((s, e) => s + e.vezes_errado, 0);

  const handleReviewTopic = (tema: string) => {
    navigate(`/dashboard/chatgpt`);
    // The user can type "revisar erros de {tema}" in the chat
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Banco de Erros
          </h1>
          <p className="text-muted-foreground text-sm">Memória pedagógica — Revisão ativa dos seus pontos fracos</p>
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
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tema Mais Fraco</p>
              <p className="text-sm font-bold truncate">{themeStats[0]?.tema || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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

            {/* Review suggestions */}
            {themeStats.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">📌 Revisão Prioritária</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {themeStats.slice(0, 3).map((s) => (
                    <Button
                      key={s.tema}
                      variant="outline"
                      size="sm"
                      className="w-full justify-between text-xs"
                      onClick={() => handleReviewTopic(s.tema)}
                    >
                      Revisar {s.tema}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  ))}
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
                <Card key={e.id} className="group">
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
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(e.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteError(e.id)}
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
