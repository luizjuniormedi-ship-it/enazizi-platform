import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, ArrowRight, CalendarDays, Clock, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ALL_SPECIALTIES } from "@/constants/specialties";
...
    try {
      const updates: TablesUpdate<"profiles"> = {
        exam_date: examDate,
        daily_study_hours: parseFloat(dailyHours) || 4,
      };
      if (targetSpecialty) updates.target_specialty = targetSpecialty;

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);
      if (error) throw error;

      localStorage.setItem("enazizi_exam_just_configured", "true");
      toast({ title: "Prova configurada! ✅", description: "Seu plano será otimizado automaticamente." });
      setDialogOpen(false);
      setShow(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Seu plano pode estar atrasando sua aprovação</p>
            <p className="text-xs text-muted-foreground">
              Sem a prova-alvo definida, o sistema não consegue otimizar seu estudo.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="shrink-0 gap-1">
            Corrigir agora <ArrowRight className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-base">Configure sua prova-alvo</DialogTitle>
            </div>
            <DialogDescription className="text-sm">
              Com a prova definida, o sistema personaliza seu plano de estudo e calcula sua chance de aprovação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                Data da prova
              </Label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                Especialidade desejada (opcional)
              </Label>
              <Select value={targetSpecialty} onValueChange={setTargetSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SPECIALTIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Horas de estudo por dia
              </Label>
              <Select value={dailyHours} onValueChange={setDailyHours}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                    <SelectItem key={h} value={String(h)}>{h}h por dia</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Ativar modo aprovação</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
