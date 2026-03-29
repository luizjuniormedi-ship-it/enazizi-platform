export interface DashboardData {
  system: { status: string; uptime: string; apiResponseTime: number; errorRate: number };
  users: { activeNow: number; totalApproved: number; pendingApproval: number };
  studyEngine: { dailyPlansToday: number; tasksCompleted: number; overdueTasks: number; executionRate: number };
  ai: { totalCalls24h: number; avgResponseTime: number; failureRate: number; byModule: { name: string; calls: number }[] };
  learning: {
    avgApprovalScore: number;
    totalQuestionsBank: number;
    recentErrors: number;
    topTopics: { topic: string; count: number }[];
    weakTopics: { topic: string; accuracy: number; questions: number }[];
  };
  students?: StudentRow[];
  riskAlerts?: RiskAlert[];
  timestamp: string;
}

export interface StudentRow {
  user_id: string;
  display_name: string;
  email: string;
  last_seen_at: string | null;
  approval_score: number;
  accuracy: number;
  tasks_completed: number;
  tasks_overdue: number;
  total_study_minutes: number;
  status: "green" | "yellow" | "red";
}

export interface RiskAlert {
  user_id: string;
  display_name: string;
  reason: string;
  severity: "low" | "medium" | "high";
  details: string;
}
