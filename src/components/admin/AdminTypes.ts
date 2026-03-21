export interface AdminUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  is_blocked: boolean;
  created_at: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  roles: string[];
  last_seen_at: string | null;
  faculdade: string | null;
  periodo: number | null;
  phone: string | null;
  user_type: string | null;
  subscription: { status: string; plan_id: string; plans: { name: string; price: number } | null } | null;
  quota: { questions_used: number; questions_limit: number } | null;
  evolution?: { avgScore: number; totalQuestions: number; specialties: number; recentAttempts: number; recentAccuracy: number };
}

export interface OnlineUser {
  user_id: string;
  display_name: string;
  email: string;
  current_page: string;
  last_seen_at: string;
}

export interface Stats {
  totalUsers: number;
  blockedUsers: number;
  activeSubs: number;
  pendingUsers: number;
  planCounts: Record<string, number>;
  onlineUsers: number;
  onlineUsersData: OnlineUser[];
}

export const PLANS = ["Free", "Pro", "Premium", "Enterprise"];
