import { Link, useNavigate } from "react-router-dom";
import { Brain, Mail, Lock, BookOpen, Trophy, Sparkles, GraduationCap, AlertTriangle, Calendar, Users, FlaskConical, Smartphone, Monitor, Globe, MessageCircle, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const errorMessages: Record<string, string> = {
  "Invalid login credentials": "Email ou senha incorretos.",
  "Email not confirmed": "Confirme seu email antes de entrar.",
  "User not found": "Nenhuma conta encontrada com este email.",
  "Too many requests": "Muitas tentativas. Aguarde um momento.",
};

const formatCount = (n: number): string => {
  if (n >= 1000) {
    const rounded = Math.floor(n / 100) * 100;
    return `${rounded.toLocaleString("pt-BR")}+`;
  }
  return `${n}+`;
};

const features = [
  { icon: Sparkles, label: "Tutor IA personalizado" },
  { icon: FlaskConical, label: "Simulados com gabarito comentado" },
  { icon: BookOpen, label: "Flashcards com repetição espaçada (FSRS)" },
  { icon: GraduationCap, label: "Painel do Professor com BI" },
  { icon: AlertTriangle, label: "Banco de erros inteligente" },
  { icon: Calendar, label: "Cronograma adaptativo" },
  { icon: MessageCircle, label: "Resumo diário via WhatsApp" },
  { icon: Smartphone, label: "App móvel (PWA) — iOS e Android" },
  { icon: Monitor, label: "Desktop — Windows, Mac e Linux" },
  { icon: Globe, label: "Acesso web em qualquer navegador" },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [dynamicStats, setDynamicStats] = useState({
    alunos: "—",
    questoes: "—",
    flashcards: "—",
  });
  const navigate = useNavigate();
  const { signIn, resetPassword } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await supabase.rpc("get_login_stats").maybeSingle();
        if (data) {
          setDynamicStats({
            alunos: formatCount(Number(data.alunos)),
            questoes: formatCount(Number(data.questoes)),
            flashcards: formatCount(Number(data.flashcards)),
          });
        }
      } catch {
        // keep "—" on error
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { icon: Users, value: dynamicStats.alunos, label: "Alunos" },
    { icon: BookOpen, value: dynamicStats.questoes, label: "Questões" },
    { icon: Trophy, value: dynamicStats.flashcards, label: "Flashcards" },
    { icon: Brain, value: "8", label: "Agentes IA" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      const msg = errorMessages[error.message] || error.message;
      toast({ title: "Erro ao entrar", description: msg, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Digite seu email", description: "Informe o email cadastrado para redefinir a senha.", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    const { error } = await resetPassword(email);
    setForgotLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
      setForgotMode(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto flex flex-col lg:flex-row bg-background">
      {/* Left panel - Hero */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-background p-4 sm:p-10 lg:p-14 flex flex-col justify-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 lg:mb-10">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center glow">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold">ENAZIZI</span>
        </Link>

        <h2 className="text-2xl lg:text-3xl font-bold mb-2">Sua plataforma completa para residência médica</h2>
        <p className="text-muted-foreground mb-6 lg:mb-8 text-sm lg:text-base">Estude com inteligência artificial, questões reais de provas e ferramentas que se adaptam ao seu ritmo.</p>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 mb-6 lg:mb-10">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="flex justify-center mb-1">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-lg lg:text-xl font-black">{s.value}</p>
              <p className="text-[10px] lg:text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Features list */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-2 lg:gap-3">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm">
              <f.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            {/* Logo already shown on left panel for desktop */}
          </div>
          <h1 className="text-2xl font-bold text-center mb-1">{forgotMode ? "Recuperar senha" : "Bem-vindo de volta"}</h1>
          <p className="text-muted-foreground text-center mb-6 text-sm">
            {forgotMode ? "Digite seu email para receber o link de redefinição" : "Entre na sua conta para continuar"}
          </p>

          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="glass-card p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="seu@email.com" className="pl-10 bg-secondary border-border" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={forgotLoading}>
                {forgotLoading ? "Enviando..." : "Enviar link de redefinição"}
              </Button>
              <button type="button" onClick={() => setForgotMode(false)} className="text-sm text-primary hover:underline w-full text-center">
                Voltar ao login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="glass-card p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="seu@email.com" className="pl-10 bg-secondary border-border" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Senha</label>
                  <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline">
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" className="pl-10 bg-secondary border-border" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full glow" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          )}

          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/register" className="text-primary hover:underline">Criar conta grátis</Link>
            </p>
            <p className="text-xs text-muted-foreground">
              <Link to="/register" className="text-primary/80 hover:underline">É professor? Cadastre-se e acesse o painel exclusivo</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
