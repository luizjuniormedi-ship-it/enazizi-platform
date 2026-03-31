import { useState, useEffect } from "react";
import { Database, Globe, FileText, CheckCircle2, AlertTriangle, Loader2, ExternalLink, Upload, Search, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface IndexedSource {
  name: string;
  banca: string;
  year: number;
  pdfUrl: string | null;
  status: "indexed" | "extracted" | "pending";
  questionsCount?: number;
}

const ENARE_SOURCES: IndexedSource[] = [
  { name: "ENARE 2025 - Objetiva R1", banca: "ENARE", year: 2025, pdfUrl: "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2024/12/10112840/ENARE-2025.pdf", status: "indexed" },
  { name: "ENARE 2024 - Objetiva R1", banca: "ENARE", year: 2024, pdfUrl: "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2023/12/22111553/ENARE-2024-Objetiva-R1.pdf", status: "indexed" },
  { name: "ENARE 2023 - Objetiva", banca: "ENARE", year: 2023, pdfUrl: "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2025/05/23105328/ENARE-2023-Objetiva.pdf", status: "indexed" },
  { name: "ENARE 2022 - Objetiva", banca: "ENARE", year: 2022, pdfUrl: "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2025/05/23105750/ENARE-2022-Objetiva.pdf", status: "indexed" },
  { name: "ENARE 2021 - Objetiva", banca: "ENARE", year: 2021, pdfUrl: "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2025/05/23105852/ENARE-2021-Objetiva.pdf", status: "indexed" },
];

const AdminIngestionPanel = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [sources, setSources] = useState(ENARE_SOURCES);
  const [processing, setProcessing] = useState<string | null>(null);
  const [navUrl, setNavUrl] = useState("");
  const [navResults, setNavResults] = useState<any[]>([]);
  const [navLoading, setNavLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [discoveredSources, setDiscoveredSources] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSources: 5, totalExtracted: 0, totalIndexed: 5, duplicatesRemoved: 0 });

  useEffect(() => {
    loadLogs();
    loadSources();
  }, []);

  const loadSources = async () => {
    const { data } = await supabase.from("external_exam_sources" as any)
      .select("*").order("created_at", { ascending: false }).limit(50);
    if (data) {
      setDiscoveredSources(data);
      setStats(prev => ({ ...prev, totalSources: 5 + (data as any[]).length, totalIndexed: 5 + (data as any[]).filter((s: any) => s.processing_status !== "pending").length }));
    }
  };

  const loadLogs = async () => {
    const { data } = await supabase.from("ingestion_log" as any)
      .select("*").order("created_at", { ascending: false }).limit(20);
    if (data) {
      setLogs(data);
      const completed = (data as any[]).filter((l: any) => l.status === "completed");
      setStats(prev => ({
        ...prev,
        totalExtracted: completed.length,
        duplicatesRemoved: completed.reduce((s: number, l: any) => s + (l.duplicates_skipped || 0), 0),
      }));
    }
  };

  const callIngest = async (payload: any) => {
    if (!session) return null;
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-questions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      }
    );
    return resp.json();
  };

  const handleExtractPdf = async (source: IndexedSource) => {
    if (!session || !source.pdfUrl) return;
    setProcessing(source.name);
    try {
      const data = await callIngest({
        mode: "pdf_url",
        url: source.pdfUrl,
        banca: source.banca,
        year: source.year,
        source_type: "indexed_external",
        permission_type: "indexed_external",
      });
      if (data?.error) throw new Error(data.error);
      setSources(prev => prev.map(s => s.name === source.name ? { ...s, status: "extracted" as const, questionsCount: data.questions_inserted } : s));
      toast({ title: `${data.questions_inserted} questões extraídas!`, description: `${source.name} processado.` });
      loadLogs();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleNavigate = async () => {
    if (!navUrl || !session) return;
    setNavLoading(true);
    try {
      // Use search-real-questions hub_page mode
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-real-questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ mode: "hub_page", url: navUrl, user_id: session.user?.id }),
        }
      );
      const data = await resp.json();
      if (data?.error) throw new Error(data.error);
      setNavResults(data.pdf_links || []);
      toast({ title: `${data.sources_found || 0} fontes descobertas, ${(data.pdf_links || []).length} PDFs` });
      loadLogs();
      loadSources();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setNavLoading(false);
    }
  };

  const handleExtractNavPdf = async (link: any) => {
    setProcessing(link.url);
    try {
      const data = await callIngest({
        mode: "pdf_url",
        url: link.url,
        year: link.year,
        source_type: "indexed_external",
        permission_type: "indexed_external",
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: `${data.questions_inserted} questões extraídas de ${link.name}` });
      loadLogs();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="glass-card p-4 sm:p-5 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 flex-shrink-0">
          <Database className="h-5 w-5 text-emerald-500" />
        </div>
        <h2 className="text-sm sm:text-base font-semibold">Pipeline de Ingestão de Questões</h2>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Fontes Indexadas", value: stats.totalIndexed, color: "text-blue-500" },
          { label: "Extraídas", value: stats.totalExtracted, color: "text-emerald-500" },
          { label: "Duplicatas", value: stats.duplicatesRemoved, color: "text-amber-500" },
          { label: "Total Fontes", value: stats.totalSources, color: "text-purple-500" },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded-lg bg-muted/50">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="sources">
        <TabsList className="mb-3 flex-wrap h-auto">
          <TabsTrigger value="sources" className="text-xs"><Globe className="h-3 w-3 mr-1" />Fontes</TabsTrigger>
          <TabsTrigger value="discovered" className="text-xs"><Link2 className="h-3 w-3 mr-1" />Descobertas</TabsTrigger>
          <TabsTrigger value="navigate" className="text-xs"><Search className="h-3 w-3 mr-1" />Navegação</TabsTrigger>
          <TabsTrigger value="log" className="text-xs"><FileText className="h-3 w-3 mr-1" />Log</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <div className="space-y-2">
            {sources.map(source => (
              <div key={source.name} className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">{source.name}</span>
                    <Badge variant={source.status === "extracted" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                      {source.status === "extracted" ? `${source.questionsCount} q` : source.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{source.banca} • {source.year}</span>
                    {source.pdfUrl && (
                      <a href={source.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5">
                        <ExternalLink className="h-2.5 w-2.5" />PDF
                      </a>
                    )}
                  </div>
                </div>
                <Button size="sm" variant={source.status === "extracted" ? "outline" : "default"}
                  disabled={processing !== null || !source.pdfUrl} onClick={() => handleExtractPdf(source)} className="text-xs h-7 px-2">
                  {processing === source.name ? <Loader2 className="h-3 w-3 animate-spin" /> :
                   source.status === "extracted" ? <CheckCircle2 className="h-3 w-3" /> : "Extrair"}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="navigate">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={navUrl} onChange={e => setNavUrl(e.target.value)}
                placeholder="https://www.medway.com.br/..." className="text-xs h-8" />
              <Button size="sm" className="h-8 text-xs" disabled={navLoading || !navUrl} onClick={handleNavigate}>
                {navLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Search className="h-3 w-3 mr-1" />Buscar</>}
              </Button>
            </div>
            {navResults.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground">{navResults.length} PDFs encontrados</p>
                {navResults.map((link, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs truncate block">{link.name}</span>
                      <span className="text-[10px] text-muted-foreground">{link.year ? `Ano: ${link.year}` : "Ano desconhecido"}</span>
                    </div>
                    <div className="flex gap-1">
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0"><ExternalLink className="h-3 w-3" /></Button>
                      </a>
                      <Button size="sm" className="h-6 text-[10px] px-2" disabled={processing !== null}
                        onClick={() => handleExtractNavPdf(link)}>
                        {processing === link.url ? <Loader2 className="h-3 w-3 animate-spin" /> : "Extrair"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="log">
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum log registrado.</p>
            ) : logs.map((log: any) => (
              <div key={log.id} className="p-2 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate">{log.source_name}</span>
                  <Badge variant={log.status === "completed" ? "default" : "secondary"} className="text-[10px] h-4">
                    {log.status}
                  </Badge>
                </div>
                <div className="flex gap-3 mt-0.5 text-[10px] text-muted-foreground">
                  <span>+{log.questions_inserted} inseridas</span>
                  <span>↑{log.questions_updated} atualizadas</span>
                  <span>={log.duplicates_skipped} duplicatas</span>
                  {log.errors > 0 && <span className="text-red-500">✗{log.errors} erros</span>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminIngestionPanel;
