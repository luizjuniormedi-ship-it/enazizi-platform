import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Eye, ChevronLeft, ChevronRight, Loader2, Filter, Image, Trash2, ZoomIn, Search, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageReviewQuestion {
  id: string;
  question_code: string;
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string | null;
  correct_index: number;
  explanation: string;
  rationale_map: Record<string, string>;
  difficulty: string;
  exam_style: string;
  status: string;
  created_at: string;
  updated_at: string;
  asset_id: string;
  image_type?: string;
  diagnosis?: string;
  image_url?: string;
  specialty?: string;
  asset_origin?: string;
  source_domain?: string;
  editorial_grade?: string;
  senior_audit_score?: number;
}

const EDITORIAL_COLORS: Record<string, string> = {
  excellent: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  good: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  weak: "bg-red-500/10 text-red-700 border-red-500/30",
};

const REVIEW_QUEUE_STATUSES = ["draft", "needs_review", "upgraded", "upgrading"];

const STATUS_COLORS: Record<string, string> = {
  queue: "bg-primary/10 text-primary border-primary/30",
  published: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  draft: "bg-muted text-muted-foreground",
  needs_review: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  rejected: "bg-red-500/10 text-red-700 border-red-500/30",
  upgraded: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  upgrading: "bg-primary/10 text-primary border-primary/30",
};

const STATUS_LABELS: Record<string, string> = {
  queue: "Fila ativa",
  published: "Publicada",
  draft: "Rascunho",
  needs_review: "Revisão",
  rejected: "Rejeitada",
  upgraded: "Atualizada",
  validated: "Validada",
  archived: "Arquivada",
  upgrading: "Processando",
};

const DIFF_COLORS: Record<string, string> = {
  easy: "bg-green-500/10 text-green-700",
  medium: "bg-yellow-500/10 text-yellow-700",
  hard: "bg-red-500/10 text-red-700",
};

const MODALITY_COLORS: Record<string, string> = {
  ecg: "bg-blue-500/10 text-blue-700",
  xray: "bg-cyan-500/10 text-cyan-700",
  dermatology: "bg-pink-500/10 text-pink-700",
  ct: "bg-purple-500/10 text-purple-700",
  us: "bg-indigo-500/10 text-indigo-700",
  pathology: "bg-orange-500/10 text-orange-700",
  ophthalmology: "bg-teal-500/10 text-teal-700",
};

const AdminImageQuestionReviewPanel = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<ImageReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("queue");
  const [modalityFilter, setModalityFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [searchingReal, setSearchingReal] = useState<string | null>(null);
  const [editorialFilter, setEditorialFilter] = useState("all");
  const [editorialCounts, setEditorialCounts] = useState<Record<string, number>>({});
  const PAGE_SIZE = 15;

  const fetchCounts = async () => {
    const statuses = ["published", "draft", "needs_review", "rejected", "upgraded", "upgrading"];
    const results: Record<string, number> = {};

    const countResults = await Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from("medical_image_questions")
          .select("id", { count: "exact", head: true })
          .eq("status", status as any);

        return { status, count: count || 0 };
      })
    );

    let queueCount = 0;
    countResults.forEach(({ status, count }) => {
      if (count > 0) {
        results[status] = count;
      }
      if (REVIEW_QUEUE_STATUSES.includes(status)) {
        queueCount += count;
      }
    });

    setCounts({ queue: queueCount, ...results });

    // Fetch editorial grade counts
    const editorialGrades = ["excellent", "good", "weak"];
    const editorialResults = await Promise.all(
      editorialGrades.map(async (grade) => {
        const { count } = await supabase
          .from("medical_image_questions")
          .select("id", { count: "exact", head: true })
          .eq("status", "published" as any)
          .eq("editorial_grade", grade as any);
        return { grade, count: count || 0 };
      })
    );
    const eCounts: Record<string, number> = {};
    editorialResults.forEach(({ grade, count }) => { if (count > 0) eCounts[grade] = count; });

    // Count multimodal vs text_only
    const { count: multimodalCount } = await supabase
      .from("medical_image_questions")
      .select("id", { count: "exact", head: true })
      .eq("status", "published" as any)
      .not("senior_audit_score", "is", null);
    eCounts["multimodal"] = multimodalCount || 0;

    setEditorialCounts(eCounts);
  };

  const fetchQuestions = async () => {
    setLoading(true);

    let query = supabase
      .from("medical_image_questions")
      .select(`
        id, question_code, statement, option_a, option_b, option_c, option_d, option_e,
        correct_index, explanation, rationale_map, difficulty, exam_style, status, created_at, updated_at, asset_id,
        senior_audit_score, editorial_grade,
        medical_image_assets!inner(image_type, diagnosis, image_url, specialty, asset_origin, source_domain)
      `, { count: "exact" })
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter === "queue") {
      query = query.in("status", REVIEW_QUEUE_STATUSES as any);
    } else if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as any);
    }

    if (difficultyFilter !== "all") {
      query = query.eq("difficulty", difficultyFilter as any);
    }

    if (modalityFilter !== "all") {
      query = query.eq("medical_image_assets.image_type", modalityFilter as any);
    }

    if (editorialFilter !== "all") {
      query = query.eq("editorial_grade", editorialFilter as any);
    }

    const { data, count, error } = await query;
    if (!error && data) {
      setQuestions(data.map((q: any) => ({
        id: q.id,
        question_code: q.question_code,
        statement: q.statement,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        option_e: q.option_e,
        correct_index: q.correct_index,
        explanation: q.explanation,
        rationale_map: q.rationale_map || {},
        difficulty: q.difficulty,
        exam_style: q.exam_style,
        status: q.status,
        created_at: q.created_at,
        updated_at: q.updated_at,
        asset_id: q.asset_id,
        image_type: q.medical_image_assets?.image_type,
        diagnosis: q.medical_image_assets?.diagnosis,
        image_url: q.medical_image_assets?.image_url,
        specialty: q.medical_image_assets?.specialty,
        asset_origin: q.medical_image_assets?.asset_origin,
        source_domain: q.medical_image_assets?.source_domain,
        editorial_grade: q.editorial_grade,
        senior_audit_score: q.senior_audit_score,
      })));
      setTotal(count || 0);
    } else if (error) {
      console.error("Fetch error:", error);
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); fetchCounts(); }, [page, statusFilter, modalityFilter, difficultyFilter, editorialFilter]);

  useEffect(() => {
    const handlePipelineUpdated = () => {
      setPage(0);
      fetchQuestions();
      fetchCounts();
    };

    window.addEventListener("image-pipeline-updated", handlePipelineUpdated);
    return () => window.removeEventListener("image-pipeline-updated", handlePipelineUpdated);
  }, [page, statusFilter, modalityFilter, difficultyFilter]);

  const handleAction = async (id: string, action: "published" | "rejected") => {
    setActionLoading(id);
    const { error } = await supabase
      .from("medical_image_questions")
      .update({ status: action } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: action === "published" ? "✅ Aprovada e publicada" : "❌ Rejeitada" });
      setPage(0);
      await Promise.all([fetchQuestions(), fetchCounts()]);
    }

    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase
      .from("medical_image_questions")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🗑️ Questão excluída permanentemente" });
      setQuestions(prev => prev.filter(q => q.id !== id));
      setTotal(prev => prev - 1);
      fetchCounts();
    }
    setActionLoading(null);
    setDeleteConfirm(null);
  };

  const handleBulkAction = async (action: "published" | "rejected") => {
    setActionLoading("bulk");
    try {
      let query = supabase
        .from("medical_image_questions")
        .update({ status: action } as any)
        .neq("status", action as any);

      if (statusFilter === "queue") {
        query = query.in("status", REVIEW_QUEUE_STATUSES as any);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      if (difficultyFilter !== "all") {
        query = query.eq("difficulty", difficultyFilter as any);
      }

      if (modalityFilter !== "all") {
        const { data: assetIds, error: assetsError } = await supabase
          .from("medical_image_assets")
          .select("id")
          .eq("image_type", modalityFilter as any);

        if (assetsError) throw assetsError;

        const ids = (assetIds || []).map((a) => a.id);
        if (ids.length === 0) {
          toast({ title: "Nenhuma questão encontrada para esse filtro" });
          setActionLoading(null);
          return;
        }

        query = query.in("asset_id", ids);
      }

      const { error } = await query;
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: `Todas as questões ${action === "published" ? "aprovadas" : "rejeitadas"}` });
        setPage(0);
        await Promise.all([fetchQuestions(), fetchCounts()]);
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const getOptions = (q: ImageReviewQuestion) => {
    const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
    if (q.option_e) opts.push(q.option_e);
    return opts;
  };

  const handleSearchReal = async (q: ImageReviewQuestion) => {
    if (!q.image_type || !q.diagnosis) {
      toast({ title: "Erro", description: "Asset sem tipo ou diagnóstico", variant: "destructive" });
      return;
    }
    setSearchingReal(q.id);
    try {
      const { data, error } = await supabase.functions.invoke("search-real-medical-images", {
        body: { asset_id: q.asset_id, image_type: q.image_type, diagnosis: q.diagnosis },
      });
      if (error) throw new Error(error.message);
      if (data?.status === "found") {
        toast({ title: "🟢 Imagem real encontrada!", description: `Fonte: ${data.source_domain}` });
        fetchQuestions();
        fetchCounts();
      } else {
        toast({ title: "Nenhuma imagem real encontrada", description: "Mantendo imagem IA atual", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro na busca", description: err.message, variant: "destructive" });
    }
    setSearchingReal(null);
  };

  return (
    <div className="glass-card p-4 sm:p-5 border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
            <Image className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold">Revisão de Questões com Imagem</h2>
          <Badge variant="secondary" className="text-xs">{total}</Badge>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(counts).map(([status, count]) => (
          <Badge
            key={status}
            variant="outline"
            className={`text-[10px] cursor-pointer ${statusFilter === status ? 'ring-1 ring-primary' : ''} ${STATUS_COLORS[status] || ''}`}
            onClick={() => { setStatusFilter(statusFilter === status ? "all" : status); setPage(0); }}
          >
            {STATUS_LABELS[status] || status}: {count}
          </Badge>
        ))}
      </div>

      {/* Editorial quality summary */}
      {Object.keys(editorialCounts).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] text-muted-foreground font-medium mr-1">Editorial:</span>
          {editorialCounts.excellent && (
            <Badge variant="outline" className={`text-[10px] cursor-pointer ${editorialFilter === 'excellent' ? 'ring-1 ring-primary' : ''} ${EDITORIAL_COLORS.excellent}`}
              onClick={() => { setEditorialFilter(editorialFilter === 'excellent' ? 'all' : 'excellent'); setPage(0); }}>
              ⭐ Excellent: {editorialCounts.excellent}
            </Badge>
          )}
          {editorialCounts.good && (
            <Badge variant="outline" className={`text-[10px] cursor-pointer ${editorialFilter === 'good' ? 'ring-1 ring-primary' : ''} ${EDITORIAL_COLORS.good}`}
              onClick={() => { setEditorialFilter(editorialFilter === 'good' ? 'all' : 'good'); setPage(0); }}>
              ✅ Good: {editorialCounts.good}
            </Badge>
          )}
          {editorialCounts.weak && (
            <Badge variant="outline" className={`text-[10px] cursor-pointer ${editorialFilter === 'weak' ? 'ring-1 ring-primary' : ''} ${EDITORIAL_COLORS.weak}`}
              onClick={() => { setEditorialFilter(editorialFilter === 'weak' ? 'all' : 'weak'); setPage(0); }}>
              ❌ Weak: {editorialCounts.weak}
            </Badge>
          )}
          {editorialCounts.multimodal && (
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
              🖼️ Multimodal: {editorialCounts.multimodal}
            </Badge>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="h-7 text-xs w-28">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="needs_review">Revisão</SelectItem>
            <SelectItem value="published">Publicadas</SelectItem>
            <SelectItem value="rejected">Rejeitadas</SelectItem>
            <SelectItem value="upgraded">Atualizadas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={modalityFilter} onValueChange={v => { setModalityFilter(v); setPage(0); }}>
          <SelectTrigger className="h-7 text-xs w-32">
            <SelectValue placeholder="Modalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas modalidades</SelectItem>
            <SelectItem value="ecg">ECG</SelectItem>
            <SelectItem value="xray">RX</SelectItem>
            <SelectItem value="dermatology">Dermatologia</SelectItem>
            <SelectItem value="ct">TC</SelectItem>
            <SelectItem value="us">US</SelectItem>
            <SelectItem value="pathology">Patologia</SelectItem>
            <SelectItem value="ophthalmology">Oftalmologia</SelectItem>
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={v => { setDifficultyFilter(v); setPage(0); }}>
          <SelectTrigger className="h-7 text-xs w-28">
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="easy">Fácil</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="hard">Difícil</SelectItem>
          </SelectContent>
        </Select>

        <Select value={editorialFilter} onValueChange={v => { setEditorialFilter(v); setPage(0); }}>
          <SelectTrigger className="h-7 text-xs w-28">
            <SelectValue placeholder="Editorial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos grades</SelectItem>
            <SelectItem value="excellent">⭐ Excellent</SelectItem>
            <SelectItem value="good">✅ Good</SelectItem>
            <SelectItem value="weak">❌ Weak</SelectItem>
          </SelectContent>
        </Select>

        {statusFilter !== "published" && questions.length > 0 && (
          <>
            <Button size="sm" variant="outline" className="text-xs h-7 text-emerald-600 border-emerald-500/30"
              disabled={actionLoading === "bulk"} onClick={() => handleBulkAction("published")}>
              {actionLoading === "bulk" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
              Aprovar Todas
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-500/30"
              disabled={actionLoading === "bulk"} onClick={() => handleBulkAction("rejected")}>
              <XCircle className="h-3 w-3 mr-1" />
              Rejeitar Todas
            </Button>
          </>
        )}
      </div>

      {/* Question list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : questions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhuma questão encontrada com os filtros selecionados.</p>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className="p-2.5 rounded-lg bg-background/50 border border-border/50 hover:border-border transition-colors">
              <div className="flex items-start justify-between gap-2">
                {/* Thumbnail */}
                {q.image_url && (
                  <div
                    className="w-12 h-12 rounded overflow-hidden flex-shrink-0 cursor-pointer border border-border/50 bg-muted"
                    onClick={() => setImagePreview(q.image_url || null)}
                  >
                    <img
                      src={q.image_url}
                      alt={q.diagnosis || ""}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                  <p className="text-xs font-medium line-clamp-2">{q.statement.slice(0, 200)}...</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {q.image_type && (
                      <Badge variant="outline" className={`text-[10px] h-4 ${MODALITY_COLORS[q.image_type] || ''}`}>
                        {q.image_type.toUpperCase()}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-[10px] h-4 ${DIFF_COLORS[q.difficulty] || ''}`}>
                      {q.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4">{q.exam_style}</Badge>
                    <Badge variant="outline" className={`text-[10px] h-4 ${STATUS_COLORS[q.status] || ''}`}>
                      {STATUS_LABELS[q.status] || q.status}
                    </Badge>
                    {q.editorial_grade && (
                      <Badge variant="outline" className={`text-[10px] h-4 ${EDITORIAL_COLORS[q.editorial_grade] || ''}`}>
                        {q.editorial_grade === 'excellent' ? '⭐' : q.editorial_grade === 'good' ? '✅' : '❌'} {q.editorial_grade}
                      </Badge>
                    )}
                    {q.senior_audit_score != null && (
                      <span className="text-[10px] text-muted-foreground">Score: {q.senior_audit_score}</span>
                    )}
                    {q.diagnosis && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{q.diagnosis}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{q.statement.length}c</span>
                    {/* Origin badge */}
                    {q.asset_origin === "real_clinical" ? (
                      <Badge variant="outline" className="text-[10px] h-4 bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                        <Globe className="h-2.5 w-2.5 mr-0.5" />Real
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-4 bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                        IA
                      </Badge>
                    )}
                    {q.source_domain && (
                      <span className="text-[10px] text-muted-foreground">{q.source_domain}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  {/* Search real image button */}
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                    disabled={!!actionLoading || searchingReal === q.id}
                    onClick={() => handleSearchReal(q)}
                    title="Buscar imagem real">
                    {searchingReal === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  </Button>
                  {q.status !== "published" && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                      disabled={!!actionLoading} onClick={() => handleAction(q.id, "published")}
                      title="Aprovar e publicar">
                      {actionLoading === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  {q.status !== "rejected" && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                      disabled={!!actionLoading} onClick={() => handleAction(q.id, "rejected")}
                      title="Rejeitar">
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    disabled={!!actionLoading} onClick={() => setDeleteConfirm(q.id)}
                    title="Excluir permanentemente">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Expanded view */}
              {expanded === q.id && (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                  {/* Image */}
                  {q.image_url && (
                    <div className="flex justify-center">
                      <div
                        className="relative max-w-xs rounded-lg overflow-hidden border border-border cursor-pointer group"
                        onClick={() => setImagePreview(q.image_url || null)}
                      >
                        <img src={q.image_url} alt={q.diagnosis || ""} className="max-h-48 object-contain" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full statement */}
                  <div className="bg-muted/30 rounded p-2">
                    <p className="text-xs font-medium mb-1 text-muted-foreground">Enunciado ({q.statement.length} caracteres)</p>
                    <p className="text-xs leading-relaxed">{q.statement}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-1">
                    {getOptions(q).map((opt, i) => (
                      <div key={i} className={`text-xs px-2 py-1.5 rounded ${i === q.correct_index
                        ? "bg-emerald-500/10 text-emerald-700 font-medium border border-emerald-500/30"
                        : "text-muted-foreground bg-muted/20"
                      }`}>
                        <span className="font-semibold">{String.fromCharCode(65 + i)})</span> {opt}
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div className="bg-blue-500/5 rounded p-2">
                    <p className="text-xs font-medium mb-1 text-blue-600">Explicação ({q.explanation.length} caracteres)</p>
                    <p className="text-xs leading-relaxed">{q.explanation}</p>
                  </div>

                  {/* Rationale map */}
                  {q.rationale_map && Object.keys(q.rationale_map).length > 0 && (
                    <div className="bg-muted/20 rounded p-2">
                      <p className="text-xs font-medium mb-1 text-muted-foreground">Rationale Map</p>
                      <div className="space-y-0.5">
                        {Object.entries(q.rationale_map).map(([key, val]) => (
                          <p key={key} className="text-[10px] text-muted-foreground">
                            <span className="font-semibold">{key}:</span> {val}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span>ID: {q.id.slice(0, 8)}</span>
                    <span>Code: {q.question_code}</span>
                    <span>Criada: {new Date(q.created_at).toLocaleDateString("pt-BR")}</span>
                    {q.specialty && <span>Esp: {q.specialty}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-3 w-3 mr-1" />Anterior
            </Button>
            <span className="text-[10px] text-muted-foreground">
              {total > 0 ? `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, total)} de ${total}` : "0 questões"}
            </span>
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>
              Próxima<ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Image preview dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Imagem do Asset</DialogTitle>
            <DialogDescription>Visualização ampliada da imagem médica</DialogDescription>
          </DialogHeader>
          {imagePreview && (
            <div className="flex justify-center">
              <img src={imagePreview} alt="Preview" className="max-h-[70vh] object-contain rounded" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir questão permanentemente?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A questão será removida definitivamente do banco.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={!!actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminImageQuestionReviewPanel;
