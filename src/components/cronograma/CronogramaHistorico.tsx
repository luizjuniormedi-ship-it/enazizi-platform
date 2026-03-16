import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { TemaEstudado, Revisao, Desempenho } from "@/pages/CronogramaInteligente";

interface Props {
  temas: TemaEstudado[];
  revisoes: Revisao[];
  desempenhos: Desempenho[];
}

const CronogramaHistorico = ({ temas, revisoes, desempenhos }: Props) => {
  const [filtroTema, setFiltroTema] = useState("");
  const [filtroEspec, setFiltroEspec] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");

  const especialidades = useMemo(() => [...new Set(temas.map(t => t.especialidade))].sort(), [temas]);

  // Build timeline entries
  const timeline = useMemo(() => {
    const entries: {
      date: string; type: "estudo" | "revisao" | "desempenho";
      tema: TemaEstudado; revisao?: Revisao; desempenho?: Desempenho;
    }[] = [];

    temas.forEach(t => {
      entries.push({ date: t.data_estudo, type: "estudo", tema: t });
    });

    revisoes.forEach(r => {
      const tema = temas.find(t => t.id === r.tema_id);
      if (tema) {
        const date = r.concluida_em ? r.concluida_em.split("T")[0] : r.data_revisao;
        entries.push({ date, type: "revisao", tema, revisao: r });
      }
    });

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [temas, revisoes]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = timeline;

    if (filtroTema) {
      const q = filtroTema.toLowerCase();
      result = result.filter(e => e.tema.tema.toLowerCase().includes(q));
    }
    if (filtroEspec !== "todas") {
      result = result.filter(e => e.tema.especialidade === filtroEspec);
    }
    if (filtroStatus !== "todos") {
      if (filtroStatus === "concluida") result = result.filter(e => e.type === "revisao" && e.revisao?.status === "concluida");
      else if (filtroStatus === "pendente") result = result.filter(e => e.type === "revisao" && e.revisao?.status === "pendente");
      else if (filtroStatus === "estudo") result = result.filter(e => e.type === "estudo");
    }
    if (filtroPeriodo !== "todos") {
      const now = new Date();
      let cutoff: Date;
      if (filtroPeriodo === "7d") { cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7); }
      else if (filtroPeriodo === "30d") { cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30); }
      else { cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 90); }
      result = result.filter(e => new Date(e.date) >= cutoff);
    }

    return result;
  }, [timeline, filtroTema, filtroEspec, filtroStatus, filtroPeriodo]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">📜 Histórico</h2>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tema..."
            value={filtroTema}
            onChange={(e) => setFiltroTema(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={filtroEspec} onValueChange={setFiltroEspec}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas especialidades</SelectItem>
            {especialidades.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="estudo">Estudos</SelectItem>
            <SelectItem value="concluida">Revisões concluídas</SelectItem>
            <SelectItem value="pendente">Revisões pendentes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo período</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Nenhum registro encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 50).map((entry, i) => {
            const desemp = entry.type === "revisao" && entry.revisao
              ? desempenhos.find(d => d.revisao_id === entry.revisao!.id)
              : entry.type === "estudo"
              ? desempenhos.find(d => d.tema_id === entry.tema.id && !d.revisao_id)
              : null;

            return (
              <div key={`${entry.type}-${entry.tema.id}-${entry.revisao?.id || i}`} className="glass-card p-3 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {entry.type === "estudo" ? (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">D0</span>
                    </div>
                  ) : entry.revisao?.status === "concluida" ? (
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{entry.tema.tema}</span>
                    {entry.revisao && <Badge variant="outline" className="text-[9px]">{entry.revisao.tipo_revisao}</Badge>}
                    <Badge variant="secondary" className="text-[9px]">{entry.tema.especialidade}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                    <span>{new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    {entry.type === "estudo" && <span>Estudo inicial</span>}
                    {entry.revisao && <span>{entry.revisao.status === "concluida" ? "Concluída" : "Pendente"}</span>}
                    {desemp && (
                      <>
                        <span>{desemp.questoes_feitas}q / {desemp.questoes_erradas}e</span>
                        <span className={desemp.taxa_acerto >= 80 ? "text-emerald-500" : desemp.taxa_acerto >= 60 ? "text-amber-500" : "text-destructive"}>
                          {desemp.taxa_acerto}% acerto
                        </span>
                        {desemp.observacoes && <span className="truncate max-w-[150px]">📝 {desemp.observacoes}</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length > 50 && (
            <p className="text-xs text-muted-foreground text-center py-2">Mostrando 50 de {filtered.length} registros</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CronogramaHistorico;
