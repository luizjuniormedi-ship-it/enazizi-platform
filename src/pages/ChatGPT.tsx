import { Sparkles } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const ChatGPT = () => (
  <AgentChat
    title="ChatGPT Médico"
    subtitle="Agente principal — Consulte primeiro aqui antes dos outros agentes"
    icon={<Sparkles className="h-6 w-6 text-green-400" />}
    welcomeMessage={`🤖 **Olá! Eu sou o ChatGPT Médico**, seu consultor principal na plataforma ENAZIZI.

Sou alimentado pela API do ChatGPT (GPT-4o) e estou aqui para ser sua **primeira consulta** em qualquer dúvida médica.

**Como posso te ajudar:**
- 🩺 Tirar dúvidas clínicas com profundidade
- 📚 Explicar temas complexos de forma clara
- 🎯 Direcionar você para o agente especializado ideal
- ⚠️ Apontar pegadinhas de prova e pontos de alta incidência

**Pergunte qualquer coisa sobre medicina!** 💬`}
    welcomeMessageWithUploads={`🤖 **ChatGPT Médico** — Consultor Principal

Detectei **{count} material(is)** disponível(is): {materiais}

Estou pronto para responder suas dúvidas usando seus materiais como base. Pergunte qualquer coisa! 💬`}
    placeholder="Pergunte qualquer coisa sobre medicina..."
    functionName="chatgpt-agent"
    quickActions={[
      { label: "Explicar um tema", prompt: "Explique detalhadamente o tema: ", icon: "📚" },
      { label: "Dúvida clínica", prompt: "Tenho uma dúvida clínica sobre: ", icon: "🩺" },
      { label: "Pegadinhas de prova", prompt: "Quais são as principais pegadinhas de prova sobre: ", icon: "⚠️" },
      { label: "Diagnóstico diferencial", prompt: "Faça o diagnóstico diferencial de: ", icon: "🔄" },
    ]}
  />
);

export default ChatGPT;
