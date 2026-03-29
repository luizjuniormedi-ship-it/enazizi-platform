import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function ExamSetupReminder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkExam = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("exam_date")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data?.exam_date) setShow(true);
    };
    checkExam();
  }, [user]);

  if (!show) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Target className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Complete sua prova-alvo</p>
          <p className="text-xs text-muted-foreground">
            Personalize seu plano definindo a prova e data do exame.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate("/profile")} className="shrink-0 gap-1">
          Configurar <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
