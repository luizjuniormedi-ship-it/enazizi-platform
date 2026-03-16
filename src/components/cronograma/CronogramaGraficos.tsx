import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import type { TemaEstudado, Revisao, Desempenho } from "@/pages/CronogramaInteligente";

interface Props {
  temas: TemaEstudado[];
  revisoes: Revisao[];
  desempenhos: Desempenho[];
}

const CronogramaGraficos = ({ temas, revisoes, desempenhos }: Props) => {
  // Error rate by specialty
  const specMap: Record<string, { total: number; erros: number }> = {};
  desempenhos.forEach((d) => {
    const tema = temas.find(t => t.id === d.tema_id);
    if (!tema) return;
    if (!specMap[tema.especialidade]) specMap[tema.especialidade] = { total: 0, erros: 0 };
    specMap[tema.especialidade].total += d.questoes_feitas;
    specMap[tema.especialidade].erros += d.questoes_erradas;
  });
  const erroData = Object.entries(specMap).map(([name, v]) => ({
    name: name.length > 12 ? name.slice(0, 12) + "…" : name,
    erro: v.total > 0 ? Math.round((v.erros / v.total) * 100) : 0,
    acerto: v.total > 0 ? Math.round(((v.total - v.erros) / v.total) * 100) : 0,
  })).sort((a, b) => b.erro - a.erro);

  // Reviews pie
  const done = revisoes.filter(r => r.status === "concluida").length;
  const pending = revisoes.filter(r => r.status === "pendente").length;
  const pieData = [{ name: "Concluídas", value: done }, { name: "Pendentes", value: pending }];

  // Weekly reviews
  const weeklyData: Record<string, number> = {};
  revisoes.filter(r => r.status === "concluida" && r.concluida_em).forEach(r => {
    const week = r.concluida_em!.split("T")[0].slice(0, 7);
    weeklyData[week] = (weeklyData[week] || 0) + 1;
  });
  const weeklyChart = Object.entries(weeklyData).sort().slice(-8).map(([month, count]) => ({ month, count }));

  // Top errored themes
  const temaErros: Record<string, { nome: string; erros: number }> = {};
  desempenhos.forEach(d => {
    const tema = temas.find(t => t.id === d.tema_id);
    if (!tema) return;
    if (!temaErros[tema.id]) temaErros[tema.id] = { nome: tema.tema, erros: 0 };
    temaErros[tema.id].erros += d.questoes_erradas;
  });
  const topErros = Object.values(temaErros).sort((a, b) => b.erros - a.erros).slice(0, 8).map(t => ({
    name: t.nome.length > 15 ? t.nome.slice(0, 15) + "…" : t.nome,
    erros: t.erros,
  }));

  // Performance evolution
  const timeData = desempenhos.slice(0, 20).reverse().map((d, i) => ({
    idx: i + 1,
    erro: d.questoes_feitas > 0 ? Math.round((d.questoes_erradas / d.questoes_feitas) * 100) : 0,
    acerto: d.taxa_acerto,
  }));

  // Preparation evolution (simulated from cumulative performance)
  const prepEvolution = desempenhos.slice(0, 15).reverse().map((d, i, arr) => {
    const slice = arr.slice(0, i + 1);
    const avgAcerto = slice.reduce((s, x) => s + x.taxa_acerto, 0) / slice.length;
    return { idx: i + 1, preparo: Math.min(100, Math.round(avgAcerto * 0.7 + Math.min(i * 3, 30))) };
  });

  if (temas.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-muted-foreground">Registre temas para ver seus gráficos.</p>
      </div>
    );
  }

  const chartStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {erroData.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-2">📉 Erro vs Acerto por Especialidade</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={erroData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
              <Tooltip contentStyle={chartStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="erro" fill="#ef4444" radius={[3, 3, 0, 0]} name="Erro %" />
              <Bar dataKey="acerto" fill="#10b981" radius={[3, 3, 0, 0]} name="Acerto %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card p-4">
        <h3 className="font-semibold text-sm mb-2">🔄 Revisões</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
              {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? "#10b981" : "hsl(var(--muted))"} />)}
            </Pie>
            <Tooltip contentStyle={chartStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {topErros.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-2">🚨 Temas Mais Errados</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topErros} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={110} />
              <Tooltip contentStyle={chartStyle} />
              <Bar dataKey="erros" fill="#ef4444" radius={[0, 3, 3, 0]} name="Erros" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {weeklyChart.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-2">📅 Revisões por Mês</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={chartStyle} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Revisões" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {timeData.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-2">📈 Evolução: Erro vs Acerto</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="idx" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
              <Tooltip contentStyle={chartStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="erro" stroke="#ef4444" strokeWidth={2} name="Erro %" dot={{ r: 2 }} />
              <Line type="monotone" dataKey="acerto" stroke="#10b981" strokeWidth={2} name="Acerto %" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {prepEvolution.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-2">🎯 Evolução do Preparo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={prepEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="idx" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
              <Tooltip contentStyle={chartStyle} />
              <Line type="monotone" dataKey="preparo" stroke="hsl(var(--primary))" strokeWidth={2} name="Preparo %" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CronogramaGraficos;
