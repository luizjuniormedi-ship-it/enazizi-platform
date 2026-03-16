import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import CronogramaHeader from "@/components/cronograma/CronogramaHeader";
import CronogramaPainel from "@/components/cronograma/CronogramaPainel";
import CronogramaAlertasHoje from "@/components/cronograma/CronogramaAlertasHoje";
import CronogramaNovoTema from "@/components/cronograma/CronogramaNovoTema";
import CronogramaTemas from "@/components/cronograma/CronogramaTemas";
import CronogramaRevisaoAtiva from "@/components/cronograma/CronogramaRevisaoAtiva";
import CronogramaGraficos from "@/components/cronograma/CronogramaGraficos";

export interface TemaEstudado {
  id: string;
  tema: string;
  especialidade: string;
  data_estudo: string;
  fonte: string;
  observacoes: string | null;
  created_at: string;
}

export interface Revisao {
  id: string;
  tema_id: string;
  tipo_revisao: string;
  data_revisao: string;
  status: string;
  concluida_em: string | null;
}

export interface Desempenho {
  id: string;
  tema_id: string;
  revisao_id: string | null;
  questoes_feitas: number;
  questoes_erradas: number;
  taxa_acerto: number;
  data_registro: string;
}

export type RiscoEsquecimento = "baixo" | "moderado" | "alto";

export interface TemaComRisco extends TemaEstudado {
  risco: RiscoEsquecimento;
  taxaErro: number;
  ultimaRevisao: string | null;
  revisoesFeitas: number;
}

const SPECIALTIES = [
  "Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia",
  "Gastroenterologia", "Nefrologia", "Infectologia", "Pediatria",
  "Ginecologia e Obstetrícia", "Cirurgia", "Medicina Preventiva",
];

const REVIEW_DAYS: Record<string, number> = {
  D1: 1, D2: 2, D3: 3, D4: 4, D5: 5, D7: 7, D15: 15, D30: 30,
};

/**
 * Error-based review generation algorithm.
 * The higher the error rate, the more aggressive the review schedule.
 */
export function generateReviewsByError(dataEstudo: string, taxaErro: number): { tipo: string; data: string }[] {
  const base = new Date(dataEstudo + "T12:00:00");
  let reviewTypes: string[];

  if (taxaErro > 60) {
    // Aggressive: D1, D2, D4, D7, D15, D30
    reviewTypes = ["D1", "D2", "D4", "D7", "D15", "D30"];
  } else if (taxaErro > 40) {
    // D1, D2, D3, D5, D7, D15, D30
    reviewTypes = ["D1", "D2", "D3", "D5", "D7", "D15", "D30"];
  } else if (taxaErro > 20) {
    // D1, D3, D5, D7, D15, D30
    reviewTypes = ["D1", "D3", "D5", "D7", "D15", "D30"];
  } else {
    // Normal: D1, D3, D7, D15, D30
    reviewTypes = ["D1", "D3", "D7", "D15", "D30"];
  }

  return reviewTypes.map(tipo => {
    const d = new Date(base);
    d.setDate(d.getDate() + REVIEW_DAYS[tipo]);
    return { tipo, data: d.toISOString().split("T")[0] };
  });
}

/**
 * Calculates forgetting risk for a theme based on:
 * - Time since last review
 * - Error rate
 * - Number of reviews completed
 */
export function calcRiscoEsquecimento(
  tema: TemaEstudado,
  revisoes: Revisao[],
  desempenhos: Desempenho[]
): { risco: RiscoEsquecimento; taxaErro: number; ultimaRevisao: string | null; revisoesFeitas: number } {
  const temaRevisoes = revisoes.filter(r => r.tema_id === tema.id);
  const temaDesempenhos = desempenhos.filter(d => d.tema_id === tema.id);
  const revisoesFeitas = temaRevisoes.filter(r => r.status === "concluida").length;

  // Calculate average error rate
  const totalFeitas = temaDesempenhos.reduce((s, d) => s + d.questoes_feitas, 0);
  const totalErradas = temaDesempenhos.reduce((s, d) => s + d.questoes_erradas, 0);
  const taxaErro = totalFeitas > 0 ? Math.round((totalErradas / totalFeitas) * 100) : 0;

  // Last review date
  const concluidas = temaRevisoes
    .filter(r => r.concluida_em)
    .sort((a, b) => (b.concluida_em || "").localeCompare(a.concluida_em || ""));
  const ultimaRevisao = concluidas.length > 0 ? concluidas[0].concluida_em : null;

  // Days since last activity
  const lastDate = ultimaRevisao || tema.data_estudo;
  const diasDesde = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));

  // Risk score: higher = more risk
  let riskScore = 0;
  riskScore += Math.min(diasDesde * 2, 40); // time factor (max 40)
  riskScore += taxaErro * 0.4; // error factor (max 40)
  riskScore += Math.max(0, (5 - revisoesFeitas) * 4); // fewer reviews = more risk (max 20)

  let risco: RiscoEsquecimento;
  if (riskScore >= 50) risco = "alto";
  else if (riskScore >= 25) risco = "moderado";
  else risco = "baixo";

  return { risco, taxaErro, ultimaRevisao, revisoesFeitas };
}

function calcPreparation(temas: TemaEstudado[], revisoes: Revisao[], desempenhos: Desempenho[]): number {
  if (temas.length === 0) return 0;
  const totalRevisoes = revisoes.filter(r => r.status === "concluida").length;
  const totalPossiveis = revisoes.length || 1;
  const revisaoPercent = (totalRevisoes / totalPossiveis) * 100;
  const acertos = desempenhos.length > 0 ? desempenhos.reduce((s, d) => s + d.taxa_acerto, 0) / desempenhos.length : 0;
  const temasScore = Math.min(temas.length * 2, 30);
  return Math.min(100, Math.round(acertos * 0.5 + revisaoPercent * 0.3 + temasScore));
}

function getPreparationLevel(pct: number): { label: string; color: string } {
  if (pct >= 80) return { label: "Pronto para prova", color: "text-emerald-500" };
  if (pct >= 60) return { label: "Avançado", color: "text-primary" };
  if (pct >= 40) return { label: "Intermediário", color: "text-amber-500" };
  return { label: "Básico", color: "text-destructive" };
}

const CronogramaInteligente = () => {
  const { user } = useAuth();
  const [temas, setTemas] = useState<TemaEstudado[]>([]);
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);
  const [desempenhos, setDesempenhos] = useState<Desempenho[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRevisao, setActiveRevisao] = useState<(Revisao & { tema: TemaEstudado }) | null>(null);
  const [tab, setTab] = useState<"painel" | "novo" | "temas" | "graficos">("painel");

  const loadData = useCallback(async () => {
    if (!user) return;
    const [temasRes, revisoesRes, desRes] = await Promise.all([
      supabase.from("temas_estudados").select("*").eq("user_id", user.id).order("data_estudo", { ascending: false }),
      supabase.from("revisoes").select("*").eq("user_id", user.id).order("data_revisao", { ascending: true }),
      supabase.from("desempenho_questoes").select("*").eq("user_id", user.id).order("data_registro", { ascending: false }),
    ]);
    setTemas((temasRes.data as any[]) || []);
    setRevisoes((revisoesRes.data as any[]) || []);
    setDesempenhos((desRes.data as any[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddTema = async (
    tema: string, especialidade: string, dataEstudo: string, fonte: string, observacoes: string,
    questoesFeitas: number, questoesErradas: number
  ) => {
    if (!user) return;
    const { data, error } = await supabase.from("temas_estudados").insert({
      user_id: user.id, tema, especialidade, data_estudo: dataEstudo, fonte, observacoes: observacoes || null,
    }).select().single();
    if (error || !data) { toast({ title: "Erro", description: "Não foi possível salvar o tema.", variant: "destructive" }); return; }

    const temaId = (data as any).id;

    // Calculate error rate for adaptive scheduling
    const taxaErro = questoesFeitas > 0 ? Math.round((questoesErradas / questoesFeitas) * 100) : 0;
    const taxaAcerto = questoesFeitas > 0 ? Math.round(((questoesFeitas - questoesErradas) / questoesFeitas) * 100) : 0;

    // Save initial performance if questions were provided
    if (questoesFeitas > 0) {
      await supabase.from("desempenho_questoes").insert({
        user_id: user.id, tema_id: temaId,
        questoes_feitas: questoesFeitas, questoes_erradas: questoesErradas, taxa_acerto: taxaAcerto,
      });
    }

    // Generate error-based reviews
    const reviews = generateReviewsByError(dataEstudo, taxaErro);
    const reviewRows = reviews.map(r => ({
      user_id: user.id, tema_id: temaId, tipo_revisao: r.tipo, data_revisao: r.data, status: "pendente",
    }));
    await supabase.from("revisoes").insert(reviewRows);

    const erroMsg = taxaErro > 60
      ? `⚠️ Erro alto (${taxaErro}%) → cronograma agressivo!`
      : taxaErro > 40
      ? `📌 Erro moderado (${taxaErro}%) → revisões extras D2 e D5`
      : taxaErro > 20
      ? `📌 Erro leve (${taxaErro}%) → revisão extra D5`
      : `✅ Erro baixo (${taxaErro}%) → cronograma padrão`;

    toast({ title: "Tema registrado!", description: `${reviews.length} revisões agendadas. ${erroMsg}` });
    setTab("painel");
    loadData();
  };

  const handleCompleteRevisao = async (revisao: Revisao, questoesFeitas: number, questoesErradas: number) => {
    if (!user) return;
    const acertos = questoesFeitas - questoesErradas;
    const taxa = questoesFeitas > 0 ? Math.round((acertos / questoesFeitas) * 100) : 0;
    const taxaErro = questoesFeitas > 0 ? Math.round((questoesErradas / questoesFeitas) * 100) : 0;

    await supabase.from("revisoes").update({ status: "concluida", concluida_em: new Date().toISOString() }).eq("id", revisao.id);
    await supabase.from("desempenho_questoes").insert({
      user_id: user.id, tema_id: revisao.tema_id, revisao_id: revisao.id,
      questoes_feitas: questoesFeitas, questoes_erradas: questoesErradas, taxa_acerto: taxa,
    });

    // Dynamic recalculation: add extra reviews based on error rate
    const tema = temas.find(t => t.id === revisao.tema_id);
    if (tema && taxaErro > 20) {
      const existingTypes = revisoes.filter(r => r.tema_id === tema.id).map(r => r.tipo_revisao);
      let extrasNeeded: string[] = [];

      if (taxaErro > 60) {
        extrasNeeded = ["D2", "D4", "D5"].filter(t => !existingTypes.includes(t));
      } else if (taxaErro > 40) {
        extrasNeeded = ["D2", "D5"].filter(t => !existingTypes.includes(t));
      } else {
        extrasNeeded = ["D5"].filter(t => !existingTypes.includes(t));
      }

      if (extrasNeeded.length > 0) {
        const extraRows = extrasNeeded.map(tipo => {
          const d = new Date(tema.data_estudo + "T12:00:00");
          d.setDate(d.getDate() + REVIEW_DAYS[tipo]);
          return { user_id: user.id, tema_id: tema.id, tipo_revisao: tipo, data_revisao: d.toISOString().split("T")[0], status: "pendente" };
        });
        await supabase.from("revisoes").insert(extraRows);
        toast({ title: "⚠️ Revisões extras adicionadas", description: `Erro ${taxaErro}% → ${extrasNeeded.join(", ")} incluídas.` });
      }
    }

    toast({ title: "✅ Revisão concluída!", description: `Acerto: ${taxa}% | Erro: ${taxaErro}%` });
    setActiveRevisao(null);
    loadData();
  };

  const handleDeleteTema = async (temaId: string) => {
    await supabase.from("desempenho_questoes").delete().eq("tema_id", temaId);
    await supabase.from("revisoes").delete().eq("tema_id", temaId);
    await supabase.from("temas_estudados").delete().eq("id", temaId);
    toast({ title: "Tema removido" });
    loadData();
  };

  // Compute derived data
  const today = new Date().toISOString().split("T")[0];
  const revisoesHoje = revisoes.filter(r => r.data_revisao <= today && r.status === "pendente");
  const revisoesAtrasadas = revisoes.filter(r => r.data_revisao < today && r.status === "pendente");
  const totalQuestoes = desempenhos.reduce((s, d) => s + d.questoes_feitas, 0);
  const totalErros = desempenhos.reduce((s, d) => s + d.questoes_erradas, 0);
  const taxaGeralAcerto = totalQuestoes > 0 ? Math.round(((totalQuestoes - totalErros) / totalQuestoes) * 100) : 0;
  const taxaGeralErro = totalQuestoes > 0 ? Math.round((totalErros / totalQuestoes) * 100) : 0;
  const preparation = calcPreparation(temas, revisoes, desempenhos);
  const prepLevel = getPreparationLevel(preparation);
  const temasEmRevisao = temas.filter(t => revisoes.some(r => r.tema_id === t.id && r.status === "pendente"));

  // Calculate risk for each theme
  const temasComRisco: TemaComRisco[] = temas.map(tema => {
    const info = calcRiscoEsquecimento(tema, revisoes, desempenhos);
    return { ...tema, ...info };
  });
  const temasAltoRisco = temasComRisco.filter(t => t.risco === "alto");

  if (activeRevisao) {
    return (
      <CronogramaRevisaoAtiva
        revisao={activeRevisao}
        desempenhos={desempenhos.filter(d => d.tema_id === activeRevisao.tema_id)}
        onComplete={handleCompleteRevisao}
        onBack={() => setActiveRevisao(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <CronogramaHeader tab={tab} setTab={setTab} revisoesHoje={revisoesHoje.length} revisoesAtrasadas={revisoesAtrasadas.length} />

      {tab === "painel" && (
        <>
          <CronogramaPainel
            temas={temas}
            temasEmRevisao={temasEmRevisao}
            revisoesHoje={revisoesHoje}
            totalQuestoes={totalQuestoes}
            totalErros={totalErros}
            taxaGeralAcerto={taxaGeralAcerto}
            taxaGeralErro={taxaGeralErro}
            preparation={preparation}
            prepLevel={prepLevel}
            temasAltoRisco={temasAltoRisco.length}
            loading={loading}
          />
          <CronogramaAlertasHoje
            revisoesHoje={revisoesHoje}
            revisoesAtrasadas={revisoesAtrasadas}
            temas={temas}
            temasComRisco={temasComRisco}
            onStartRevisao={(revisao) => {
              const tema = temas.find(t => t.id === revisao.tema_id);
              if (tema) setActiveRevisao({ ...revisao, tema });
            }}
          />
        </>
      )}

      {tab === "novo" && (
        <CronogramaNovoTema specialties={SPECIALTIES} onAdd={handleAddTema} />
      )}

      {tab === "temas" && (
        <CronogramaTemas
          temasComRisco={temasComRisco}
          revisoes={revisoes}
          desempenhos={desempenhos}
          onDelete={handleDeleteTema}
          onStartRevisao={(revisao) => {
            const tema = temas.find(t => t.id === revisao.tema_id);
            if (tema) setActiveRevisao({ ...revisao, tema });
          }}
        />
      )}

      {tab === "graficos" && (
        <CronogramaGraficos temas={temas} revisoes={revisoes} desempenhos={desempenhos} />
      )}
    </div>
  );
};

export default CronogramaInteligente;
