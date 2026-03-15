import { Link, useNavigate } from "react-router-dom";
import { Brain, Mail, Lock, User, GraduationCap, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FACULDADES = [
  "UNIG",
  "Estácio",
  "Outra",
];

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [faculdade, setFaculdade] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodo || !faculdade) {
      toast({ title: "Preencha todos os campos", description: "Período e faculdade são obrigatórios.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      // Update profile with periodo and faculdade after signup
      // The profile is created by the handle_new_user trigger, so we update it
      // We need to wait a moment for the trigger to fire
      setTimeout(async () => {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          await supabase.from("profiles").update({
            periodo: parseInt(periodo),
            faculdade,
          }).eq("user_id", newUser.id);
        }
      }, 1000);
      toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center glow">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold">ENAZIZI</span>
          </Link>
          <h1 className="text-2xl font-bold">Crie sua conta</h1>
          <p className="text-muted-foreground mt-1">Comece sua preparação agora</p>
        </div>

        <form onSubmit={handleRegister} className="glass-card p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Seu nome" className="pl-10 bg-secondary border-border" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="seu@email.com" className="pl-10 bg-secondary border-border" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Mínimo 6 caracteres" className="pl-10 bg-secondary border-border" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                Período
              </label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="bg-secondary border-border">
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
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Faculdade
              </label>
              <Select value={faculdade} onValueChange={setFaculdade}>
                <SelectTrigger className="bg-secondary border-border">
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

          <Button type="submit" className="w-full glow" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
