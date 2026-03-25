import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import ResumeSessionBanner from "@/components/layout/ResumeSessionBanner";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { useLocation } from "react-router-dom";
import { Send, Bot, User, Loader2, Plus, History, Trash2, FileText, ChevronDown, Check, Sparkles, BookOpen, HelpCircle, Stethoscope, RefreshCw, BarChart3, GraduationCap, LogOut, AlertTriangle, Maximize2, Minimize2, MoreVertical, Copy, ChevronUp, Zap, Brain, Heart, Bone, Eye, Pill, Baby, Microscope, Activity, X, Flame, ArrowRight, Target, TrendingUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ModuleHelpButton from "@/components/layout/ModuleHelpButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { mapTopicToSpecialty } from "@/lib/mapTopicToSpecialty";

type Msg = { role: "user" | "assistant"; content: string };

interface Conversation { id: string; title: string; created_at: string; }
interface Upload { id: string; filename: string; category: string | null; extracted_text: string | null; }

interface StudyPerformance {
  tema_atual: string | null;
  questoes_respondidas: number;
  taxa_acerto: number;
  pontuacao_discursiva: number | null;
  temas_fracos: string[];
  historico_estudo: Array<{ tema: string; data: string; questoes: number; acerto: number; discursiva: number | null }>;
}

interface EnaziziProgress {
  estado_atual: number;
  tema_atual: string | null;
  questoes_respondidas: number;
  taxa_acerto: number;
  pontuacao_discursiva: number | null;
  temas_fracos: string[];
  historico_estudo: string[];
}

const MEDSTUDY_STEPS = [
  { num: 1, label: "Painel", icon: "📊", desc: "Visão geral do seu desempenho" },
  { num: 2, label: "Tema", icon: "📚", desc: "Escolha do tema de estudo" },
  { num: 3, label: "Técnico 1", icon: "🔬", desc: "Conceito e definição técnica" },
  { num: 4, label: "Leigo 1", icon: "💡", desc: "Tradução para linguagem simples" },
  { num: 5, label: "Técnico 2", icon: "🔬", desc: "Fisiopatologia profunda" },
  { num: 6, label: "Leigo 2", icon: "💡", desc: "Simplificação da fisiopatologia" },
  { num: 7, label: "Técnico 3", icon: "🏥", desc: "Clínica, diagnóstico e tratamento" },
  { num: 8, label: "Leigo 3", icon: "💡", desc: "Simplificação da clínica" },
  { num: 9, label: "Questão", icon: "❓", desc: "Questão objetiva com caso clínico" },
  { num: 10, label: "Discussão", icon: "💬", desc: "Análise detalhada da questão" },
  { num: 11, label: "Discursivo", icon: "✍️", desc: "Caso clínico discursivo" },
  { num: 12, label: "Correção", icon: "✅", desc: "Correção com nota 0-5" },
  { num: 13, label: "Atualizar", icon: "📈", desc: "Atualização do desempenho" },
  { num: 14, label: "Consolidação", icon: "🔁", desc: "5 questões de consolidação" },
];

const QUICK_TOPICS = [
  { label: "Sepse", emoji: "🩸", color: "from-red-500/20 to-red-600/10 border-red-500/30" },
  { label: "IAM", emoji: "🫀", color: "from-rose-500/20 to-rose-600/10 border-rose-500/30" },
  { label: "Pneumonia", emoji: "🫁", color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
  { label: "AVC", emoji: "🧠", color: "from-purple-500/20 to-purple-600/10 border-purple-500/30" },
  { label: "Diabetes", emoji: "💉", color: "from-amber-500/20 to-amber-600/10 border-amber-500/30" },
  { label: "Insuficiência Renal", emoji: "🫘", color: "from-orange-500/20 to-orange-600/10 border-orange-500/30" },
  { label: "Fraturas", emoji: "🦴", color: "from-slate-500/20 to-slate-600/10 border-slate-500/30" },
  { label: "Glaucoma", emoji: "👁", color: "from-teal-500/20 to-teal-600/10 border-teal-500/30" },
  { label: "Asma", emoji: "💨", color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30" },
  { label: "Hipertensão", emoji: "❤️‍🔥", color: "from-red-400/20 to-red-500/10 border-red-400/30" },
  { label: "Anemia", emoji: "🔴", color: "from-pink-500/20 to-pink-600/10 border-pink-500/30" },
  { label: "Meningite", emoji: "🧬", color: "from-violet-500/20 to-violet-600/10 border-violet-500/30" },
];

const FUNCTION_NAME = "chatgpt-agent";
const MEDSTUDY_SEQUENTIAL_APPENDIX = "IMPORTANTE: para não cortar a explicação, divida em tópicos e entregue em blocos atômicos sequenciais (2 a 3 seções por resposta), finalize cada bloco sem truncar frases e pergunte se pode continuar antes do próximo bloco.";

const ensureSequentialInitialMessage = (message: string) => {
  if (/blocos? curtos?|bloco at[oô]mico|2\s*a\s*3\s*se[cç][oõ]es/i.test(message)) return message;
  return `${message}\n\n${MEDSTUDY_SEQUENTIAL_APPENDIX}`;
};

const ChatGPT = () => {
  const { user } = useAuth();
  const { addXp } = useGamification();
  const location = useLocation();
  const [topic, setTopic] = useState("");
  const [studyStarted, setStudyStarted] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [availableUploads, setAvailableUploads] = useState<Upload[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<Set<string>>(new Set());
  const [showUploads, setShowUploads] = useState(false);
  const [performance, setPerformance] = useState<StudyPerformance>({
    tema_atual: null,
    questoes_respondidas: 0,
    taxa_acerto: 0,
    pontuacao_discursiva: null,
    temas_fracos: [],
    historico_estudo: [],
  });
  const [sessionQuestions, setSessionQuestions] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [enaziziStep, setEnaziziStep] = useState(1);
  const [changingTopic, setChangingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [metricsCollapsed, setMetricsCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    pendingSession, checked: sessionChecked, saveSession: persistSession,
    completeSession, abandonSession, registerAutoSave, clearPending,
  } = useSessionPersistence({ moduleKey: "chatgpt" });

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`;

  // Check onboarding
  useEffect(() => {
    const dismissed = localStorage.getItem("tutor-onboarding-dismissed");
    if (!dismissed) setShowOnboarding(true);
  }, []);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("tutor-onboarding-dismissed", "true");
  };

  // Register auto-save for session persistence
  useEffect(() => {
    registerAutoSave(() => {
      if (!studyStarted || messages.length === 0) return {};
      return {
        messages,
        currentTopic,
        enaziziStep,
        performance,
        selectedUploadIds: Array.from(selectedUploadIds),
        sessionQuestions,
        sessionCorrect,
      };
    });
  }, [registerAutoSave, studyStarted, messages, currentTopic, enaziziStep, performance, selectedUploadIds, sessionQuestions, sessionCorrect]);

  const handleRestoreSession = () => {
    if (!pendingSession) return;
    const data = pendingSession.session_data as any;
    if (data.messages) setMessages(data.messages);
    if (data.currentTopic) { setCurrentTopic(data.currentTopic); setTopic(data.currentTopic); }
    if (data.enaziziStep) setEnaziziStep(data.enaziziStep);
    if (data.performance) setPerformance(data.performance);
    if (data.selectedUploadIds) setSelectedUploadIds(new Set(data.selectedUploadIds));
    if (data.sessionQuestions) setSessionQuestions(data.sessionQuestions);
    if (data.sessionCorrect) setSessionCorrect(data.sessionCorrect);
    setStudyStarted(true);
    setMetricsCollapsed(true);
    clearPending();
  };

  useEffect(() => {
    if (!user) return;
    const loadPerformance = async () => {
      const { data } = await supabase
        .from("study_performance")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPerformance({
          tema_atual: data.tema_atual,
          questoes_respondidas: data.questoes_respondidas,
          taxa_acerto: Number(data.taxa_acerto),
          pontuacao_discursiva: data.pontuacao_discursiva != null ? Number(data.pontuacao_discursiva) : null,
          temas_fracos: (data.temas_fracos as string[]) || [],
          historico_estudo: (data.historico_estudo as StudyPerformance["historico_estudo"]) || [],
        });
      }
      const { data: progress } = await supabase
        .from("enazizi_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (progress) {
        setEnaziziStep(progress.estado_atual || 1);
        if (progress.tema_atual && progress.estado_atual > 2) {
          setCurrentTopic(progress.tema_atual);
        }
      }
    };
    loadPerformance();
  }, [user]);

  // Load uploads
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("uploads")
        .select("id, filename, extracted_text, category")
        .eq("status", "processed")
        .not("extracted_text", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data && data.length > 0) {
        setAvailableUploads(data);
        setSelectedUploadIds(new Set(data.map((u) => u.id)));
      }
    };
    load();
  }, [user]);

  const [bankQuestions, setBankQuestions] = useState<Array<{ statement: string; options: any; correct_index: number | null; explanation: string | null; topic: string | null }>>([]);
  const [errorBankData, setErrorBankData] = useState<Array<{ tema: string; subtema: string | null; tipo_questao: string; categoria_erro: string | null; vezes_errado: number }>>([]);

  useEffect(() => {
    if (!user || !currentTopic) { setBankQuestions([]); return; }
    const loadQuestions = async () => {
      const { data } = await supabase
        .from("questions_bank")
        .select("statement, options, correct_index, explanation, topic")
        .or(`user_id.eq.${user.id},is_global.eq.true`)
        .ilike("topic", `%${currentTopic}%`)
        .order("created_at", { ascending: false })
        .limit(10);
      setBankQuestions(data || []);
    };
    loadQuestions();
  }, [user, currentTopic]);

  useEffect(() => {
    if (!user) return;
    const loadErrorBank = async () => {
      const { data } = await supabase
        .from("error_bank")
        .select("tema, subtema, tipo_questao, categoria_erro, vezes_errado")
        .eq("user_id", user.id)
        .order("vezes_errado", { ascending: false })
        .limit(20);
      setErrorBankData((data as any[]) || []);
    };
    loadErrorBank();
  }, [user]);

  const buildUserContext = useCallback(() => {
    let ctx = "";
    for (const upload of availableUploads) {
      if (!selectedUploadIds.has(upload.id)) continue;
      const snippet = upload.extracted_text?.slice(0, 2000) || "";
      if (ctx.length + snippet.length > 6000) break;
      ctx += `\n\n📄 ${upload.filename} (${upload.category || "material"}):\n${snippet}`;
    }
    if (bankQuestions.length > 0) {
      ctx += `\n\n📋 BANCO DE QUESTÕES DO ALUNO (${bankQuestions.length} questões sobre "${currentTopic}"):\n`;
      bankQuestions.slice(0, 5).forEach((q, i) => {
        ctx += `\nQ${i + 1}: ${q.statement.slice(0, 300)}`;
        if (q.options && Array.isArray(q.options)) {
          (q.options as string[]).forEach((opt: string, j: number) => {
            ctx += `\n  ${String.fromCharCode(65 + j)}) ${opt}`;
          });
        }
        if (q.correct_index != null) ctx += `\n  Gabarito: ${String.fromCharCode(65 + q.correct_index)}`;
        if (q.explanation) ctx += `\n  Explicação: ${q.explanation.slice(0, 200)}`;
      });
      ctx += `\n\nUSE estas questões como referência para o estilo, dificuldade e temas. Priorize CASOS CLÍNICOS.`;
    }
    return ctx.trim();
  }, [availableUploads, selectedUploadIds, bankQuestions, currentTopic]);

  const toggleUpload = (id: string) => {
    setSelectedUploadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .eq("agent_type", FUNCTION_NAME)
      .order("updated_at", { ascending: false })
      .limit(20);
    setConversations(data || []);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const errorBankHandled = useRef(false);
  const summaryHandled = useRef(false);
  useEffect(() => {
    const state = location.state as { initialMessage?: string; fromErrorBank?: boolean; fromSimulado?: boolean; fromErrorReview?: boolean; fromSummary?: string; sharedUploadIds?: string[] } | null;
    if (state?.fromErrorReview && state?.initialMessage && !errorBankHandled.current && user) {
      errorBankHandled.current = true;
      const initialMessage = ensureSequentialInitialMessage(state.initialMessage);
      setStudyStarted(true);
      setMetricsCollapsed(true);
      setCurrentTopic("Revisão Inteligente de Erros");
      setTimeout(() => { sendMessage(initialMessage); }, 500);
      window.history.replaceState({}, document.title);
    }
    if (state?.fromErrorBank && state?.initialMessage && !errorBankHandled.current && user) {
      errorBankHandled.current = true;
      const initialMessage = ensureSequentialInitialMessage(state.initialMessage);
      setStudyStarted(true);
      setMetricsCollapsed(true);
      setCurrentTopic("Revisão do Banco de Erros");
      setTimeout(() => { sendMessage(initialMessage); }, 500);
      window.history.replaceState({}, document.title);
    }
    if (state?.fromSimulado && state?.initialMessage && !errorBankHandled.current && user) {
      errorBankHandled.current = true;
      const initialMessage = ensureSequentialInitialMessage(state.initialMessage);
      setStudyStarted(true);
      setMetricsCollapsed(true);
      setCurrentTopic("Revisão de Simulado — Proficiência");
      setTimeout(() => { sendMessage(initialMessage); }, 500);
      window.history.replaceState({}, document.title);
    }
    if (state?.fromSummary && !summaryHandled.current && user) {
      summaryHandled.current = true;
      if (state.sharedUploadIds && state.sharedUploadIds.length > 0) {
        setSelectedUploadIds(new Set(state.sharedUploadIds));
      }
      const summaryText = state.fromSummary.slice(0, 10000);
      const prompt = ensureSequentialInitialMessage(
        `Com base neste resumo, continue a explicação aprofundada seguindo o Protocolo ENAZIZI. Aprofunde os pontos mais importantes, faça perguntas de active recall e proponha questões clínicas:\n\n${summaryText}`
      );
      setStudyStarted(true);
      setMetricsCollapsed(true);
      setCurrentTopic("Aprofundamento de Resumo");
      setTimeout(() => { sendMessage(prompt); }, 500);
      window.history.replaceState({}, document.title);
    }
  }, [user, location.state]);

  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setMessages(data.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
      setStudyStarted(true);
      setMetricsCollapsed(true);
      setCurrentTopic("Sessão anterior");
    }
    setActiveConversationId(convId);
    setShowHistory(false);
  };

  const savePerformance = async (updates: Partial<StudyPerformance>) => {
    if (!user) return;
    const newPerf = { ...performance, ...updates };
    setPerformance(newPerf);
    const dbData = {
      user_id: user.id,
      tema_atual: newPerf.tema_atual,
      questoes_respondidas: newPerf.questoes_respondidas,
      taxa_acerto: newPerf.taxa_acerto,
      pontuacao_discursiva: newPerf.pontuacao_discursiva,
      temas_fracos: newPerf.temas_fracos as any,
      historico_estudo: newPerf.historico_estudo as any,
    };
    const { data: existing } = await supabase
      .from("study_performance")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      await supabase.from("study_performance").update(dbData).eq("user_id", user.id);
    } else {
      await supabase.from("study_performance").insert(dbData);
    }
  };

  const saveEnaziziStep = async (step: number, tema?: string | null) => {
    if (!user) return;
    setEnaziziStep(step);
    const dbData = {
      user_id: user.id,
      estado_atual: step,
      tema_atual: tema !== undefined ? tema : currentTopic || null,
      questoes_respondidas: performance.questoes_respondidas + sessionQuestions,
      taxa_acerto: performance.taxa_acerto,
      pontuacao_discursiva: performance.pontuacao_discursiva,
      temas_fracos: performance.temas_fracos as any,
      historico_estudo: [] as any,
      ultima_interacao: new Date().toISOString(),
    };
    const { data: existing } = await supabase
      .from("enazizi_progress")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      await supabase.from("enazizi_progress").update(dbData).eq("user_id", user.id);
    } else {
      await supabase.from("enazizi_progress").insert(dbData);
    }
  };

  const handleFinishSession = async () => {
    const totalQuestions = performance.questoes_respondidas + sessionQuestions;
    const totalCorrect = Math.round((performance.taxa_acerto / 100) * performance.questoes_respondidas) + sessionCorrect;
    const newAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const sessionEntry = {
      tema: currentTopic,
      data: new Date().toISOString(),
      questoes: sessionQuestions,
      acerto: sessionQuestions > 0 ? Math.round((sessionCorrect / sessionQuestions) * 100) : 0,
      discursiva: null as number | null,
    };
    const newHistory = [...performance.historico_estudo, sessionEntry].slice(-50);
    await savePerformance({
      tema_atual: null,
      questoes_respondidas: totalQuestions,
      taxa_acerto: newAccuracy,
      historico_estudo: newHistory,
    });
    if (user && currentTopic) {
      const specialty = mapTopicToSpecialty(currentTopic);
      if (specialty) {
        try {
          const { data: existing } = await supabase
            .from("medical_domain_map")
            .select("id, questions_answered, correct_answers, reviews_count")
            .eq("user_id", user.id)
            .eq("specialty", specialty)
            .maybeSingle();
          const newQuestionsAnswered = (existing?.questions_answered || 0) + sessionQuestions;
          const newCorrectAnswers = (existing?.correct_answers || 0) + sessionCorrect;
          const newReviews = (existing?.reviews_count || 0) + 1;
          const accuracy = newQuestionsAnswered > 0 ? (newCorrectAnswers / newQuestionsAnswered) * 100 : 0;
          const domainScore = Math.max(0, Math.min(100, Math.round(accuracy)));
          if (existing) {
            await supabase.from("medical_domain_map").update({
              questions_answered: newQuestionsAnswered,
              correct_answers: newCorrectAnswers,
              reviews_count: newReviews,
              domain_score: domainScore,
              last_studied_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).eq("id", existing.id);
          } else {
            await supabase.from("medical_domain_map").insert({
              user_id: user.id,
              specialty,
              questions_answered: sessionQuestions,
              correct_answers: sessionCorrect,
              reviews_count: 1,
              domain_score: domainScore,
              last_studied_at: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.error("Error updating domain map:", e);
        }
      }
    }
    setSessionQuestions(0);
    setSessionCorrect(0);
    setStudyStarted(false);
    setCurrentTopic("");
    setMessages([]);
    setActiveConversationId(null);
    setEnaziziStep(1);
    setMetricsCollapsed(false);
    await saveEnaziziStep(1, null);
    if (sessionQuestions > 0) {
      const xpGained = (sessionCorrect * XP_REWARDS.question_correct) + ((sessionQuestions - sessionCorrect) * XP_REWARDS.question_answered);
      await addXp(xpGained);
    }
    await completeSession();
    toast({ title: "Sessão finalizada!", description: `Dados salvos. ${sessionQuestions} questões nesta sessão.` });
  };

  const startNewSession = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStudyStarted(false);
    setCurrentTopic("");
    setTopic("");
    setShowHistory(false);
    setSessionQuestions(0);
    setSessionCorrect(0);
    setMetricsCollapsed(false);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("chat_conversations").delete().eq("id", convId);
    if (activeConversationId === convId) startNewSession();
    loadConversations();
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !user) return;
    const topicChangeMatch = text.match(/(?:quero estudar|vamos estudar|mudar (?:tema|assunto) (?:para)?|agora (?:quero|vamos) (?:estudar)?)\s+(.+)/i);
    if (topicChangeMatch && studyStarted) {
      const detectedTopic = topicChangeMatch[1].replace(/[.!?]+$/, "").trim();
      if (detectedTopic && detectedTopic.toLowerCase() !== currentTopic.toLowerCase()) {
        setCurrentTopic(detectedTopic);
        setEnaziziStep(3);
        setChangingTopic(false);
        saveEnaziziStep(3, detectedTopic);
        savePerformance({ tema_atual: detectedTopic });
      }
    }
    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    let convId = activeConversationId;
    if (!convId) {
      const convTitle = text.slice(0, 60);
      const { data: newConv } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, agent_type: FUNCTION_NAME, title: convTitle })
        .select("id")
        .single();
      if (newConv) {
        convId = newConv.id;
        setActiveConversationId(convId);
      }
    }
    if (convId) {
      await supabase.from("chat_messages").insert({
        conversation_id: convId, user_id: user.id, role: "user", content: text,
      });
      await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    }
    let assistantSoFar = "";
    const contextToSend = buildUserContext();
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          userContext: contextToSend || undefined,
          enazizi_progress: {
            estado_atual: enaziziStep,
            tema_atual: currentTopic || null,
            questoes_respondidas: performance.questoes_respondidas + sessionQuestions,
            taxa_acerto: performance.taxa_acerto,
            pontuacao_discursiva: performance.pontuacao_discursiva,
            temas_fracos: performance.temas_fracos,
          },
          error_bank: errorBankData.length > 0 ? errorBankData : undefined,
        }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        toast({ title: "Erro", description: errData.error || "Erro ao conectar com o ChatGPT", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (!resp.body) throw new Error("No response body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      const appendAssistantChunk = (content: string) => {
        if (!content) return;
        assistantSoFar += content;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };
      const processSseLine = (rawLine: string): "ok" | "done" | "incomplete" => {
        let line = rawLine;
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") return "ok";
        if (!line.startsWith("data: ")) return "ok";
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") return "done";
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) appendAssistantChunk(content);
          return "ok";
        } catch {
          return "incomplete";
        }
      };
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          const line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          const result = processSseLine(line);
          if (result === "done") { streamDone = true; break; }
          if (result === "incomplete") { textBuffer = `${line}\n${textBuffer}`; break; }
        }
      }
      textBuffer += decoder.decode();
      if (textBuffer.trim()) {
        const remainingLines = textBuffer.split("\n");
        for (const line of remainingLines) {
          if (!line) continue;
          const result = processSseLine(line);
          if (result === "done") break;
        }
      }
      if (convId && assistantSoFar) {
        await supabase.from("chat_messages").insert({
          conversation_id: convId, user_id: user.id, role: "assistant", content: assistantSoFar,
        });
        loadConversations();
        if (user && currentTopic) {
          const errorPatterns = [
            /(?:incorret|errad|não está corret|resposta errada|infelizmente|não é essa)/i,
            /alternativa correta[:\s]+([A-E])/i,
            /a resposta (?:correta|certa) (?:é|seria|era)/i,
          ];
          const hasError = errorPatterns.some((p) => p.test(assistantSoFar));
          if (hasError) {
            const subtemaMatch = assistantSoFar.match(/(?:subtema|tópico|sobre):\s*([^\n.]+)/i);
            const categoriaMatch = assistantSoFar.match(/\[ERRO_TIPO:(\w+)\]/i);
            const motivoMatch = assistantSoFar.match(/\[ERRO_MOTIVO:([^\]]+)\]/i);
            const conteudoSnippet = assistantSoFar.slice(0, 300);
            const errorData = {
              user_id: user.id,
              tema: currentTopic,
              subtema: subtemaMatch?.[1]?.trim() || null,
              tipo_questao: enaziziStep >= 9 && enaziziStep <= 10 ? "objetiva" : enaziziStep >= 11 && enaziziStep <= 12 ? "discursiva" : "active_recall",
              conteudo: conteudoSnippet,
              motivo_erro: motivoMatch?.[1]?.trim() || null,
              categoria_erro: categoriaMatch?.[1]?.trim() || null,
              dificuldade: 3,
              vezes_errado: 1,
            };
            const { data: existing } = await supabase
              .from("error_bank")
              .select("id, vezes_errado")
              .eq("user_id", user.id)
              .eq("tema", errorData.tema)
              .eq("tipo_questao", errorData.tipo_questao)
              .maybeSingle();
            if (existing) {
              await supabase.from("error_bank").update({ vezes_errado: (existing.vezes_errado || 1) + 1, updated_at: new Date().toISOString(), conteudo: conteudoSnippet }).eq("id", existing.id);
            } else {
              await supabase.from("error_bank").insert(errorData);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao conectar com o ChatGPT.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const NON_MEDICAL_KEYWORDS = /\b(direito|jurídic|advocacia|contabil|engenharia|arquitetura|economia|finanças|marketing|administração de empresas|programação|software|TI\b|informática|matemática pura|filosofia|sociologia|letras|pedagogia)\b/i;

  const handleStartStudy = (overrideTopic?: string) => {
    const t = overrideTopic || topic;
    if (!t.trim()) return;
    if (NON_MEDICAL_KEYWORDS.test(t)) {
      toast({
        title: "⛔ Tema não médico",
        description: "Esta plataforma é exclusiva para Residência Médica. Por favor, escolha um tema de medicina.",
        variant: "destructive",
      });
      return;
    }
    setStudyStarted(true);
    setMetricsCollapsed(true);
    setCurrentTopic(t);
    setSessionQuestions(0);
    setSessionCorrect(0);
    setEnaziziStep(3);
    savePerformance({ tema_atual: t });
    saveEnaziziStep(3, t);
    sendMessage(`Quero estudar o tema: ${t}. Comece com o Bloco Técnico 1 (conceito e definição — explicação técnica baseada na literatura). Estou na etapa 3/13 do Protocolo ENAZIZI.`);
  };

  const handleChangeTopic = () => {
    if (!newTopic.trim()) return;
    if (NON_MEDICAL_KEYWORDS.test(newTopic)) {
      toast({ title: "⛔ Tema não médico", description: "Esta plataforma é exclusiva para Residência Médica.", variant: "destructive" });
      return;
    }
    setChangingTopic(false);
    setTopic(newTopic);
    setMessages((prev) => [...prev, { role: "user" as const, content: `--- MUDANÇA DE TEMA ---\nNovo tema: ${newTopic}` }]);
    setCurrentTopic(newTopic);
    setEnaziziStep(3);
    saveEnaziziStep(3, newTopic);
    savePerformance({ tema_atual: newTopic });
    sendMessage(`MUDANÇA DE TEMA: Quero mudar para o tema "${newTopic}". Reinicie o fluxo pedagógico. Comece do STATE 2 — Bloco Técnico 1 (conceito e definição) sobre ${newTopic}.`);
    setNewTopic("");
  };

  const handlePhaseAction = (phase: string) => {
    const phaseMap: Record<string, { prompt: string; step: number }> = {
      "leigo1": { prompt: `Agora traduza o bloco técnico 1 sobre ${currentTopic} para linguagem leiga e faça UMA pergunta curta de active recall.`, step: 4 },
      "tecnico2": { prompt: `Agora avance para o Bloco Técnico 2 (fisiopatologia) sobre ${currentTopic}. Base: Guyton, Robbins, Harrison. Explicação técnica profunda.`, step: 5 },
      "leigo2": { prompt: `Agora traduza o bloco técnico 2 (fisiopatologia) sobre ${currentTopic} para linguagem leiga e faça UMA pergunta curta.`, step: 6 },
      "tecnico3": { prompt: `Agora avance para o Bloco Técnico 3 (aplicação clínica) sobre ${currentTopic}. Sinais, sintomas, exames, tratamento, diagnósticos diferenciais. Explicação técnica.`, step: 7 },
      "leigo3": { prompt: `Agora traduza o bloco técnico 3 (aplicação clínica) sobre ${currentTopic} para linguagem leiga e faça UMA pergunta curta.`, step: 8 },
      "questions": { prompt: `Agora crie 1 questão objetiva estilo prova médica com caso clínico e alternativas A–E sobre ${currentTopic}. Não revele a resposta, espere eu responder.`, step: 9 },
      "discussion": { prompt: `Agora faça a discussão completa da questão sobre ${currentTopic}: alternativa correta, explicação simples+técnica, raciocínio clínico, diferenciais, análise de todas alternativas, ponto de prova, mini resumo.`, step: 10 },
      "discursive": { prompt: `Agora crie um caso clínico discursivo sobre ${currentTopic}. Pergunte: diagnóstico provável, conduta inicial, exames necessários, justificativa clínica.`, step: 11 },
      "correction": { prompt: `Corrija minha resposta discursiva com nota de 0-5 (Diagnóstico 0-2, Conduta 0-2, Justificativa 0-1). Depois apresente: resposta esperada, explicação simples+técnica, raciocínio clínico completo, pontos obrigatórios, erros clássicos, mini aula de reforço.`, step: 12 },
      "update": { prompt: `Atualize meu painel de desempenho com base nesta sessão sobre ${currentTopic}. Mostre: questões respondidas, taxa de acerto, temas fracos, desempenho clínico e discursivo.`, step: 13 },
      "consolidation": { prompt: `Agora inicie o BLOCO DE CONSOLIDAÇÃO sobre ${currentTopic}. Gere 5 questões objetivas sequenciais (uma por vez, espere minha resposta antes de enviar a próxima). Cada questão deve ter caso clínico curto + alternativas A–E. Após cada resposta, diga se acertou ou errou com breve explicação. Ao final das 5, apresente um resumo: acertos/erros, taxa, pontos fracos detectados e recomendação de próximo tema.`, step: 14 },
    };
    const action = phaseMap[phase];
    if (action) {
      setEnaziziStep(action.step);
      saveEnaziziStep(action.step);
      sendMessage(action.prompt);
    }
  };

  const getNextPhaseInfo = (): { key: string; label: string; icon: string; desc: string } | null => {
    const phaseByStep: Record<number, { key: string; label: string; icon: string; desc: string }> = {
      3: { key: "leigo1", label: "Tradução Leiga", icon: "💡", desc: "O tutor vai simplificar o conteúdo técnico para linguagem do dia-a-dia" },
      4: { key: "tecnico2", label: "Fisiopatologia", icon: "🔬", desc: "Aprofundamento na fisiopatologia com base em Guyton e Robbins" },
      5: { key: "leigo2", label: "Tradução Leiga 2", icon: "💡", desc: "Simplificação da fisiopatologia para fixação" },
      6: { key: "tecnico3", label: "Aplicação Clínica", icon: "🏥", desc: "Sinais, sintomas, exames, diagnóstico e tratamento" },
      7: { key: "leigo3", label: "Tradução Leiga 3", icon: "💡", desc: "Simplificação da aplicação clínica" },
      8: { key: "questions", label: "Questão Objetiva", icon: "❓", desc: "Caso clínico com alternativas A-E para testar seu conhecimento" },
      9: { key: "discussion", label: "Discussão", icon: "💬", desc: "Análise detalhada da questão com raciocínio clínico" },
      10: { key: "discursive", label: "Caso Discursivo", icon: "✍️", desc: "Caso clínico aberto para diagnóstico e conduta" },
      11: { key: "correction", label: "Correção", icon: "✅", desc: "Correção detalhada com nota e feedback" },
      12: { key: "update", label: "Atualizar Painel", icon: "📈", desc: "Revisão do seu desempenho na sessão" },
      13: { key: "consolidation", label: "Consolidação", icon: "🔁", desc: "5 questões rápidas para consolidar o aprendizado" },
    };
    return phaseByStep[enaziziStep] || null;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
  };

  const recentHistory = performance.historico_estudo.slice(-5).reverse();

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Estudante";

  const content = (
    <div className={`flex flex-col animate-fade-in min-w-0 w-full ${isFullscreen ? "fixed inset-0 z-[100] bg-background p-2 sm:p-4" : "h-full max-h-[calc(100dvh-8rem)] sm:max-h-[calc(100dvh-6rem)] lg:max-h-[calc(100dvh-5rem)]"}`}>
      {/* Header */}
      <div className="mb-2 sm:mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 tutor-glow float-gentle">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold truncate">TutorZizi</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Protocolo ENAZIZI • GPT-4o</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0 items-center">
          {studyStarted && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 text-primary text-[10px] font-semibold border border-primary/20">
              <Target className="h-3 w-3" /> {performance.taxa_acerto}%
            </span>
          )}
          <Button variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} className="h-8 w-8" title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {studyStarted && (
                <DropdownMenuItem onClick={handleFinishSession} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Finalizar sessão
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={startNewSession}>
                <Plus className="h-4 w-4 mr-2" /> Nova sessão
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowHistory(!showHistory)}>
                <History className="h-4 w-4 mr-2" /> Histórico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowOnboarding(true)}>
                <HelpCircle className="h-4 w-4 mr-2" /> Como usar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Resume Session Banner */}
      {sessionChecked && pendingSession && !studyStarted && (
        <ResumeSessionBanner
          updatedAt={pendingSession.updated_at}
          onResume={handleRestoreSession}
          onDiscard={abandonSession}
        />
      )}

      {/* Onboarding Card */}
      {showOnboarding && !studyStarted && (
        <div className="relative overflow-hidden rounded-xl border border-primary/20 p-4 mb-3 animate-fade-in bg-gradient-to-br from-primary/5 via-card to-accent/5">
          <div className="absolute inset-0 shimmer pointer-events-none" />
          <button onClick={dismissOnboarding} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground z-10">
            <X className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 relative z-10">
            <Sparkles className="h-4 w-4 text-primary" /> Como funciona o TutorZizi
          </h3>
          <div className="grid grid-cols-3 gap-3 relative z-10">
            <div className="text-center space-y-1.5">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto border border-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium">1. Escolha um tema</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Digite ou clique nas sugestões</p>
            </div>
            <div className="text-center space-y-1.5">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto border border-accent/10">
                <Brain className="h-5 w-5 text-accent" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium">2. Aprenda em blocos</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Técnico → Leigo → Recall</p>
            </div>
            <div className="text-center space-y-1.5">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mx-auto border border-success/10">
                <Zap className="h-5 w-5 text-success" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium">3. Teste e consolide</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Questões + casos clínicos</p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Metrics Bar */}
      <div className="mb-3">
        <button
          onClick={() => setMetricsCollapsed(!metricsCollapsed)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full group"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Métricas</span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{performance.questoes_respondidas}Q</span>
            <span className={`px-1.5 py-0.5 rounded font-semibold ${performance.taxa_acerto >= 70 ? "bg-success/10 text-success" : performance.taxa_acerto >= 50 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{performance.taxa_acerto}%</span>
            {performance.pontuacao_discursiva != null && (
              <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-semibold">{performance.pontuacao_discursiva}/10</span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{performance.historico_estudo.length} sessões</span>
          </div>
          {metricsCollapsed ? <ChevronDown className="h-3.5 w-3.5 ml-auto" /> : <ChevronUp className="h-3.5 w-3.5 ml-auto" />}
        </button>
        {!metricsCollapsed && (
          <div className="grid grid-cols-4 gap-2 mt-2 animate-fade-in">
            <div className="glass-card p-2 sm:p-3 flex items-center gap-2 card-3d">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground">Questões</p>
                <p className="text-sm font-bold">{performance.questoes_respondidas}</p>
              </div>
            </div>
            <div className="glass-card p-2 sm:p-3 flex items-center gap-2 card-3d">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${performance.taxa_acerto >= 70 ? "bg-success/10" : performance.taxa_acerto >= 50 ? "bg-warning/10" : "bg-destructive/10"}`}>
                <TrendingUp className={`h-4 w-4 ${performance.taxa_acerto >= 70 ? "text-success" : performance.taxa_acerto >= 50 ? "text-warning" : "text-destructive"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground">Acerto</p>
                <p className="text-sm font-bold">{performance.taxa_acerto}%</p>
              </div>
            </div>
            <div className="glass-card p-2 sm:p-3 flex items-center gap-2 card-3d">
              <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground">Discursiva</p>
                <p className="text-sm font-bold">{performance.pontuacao_discursiva != null ? `${performance.pontuacao_discursiva}/10` : "—"}</p>
              </div>
            </div>
            <div className="glass-card p-2 sm:p-3 flex items-center gap-2 card-3d">
              <div className="h-8 w-8 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-4 w-4 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground">Sessões</p>
                <p className="text-sm font-bold">{performance.historico_estudo.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Screen */}
      {!studyStarted && (
        <>
          {/* Hero + Input — Immersive */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/10 p-5 sm:p-8 mb-4 text-center bg-gradient-to-br from-primary/5 via-card to-accent/5 gradient-shift">
            <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-br from-primary/25 to-accent/25 flex items-center justify-center mx-auto tutor-glow float-gentle border border-primary/15">
                <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">
                  Olá, <span className="gradient-text">{displayName}</span>! 👋
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Pronto para evoluir? Escolha um tema para começar.
                </p>
              </div>
              {performance.historico_estudo.length > 0 && (
                <div className="flex items-center justify-center gap-2 text-xs">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20">
                    <Flame className="h-3.5 w-3.5 text-warning" />
                    <span className="text-warning font-semibold">{performance.historico_estudo.length} sessões completadas</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Input
                    placeholder="Ex: Sepse, IAM, Pneumonia..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStartStudy()}
                    className="bg-background/60 backdrop-blur-sm border-border/60 text-sm sm:text-base h-11 sm:h-12 rounded-xl pl-4 pr-4"
                  />
                </div>
                <Button onClick={() => handleStartStudy()} className="glow gap-2 px-4 sm:px-8 flex-shrink-0 text-sm sm:text-base h-11 sm:h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-semibold" disabled={!topic.trim()}>
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Estudar</span>
                  <ArrowRight className="h-4 w-4 sm:hidden" />
                </Button>
              </div>
            </div>
          </div>

          {/* Recommended (weak topics) — Before popular */}
          {performance.temas_fracos.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-warning" />
                <span className="text-warning">Recomendado para você</span>
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {performance.temas_fracos.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => handleStartStudy(t)}
                    className="card-3d flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-warning/10 to-destructive/5 border border-warning/20 hover:border-warning/40 transition-all group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">🔴</span>
                    <span className="text-[10px] sm:text-xs font-medium text-foreground truncate w-full text-center">{t}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Topics Grid — Glassmorphism Cards */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" /> Temas Populares
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {QUICK_TOPICS.map((qt) => (
                <button
                  key={qt.label}
                  onClick={() => handleStartStudy(qt.label)}
                  className={`card-3d flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl bg-gradient-to-br ${qt.color} border backdrop-blur-sm hover:border-primary/30 transition-all group`}
                >
                  <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform drop-shadow-sm">{qt.emoji}</span>
                  <span className="text-[10px] sm:text-xs font-medium text-foreground truncate w-full text-center">{qt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent History */}
          {recentHistory.length > 0 && (
            <div className="glass-card p-3 sm:p-4 mb-3">
              <h3 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                Continuar Estudando
              </h3>
              <div className="space-y-1.5">
                {recentHistory.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => handleStartStudy(h.tema)}
                    className="flex items-center justify-between text-xs w-full px-3 py-2 rounded-lg hover:bg-secondary/80 transition-colors group"
                  >
                    <span className="text-foreground truncate mr-2 group-hover:text-primary transition-colors">{h.tema}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">{new Date(h.data).toLocaleDateString("pt-BR")}</span>
                      <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${h.acerto >= 70 ? "bg-success/10 text-success" : h.acerto >= 50 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                        {h.acerto}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          <button
            onClick={() => availableUploads.length > 0 && setShowUploads(!showUploads)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors mx-auto mb-3 ${
              availableUploads.length > 0
                ? selectedUploadIds.size > 0
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            {availableUploads.length === 0 ? (
              <span>Nenhum material disponível</span>
            ) : (
              <>
                <span>Meus materiais</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showUploads ? "rotate-180" : ""}`} />
              </>
            )}
          </button>
          {showUploads && availableUploads.length > 0 && (
            <div className="glass-card p-3 max-h-40 overflow-y-auto space-y-1 max-w-lg mx-auto text-left mb-3">
              {availableUploads.map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary cursor-pointer text-xs">
                  <Checkbox checked={selectedUploadIds.has(u.id)} onCheckedChange={() => toggleUpload(u.id)} className="h-3.5 w-3.5" />
                  <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{u.filename}</span>
                </label>
              ))}
            </div>
          )}
        </>
      )}

      {/* History panel */}
      {showHistory && (
        <div className="glass-card p-3 mb-3 max-h-48 overflow-y-auto space-y-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">Nenhuma conversa salva.</p>
          ) : conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => loadConversation(c.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                activeConversationId === c.id ? "bg-primary/10 text-primary" : "hover:bg-secondary"
              }`}
            >
              <span className="truncate flex-1 mr-2">{c.title}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                <button onClick={(e) => deleteConversation(c.id, e)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat area */}
      {studyStarted && (
        <>
          {/* Visual Step Tracker */}
          <div className="mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
              <span className="px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 text-primary text-[10px] sm:text-xs font-medium truncate max-w-[40%] border border-primary/20">
                📚 {currentTopic}
              </span>
              <span className="px-2 py-1 rounded-full bg-secondary text-muted-foreground text-[10px] sm:text-xs font-medium">
                Etapa {enaziziStep}/14
              </span>
              {sessionQuestions > 0 && (
                <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${Math.round((sessionCorrect / sessionQuestions) * 100) >= 70 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {sessionQuestions}Q • {Math.round((sessionCorrect / sessionQuestions) * 100)}%
                </span>
              )}
              <Button variant="ghost" size="sm" className="gap-1 text-[10px] sm:text-xs h-7 ml-auto px-2" onClick={() => setChangingTopic(!changingTopic)} disabled={isLoading}>
                <RefreshCw className="h-3 w-3" /> Tema
              </Button>
            </div>
            {changingTopic && (
              <div className="flex gap-2 mb-2">
                <Input placeholder="Novo tema médico..." value={newTopic} onChange={(e) => setNewTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChangeTopic()} className="bg-secondary border-border text-sm h-8" autoFocus />
                <Button size="sm" className="h-8 text-xs flex-shrink-0" onClick={handleChangeTopic} disabled={!newTopic.trim()}>Iniciar</Button>
              </div>
            )}

            {/* Timeline Stepper */}
            <div className="flex items-center gap-0 overflow-x-auto pb-1">
              {MEDSTUDY_STEPS.map((s, idx) => (
                <TooltipProvider key={s.num} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center flex-shrink-0">
                        <div
                          className={`relative flex items-center justify-center rounded-full transition-all cursor-default ${
                            s.num < enaziziStep
                              ? "h-5 w-5 sm:h-6 sm:w-6 bg-primary text-primary-foreground"
                              : s.num === enaziziStep
                              ? "h-7 w-7 sm:h-8 sm:w-8 bg-gradient-to-br from-primary to-accent text-primary-foreground animate-pulse-glow ring-2 ring-primary/30"
                              : "h-5 w-5 sm:h-6 sm:w-6 bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {s.num < enaziziStep ? (
                            <Check className="h-3 w-3" />
                          ) : s.num === enaziziStep ? (
                            <span className="text-[10px] sm:text-xs font-bold">{s.icon}</span>
                          ) : (
                            <span className="text-[8px] sm:text-[9px]">{s.num}</span>
                          )}
                        </div>
                        {idx < MEDSTUDY_STEPS.length - 1 && (
                          <div className={`w-1 sm:w-2 h-0.5 ${s.num < enaziziStep ? "bg-primary" : "bg-border"}`} />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">{s.icon} {s.num}. {s.label}</p>
                      <p className="text-muted-foreground">{s.desc}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            {/* Mobile: show current step label */}
            <p className="sm:hidden text-[10px] text-muted-foreground text-center mt-1">
              {MEDSTUDY_STEPS.find(s => s.num === enaziziStep)?.icon} {MEDSTUDY_STEPS.find(s => s.num === enaziziStep)?.label} ({enaziziStep}/14)
            </p>
          </div>

          {/* Next Phase Card — Enhanced */}
          {(() => {
            const nextPhase = getNextPhaseInfo();
            if (!nextPhase) return null;
            const progressPercent = Math.round((enaziziStep / 14) * 100);
            return (
              <div className="relative overflow-hidden rounded-xl border border-primary/20 p-3 sm:p-4 mb-2 sm:mb-3 animate-fade-in bg-gradient-to-r from-primary/5 via-card to-accent/5">
                <div className="absolute inset-0 shimmer pointer-events-none opacity-50" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/25 flex items-center justify-center flex-shrink-0 text-xl float-gentle border border-primary/15">
                    {nextPhase.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Próxima etapa</p>
                    <p className="text-sm font-bold">{nextPhase.label}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{nextPhase.desc}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="relative h-10 w-10">
                      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="2" />
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-primary" strokeWidth="2" strokeDasharray={`${progressPercent} 100`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">{progressPercent}%</span>
                    </div>
                    <Button
                      size="sm"
                      className="glow text-xs h-8 px-4 flex-shrink-0 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 gap-1.5 font-semibold"
                      onClick={() => handlePhaseAction(nextPhase.key)}
                      disabled={isLoading}
                    >
                      Avançar <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {/* Shortcut buttons */}
                {enaziziStep < 8 && (
                  <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/50 relative z-10">
                    <button onClick={() => handlePhaseAction("questions")} disabled={isLoading} className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Pular para Questões
                    </button>
                    <span className="text-border">•</span>
                    <button onClick={() => handlePhaseAction("consolidation")} disabled={isLoading} className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" /> Ir para Consolidação
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Chat Messages — Premium */}
          <div ref={scrollRef} className="flex-1 rounded-xl border border-border/50 bg-card/50 p-2 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 mb-2 sm:mb-3 min-h-0 pattern-dots">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : ""} animate-fade-in`}>
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 tutor-glow bot-breathing">
                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed relative group ${
                  msg.role === "user"
                    ? "max-w-[85%] sm:max-w-[75%] bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                    : "w-full bg-secondary/80 backdrop-blur-sm text-secondary-foreground relative gradient-border-subtle"
                }`}>
                  {msg.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-xs sm:text-sm prose-p:my-3 prose-headings:mt-5 prose-headings:mb-2 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 [&_p:has(+ul)]:mb-1 [&_p:has(+ol)]:mb-1 [&>p+p]:mt-4 [&_strong]:text-foreground [&_hr]:my-4 [&_blockquote]:my-3">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-background/50 backdrop-blur-sm"
                        title="Copiar"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2 sm:gap-3 animate-fade-in">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 tutor-glow bot-breathing">
                  <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <div className="rounded-xl px-4 py-3 bg-secondary/80 backdrop-blur-sm">
                  <div className="flex gap-1.5 items-center">
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input — Enhanced */}
          <div className="flex gap-2">
            <Input
              placeholder="Sua resposta ou dúvida..."
              className="bg-background/60 backdrop-blur-sm border-border/60 text-sm h-10 sm:h-11 rounded-xl"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage(input)}
              size="icon"
              className="glow flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  if (isFullscreen) return createPortal(content, document.body);
  return content;
};

export default ChatGPT;
