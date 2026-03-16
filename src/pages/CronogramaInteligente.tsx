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

const SPECIALTIES = [
  "Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia",
  "Gastroenterologia", "Nefrologia", "Infectologia", "Pediatria",
  "Ginecologia e Obstetrícia", "Cirurgia", "Medicina Preventiva",
];

const REVIEW_DAYS: Record<string, number> = { D1: 1, D2: 2, D3: 3, D5: 5, D7: 7, D15: 15, D30: 30 };

function generateReviews(dataEstudo: string, taxaAcerto?: number): { tipo: string; data: string }[] {
  const base = new Date(dataEstudo + "T00:00:00");
  const standard = ["D1", "D3", "D7", "D15", "D30"];
  const reviews = [...standard];
  if (taxaAcerto !== undefined) {
    if (taxaAcerto < 60) {
      if (!reviews.includes("D2")) reviews.push("D2");
      if (!reviews.includes("D5")) reviews.push("D5");
    } else if (taxaAcerto < 80) {
      if (!reviews.includes("D5")) reviews.push("D5");
    }
  }
  return reviews.map(tipo => {
    const d = new Date(base);
    d.setDate(d.getDate() + REVIEW_DAYS[tipo]);
    return { tipo, data: d.toISOString().split("T")[0] };
  });
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

  const handleAddTema = async (tema: string, especialidade: string, dataEstudo: string, fonte: string, observacoes: string) => {
    if (!user) return;
    const { data, error } = await supabase.from("temas_estudados").insert({
      user_id: user.id, tema, especialidade, data_estudo: dataEstudo, fonte, observacoes: observacoes || null,
    }).select().single();
    if (error || !data) { toast({ title: "Erro", description: "Não foi possível salvar o tema.", variant: "destructive" }); return; }

    const reviews = generateReviews(dataEstudo);
    const reviewRows = reviews.map(r => ({
      user_id: user.id, tema_id: (data as any).id, tipo_revisao: r.tipo, data_revisao: r.data, status: "pendente",
    }));
    await supabase.from("revisoes").insert(reviewRows);
    toast({ title: "✅ Tema registrado!", description: `${reviews.length} revisões agendadas automaticamente.` });
    setTab("painel");
    loadData();
  };

  const handleCompleteRevisao = async (revisao: Revisao, questoesFeitas: number, questoesErradas: number) => {
    if (!user) return;
    const acertos = questoesFeitas - questoesErradas;
    const taxa = questoesFeitas > 0 ? Math.round((acertos / questoesFeitas) * 100) : 0;

    await supabase.from("revisoes").update({ status: "concluida", concluida_em: new Date().toISOString() }).eq("id", revisao.id);
    await supabase.from("desempenho_questoes").insert({
      user_id: user.id, tema_id: revisao.tema_id, revisao_id: revisao.id,
      questoes_feitas: questoesFeitas, questoes_erradas: questoesErradas, taxa_acerto: taxa,
    });

    // Adaptive: add extra reviews if performance is low
    if (taxa < 60) {
      const tema = temas.find(t => t.id === revisao.tema_id);
      if (tema) {
        const existingTypes = revisoes.filter(r => r.tema_id === tema.id).map(r => r.tipo_revisao);
        const extras = ["D2", "D5"].filter(t => !existingTypes.includes(t));
        if (extras.length > 0) {
          const extraRows = extras.map(tipo => {
            const d = new Date(tema.data_estudo + "T00:00:00");
            d.setDate(d.getDate() + REVIEW_DAYS[tipo]);
            return { user_id: user.id, tema_id: tema.id, tipo_revisao: tipo, data_revisao: d.toISOString().split("T")[0], status: "pendente" };
          });
          await supabase.from("revisoes").insert(extraRows);
          toast({ title: "⚠️ Revisões extras adicionadas", description: `Taxa ${taxa}% → revisões D2/D5 incluídas.` });
        }
      }
    } else if (taxa < 80) {
      const tema = temas.find(t => t.id === revisao.tema_id);
      if (tema) {
        const existingTypes = revisoes.filter(r => r.tema_id === tema.id).map(r => r.tipo_revisao);
        if (!existingTypes.includes("D5")) {
          const d = new Date(tema.data_estudo + "T00:00:00");
          d.setDate(d.getDate() + 5);
          await supabase.from("revisoes").insert({
            user_id: user.id, tema_id: tema.id, tipo_revisao: "D5",
            data_revisao: d.toISOString().split("T")[0], status: "pendente",
          });
          toast({ title: "📌 Revisão extra adicionada", description: `Taxa ${taxa}% → revisão D5 incluída.` });
        }
      }
    }

    toast({ title: "✅ Revisão concluída!", description: `Taxa de acerto: ${taxa}%` });
    setActiveRevisao(null);
    loadData();
  };

  const handleDeleteTema = async (temaId: string) => {
    await supabase.from("temas_estudados").delete().eq("id", temaId);
    toast({ title: "Tema removido" });
    loadData();
  };

  const today = new Date().toISOString().split("T")[0];
  const revisoesHoje = revisoes.filter(r => r.data_revisao <= today && r.status === "pendente");
  const totalQuestoes = desempenhos.reduce((s, d) => s + d.questoes_feitas, 0);
  const totalErros = desempenhos.reduce((s, d) => s + d.questoes_erradas, 0);
  const taxaGeralAcerto = totalQuestoes > 0 ? Math.round(((totalQuestoes - totalErros) / totalQuestoes) * 100) : 0;
  const preparation = calcPreparation(temas, revisoes, desempenhos);
  const prepLevel = getPreparationLevel(preparation);
  const temasEmRevisao = temas.filter(t => revisoes.some(r => r.tema_id === t.id && r.status === "pendente"));

  if (activeRevisao) {
    return (
      <CronogramaRevisaoAtiva
        revisao={activeRevisao}
        onComplete={handleCompleteRevisao}
        onBack={() => setActiveRevisao(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <CronogramaHeader tab={tab} setTab={setTab} revisoesHoje={revisoesHoje.length} />

      {tab === "painel" && (
        <>
          <CronogramaPainel
            temas={temas}
            temasEmRevisao={temasEmRevisao}
            revisoesHoje={revisoesHoje}
            totalQuestoes={totalQuestoes}
            totalErros={totalErros}
            taxaGeralAcerto={taxaGeralAcerto}
            preparation={preparation}
            prepLevel={prepLevel}
            loading={loading}
          />
          <CronogramaAlertasHoje
            revisoesHoje={revisoesHoje}
            temas={temas}
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
          temas={temas}
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
