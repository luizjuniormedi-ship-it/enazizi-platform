import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Save, Settings, RotateCcw } from "lucide-react";
import type { CronogramaConfig, PesosAlgoritmo } from "@/pages/CronogramaInteligente";

interface Props {
  config: CronogramaConfig | null;
  onSave: (config: Partial<CronogramaConfig>) => void;
}

const DEFAULT_PESOS: PesosAlgoritmo = { erro: 0.3, tempo: 0.2, atraso: 0.2, dificuldade: 0.15, confianca: 0.15 };

const CronogramaConfiguracoes = ({ config, onSave }: Props) => {
  const [revisoesExtras, setRevisoesExtras] = useState(config?.revisoes_extras_ativas ?? true);
  const [maxRevisoesDia, setMaxRevisoesDia] = useState(String(config?.max_revisoes_dia ?? 10));
  const [metaQuestoesDia, setMetaQuestoesDia] = useState(String(config?.meta_questoes_dia ?? 30));
  const [metaRevisoesSemana, setMetaRevisoesSemana] = useState(String(config?.meta_revisoes_semana ?? 15));
  const [mostrarConcluidos, setMostrarConcluidos] = useState(config?.mostrar_concluidos ?? false);
  const [pesos, setPesos] = useState<PesosAlgoritmo>((config?.pesos_algoritmo as PesosAlgoritmo) || DEFAULT_PESOS);

  const handleSave = () => {
    onSave({
      revisoes_extras_ativas: revisoesExtras,
      max_revisoes_dia: parseInt(maxRevisoesDia) || 10,
      meta_questoes_dia: parseInt(metaQuestoesDia) || 30,
      meta_revisoes_semana: parseInt(metaRevisoesSemana) || 15,
      mostrar_concluidos: mostrarConcluidos,
      pesos_algoritmo: pesos,
    });
  };

  const resetPesos = () => setPesos(DEFAULT_PESOS);

  const updatePeso = (key: keyof PesosAlgoritmo, value: number) => {
    setPesos(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        Configurações do Cronograma
      </h2>

      {/* General settings */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="font-semibold text-sm">⚙️ Geral</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Revisões extras automáticas</p>
            <p className="text-xs text-muted-foreground">Adicionar D2/D5 quando erro for alto</p>
          </div>
          <Switch checked={revisoesExtras} onCheckedChange={setRevisoesExtras} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Mostrar temas concluídos</p>
            <p className="text-xs text-muted-foreground">Exibir temas com todas revisões feitas</p>
          </div>
          <Switch checked={mostrarConcluidos} onCheckedChange={setMostrarConcluidos} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Máx revisões/dia</label>
            <Input type="number" min="1" max="30" value={maxRevisoesDia} onChange={(e) => setMaxRevisoesDia(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Meta questões/dia</label>
            <Input type="number" min="1" max="100" value={metaQuestoesDia} onChange={(e) => setMetaQuestoesDia(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Meta revisões/semana</label>
            <Input type="number" min="1" max="50" value={metaRevisoesSemana} onChange={(e) => setMetaRevisoesSemana(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Priority weights */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">🎯 Pesos do Algoritmo de Prioridade</h3>
          <Button variant="ghost" size="sm" onClick={resetPesos}>
            <RotateCcw className="h-3 w-3 mr-1" /> Resetar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ajuste os pesos para personalizar como o sistema calcula a prioridade dos temas.
        </p>

        {[
          { key: "erro" as const, label: "Taxa de Erro", desc: "Peso dado à taxa de erro nas questões" },
          { key: "tempo" as const, label: "Tempo sem Revisar", desc: "Peso dado ao tempo desde última revisão" },
          { key: "atraso" as const, label: "Atrasos", desc: "Peso dado a revisões não concluídas" },
          { key: "dificuldade" as const, label: "Dificuldade", desc: "Peso dado à dificuldade percebida" },
          { key: "confianca" as const, label: "Confiança", desc: "Peso dado ao nível de confiança" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
              <span className="text-sm font-mono font-bold text-primary">{pesos[key].toFixed(2)}</span>
            </div>
            <Slider
              value={[pesos[key] * 100]}
              onValueChange={([v]) => updatePeso(key, v / 100)}
              min={0} max={50} step={5}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" /> Salvar Configurações
      </Button>
    </div>
  );
};

export default CronogramaConfiguracoes;
