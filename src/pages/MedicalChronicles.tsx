import { useState, useRef } from "react";
import { BookOpen, Play, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import InteractiveQuestionRenderer from "@/components/agents/InteractiveQuestionRenderer";

const SPECIALTIES = [
  "Clínica Médica", "Cirurgia", "Pediatria", "Ginecologia e Obstetrícia",
  "Medicina Preventiva", "Urgência e Emergência", "Cardiologia", "Neurologia",
  "Infectologia", "Pneumologia", "Gastroenterologia", "Ortopedia",
  "Dermatologia", "Hematologia", "Oncologia", "Reumatologia",
  "Urologia", "Psiquiatria", "Medicina de Emergência", "Terapia Intensiva",
];

const DIFFICULTIES = [
  { value: "intermediario", label: "🟡 Intermediário" },
  { value: "avancado", label: "🟠 Avançado" },
  { value: "expert", label: "🔴 Expert" },
];

const MedicalChronicles = () => {
  const [specialty, setSpecialty] = useState("Clínica Médica");
  const [subtopic, setSubtopic] = useState("");
  const [difficulty, setDifficulty] = useState("avancado");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    setLoading(true);
    setContent("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-chronicle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ specialty, subtopic: subtopic.trim() || undefined, difficulty }),
          signal: controller.signal,
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Stream indisponível");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setContent(accumulated);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error(e.message || "Erro ao gerar crônica");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setContent("");
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          Crônicas Médicas
        </h1>
        <p className="text-muted-foreground">
          Aprenda medicina através de narrativas clínicas imersivas — como se você estivesse no plantão.
        </p>
      </div>

      {!content && !loading && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Especialidade</label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subtema (opcional)</label>
              <Input
                placeholder="Ex: IAM, Dengue, Meningite..."
                value={subtopic}
                onChange={e => setSubtopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dificuldade</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generate} size="lg" className="w-full">
            <Play className="h-5 w-5 mr-2" />
            Gerar Crônica
          </Button>
        </Card>
      )}

      {loading && !content && (
        <Card className="p-12 flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground text-center">Escrevendo sua crônica clínica...</p>
        </Card>
      )}

      {content && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Nova Crônica
            </Button>
          </div>
          <Card className="p-6 md:p-8">
            <InteractiveQuestionRenderer content={content} />
          </Card>
        </div>
      )}
    </div>
  );
};

export default MedicalChronicles;
