import { Link, useNavigate } from "react-router-dom";
import { Brain, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
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
          <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
          <p className="text-muted-foreground mt-1">Entre na sua conta para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card p-8 space-y-5">
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
              <Input type="password" placeholder="••••••••" className="pl-10 bg-secondary border-border" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" className="w-full glow" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Não tem conta?{" "}
          <Link to="/register" className="text-primary hover:underline">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
