import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, Save, Loader2, GraduationCap, Building, Phone, User, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FACULDADES } from "@/constants/faculdades";
import FaculdadeCombobox from "@/components/FaculdadeCombobox";


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Onboarding form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPeriodo, setFormPeriodo] = useState("");
  const [formFaculdade, setFormFaculdade] = useState("");
  const [formUserType, setFormUserType] = useState("estudante");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setCheckingProfile(false); return; }
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_blocked, status, display_name, phone, periodo, faculdade")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.is_blocked) {
        setProfileStatus("blocked");
      } else {
        setProfileStatus(data?.status || "pending");
      }
      // Check if profile is incomplete
      const userType = (data as any)?.user_type || "estudante";
      const isStudent = userType === "estudante";
      const incomplete = !data?.phone || !data?.display_name || (isStudent && (!data?.periodo || !data?.faculdade));
      setProfileIncomplete(incomplete);
      if (incomplete) {
        setFormName(data?.display_name || "");
        setFormPhone(data?.phone || "");
        setFormPeriodo(data?.periodo ? String(data.periodo) : "");
        setFormFaculdade(data?.faculdade || "");
        setFormUserType(userType);
      }
      setCheckingProfile(false);
    };
    check();
  }, [user]);

  const handleOnboardingSave = async () => {
    if (!user) return;
    const trimmedName = formName.trim();
    const cleanPhone = formPhone.replace(/\D/g, "");
    const isStudent = formUserType === "estudante";
    if (!trimmedName || !cleanPhone || cleanPhone.length < 10 || (isStudent && (!formPeriodo || !formFaculdade))) {
      toast({ title: "Preencha todos os campos corretamente", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        display_name: trimmedName,
        phone: cleanPhone,
        user_type: formUserType,
      };
      if (isStudent) {
        updateData.periodo = parseInt(formPeriodo);
        updateData.faculdade = formFaculdade;
      }
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);
      if (error) throw error;
      setProfileIncomplete(false);
      toast({ title: "Cadastro completo! 🎉" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (profileStatus === "blocked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <div className="text-5xl">🚫</div>
          <h1 className="text-2xl font-bold text-destructive">Conta Bloqueada</h1>
          <p className="text-muted-foreground max-w-md">
            Sua conta foi bloqueada pelo administrador. Entre em contato com o suporte para mais informações.
          </p>
          <Button variant="outline" onClick={() => signOut()} className="gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </div>
    );
  }

  // Force onboarding BEFORE showing pending/approval screen
  if (profileIncomplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Complete seu cadastro</h1>
            <p className="text-muted-foreground text-sm">
              Para acessar a plataforma, preencha todas as informações abaixo.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nome completo
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Seu nome completo"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Eu sou</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormUserType("estudante")}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${formUserType === "estudante" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-accent"}`}
                >
                  <GraduationCap className="h-4 w-4" />
                  Estudante
                </button>
                <button
                  type="button"
                  onClick={() => setFormUserType("medico")}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${formUserType === "medico" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-accent"}`}
                >
                  <Stethoscope className="h-4 w-4" />
                  Médico
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                WhatsApp
              </Label>
              <Input
                value={formPhone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  let formatted = digits;
                  if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                  if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                  setFormPhone(formatted);
                }}
                placeholder="(21) 99999-9999"
                maxLength={16}
              />
            </div>

            {formUserType === "estudante" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    Período
                  </Label>
                  <Select value={formPeriodo} onValueChange={setFormPeriodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                        <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                    Faculdade
                  </Label>
                  <FaculdadeCombobox value={formFaculdade} onChange={setFormFaculdade} />
                </div>
              </div>
            )}

            <Button onClick={handleOnboardingSave} disabled={saving} className="w-full mt-2">
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Salvar e acessar</>
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (profileStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold">Aguardando Aprovação</h1>
          <p className="text-muted-foreground">
            Sua conta está aguardando aprovação do administrador. Você receberá acesso assim que for aprovado.
          </p>
          <div className="pt-4">
            <Button variant="outline" onClick={() => signOut()} className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (profileStatus === "disabled") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="text-5xl">❌</div>
          <h1 className="text-2xl font-bold text-destructive">Conta Rejeitada</h1>
          <p className="text-muted-foreground">
            Sua solicitação de acesso foi rejeitada pelo administrador. Entre em contato com o suporte se acredita que isso é um erro.
          </p>
          <Button variant="outline" onClick={() => signOut()} className="gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </div>
    );
  }


  if (profileStatus === "active" && profileIncomplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Complete seu cadastro</h1>
            <p className="text-muted-foreground text-sm">
              Para acessar a plataforma, preencha todas as informações abaixo.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nome completo
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Seu nome completo"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Eu sou</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormUserType("estudante")}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${formUserType === "estudante" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-accent"}`}
                >
                  <GraduationCap className="h-4 w-4" />
                  Estudante
                </button>
                <button
                  type="button"
                  onClick={() => setFormUserType("medico")}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${formUserType === "medico" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-accent"}`}
                >
                  <Stethoscope className="h-4 w-4" />
                  Médico
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                WhatsApp
              </Label>
              <Input
                value={formPhone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  let formatted = digits;
                  if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                  if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                  setFormPhone(formatted);
                }}
                placeholder="(21) 99999-9999"
                maxLength={16}
              />
            </div>

            {formUserType === "estudante" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    Período
                  </Label>
                  <Select value={formPeriodo} onValueChange={setFormPeriodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                        <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                    Faculdade
                  </Label>
                  <Select value={formFaculdade} onValueChange={setFormFaculdade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACULDADES.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button onClick={handleOnboardingSave} disabled={saving} className="w-full mt-2">
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Salvar e acessar</>
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
