export interface StudyBlock {
  order: number;
  type: string;
  topic: string;
  duration_minutes: number;
  description: string;
  priority: string;
  reason: string;
  summary?: string;
  learningGoal?: string;
  prerequisite?: string;
}

export interface DailyPlanData {
  greeting: string;
  focus_areas: string[];
  blocks: StudyBlock[];
  total_minutes: number;
  tips: string[];
  review_reminder: string;
}

export interface ScheduledReview {
  id: string;
  tema_id: string;
  tipo_revisao: string;
  data_revisao: string;
  status: string;
  prioridade: number | null;
  risco_esquecimento: string | null;
  tema: string;
  especialidade: string;
  subtopico: string | null;
  overdue: boolean;
  estimatedMinutes?: number;
}

export interface TopicMastery {
  tema: string;
  especialidade: string;
  totalAttempts: number;
  correctAttempts: number;
  reviewsDone: number;
  level: "iniciante" | "basico" | "intermediario" | "avancado" | "dominado";
  percentage: number;
}
