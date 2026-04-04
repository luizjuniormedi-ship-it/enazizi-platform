import { supabase } from "@/integrations/supabase/client";

export interface CurriculumItem {
  id: string;
  especialidade: string;
  tema: string;
  subtema: string;
  descricao_curta: string | null;
  incidencia_geral: string;
  prioridade_base: number;
  tipo_cobranca: string[];
  dificuldade_base: number;
  peso_banca_enare: number;
  peso_banca_usp: number;
  peso_banca_sus_sp: number;
  peso_banca_unicamp: number;
  peso_banca_unifesp: number;
  pre_requisitos: string[];
  palavras_chave: string[];
  gatilhos_clinicos: string[];
  integra_com_pratica: boolean;
  integra_com_osce: boolean;
  integra_com_revisao_fsrs: boolean;
  ativo: boolean;
}

type BancaKey = "enare" | "usp" | "sus_sp" | "unicamp" | "unifesp";

const BANCA_COL_MAP: Record<string, BancaKey> = {
  "ENARE": "enare",
  "USP": "usp",
  "SUS-SP": "sus_sp",
  "UNICAMP": "unicamp",
  "UNIFESP": "unifesp",
};

function bancaColumn(banca: string): string {
  const key = BANCA_COL_MAP[banca.toUpperCase()] ?? BANCA_COL_MAP[banca];
  return key ? `peso_banca_${key}` : "peso_banca_enare";
}

/** Busca todos os itens ativos da matriz */
export async function fetchFullMatrix(): Promise<CurriculumItem[]> {
  const { data, error } = await supabase
    .from("curriculum_matrix")
    .select("*")
    .eq("ativo", true)
    .order("prioridade_base", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CurriculumItem[];
}

/** Busca itens por especialidade */
export async function fetchByEspecialidade(especialidade: string): Promise<CurriculumItem[]> {
  const { data, error } = await supabase
    .from("curriculum_matrix")
    .select("*")
    .eq("ativo", true)
    .eq("especialidade", especialidade)
    .order("prioridade_base", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CurriculumItem[];
}

/** Busca itens por incidência (altissima, alta, media, baixa) */
export async function fetchByIncidencia(incidencia: string): Promise<CurriculumItem[]> {
  const { data, error } = await supabase
    .from("curriculum_matrix")
    .select("*")
    .eq("ativo", true)
    .eq("incidencia_geral", incidencia)
    .order("prioridade_base", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CurriculumItem[];
}

/** Busca itens com prioridade >= threshold */
export async function fetchByPrioridade(minPrioridade: number = 7): Promise<CurriculumItem[]> {
  const { data, error } = await supabase
    .from("curriculum_matrix")
    .select("*")
    .eq("ativo", true)
    .gte("prioridade_base", minPrioridade)
    .order("prioridade_base", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CurriculumItem[];
}

/** Busca itens ordenados pelo peso de uma banca específica */
export async function fetchByBanca(bancaNome: string, limit: number = 50): Promise<CurriculumItem[]> {
  const col = bancaColumn(bancaNome);
  const { data, error } = await supabase
    .from("curriculum_matrix")
    .select("*")
    .eq("ativo", true)
    .order(col, { ascending: false })
    .order("prioridade_base", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as CurriculumItem[];
}

/** Busca itens filtrados por múltiplas bancas (retorna os que têm peso alto em qualquer uma) */
export async function fetchForTargetExams(bancas: string[], minPeso: number = 7): Promise<CurriculumItem[]> {
  const all = await fetchFullMatrix();
  return all.filter((item) => {
    return bancas.some((b) => {
      const key = BANCA_COL_MAP[b.toUpperCase()] ?? BANCA_COL_MAP[b];
      if (!key) return false;
      const peso = (item as any)[`peso_banca_${key}`] as number;
      return peso >= minPeso;
    });
  });
}

/** Retorna pré-requisitos de um subtema */
export async function fetchPreRequisitos(subtema: string): Promise<CurriculumItem[]> {
  const { data: item } = await supabase
    .from("curriculum_matrix")
    .select("pre_requisitos")
    .eq("subtema", subtema)
    .eq("ativo", true)
    .limit(1)
    .single();

  if (!item || !(item as any).pre_requisitos?.length) return [];

  const prereqs = (item as any).pre_requisitos as string[];
  const { data } = await supabase
    .from("curriculum_matrix")
    .select("*")
    .eq("ativo", true)
    .in("subtema", prereqs);

  return (data ?? []) as unknown as CurriculumItem[];
}

/** Retorna lista de especialidades distintas */
export async function fetchEspecialidades(): Promise<string[]> {
  const { data } = await supabase
    .from("curriculum_matrix")
    .select("especialidade")
    .eq("ativo", true);
  if (!data) return [];
  return [...new Set(data.map((d: any) => d.especialidade))].sort();
}

/** Retorna temas de uma especialidade */
export async function fetchTemas(especialidade: string): Promise<string[]> {
  const { data } = await supabase
    .from("curriculum_matrix")
    .select("tema")
    .eq("ativo", true)
    .eq("especialidade", especialidade);
  if (!data) return [];
  return [...new Set(data.map((d: any) => d.tema))].sort();
}

/** Retorna contagem de itens por especialidade */
export async function fetchMatrixStats(): Promise<{ especialidade: string; count: number; avgPrioridade: number }[]> {
  const all = await fetchFullMatrix();
  const map = new Map<string, { count: number; sumPrio: number }>();
  for (const item of all) {
    const curr = map.get(item.especialidade) ?? { count: 0, sumPrio: 0 };
    curr.count++;
    curr.sumPrio += item.prioridade_base;
    map.set(item.especialidade, curr);
  }
  return Array.from(map.entries())
    .map(([especialidade, { count, sumPrio }]) => ({
      especialidade,
      count,
      avgPrioridade: Math.round((sumPrio / count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}
