import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Eye, ChevronLeft, ChevronRight, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReviewQuestion {
  id: string;
  statement: string;
  options: string[];
  correct_index: number;
  topic: string;
  source: string;
  review_status: string;
  source_type: string;
  permission_type: string;
  created_at: string;
}

const AdminQuestionReviewPanel = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const fetchQuestions = async () => {
    setLoading(true);
    let query = supabase.from("questions_bank")
      .select("id, statement, options, correct_index, topic, source, review_status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter !== "all") {
      query = query.eq("review_status", statusFilter);
    }

    const { data, count, error } = await query;
    if (!error && data) {
      setQuestions(data.map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
        source_type: (q as any).source_type || "unknown",
        permission_type: (q as any).permission_type || "unknown",
      })));
      setTotal(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [page, statusFilter]);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setActionLoading(id);
    const { error } = await supabase.from("questions_bank")
      .update({ review_status: action })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: action === "approved" ? "Aprovada" : "Rejeitada" });
      setQuestions(prev => prev.filter(q => q.id !== id));
      setTotal(prev => prev - 1);
    }
    setActionLoading(null);
  };

  const handleBulkApprove = async () => {
    setActionLoading("bulk");
    const ids = questions.map(q => q.id);
    const { error } = await supabase.from("questions_bank")
      .update({ review_status: "approved" })
      .in("id", ids);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${ids.length} questões aprovadas` });
      fetchQuestions();
    }
    setActionLoading(null);
  };

  return (
    <div className="glass-card p-4 sm:p-5 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 flex-shrink-0">
            <Eye className="h-5 w-5 text-amber-500" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold">Revisão de Questões</h2>
          <Badge variant="secondary" className="text-xs">{total}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="h-7 text-xs w-28">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="approved">Aprovadas</SelectItem>
              <SelectItem value="rejected">Rejeitadas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
          {statusFilter === "pending" && questions.length > 0 && (
            <Button size="sm" variant="outline" className="text-xs h-7"
              disabled={actionLoading === "bulk"} onClick={handleBulkApprove}>
              {actionLoading === "bulk" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aprovar Todas"}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : questions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhuma questão {statusFilter === "pending" ? "pendente" : ""} encontrada.</p>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className="p-2.5 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                  <p className="text-xs font-medium line-clamp-2">{q.statement.slice(0, 200)}...</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] h-4">{q.topic || "—"}</Badge>
                    {(q as any).subtopic && <Badge variant="outline" className="text-[10px] h-4 border-primary/30 text-primary">{(q as any).subtopic}</Badge>}
                    <Badge variant="outline" className="text-[10px] h-4">{q.source || "—"}</Badge>
                    <span className="text-[10px] text-muted-foreground">{q.options.length} alt</span>
                  </div>
                </div>
                {statusFilter === "pending" && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-600"
                      disabled={!!actionLoading} onClick={() => handleAction(q.id, "approved")}>
                      {actionLoading === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      disabled={!!actionLoading} onClick={() => handleAction(q.id, "rejected")}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              {expanded === q.id && (
                <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                  {q.options.map((opt, i) => (
                    <div key={i} className={`text-xs px-2 py-1 rounded ${i === q.correct_index ? "bg-emerald-500/10 text-emerald-700 font-medium" : "text-muted-foreground"}`}>
                      {String.fromCharCode(65 + i)}) {typeof opt === "string" ? opt : JSON.stringify(opt)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-3 w-3 mr-1" />Anterior
            </Button>
            <span className="text-[10px] text-muted-foreground">{page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} de {total}</span>
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>
              Próxima<ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestionReviewPanel;
