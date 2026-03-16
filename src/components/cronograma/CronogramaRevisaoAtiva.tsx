import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Send, Brain, Stethoscope, AlertTriangle, Clock, TrendingUp, ShieldAlert } from "lucide-react";
import CronogramaRecursosRevisao from "./CronogramaRecursosRevisao";
import type { Revisao, TemaEstudado, Desempenho, TemaComputado } from "@/pages/CronogramaInteligente";

interface Props {
  revisao: Revisao & { tema: TemaEstudado };
  temaComputado: TemaComputado | null;
  desempenhos: Desempenho[];
  onComplete: (revisao: Revisao, questoesFeitas: number, questoesErradas: number, tempoGasto: number, nivelConfianca: string, observacoes: string) => void;
  onBack: () => void;
}

const CONFIANCA = [
  { value: "nao_sei", label: "😰 Não sei" },
  { value: "parcial", label: "🤔 Sei parcialmente" },
  { value: "sei_bem", label: "😊 Sei bem" },
];

const RISCO_COLORS: Record<string, string> = {
  baixo: "text-emerald-500", moderado: "text-amber-500", alto: "text-orange-500", critico: "text-destructive",
};

const CronogramaRevisaoAtiva = ({ revisao, temaComputado, desempenhos, onComplete, onBack }: Props) => {
  const [questoesFeitas, setQuestoesFeitas] = useState("");
  const [questoesErradas, setQuestoesErradas] = useState("");
  const [tempoGasto, setTempoGasto] = useState("");
  const [nivelConfianca, setNivelConfianca] = useState("parcial");
  const [observacoes, setObservacoes] = useState("");
  const [step, setStep] = useState<"review" | "questions">("review");

  const feitas = parseInt(questoesFeitas) || 0;
  const erradas = parseInt(questoesErradas) || 0;
  const acertos = feitas - erradas;
  const taxaAcerto = feitas > 0 ? Math.round((acertos / feitas) * 100) : 0;
  const taxaErro = feitas > 0 ? Math.round((erradas / feitas) * 100) : 0;
  const tc = temaComputado;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <div className="glass-card p-6 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{revisao.tipo_revisao}</Badge>
              {tc && <Badge variant={tc.prioridade === "urgente" ? "destructive" : "secondary"} className="text-[10px]">{tc.prioridade}</Badge>}
              {tc && <span className={`text-[10px] font-medium ${RISCO_COLORS[tc.risco]}`}>Risco: {tc.risco}</span>}
            </div>
            <h2 className="text-xl font-bold">{revisao.tema.tema}</h2>
            <p className="text-sm text-muted-foreground">{revisao.tema.especialidade}</p>
          </div>
        </div>

        {/* Performance summary */}
        {tc && tc.totalQuestoes > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="rounded-lg bg-secondary/50 p-2 text-center">
              <div className="text-sm font-bold">{tc.totalQuestoes}</div>
              <div className="text-[9px] text-muted-foreground">Total questões</div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2 text-center">
              <div className="text-sm font-bold text-destructive">{tc.taxaErro}%</div>
              <div className="text-[9px] text-muted-foreground">Taxa erro</div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2 text-center">
              <div className="text-sm font-bold">{tc.revisoesFeitas}</div>
              <div className="text-[9px] text-muted-foreground">Revisões feitas</div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2 text-center">
              <div className="text-sm font-bold">{tc.diasSemRevisar}d</div>
              <div className="text-[9px] text-muted-foreground">Sem revisar</div>
            </div>
          </div>
        )}

        {/* Last errors */}
        {desempenhos.length > 0 && desempenhos[0].observacoes && (
          <div className="rounded-lg bg-destructive/5 p-3 mb-4 border border-destructive/10">
            <p className="text-xs font-medium text-destructive mb-1">⚠️ Últimas dificuldades:</p>
            <p className="text-sm text-muted-foreground">{desempenhos[0].observacoes}</p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Stethoscope className="h-4 w-4 text-primary" />
                Roteiro de Revisão
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>✅ Conceitos principais e definições</li>
                <li>✅ Fisiopatologia e mecanismos</li>
                <li>✅ Diagnóstico diferencial</li>
                <li>✅ Conduta e tratamento atual</li>
                <li>✅ Armadilhas comuns de prova</li>
              </ul>
              {revisao.tema.observacoes && (
                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium text-primary mb-1">📝 Suas anotações:</p>
                  <p className="text-sm">{revisao.tema.observacoes}</p>
                </div>
              )}
            </div>

            {/* Integrated resources: questions, flashcards, simulados */}
            <CronogramaRecursosRevisao tema={revisao.tema.tema} especialidade={revisao.tema.especialidade} />

            <Button className="w-full" onClick={() => setStep("questions")}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Revisão feita → Registrar desempenho
            </Button>
          </div>
        )}

        {step === "questions" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Registrar desempenho</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Questões realizadas *</label>
                <Input type="number" min="0" value={questoesFeitas} onChange={(e) => setQuestoesFeitas(e.target.value)} placeholder="Ex: 20" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Questões erradas *</label>
                <Input type="number" min="0" max={questoesFeitas} value={questoesErradas} onChange={(e) => setQuestoesErradas(e.target.value)} placeholder="Ex: 8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Tempo gasto (min)</label>
                <Input type="number" min="0" value={tempoGasto} onChange={(e) => setTempoGasto(e.target.value)} placeholder="Ex: 30" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Como se sentiu?</label>
                <Select value={nivelConfianca} onValueChange={setNivelConfianca}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONFIANCA.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {feitas > 0 && (
              <div className="space-y-2">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-base font-bold text-emerald-500">{acertos}</div>
                      <div className="text-[9px] text-muted-foreground">Acertos</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-destructive">{erradas}</div>
                      <div className="text-[9px] text-muted-foreground">Erros</div>
                    </div>
                    <div>
                      <div className={`text-base font-bold ${taxaAcerto >= 80 ? "text-emerald-500" : taxaAcerto >= 60 ? "text-amber-500" : "text-destructive"}`}>{taxaAcerto}%</div>
                      <div className="text-[9px] text-muted-foreground">Acerto</div>
                    </div>
                    <div>
                      <div className={`text-base font-bold ${taxaErro > 40 ? "text-destructive" : taxaErro > 20 ? "text-amber-500" : "text-emerald-500"}`}>{taxaErro}%</div>
                      <div className="text-[9px] text-muted-foreground">Erro</div>
                    </div>
                  </div>
                </div>
                {taxaErro > 20 && (
                  <div className={`text-xs font-medium flex items-center gap-1 p-2 rounded-lg ${taxaErro > 40 ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-500"}`}>
                    <AlertTriangle className="h-3 w-3" />
                    {taxaErro > 60 ? "Cronograma agressivo será aplicado" : taxaErro > 40 ? "Revisões D2 e D5 serão adicionadas" : "Revisão D5 será adicionada"}
                  </div>
                )}
                {nivelConfianca === "nao_sei" && (
                  <div className="text-xs font-medium flex items-center gap-1 p-2 rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-3 w-3" />
                    Próxima revisão será antecipada automaticamente
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Dificuldades / Observações</label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="O que errou? Onde teve dúvida?" rows={2} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("review")}>Voltar</Button>
              <Button onClick={() => onComplete(revisao, feitas, erradas, parseInt(tempoGasto) || 0, nivelConfianca, observacoes)} disabled={feitas === 0} className="flex-1">
                <Send className="h-4 w-4 mr-2" /> Concluir e Recalcular
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CronogramaRevisaoAtiva;
