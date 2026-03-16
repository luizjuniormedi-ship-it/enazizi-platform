import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Save } from "lucide-react";

interface Props {
  specialties: string[];
  onAdd: (tema: string, especialidade: string, dataEstudo: string, fonte: string, observacoes: string) => void;
}

const FONTES = [
  { value: "literatura", label: "📚 Literatura médica" },
  { value: "material", label: "📄 Material enviado" },
  { value: "aula", label: "🎓 Aula / Curso" },
  { value: "questoes", label: "📝 Banco de Questões" },
  { value: "revisao", label: "🔁 Revisão" },
];

const CronogramaNovoTema = ({ specialties, onAdd }: Props) => {
  const [tema, setTema] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [dataEstudo, setDataEstudo] = useState(new Date().toISOString().split("T")[0]);
  const [fonte, setFonte] = useState("literatura");
  const [observacoes, setObservacoes] = useState("");

  const handleSubmit = () => {
    if (!tema.trim() || !especialidade) return;
    onAdd(tema.trim(), especialidade, dataEstudo, fonte, observacoes.trim());
    setTema("");
    setObservacoes("");
  };

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
          Salvar e Agendar Revisões (D1, D3, D7, D15, D30)
        </Button>
      </div>
    </div>
  );
};

export default CronogramaNovoTema;
