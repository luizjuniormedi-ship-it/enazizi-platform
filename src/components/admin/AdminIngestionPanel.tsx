import { useState } from "react";
import { Database, Globe, FileText, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [stats, setStats] = useState({ totalSources: 5, totalExtracted: 0, totalIndexed: 5, duplicatesRemoved: 0 });

  const handleExtractPdf = async (source: IndexedSource) => {
    if (!session || !source.pdfUrl) return;
    setProcessing(source.name);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-exam-questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ pdf_url: source.pdfUrl, banca: source.banca, year: source.year, source_tag: `enare_${source.year}` }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro na extração");
      
      setSources(prev => prev.map(s => s.name === source.name ? { ...s, status: "extracted" as const, questionsCount: data.questions_inserted } : s));
      setStats(prev => ({ ...prev, totalExtracted: prev.totalExtracted + 1 }));
      toast({ title: `${data.questions_inserted} questões extraídas!`, description: `${source.name} processado com sucesso.` });
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro desconhecido", variant: "destructive" });
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
        <TabsList className="mb-3">
          <TabsTrigger value="sources" className="text-xs"><Globe className="h-3 w-3 mr-1" />Fontes ENARE</TabsTrigger>
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
                <Button
                  size="sm"
                  variant={source.status === "extracted" ? "outline" : "default"}
                  disabled={processing !== null || !source.pdfUrl}
                  onClick={() => handleExtractPdf(source)}
                  className="text-xs h-7 px-2"
                >
                  {processing === source.name ? <Loader2 className="h-3 w-3 animate-spin" /> : 
                   source.status === "extracted" ? <CheckCircle2 className="h-3 w-3" /> : "Extrair"}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Fonte: Medway (indexação controlada). PDFs públicos do ENARE. Permissão: indexed_external.
          </p>
        </TabsContent>

        <TabsContent value="log">
          <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <p>• 5 edições ENARE indexadas (2021-2025)</p>
            <p>• PDFs públicos disponíveis para extração</p>
            <p>• Deduplicação por hash + primeiros 80 chars</p>
            <p>• Todas questões marcadas com source e permission_type</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminIngestionPanel;
