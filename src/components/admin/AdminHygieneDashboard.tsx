import { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HygieneStats {
  totalActive: number;
  totalBlocked: number;
  totalSafe: number;
  downgraded: number;
  byReason: { reason: string; count: number }[];
  blockedAssets: { id: string; image_type: string; diagnosis: string; review_status: string; validation_level: string; clinical_confidence: number; asset_origin: string }[];
}

const REASON_LABELS: Record<string, string> = {
  "url_suspeita": "URL suspeita ou não clínica",
  "origem_invalida": "Origem inválida",
  "confianca_baixa": "Confiança clínica baixa",
  "blocked_clinical": "Bloqueio clínico",
};

const AdminHygieneDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<HygieneStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filterValidation, setFilterValidation] = useState("all");
  const [filterOrigin, setFilterOrigin] = useState("all");

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch blocked assets
      const { data: blocked, error: e1 } = await supabase
        .from("medical_image_assets")
        .select("id, image_type, diagnosis, review_status, validation_level, clinical_confidence, asset_origin, multimodal_ready")
        .eq("review_status", "blocked_clinical")
        .order("updated_at", { ascending: false })
        .limit(200);

      // Fetch active safe count
      const { count: activeCount } = await supabase
        .from("medical_image_assets")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .neq("review_status", "blocked_clinical");

      // Fetch total active
      const { count: totalActive } = await supabase
        .from("medical_image_assets")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch downgraded questions
      const { count: downgraded } = await supabase
        .from("medical_image_questions")
        .select("id", { count: "exact", head: true })
        .eq("status", "needs_review");

      // Classify block reasons
      const byReason: Record<string, number> = {};
      for (const a of blocked || []) {
        let reason = "blocked_clinical";
        if (!["real_medical", "validated_medical"].includes(a.asset_origin || "")) {
          reason = "origem_invalida";
        } else if (a.clinical_confidence != null && a.clinical_confidence < 0.90) {
          reason = "confianca_baixa";
        } else {
          reason = "url_suspeita";
        }
        byReason[reason] = (byReason[reason] || 0) + 1;
      }

      setStats({
        totalActive: totalActive || 0,
        totalBlocked: blocked?.length || 0,
        totalSafe: activeCount || 0,
        downgraded: downgraded || 0,
        byReason: Object.entries(byReason).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
        blockedAssets: (blocked || []) as any,
      });
    } catch (err: any) {
      toast({ title: "Erro ao carregar higiene", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const runHygiene = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("hygiene-block-contaminated-assets");
      if (error) throw error;
      toast({
        title: "Higiene executada",
        description: `${data?.blocked_count || 0} assets bloqueados de ${data?.total_scanned || 0} escaneados`,
      });
      fetchStats();
    } catch (err: any) {
      toast({ title: "Erro na higiene", description: err.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const filteredBlocked = (stats?.blockedAssets || []).filter((a) => {
    if (filterValidation !== "all" && a.validation_level !== filterValidation) return false;
    if (filterOrigin !== "all" && a.asset_origin !== filterOrigin) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Carregando higiene multimodal...</span>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          Higiene Multimodal
        </h2>
        <Button onClick={runHygiene} disabled={running} variant="destructive" size="sm">
          {running ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Executar Higiene
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats?.totalActive || 0}</div>
            <div className="text-xs text-muted-foreground">Total Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats?.totalSafe || 0}</div>
            <div className="text-xs text-muted-foreground">Ativos Seguros</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-destructive">{stats?.totalBlocked || 0}</div>
            <div className="text-xs text-muted-foreground">Bloqueados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats?.downgraded || 0}</div>
            <div className="text-xs text-muted-foreground">Questões Rebaixadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Block reasons */}
      {stats?.byReason && stats.byReason.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Motivos de Bloqueio
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.byReason.map((r) => (
              <Badge key={r.reason} variant="outline" className="text-xs py-1 px-2">
                {REASON_LABELS[r.reason] || r.reason}: <span className="font-bold ml-1">{r.count}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterValidation} onValueChange={setFilterValidation}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Validação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos níveis</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            <SelectItem value="real_medical">Real Medical</SelectItem>
            <SelectItem value="validated_medical">Validated Medical</SelectItem>
            <SelectItem value="educational_ai">Educational AI</SelectItem>
            <SelectItem value="generic_ai">Generic AI</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filteredBlocked.length} bloqueados</span>
      </div>

      {/* Blocked assets table */}
      {filteredBlocked.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Tipo</TableHead>
                <TableHead className="text-xs">Diagnóstico</TableHead>
                <TableHead className="text-xs">Origem</TableHead>
                <TableHead className="text-xs">Validação</TableHead>
                <TableHead className="text-xs">Confiança</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlocked.slice(0, 50).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs font-medium">{a.image_type}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{a.diagnosis || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{a.asset_origin || "?"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{a.validation_level || "?"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {a.clinical_confidence != null ? (a.clinical_confidence * 100).toFixed(0) + "%" : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Nenhum asset bloqueado encontrado com os filtros atuais
        </div>
      )}
    </div>
  );
};

export default AdminHygieneDashboard;
