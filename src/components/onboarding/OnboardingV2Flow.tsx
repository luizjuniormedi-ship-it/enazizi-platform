import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Rocket, Calendar, Clock, Stethoscope, ChevronRight, ArrowRight,
  CheckCircle2, TrendingUp, Target, Zap, Brain, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Props {
  onComplete: () => void;
  onSkip?: () => void;
}

const TOTAL_STEPS = 6;

const QUICK_QUESTIONS = [
  {
    topic: "Cardiologia",
    question: "Qual é o achado clássico na estenose mitral?",
    options: ["Sopro diastólico em ruflar", "Sopro sistólico ejetivo", "B3 presente", "Desdobramento fixo de B2"],
    correct: 0,
  },
  {
    topic: "Infectologia",
    question: "Qual o agente etiológico mais comum da meningite bacteriana em adultos?",
    options: ["Streptococcus pneumoniae", "Neisseria meningitidis", "Haemophilus influenzae", "Listeria monocytogenes"],
    correct: 0,
  },
  {
    topic: "Cirurgia",
    question: "Sinal de Murphy é sugestivo de:",
    options: ["Colecistite aguda", "Apendicite aguda", "Pancreatite aguda", "Úlcera perfurada"],
    correct: 0,
  },
  {
    topic: "Pediatria",
    question: "A vacina BCG é aplicada em que momento?",
    options: ["Ao nascimento", "2 meses", "6 meses", "12 meses"],
    correct: 0,
  },
  {
    topic: "Ginecologia",
    question: "Qual exame é padrão-ouro para diagnóstico de endometriose?",
    options: ["Laparoscopia", "Ultrassom transvaginal", "Ressonância magnética", "CA-125"],
    correct: 0,
  },
];

export default function OnboardingV2Flow({ onComplete, onSkip }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState("4");
  const [targetSpecialty, setTargetSpecialty] = useState("");
  const [saving, setSaving] = useState(false);

  // Quick diagnostic state
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(QUICK_QUESTIONS.map(() => null));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const correctCount = answers.filter((a, i) => a === QUICK_QUESTIONS[i].correct).length;
  const answeredCount = answers.filter((a) => a !== null).length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const level = accuracy >= 70 ? "Avançado" : accuracy >= 40 ? "Intermediário" : "Iniciante";
  const approvalChance = Math.min(95, Math.max(15, accuracy + 10));
  const projectedImprovement = Math.min(40, Math.max(10, 30 - Math.floor(accuracy / 10)));

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

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        onboarding_version: 2,
        experience_reset_at: new Date().toISOString(),
        last_onboarding_step: step,
        daily_study_hours: parseFloat(dailyHours) || 4,
      };
      if (examDate) updates.exam_date = examDate;
      if (targetSpecialty) updates.target_specialty = targetSpecialty;

      await supabase.from("profiles").update(updates).eq("user_id", user.id);
    } catch {
      // silent — will retry on final save
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        onboarding_version: 2,
        experience_reset_at: new Date().toISOString(),
        last_onboarding_step: TOTAL_STEPS,
        daily_study_hours: parseFloat(dailyHours) || 4,
        has_completed_diagnostic: answeredCount > 0,
        ...(examDate ? { exam_date: examDate } : {}),
        ...(targetSpecialty ? { target_specialty: targetSpecialty } : {}),
      }).eq("user_id", user.id);

      localStorage.setItem("enazizi_v2_welcome_seen", "true");
      localStorage.setItem("enazizi_v2_onboarding_done", "true");
      localStorage.removeItem("enazizi_exam_setup_skipped");

      onComplete();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const nextStep = useCallback(() => {
    if (step === 2) handleSaveProfile();
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }, [step]);

  const answerQuestion = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
    setSelectedOption(null);

    setTimeout(() => {
      if (currentQ < QUICK_QUESTIONS.length - 1) {
        setCurrentQ((q) => q + 1);
      } else {
        setStep(4); // go to results
      }
    }, 600);
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md sm:max-w-lg space-y-6 animate-fade-in">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Passo {step} de {TOTAL_STEPS}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* STEP 1 — INTRO */}
        {step === 1 && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">
                Você não precisa decidir o que estudar
              </h1>
              <p className="text-lg text-muted-foreground font-medium">
                Nós fazemos isso por você.
              </p>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Em menos de 2 minutos vamos criar seu plano personalizado de estudo.
            </p>
            <Button onClick={nextStep} size="lg" className="w-full gap-2 text-lg py-6">
              Começar <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* STEP 2 — EXAM SETUP */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Configure sua prova</h2>
              <p className="text-sm text-muted-foreground">
                Isso personaliza 100% do seu plano de estudo.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div className="space-y-2">
                <Label>Especialidade alvo</Label>
                <Select value={targetSpecialty} onValueChange={setTargetSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ex: Clínica Médica" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Clínica Médica", "Cirurgia Geral", "Pediatria", "Ginecologia e Obstetrícia",
                      "Medicina de Família", "Ortopedia", "Cardiologia", "Dermatologia",
                      "Neurologia", "Psiquiatria", "Outra"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data da prova (opcional)</Label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Horas de estudo por dia</Label>
                <Select value={dailyHours} onValueChange={setDailyHours}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {h} hora{h > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={nextStep} className="w-full gap-2">
              Gerar meu plano <Sparkles className="h-4 w-4" />
            </Button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="text-xs text-muted-foreground hover:underline mx-auto block"
            >
              Pular e definir depois
            </button>
          </div>
        )}

        {/* STEP 3 — QUICK DIAGNOSTIC */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Stethoscope className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Nivelamento rápido</h2>
              <p className="text-sm text-muted-foreground">
                {QUICK_QUESTIONS.length} perguntas para calibrar seu nível
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{currentQ + 1}/{QUICK_QUESTIONS.length}</span>
              <Progress value={((currentQ + 1) / QUICK_QUESTIONS.length) * 100} className="h-1.5 flex-1" />
              <span className="text-primary font-medium">{QUICK_QUESTIONS[currentQ].topic}</span>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium leading-relaxed">
                {QUICK_QUESTIONS[currentQ].question}
              </p>

              <RadioGroup
                value={selectedOption ?? ""}
                onValueChange={(val) => {
                  setSelectedOption(val);
                  answerQuestion(parseInt(val));
                }}
                className="space-y-2"
              >
                {QUICK_QUESTIONS[currentQ].options.map((opt, i) => {
                  const answered = answers[currentQ] !== null;
                  const isCorrect = i === QUICK_QUESTIONS[currentQ].correct;
                  const wasSelected = answers[currentQ] === i;

                  return (
                    <label
                      key={i}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all text-sm",
                        answered && isCorrect && "border-green-500 bg-green-500/10",
                        answered && wasSelected && !isCorrect && "border-red-500 bg-red-500/10",
                        !answered && "hover:border-primary/50 hover:bg-accent/50"
                      )}
                    >
                      <RadioGroupItem value={String(i)} disabled={answered} />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            <button
              type="button"
              onClick={() => setStep(4)}
              className="text-xs text-muted-foreground hover:underline mx-auto block"
            >
              Pular diagnóstico
            </button>
          </div>
        )}

        {/* STEP 4 — RESULT */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in text-center">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>

            <h2 className="text-xl font-bold">Seu perfil inicial</h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-card p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Nível</p>
                <p className={cn(
                  "text-lg font-bold",
                  level === "Avançado" && "text-green-500",
                  level === "Intermediário" && "text-yellow-500",
                  level === "Iniciante" && "text-orange-500"
                )}>
                  {level}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Aprovação</p>
                <p className="text-lg font-bold text-primary">{approvalChance}%</p>
              </div>
              <div className="rounded-xl border bg-card p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Projeção</p>
                <p className="text-lg font-bold text-green-500">+{projectedImprovement}%</p>
              </div>
            </div>

            {answeredCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Você acertou {correctCount} de {answeredCount} — {accuracy}% de acurácia
              </p>
            )}

            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Com estudo guiado, alunos como você evoluem até <strong className="text-foreground">3x mais rápido</strong>.
            </p>

            <Button onClick={nextStep} className="w-full gap-2">
              Continuar <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STEP 5 — SIMPLE EXPLANATION */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Zap className="h-7 w-7 text-primary" />
            </div>

            <h2 className="text-xl font-bold">Seu estudo funciona assim</h2>

            <div className="space-y-3 text-left">
              {[
                { num: "1", text: "Você entra no sistema", icon: Rocket },
                { num: "2", text: "Clica em 'Começar estudo'", icon: Target },
                { num: "3", text: "O sistema guia você automaticamente", icon: Brain },
              ].map(({ num, text, icon: Icon }) => (
                <div key={num} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Passo {num}</span>
                    <p className="font-medium text-sm">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Sem decisões. Sem dúvida. Apenas estude.
            </p>

            <Button onClick={nextStep} className="w-full gap-2">
              Entendi <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STEP 6 — FIRST MISSION */}
        {step === 6 && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
              <Rocket className="h-12 w-12 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black">Vamos começar agora</h2>
              <p className="text-muted-foreground">
                Sua primeira missão de estudo está pronta.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 text-left space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Plano personalizado criado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Nível calibrado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Primeira missão disponível</span>
              </div>
            </div>

            <Button
              onClick={handleFinish}
              disabled={saving}
              size="lg"
              className="w-full gap-2 text-lg py-6 font-bold"
            >
              {saving ? "Salvando..." : "COMEÇAR ESTUDO"} <Rocket className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
