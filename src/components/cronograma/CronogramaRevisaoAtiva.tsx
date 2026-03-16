import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Send, Brain, Stethoscope, AlertTriangle } from "lucide-react";
import type { Revisao, TemaEstudado, Desempenho } from "@/pages/CronogramaInteligente";

interface Props {
  revisao: Revisao & { tema: TemaEstudado };
  desempenhos: Desempenho[];
  onComplete: (revisao: Revisao, questoesFeitas: number, questoesErradas: number) => void;
  onBack: () => void;
}

const CronogramaRevisaoAtiva = ({ revisao, desempenhos, onComplete, onBack }: Props) => {
  const [questoesFeitas, setQuestoesFeitas] = useState("");
  const [questoesErradas, setQuestoesErradas] = useState("");
  const [step, setStep] = useState<"review" | "questions">("review");

  const feitas = parseInt(questoesFeitas) || 0;
  const erradas = parseInt(questoesErradas) || 0;
  const acertos = feitas - erradas;
  const taxaAcerto = feitas > 0 ? Math.round((acertos / feitas) * 100) : 0;
  const taxaErro = feitas > 0 ? Math.round((erradas / feitas) * 100) : 0;

  // Previous performance
  const totalFeitasAnt = desempenhos.reduce((s, d) => s + d.questoes_feitas, 0);
  const totalErradasAnt = desempenhos.reduce((s, d) => s + d.questoes_erradas, 0);
  const taxaErroAnterior = totalFeitasAnt > 0 ? Math.round((totalErradasAnt / totalFeitasAnt) * 100) : null;

  const getScheduleImpact = () => {
    if (taxaErro > 60) return "⚠️ Cronograma será recalculado para modo AGRESSIVO (D1, D2, D4, D7)";
    if (taxaErro > 40) return "📌 Revisões extras D2 e D5 serão adicionadas";
    if (taxaErro > 20) return "📌 Revisão extra D5 será adicionada";
    return "✅ Cronograma mantido sem alterações";
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao cronograma
      </Button>

      <div className="glass-card p-6 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <Badge variant="outline" className="mb-1">{revisao.tipo_revisao}</Badge>
            <h2 className="text-xl font-bold">{revisao.tema.tema}</h2>
            <p className="text-sm text-muted-foreground">{revisao.tema.especialidade}</p>
          </div>
        </div>

        {/* Previous performance summary */}
        {taxaErroAnterior !== null && (
          <div className="rounded-lg bg-secondary/50 p-3 mb-4">
            <p className="text-xs font-medium text-muted-foreground">
              📊 Desempenho anterior: {totalFeitasAnt} questões, {totalErradasAnt} erros ({taxaErroAnterior}% erro)
            </p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Stethoscope className="h-4 w-4 text-primary" />
                Roteiro de Revisão
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✅ Revise os conceitos principais do tema</li>
                <li>✅ Relembre a fisiopatologia e mecanismos-chave</li>
                <li>✅ Repasse diagnóstico diferencial</li>
                <li>✅ Confira a conduta e tratamento atual</li>
                <li>✅ Revise armadilhas comuns de prova</li>
              </ul>
              {revisao.tema.observacoes && (
                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium text-primary mb-1">📝 Suas anotações:</p>
                  <p className="text-sm">{revisao.tema.observacoes}</p>
                </div>
              )}
            </div>

            <Button className="w-full" onClick={() => setStep("questions")}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Revisão feita → Registrar questões
            </Button>
          </div>
        )}

        {step === "questions" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Registrar desempenho nas questões</h3>
            <p className="text-xs text-muted-foreground">
              Registre questões feitas manualmente ou importadas de simulados/bancos externos.
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
              <div className="space-y-3">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-emerald-500">{acertos}</div>
                      <div className="text-[10px] text-muted-foreground">Acertos</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-destructive">{erradas}</div>
                      <div className="text-[10px] text-muted-foreground">Erros</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${taxaAcerto >= 80 ? "text-emerald-500" : taxaAcerto >= 60 ? "text-amber-500" : "text-destructive"}`}>
                        {taxaAcerto}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">Acerto</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${taxaErro > 40 ? "text-destructive" : taxaErro > 20 ? "text-amber-500" : "text-emerald-500"}`}>
                        {taxaErro}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">Erro</div>
                    </div>
                  </div>
                </div>
                <div className={`text-xs font-medium flex items-center gap-1 p-2 rounded-lg ${
                  taxaErro > 40 ? "bg-destructive/10 text-destructive" : taxaErro > 20 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                }`}>
                  {taxaErro > 20 && <AlertTriangle className="h-3 w-3" />}
                  {getScheduleImpact()}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("review")}>Voltar</Button>
              <Button onClick={() => onComplete(revisao, feitas, erradas)} disabled={feitas === 0} className="flex-1">
                <Send className="h-4 w-4 mr-2" /> Concluir e Recalcular Cronograma
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CronogramaRevisaoAtiva;
