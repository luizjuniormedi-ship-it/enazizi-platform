import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Save, AlertTriangle } from "lucide-react";

interface Props {
  specialties: string[];
  onAdd: (tema: string, especialidade: string, dataEstudo: string, fonte: string, observacoes: string, questoesFeitas: number, questoesErradas: number) => void;
}

const FONTES = [
  { value: "literatura", label: "📚 Literatura médica" },
  { value: "material", label: "📄 Material enviado" },
  { value: "aula", label: "🎓 Aula / Curso" },
  { value: "questoes", label: "📝 Banco de Questões" },
  { value: "revisao", label: "🔁 Revisão" },
  { value: "simulado", label: "🧪 Simulado externo" },
];

const CronogramaNovoTema = ({ specialties, onAdd }: Props) => {
  const [tema, setTema] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [dataEstudo, setDataEstudo] = useState(new Date().toISOString().split("T")[0]);
  const [fonte, setFonte] = useState("literatura");
  const [observacoes, setObservacoes] = useState("");
  const [questoesFeitas, setQuestoesFeitas] = useState("");
  const [questoesErradas, setQuestoesErradas] = useState("");

  const feitas = parseInt(questoesFeitas) || 0;
  const erradas = parseInt(questoesErradas) || 0;
  const acertos = feitas - erradas;
  const taxaErro = feitas > 0 ? Math.round((erradas / feitas) * 100) : 0;
  const taxaAcerto = feitas > 0 ? Math.round((acertos / feitas) * 100) : 0;

  const getSchedulePreview = () => {
    if (taxaErro > 60) return { text: "Cronograma AGRESSIVO: D1, D2, D4, D7, D15, D30", color: "text-destructive" };
    if (taxaErro > 40) return { text: "Cronograma reforçado: D1, D2, D3, D5, D7, D15, D30", color: "text-orange-500" };
    if (taxaErro > 20) return { text: "Cronograma com extra: D1, D3, D5, D7, D15, D30", color: "text-amber-500" };
    return { text: "Cronograma padrão: D1, D3, D7, D15, D30", color: "text-emerald-500" };
  };

  const handleSubmit = () => {
    if (!tema.trim() || !especialidade) return;
    onAdd(tema.trim(), especialidade, dataEstudo, fonte, observacoes.trim(), feitas, erradas);
    setTema("");
    setObservacoes("");
    setQuestoesFeitas("");
    setQuestoesErradas("");
  };

  const preview = getSchedulePreview();

  return (
    <div className="glass-card p-6 max-w-2xl">
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        Registrar Novo Tema Estudado
      </h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Assunto / Tema *</label>
          <Input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ex: Insuficiência Cardíaca Descompensada"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Especialidade *</label>
            <Select value={especialidade} onValueChange={setEspecialidade}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {specialties.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Data do estudo (D0)</label>
            <Input type="date" value={dataEstudo} onChange={(e) => setDataEstudo(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Fonte do estudo</label>
          <Select value={fonte} onValueChange={setFonte}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONTES.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Questions performance section */}
        <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            📝 Desempenho em Questões (opcional)
          </h4>
          <p className="text-xs text-muted-foreground">
            Registre seu desempenho para gerar um cronograma adaptado ao seu nível de erro.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Questões realizadas</label>
              <Input
                type="number"
                min="0"
                value={questoesFeitas}
                onChange={(e) => setQuestoesFeitas(e.target.value)}
                placeholder="Ex: 20"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Questões erradas</label>
              <Input
                type="number"
                min="0"
                max={questoesFeitas}
                value={questoesErradas}
                onChange={(e) => setQuestoesErradas(e.target.value)}
                placeholder="Ex: 8"
              />
            </div>
          </div>
          {feitas > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-background p-2">
                  <div className="text-lg font-bold text-emerald-500">{acertos}</div>
                  <div className="text-[10px] text-muted-foreground">Acertos</div>
                </div>
                <div className="rounded-lg bg-background p-2">
                  <div className="text-lg font-bold text-destructive">{erradas}</div>
                  <div className="text-[10px] text-muted-foreground">Erros</div>
                </div>
                <div className="rounded-lg bg-background p-2">
                  <div className={`text-lg font-bold ${taxaErro > 40 ? "text-destructive" : taxaErro > 20 ? "text-amber-500" : "text-emerald-500"}`}>
                    {taxaErro}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">Taxa Erro</div>
                </div>
              </div>
              <div className={`text-xs font-medium flex items-center gap-1 ${preview.color}`}>
                {taxaErro > 40 && <AlertTriangle className="h-3 w-3" />}
                {preview.text}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Observações</label>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Anotações, pontos importantes, dúvidas..."
            rows={3}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!tema.trim() || !especialidade} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          Salvar e Gerar Cronograma Adaptativo
        </Button>
      </div>
    </div>
  );
};

export default CronogramaNovoTema;
