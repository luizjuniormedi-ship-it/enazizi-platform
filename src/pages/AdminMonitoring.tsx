import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, RefreshCw, Wifi, WifiOff, XCircle } from "lucide-react";
import { DashboardData } from "@/components/monitoring/MonitoringTypes";
import { OverviewTab } from "@/components/monitoring/OverviewTab";
import { StudentsTab } from "@/components/monitoring/StudentsTab";
import { PerformanceTab } from "@/components/monitoring/PerformanceTab";
import { RiskAlertsTab } from "@/components/monitoring/RiskAlertsTab";
import { AIUsageTab } from "@/components/monitoring/AIUsageTab";
import { SystemHealthTab } from "@/components/monitoring/SystemHealthTab";

export default function AdminMonitoring() {
  const { session } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: dashboard, isLoading, refetch, isFetching } = useQuery<DashboardData>({
    queryKey: ["admin-monitoring-dashboard"],
    queryFn: async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-health-check?mode=dashboard`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${s?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch monitoring data");
      return response.json();
    },
    enabled: !!session,
    staleTime: 30_000,
    refetchInterval: autoRefresh ? 60_000 : false,
  });

  const { data: alertsData } = useQuery({
    queryKey: ["admin-monitoring-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_health_reports" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!session,
    staleTime: 60_000,
  });

  const d = dashboard;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" />
            Monitoramento do Sistema
          </h1>
          <p className="text-xs text-muted-foreground">
            {d?.timestamp ? `Última atualização: ${new Date(d.timestamp).toLocaleTimeString("pt-BR")}` : "Carregando..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={() => setAutoRefresh(!autoRefresh)} className="gap-1 text-xs">
            {autoRefresh ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : d ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
            <TabsTrigger value="students" className="text-xs">Alunos</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs">Desempenho</TabsTrigger>
            <TabsTrigger value="risk" className="text-xs">Riscos e Alertas</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">IA</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab d={d} /></TabsContent>
          <TabsContent value="students"><StudentsTab students={d.students || []} /></TabsContent>
          <TabsContent value="performance"><PerformanceTab d={d} /></TabsContent>
          <TabsContent value="risk"><RiskAlertsTab alerts={d.riskAlerts || []} systemAlerts={(alertsData as any)?.alerts || []} /></TabsContent>
          <TabsContent value="ai"><AIUsageTab d={d} /></TabsContent>
          <TabsContent value="system"><SystemHealthTab d={d} /></TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm">Erro ao carregar dados de monitoramento</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
