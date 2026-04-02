import { useState, useEffect, useRef } from "react";
import { User, Camera, Loader2, Save, GraduationCap, Building, Phone, Stethoscope, CalendarDays, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FaculdadeCombobox from "@/components/FaculdadeCombobox";
import { isValidPhone, isValidName } from "@/lib/profileValidation";
import { Switch } from "@/components/ui/switch";
import { ALL_SPECIALTIES } from "@/constants/specialties";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("");
  const [faculdade, setFaculdade] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("estudante");
  const [targetSpecialty, setTargetSpecialty] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyStudyHours, setDailyStudyHours] = useState("4");
  const [whatsappDailyBi, setWhatsappDailyBi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, email, periodo, faculdade, phone, user_type, target_specialty, exam_date, daily_study_hours, whatsapp_daily_bi")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url);
        setPeriodo(data.periodo ? String(data.periodo) : "");
        setFaculdade(data.faculdade || "");
        setPhone(data.phone || "");
        setUserType(data.user_type || "estudante");
        setTargetSpecialty(data.target_specialty || "");
        setExamDate(data.exam_date || "");
        setDailyStudyHours(data.daily_study_hours ? String(data.daily_study_hours) : "4");
        setWhatsappDailyBi(data.whatsapp_daily_bi || false);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Envie uma imagem (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      await supabase.storage.from("avatars").remove([path]);

      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBust })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBust);
      toast({ title: "Avatar atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar avatar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const trimmed = displayName.trim();
    const nameCheck = isValidName(trimmed);
    if (!nameCheck.valid) {
      toast({ title: nameCheck.message || "Nome inválido", variant: "destructive" });
      return;
    }

    const phoneCheck = isValidPhone(phone);
    if (!phoneCheck.valid) {
      toast({ title: phoneCheck.message || "Telefone inválido", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        display_name: trimmed,
        phone: phone.replace(/\D/g, "") || null,
        user_type: userType,
        exam_date: examDate || null,
        daily_study_hours: parseFloat(dailyStudyHours) || 4,
        whatsapp_daily_bi: whatsappDailyBi,
      };
      if (userType === "estudante") {
        updateData.periodo = periodo ? parseInt(periodo) : null;
        updateData.faculdade = faculdade || null;
      }
      if (userType === "medico") {
        updateData.target_specialty = targetSpecialty || null;
        updateData.faculdade = faculdade || null;
      }
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Perfil atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "?";

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Meu Perfil
        </h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais.</p>
      </div>

      {/* Avatar */}
      <div className="glass-card p-6 flex flex-col items-center gap-4">
        <div className="relative group">
          <Avatar className="h-24 w-24 text-2xl">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <p className="text-xs text-muted-foreground">Clique para alterar o avatar (máx. 2MB)</p>
      </div>

      {/* Info */}
      <div className="glass-card p-6 space-y-4">
        <div className="space-y-2">
          <Label>Nome de exibição</Label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Seu nome"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input value={user?.email || ""} disabled className="opacity-60" />
          <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
        </div>

        <div className="space-y-2">
          <Label>Eu sou</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUserType("estudante")}
              className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${userType === "estudante" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-accent"}`}
            >
              <GraduationCap className="h-4 w-4" />
              Estudante
            </button>
            <button
              type="button"
              onClick={() => setUserType("medico")}
              className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${userType === "medico" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:bg-accent"}`}
            >
              <Stethoscope className="h-4 w-4" />
              Médico
            </button>
          </div>
        </div>

        {userType === "estudante" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                Período
              </Label>
              <Select value={periodo} onValueChange={setPeriodo}>
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
              <FaculdadeCombobox value={faculdade} onChange={setFaculdade} />
            </div>
          </div>
        )}

        {userType === "medico" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                Especialidade
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
              <Label className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Onde formou
              </Label>
              <FaculdadeCombobox value={faculdade} onChange={setFaculdade} />
            </div>
          </div>
        )}

        {/* Exam & Study Config */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              Data da prova
            </Label>
            <Input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Define a contagem regressiva e o plano de estudo.</p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Horas/dia
            </Label>
            <Select value={dailyStudyHours} onValueChange={setDailyStudyHours}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                  <SelectItem key={h} value={String(h)}>{h}h</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Quantas horas estuda por dia.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            WhatsApp
          </Label>
          <Input
            value={phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
              let formatted = digits;
              if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
              if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
              setPhone(formatted);
            }}
            placeholder="(21) 99999-9999"
            maxLength={16}
          />
          <p className="text-xs text-muted-foreground">Seu número para receber lembretes de estudo.</p>
        </div>

        {/* BI Diário via WhatsApp */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/50">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Resumo diário via WhatsApp</p>
              <p className="text-xs text-muted-foreground">Receba seu BI e programação do dia seguinte às 20h.</p>
            </div>
          </div>
          <Switch checked={whatsappDailyBi} onCheckedChange={setWhatsappDailyBi} />
        </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
