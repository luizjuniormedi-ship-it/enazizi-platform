import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Stethoscope, ChevronRight, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function OnboardingV2Flow({ onComplete, onSkip }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState("4");
  const [saving, setSaving] = useState(false);

  const handleSkip = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        onboarding_version: 2,
        experience_reset_at: new Date().toISOString(),
        last_onboarding_step: 0,
        daily_study_hours: 4,
      }).eq("user_id", user.id);

      localStorage.setItem("enazizi_v2_welcome_seen", "true");
      localStorage.setItem("enazizi_v2_onboarding_done", "true");
      localStorage.setItem("enazizi_exam_setup_skipped", "true");

      onSkip ? onSkip() : onComplete();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndFinish = async (doDiagnostic: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        onboarding_version: 2,
        experience_reset_at: new Date().toISOString(),
        last_onboarding_step: 3,
        daily_study_hours: parseFloat(dailyHours) || 4,
      };
      if (examDate) updates.exam_date = examDate;

      await supabase.from("profiles").update(updates).eq("user_id", user.id);

      localStorage.removeItem("enazizi_onboarding_completed_v2");
      localStorage.removeItem("onboarding_checklist_dismissed_v2");
      localStorage.setItem("enazizi_v2_welcome_seen", "true");
      localStorage.setItem("enazizi_v2_onboarding_done", "true");
      localStorage.removeItem("enazizi_exam_setup_skipped");

      onComplete();

      if (doDiagnostic) {
        navigate("/dashboard/diagnostico");
      }
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Progress */}
        <div className="flex items-center gap-2 justify-center">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? "bg-primary w-12" : "bg-muted w-8"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 text-center">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Qual sua prova-alvo?</h2>
            <p className="text-sm text-muted-foreground">
              Informe a data aproximada da sua prova para otimizarmos o plano.
            </p>
            <div className="space-y-2 text-left">
              <Label>Data da prova (opcional)</Label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <Button onClick={() => setStep(2)} className="w-full gap-2">
              Continuar <ChevronRight className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="text-xs text-muted-foreground hover:underline mx-auto block"
            >
              Pular configuração e entrar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Clock className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Quantas horas por dia?</h2>
            <p className="text-sm text-muted-foreground">
              Isso define o tamanho do seu plano diário de estudo.
            </p>
            <div className="space-y-2 text-left">
              <Label>Horas disponíveis por dia</Label>
              <Select value={dailyHours} onValueChange={setDailyHours}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h} hora{h > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1 gap-2">
                Continuar <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Stethoscope className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Personalizar seu plano?</h2>
            <p className="text-sm text-muted-foreground">
              Um nivelamento rápido identifica seus pontos fortes e fracos para criar um plano sob medida.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => handleSaveAndFinish(true)}
                disabled={saving}
                className="w-full gap-2"
              >
                <Stethoscope className="h-4 w-4" /> Fazer nivelamento
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveAndFinish(false)}
                disabled={saving}
                className="w-full gap-2"
              >
                Pular por enquanto <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
