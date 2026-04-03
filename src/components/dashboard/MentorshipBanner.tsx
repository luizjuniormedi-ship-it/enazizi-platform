import { useState, useEffect } from "react";
import { BookMarked, Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ActiveMentorship {
  id: string;
  name: string;
  exam_date: string | null;
  topics: { topic: string; subtopic: string | null }[];
  professor_name?: string;
}

const MentorshipBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentorships, setMentorships] = useState<ActiveMentorship[]>([]);

  useEffect(() => {
    if (!user) return;
    loadMentorships();
  }, [user]);

  const loadMentorships = async () => {
    if (!user) return;

    // Get plan IDs targeting this student
    const { data: targets } = await supabase
      .from("mentor_theme_plan_targets")
      .select("plan_id");

    if (!targets || targets.length === 0) return;

    const planIds = [...new Set(targets.map(t => t.plan_id))];

    const { data: plans } = await supabase
      .from("mentor_theme_plans")
      .select("id, name, exam_date, professor_id")
      .in("id", planIds)
      .eq("status", "active");

    if (!plans || plans.length === 0) return;

    // Get topics for these plans
    const { data: topics } = await supabase
      .from("mentor_theme_plan_topics")
      .select("plan_id, topic, subtopic")
      .in("plan_id", plans.map(p => p.id));

    // Get professor names
    const profIds = [...new Set(plans.map(p => p.professor_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", profIds);
    const profMap: Record<string, string> = {};
    (profiles || []).forEach(p => { profMap[p.user_id] = p.display_name || "Professor"; });

    const enriched: ActiveMentorship[] = plans.map(p => ({
      id: p.id,
      name: p.name,
      exam_date: p.exam_date,
      professor_name: profMap[p.professor_id],
      topics: (topics || []).filter(t => t.plan_id === p.id).map(t => ({ topic: t.topic, subtopic: t.subtopic })),
    }));

    setMentorships(enriched);
  };

  if (mentorships.length === 0) return null;

  return (
    <div className="space-y-2">
      {mentorships.map(m => (
        <Card key={m.id} className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <BookMarked className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold truncate">Mentoria: {m.name}</h3>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {m.professor_name || "Professor"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {m.topics.slice(0, 5).map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {t.topic}{t.subtopic ? ` → ${t.subtopic}` : ""}
                    </Badge>
                  ))}
                  {m.topics.length > 5 && (
                    <Badge variant="secondary" className="text-[10px]">+{m.topics.length - 5}</Badge>
                  )}
                </div>
                {m.exam_date && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Prova em {new Date(m.exam_date).toLocaleDateString("pt-BR")}
                    {(() => {
                      const days = Math.ceil((new Date(m.exam_date).getTime() - Date.now()) / 86400000);
                      return days > 0 ? ` (${days} dias)` : days === 0 ? " (HOJE!)" : "";
                    })()}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate("/dashboard/chatgpt?topic=" + encodeURIComponent(m.topics[0]?.topic || ""))}
                className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors shrink-0"
              >
                <ChevronRight className="h-4 w-4 text-primary" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MentorshipBanner;
