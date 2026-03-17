import type { Stats } from "./AdminTypes";

interface AdminPlanDistributionProps {
  stats: Stats | null;
}

const AdminPlanDistribution = ({ stats }: AdminPlanDistributionProps) => {
  if (!stats?.planCounts || Object.keys(stats.planCounts).length === 0) return null;

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-4">Distribuição por plano</h2>
      <div className="space-y-3">
        {Object.entries(stats.planCounts).map(([plan, count]) => {
          const total = stats.totalUsers || 1;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={plan}>
              <div className="flex justify-between text-sm mb-1">
                <span>{plan}</span>
                <span className="text-muted-foreground">{count} ({pct}%)</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPlanDistribution;
