import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Download, Loader2, Search, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import { exportToPdf } from "@/lib/exportPdf";
import ReactMarkdown from "react-markdown";

const SPECIALTIES = [
  "Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia", "Gastroenterologia",
  "Pediatria", "Ginecologia e Obstetrícia", "Cirurgia Geral", "Medicina Preventiva",
  "Nefrologia", "Infectologia", "Hematologia", "Reumatologia", "Dermatologia",
  "Ortopedia", "Urologia", "Psiquiatria", "Emergência", "Farmacologia",
  "Semiologia", "Anatomia",
];

const DEPTH_OPTIONS = [
  { value: "resumo", label: "📝 Resumo Rápido", desc: "2-3 páginas, pontos-chave" },
  { value: "completo", label: "📚 Apostila Completa", desc: "5-8 páginas, conteúdo extenso" },
  { value: "revisao", label: "⚡ Revisão de Véspera", desc: "1-2 páginas, pergunta-resposta" },
];

export default function StudyGuides() {
  const { user } = useAuth();
  const [specialty, setSpecialty] = useState("");
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState("completo");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: savedSummaries, isLoading: loadingSummaries } = useQuery({
    queryKey: ["summaries", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("summaries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const handleGenerate = async () => {
    if (!specialty) {
      toast.error("Selecione uma especialidade");
      return;
    }
    setGenerating(true);
    setGeneratedContent("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-study-guide", {
        body: { specialty, topic: topic || undefined, depth },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const title = `${specialty}${topic ? ` — ${topic}` : ""}`;
      setGeneratedContent(data.content);
      setGeneratedTitle(title);

      // Save to summaries table
      if (user) {
        await supabase.from("summaries").insert({
          user_id: user.id,
          topic: title,
          content: data.content,
        });
      }

      toast.success("Apostila gerada com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar apostila");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPdf = (title: string, content: string) => {
    const sections = content.split(/^## /gm).filter(Boolean);
    const items = sections.map((section) => {
      const lines = section.split("\n");
      const sTitle = lines[0]?.replace(/^#+\s*/, "").trim() || "Seção";
      const sContent = lines.slice(1).join("\n").trim();
      return { title: sTitle, content: sContent };
    });

    if (items.length === 0) {
      items.push({ title, content });
    }

    exportToPdf(items, `Apostila — ${title}`);
    toast.success("PDF exportado!");
  };

  const filteredSummaries = (savedSummaries || []).filter(
    (s) => !searchTerm || s.topic.toLowerCase().includes(searchTerm.toLowerCase()) || s.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          Apostilas & Resumos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gere materiais de estudo estruturados por IA ou baixe apostilas prontas
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="h-4 w-4" /> Gerar Nova
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-2">
            <FileText className="h-4 w-4" /> Biblioteca
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gerar Apostila com IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Especialidade *</label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Tema específico (opcional)</label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: IAM, Pneumonia, Diabetes..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Profundidade</label>
                  <Select value={depth} onValueChange={setDepth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPTH_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          <div>
                            <div className="font-medium">{d.label}</div>
                            <div className="text-xs text-muted-foreground">{d.desc}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={generating || !specialty} className="w-full md:w-auto">
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {generating ? "Gerando apostila..." : "Gerar Apostila"}
              </Button>
            </CardContent>
          </Card>

          {generatedContent && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{generatedTitle}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleExportPdf(generatedTitle, generatedContent)}>
                  <Download className="h-4 w-4 mr-2" /> Baixar PDF
                </Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{generatedContent}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por tema..."
              className="max-w-sm"
            />
          </div>

          {loadingSummaries ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredSummaries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma apostila encontrada</p>
                <p className="text-sm mt-1">Gere sua primeira apostila na aba "Gerar Nova"</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSummaries.map((summary) => (
                <Card key={summary.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium truncate">{summary.topic}</CardTitle>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {new Date(summary.created_at).toLocaleDateString("pt-BR")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                      {summary.content.slice(0, 200)}...
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGeneratedContent(summary.content);
                          setGeneratedTitle(summary.topic);
                          const tabTrigger = document.querySelector('[data-value="generate"]') as HTMLElement;
                          tabTrigger?.click();
                        }}
                      >
                        <BookOpen className="h-3 w-3 mr-1" /> Ler
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPdf(summary.topic, summary.content)}
                      >
                        <Download className="h-3 w-3 mr-1" /> PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
