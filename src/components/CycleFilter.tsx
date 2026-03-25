import { SPECIALTY_CYCLES, ALL_SPECIALTIES } from "@/constants/specialties";

interface CycleFilterProps {
  activeCycle: string | null;
  onCycleChange: (cycle: string | null) => void;
  className?: string;
}

export function getFilteredSpecialties(cycle: string | null): string[] {
  if (!cycle) return ALL_SPECIALTIES;
  const found = SPECIALTY_CYCLES.find(c => c.label === cycle);
  return found ? found.specialties : ALL_SPECIALTIES;
}

const CYCLE_SHORT_LABELS: Record<string, string> = {
  "Ciclo Básico (1º-2º ano)": "Básico",
  "Ciclo Clínico (3º-4º ano)": "Clínico",
  "Internato (5º-6º ano)": "Internato",
};

const CycleFilter = ({ activeCycle, onCycleChange, className = "" }: CycleFilterProps) => {
  const buttons = [
    { label: "Todos", value: null as string | null },
    ...SPECIALTY_CYCLES.map(c => ({ label: CYCLE_SHORT_LABELS[c.label] || c.label, value: c.label })),
  ];

  return (
    <div className={`flex gap-1.5 flex-wrap ${className}`}>
      {buttons.map(b => (
        <button
          key={b.label}
          onClick={() => onCycleChange(b.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            activeCycle === b.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
};

export default CycleFilter;
