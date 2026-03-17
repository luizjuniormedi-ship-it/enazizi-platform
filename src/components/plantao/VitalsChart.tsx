import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface VitalsSnapshot {
  time: number; // minutes elapsed
  PA_sys: number;
  PA_dia: number;
  FC: number;
  FR: number;
  SpO2: number;
  Temp: number;
}

interface VitalsChartProps {
  snapshots: VitalsSnapshot[];
}

function parseVitalValue(val: string, type: "PA_sys" | "PA_dia" | "FC" | "FR" | "SpO2" | "Temp"): number {
  if (!val) return 0;
  const clean = val.replace(/[^\d.,/x]/g, "");
  if (type === "PA_sys") {
    const parts = clean.split(/[/x]/);
    return parseInt(parts[0]) || 0;
  }
  if (type === "PA_dia") {
    const parts = clean.split(/[/x]/);
    return parseInt(parts[1]) || 0;
  }
  if (type === "Temp") {
    return parseFloat(clean.replace(",", ".")) || 0;
  }
  return parseInt(clean) || 0;
}

export function parseVitalsToSnapshot(vitals: Record<string, string>, timeElapsed: number): VitalsSnapshot {
  return {
    time: timeElapsed,
    PA_sys: parseVitalValue(vitals.PA || "", "PA_sys"),
    PA_dia: parseVitalValue(vitals.PA || "", "PA_dia"),
    FC: parseVitalValue(vitals.FC || "", "FC"),
    FR: parseVitalValue(vitals.FR || "", "FR"),
    SpO2: parseVitalValue(vitals.SpO2 || "", "SpO2"),
    Temp: parseVitalValue(vitals.Temp || "", "Temp"),
  };
}

const VitalsChart = ({ snapshots }: VitalsChartProps) => {
  if (snapshots.length < 1) return null;

  const latest = snapshots[snapshots.length - 1];

  const vitalIndicators = [
    { label: "PAS", value: latest.PA_sys, unit: "mmHg", normal: [90, 140], color: "hsl(var(--primary))" },
    { label: "PAD", value: latest.PA_dia, unit: "mmHg", normal: [60, 90], color: "hsl(var(--primary))" },
    { label: "FC", value: latest.FC, unit: "bpm", normal: [60, 100], color: "#ef4444" },
    { label: "FR", value: latest.FR, unit: "irpm", normal: [12, 20], color: "#3b82f6" },
    { label: "SpO2", value: latest.SpO2, unit: "%", normal: [95, 100], color: "#22c55e" },
    { label: "Temp", value: latest.Temp, unit: "°C", normal: [36, 37.8], color: "#f59e0b" },
  ];

  const getColor = (value: number, normal: number[]) => {
    if (value < normal[0]) return "text-amber-500";
    if (value > normal[1]) return "text-red-500";
    return "text-green-500";
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-3 space-y-3">
        <h4 className="text-xs font-semibold flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-red-500" />
          Monitor de Sinais Vitais
        </h4>

        {/* Current values */}
        <div className="grid grid-cols-3 gap-1.5">
          {vitalIndicators.map((v) => (
            <div key={v.label} className="text-center p-1.5 rounded-md bg-muted/30 border border-border/30">
              <p className="text-[10px] text-muted-foreground">{v.label}</p>
              <p className={`text-sm font-bold font-mono ${getColor(v.value, v.normal)}`}>
                {v.label === "Temp" ? v.value.toFixed(1) : v.value}
              </p>
              <p className="text-[9px] text-muted-foreground">{v.unit}</p>
            </div>
          ))}
        </div>

        {/* Chart - only show if 2+ snapshots */}
        {snapshots.length >= 2 && (
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshots} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <XAxis dataKey="time" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}min`} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelFormatter={(v) => `${v} min`}
                />
                <Line type="monotone" dataKey="FC" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} name="FC" />
                <Line type="monotone" dataKey="PA_sys" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={{ r: 2 }} name="PAS" />
                <Line type="monotone" dataKey="SpO2" stroke="#22c55e" strokeWidth={1.5} dot={{ r: 2 }} name="SpO2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {snapshots.length >= 2 && (
          <div className="flex gap-2 justify-center">
            <Badge variant="outline" className="text-[9px] gap-1"><span className="w-2 h-0.5 bg-red-500 inline-block" /> FC</Badge>
            <Badge variant="outline" className="text-[9px] gap-1"><span className="w-2 h-0.5 bg-primary inline-block" /> PAS</Badge>
            <Badge variant="outline" className="text-[9px] gap-1"><span className="w-2 h-0.5 bg-green-500 inline-block" /> SpO2</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VitalsChart;
