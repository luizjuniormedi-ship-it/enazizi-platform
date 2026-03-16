import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import type { TemaEstudado, Revisao, Desempenho } from "@/pages/CronogramaInteligente";

interface Props {
  temas: TemaEstudado[];
  revisoes: Revisao[];
  desempenhos: Desempenho[];
}

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1", "#14b8a6"];

const CronogramaGraficos = ({ temas, revisoes, desempenhos }: Props) => {
  // Error rate by specialty
  const specMap: Record<string, { total: number; erros: number }> = {};
  desempenhos.forEach((d) => {
    const tema = temas.find(t => t.id === d.tema_id);
    if (!tema) return;
    const spec = tema.especialidade;
    if (!specMap[spec]) specMap[spec] = { total: 0, erros: 0 };
    specMap[spec].total += d.questoes_feitas;
    specMap[spec].erros += d.questoes_erradas;
  });
  const erroData = Object.entries(specMap).map(([name, v]) => ({
    name: name.length > 12 ? name.slice(0, 12) + "…" : name,
    erro: v.total > 0 ? Math.round((v.erros / v.total) * 100) : 0,
    acerto: v.total > 0 ? Math.round(((v.total - v.erros) / v.total) * 100) : 0,
  })).sort((a, b) => b.erro - a.erro);

  // Reviews done vs pending
  const done = revisoes.filter(r => r.status === "concluida").length;
  const pending = revisoes.filter(r => r.status === "pendente").length;
  const pieData = [
    { name: "Concluídas", value: done },
    { name: "Pendentes", value: pending },
  ];

  // Themes by specialty
  const specCount: Record<string, number> = {};
  temas.forEach(t => { specCount[t.especialidade] = (specCount[t.especialidade] || 0) + 1; });
  const specData = Object.entries(specCount).map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, count })).sort((a, b) => b.count - a.count);

  // Error rate evolution over time
  const timeData = desempenhos
    .slice(0, 20)
    .reverse()
    .map((d, i) => ({
      idx: i + 1,
      erro: d.questoes_feitas > 0 ? Math.round((d.questoes_erradas / d.questoes_feitas) * 100) : 0,
      acerto: d.taxa_acerto,
    }));

  if (temas.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-muted-foreground">Registre temas e faça revisões para ver seus gráficos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Error rate by Specialty */}
      {erroData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-sm mb-3">📉 Taxa de Erro por Especialidade</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={erroData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="erro" fill="#ef4444" radius={[4, 4, 0, 0]} name="Erro (%)" />
              <Bar dataKey="acerto" fill="#10b981" radius={[4, 4, 0, 0]} name="Acerto (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reviews Pie */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-sm mb-3">🔄 Revisões: Concluídas vs Pendentes</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#10b981" : "hsl(var(--muted))"} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Themes by Specialty */}
      {specData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-sm mb-3">📚 Temas por Especialidade</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={specData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={100} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Temas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Error evolution over time */}
      {timeData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-sm mb-3">📈 Evolução: Erro vs Acerto</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Sessão", position: "insideBottom", offset: -5, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="erro" stroke="#ef4444" strokeWidth={2} name="Erro (%)" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="acerto" stroke="#10b981" strokeWidth={2} name="Acerto (%)" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CronogramaGraficos;
