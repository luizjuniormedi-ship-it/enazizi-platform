import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

/**
 * Standard study context passed between modules in guided flows.
 * Free mode = no context (all fields undefined).
 */
export interface StudyContext {
  source: StudySource;
  specialty?: string;
  topic?: string;
  subtopic?: string;
  taskType?: StudyTaskType;
  objective?: StudyObjective;
  difficulty?: string;
  priority?: number;
  /** Brief reason shown to the user, e.g. "Taxa de acerto < 60%" */
  reason?: string;
}

export type StudySource =
  | "planner"
  | "daily-plan"
  | "mission"
  | "pending-reviews"
  | "weak-topics"
  | "error-bank"
  | "simulado-result"
  | "diagnostic"
  | "mentor"
  | "free";

export type StudyTaskType =
  | "review"
  | "error_review"
  | "practice"
  | "clinical"
  | "new"
  | "simulado";

export type StudyObjective =
  | "review"
  | "reinforcement"
  | "new_content"
  | "correction"
  | "practice";

const SOURCE_LABELS: Record<StudySource, string> = {
  planner: "Planner IA",
  "daily-plan": "Plano do Dia",
  mission: "Missão do Dia",
  "pending-reviews": "Revisões Pendentes",
  "weak-topics": "Pontos Fracos",
  "error-bank": "Banco de Erros",
  "simulado-result": "Resultado do Simulado",
  diagnostic: "Diagnóstico",
  mentor: "Mentor IA",
  free: "Modo Livre",
};

const OBJECTIVE_LABELS: Record<StudyObjective, string> = {
  review: "Revisão",
  reinforcement: "Reforço",
  new_content: "Conteúdo Novo",
  correction: "Correção de Erros",
  practice: "Prática",
};

export function getSourceLabel(source: StudySource): string {
  return SOURCE_LABELS[source] || source;
}

export function getObjectiveLabel(objective: StudyObjective): string {
  return OBJECTIVE_LABELS[objective] || objective;
}

/** Derive objective from task type */
export function objectiveFromTaskType(type: StudyTaskType): StudyObjective {
  switch (type) {
    case "review": return "review";
    case "error_review": return "correction";
    case "practice": return "practice";
    case "clinical": return "practice";
    case "new": return "new_content";
    case "simulado": return "practice";
    default: return "practice";
  }
}

// ── Serialization to/from URL search params ──

const CONTEXT_KEYS: (keyof StudyContext)[] = [
  "source", "specialty", "topic", "subtopic",
  "taskType", "objective", "difficulty", "priority", "reason",
];

/** Encode StudyContext into URLSearchParams (merges into existing params) */
export function encodeStudyContext(ctx: StudyContext, params?: URLSearchParams): URLSearchParams {
  const p = params ?? new URLSearchParams();
  for (const key of CONTEXT_KEYS) {
    const val = ctx[key];
    if (val !== undefined && val !== null && val !== "") {
      p.set(`sc_${key}`, String(val));
    }
  }
  return p;
}

/** Decode StudyContext from URLSearchParams. Returns null if no context present. */
export function decodeStudyContext(params: URLSearchParams): StudyContext | null {
  const source = params.get("sc_source") as StudySource | null;
  if (!source || source === "free") return null;

  const ctx: StudyContext = { source };
  if (params.get("sc_specialty")) ctx.specialty = params.get("sc_specialty")!;
  if (params.get("sc_topic")) ctx.topic = params.get("sc_topic")!;
  if (params.get("sc_subtopic")) ctx.subtopic = params.get("sc_subtopic")!;
  if (params.get("sc_taskType")) ctx.taskType = params.get("sc_taskType") as StudyTaskType;
  if (params.get("sc_objective")) ctx.objective = params.get("sc_objective") as StudyObjective;
  if (params.get("sc_difficulty")) ctx.difficulty = params.get("sc_difficulty")!;
  if (params.get("sc_priority")) ctx.priority = Number(params.get("sc_priority"));
  if (params.get("sc_reason")) ctx.reason = params.get("sc_reason")!;
  return ctx;
}

// ── React hook ──

/** Read StudyContext from current URL. Returns null in free mode. */
export function useStudyContext(): StudyContext | null {
  const [searchParams] = useSearchParams();
  return useMemo(() => decodeStudyContext(searchParams), [searchParams]);
}
