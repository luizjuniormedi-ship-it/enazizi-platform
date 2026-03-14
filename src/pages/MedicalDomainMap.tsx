import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, RefreshCw, BookOpen, AlertTriangle, ChevronDown, ChevronRight, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SPECIALTIES_WITH_TOPICS: Record<string, string[]> = {
  "Cardiologia": ["Insuficiência Cardíaca", "Síndromes Coronarianas", "Arritmias", "Valvopatias", "Hipertensão Arterial", "Endocardite", "Pericardite", "Cardiopatias Congênitas"],
  "Pneumologia": ["DPOC", "Asma", "Pneumonias", "Tuberculose", "Embolia Pulmonar", "Derrame Pleural", "Fibrose Pulmonar", "Câncer de Pulmão"],
  "Neurologia": ["AVC", "Epilepsia", "Cefaleias", "Meningites", "Esclerose Múltipla", "Parkinson", "Alzheimer", "Neuropatias Periféricas"],
  "Endocrinologia": ["Diabetes Mellitus", "Distúrbios da Tireoide", "Insuficiência Adrenal", "Síndrome de Cushing", "Hipopituitarismo", "Feocromocitoma", "Obesidade", "Dislipidemias"],
  "Gastroenterologia": ["Doença do Refluxo", "Úlcera Péptica", "Hepatites", "Cirrose", "Doença de Crohn", "Retocolite Ulcerativa", "Pancreatite", "Câncer Colorretal"],
  "Nefrologia": ["Insuficiência Renal Aguda", "Doença Renal Crônica", "Glomerulonefrites", "Síndrome Nefrótica", "Distúrbios Eletrolíticos", "Infecção Urinária", "Litíase Renal", "Diálise"],
  "Infectologia": ["HIV/AIDS", "Sepse", "Dengue", "Malária", "Infecções Oportunistas", "Antibioticoterapia", "Parasitoses", "Infecções Hospitalares"],
  "Hematologia": ["Anemias", "Leucemias", "Linfomas", "Distúrbios de Coagulação", "Trombocitopenia", "Hemoglobinopatias", "Mieloma Múltiplo", "Hemoterapia"],
  "Reumatologia": ["Lúpus Eritematoso", "Artrite Reumatoide", "Vasculites", "Espondiloartrites", "Esclerose Sistêmica", "Fibromialgia", "Gota", "Síndrome de Sjögren"],
  "Pediatria": ["Puericultura", "Doenças Exantemáticas", "Infecções Respiratórias", "Diarreias", "Imunização", "Aleitamento Materno", "Neonatologia", "Distúrbios do Crescimento"],
  "Ginecologia e Obstetrícia": ["Pré-Natal", "Trabalho de Parto", "Síndromes Hipertensivas", "Diabetes Gestacional", "Hemorragias Obstétricas", "Câncer de Colo", "Endometriose", "Climatério"],
  "Cirurgia": ["Abdome Agudo", "Apendicite", "Colecistite", "Hérnias", "Trauma", "Queimaduras", "Pré e Pós-Operatório", "Cirurgia Vascular"],
  "Psiquiatria": ["Depressão", "Transtorno Bipolar", "Esquizofrenia", "Transtornos de Ansiedade", "TOC", "TDAH", "Dependência Química", "Psicofarmacologia"],
  "Dermatologia": ["Dermatites", "Psoríase", "Infecções Cutâneas", "Melanoma", "Hanseníase", "Urticária", "Acne", "Lesões Pré-Malignas"],
  "Oftalmologia": ["Glaucoma", "Catarata", "Retinopatia Diabética", "Descolamento de Retina", "Conjuntivite", "Uveíte", "Erros de Refração", "Trauma Ocular"],
  "Otorrinolaringologia": ["Otite", "Sinusite", "Amigdalite", "Rinite", "Surdez", "Vertigem", "Apneia do Sono", "Tumores de Cabeça e Pescoço"],
  "Medicina Preventiva": ["Epidemiologia", "Vigilância em Saúde", "SUS", "Atenção Primária", "Política de Saúde", "Vacinação", "Indicadores de Saúde", "Saúde do Trabalhador"],
  "Medicina de Emergência": ["PCR e RCP", "Choque", "Politrauma", "Emergências Respiratórias", "Intoxicações", "Queimaduras", "Emergências Obstétricas", "ATLS"],
  "Terapia Intensiva": ["Ventilação Mecânica", "Sedação e Analgesia", "Choque Séptico", "Monitorização", "Nutrição em UTI", "Distúrbios Ácido-Base", "SDRA", "Morte Encefálica"],
};

const SPECIALTIES = Object.keys(SPECIALTIES_WITH_TOPICS);

interface DomainEntry {
  specialty: string;
  domain_score: number;
  questions_answered: number;
  correct_answers: number;
  clinical_cases_score: number;
  errors_count: number;
  reviews_count: number;
  avg_difficulty: number;
  last_studied_at: string | null;
}

const getScoreColor = (score: number) => {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
};

const getProgressColor = (score: number) => {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
};

const getBadge = (score: number) => {
  if (score >= 75) return { label: "Dominado", variant: "default" as const, className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  if (score >= 50) return { label: "Em progresso", variant: "secondary" as const, className: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  if (score > 0) return { label: "Precisa revisar", variant: "destructive" as const, className: "bg-red-500/20 text-red-400 border-red-500/30" };
  return { label: "Não estudado", variant: "outline" as const, className: "bg-muted/30 text-muted-foreground border-border" };
};

const MedicalDomainMap = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (specialty: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(specialty)) next.delete(specialty);
      else next.add(specialty);
      return next;
    });
  };

  const handleStudyTopic = (specialty: string, subtopic?: string) => {
    const topic = subtopic ? `${subtopic} (${specialty})` : specialty;
    navigate("/dashboard/chatgpt", {
      state: {
        initialMessage: `Quero estudar o tópico "${topic}". Me dê uma aula completa seguindo o protocolo ENAZIZI.`,
        fromErrorBank: true,
      },
    });
  };

  const fetchDomains = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("medical_domain_map")
      .select("*")
      .eq("user_id", user.id)
      .order("domain_score", { ascending: true });

    if (error) console.error("Error fetching domains:", error);

    const existingMap = new Map((data || []).map((d: any) => [d.specialty, d]));
    const merged = SPECIALTIES.map((s) => existingMap.get(s) || {
      specialty: s, domain_score: 0, questions_answered: 0, correct_answers: 0,
      clinical_cases_score: 0, errors_count: 0, reviews_count: 0, avg_difficulty: 3,
      last_studied_at: null,
    });
    setDomains(merged as DomainEntry[]);
    setLoading(false);
  };

  const recalculateFromErrors = async () => {
    if (!user) return;
    setRecalculating(true);
    try {
      const { data: errors } = await supabase
        .from("error_bank")
        .select("tema, subtema, vezes_errado, dificuldade")
        .eq("user_id", user.id);

      const { data: attempts } = await supabase
        .from("practice_attempts")
        .select("correct, question_id, questions_bank(topic)")
        .eq("user_id", user.id);

      const perfMap: Record<string, { answered: number; correct: number; errors: number; totalDiff: number }> = {};

      (attempts || []).forEach((a: any) => {
        const topic = a.questions_bank?.topic;
        if (!topic) return;
        const specialty = mapTopicToSpecialty(topic);
        if (!specialty) return;
        if (!perfMap[specialty]) perfMap[specialty] = { answered: 0, correct: 0, errors: 0, totalDiff: 0 };
        perfMap[specialty].answered++;
        if (a.correct) perfMap[specialty].correct++;
      });

      (errors || []).forEach((e: any) => {
        const specialty = mapTopicToSpecialty(e.tema);
        if (!specialty) return;
        if (!perfMap[specialty]) perfMap[specialty] = { answered: 0, correct: 0, errors: 0, totalDiff: 0 };
        perfMap[specialty].errors += e.vezes_errado || 1;
        perfMap[specialty].totalDiff += e.dificuldade || 3;
      });

      for (const [specialty, perf] of Object.entries(perfMap)) {
        const accuracy = perf.answered > 0 ? (perf.correct / perf.answered) * 100 : 0;
        const errorPenalty = Math.min(perf.errors * 3, 30);
        const score = Math.max(0, Math.min(100, Math.round(accuracy - errorPenalty)));

        await supabase.from("medical_domain_map").upsert({
          user_id: user.id,
          specialty,
          domain_score: score,
          questions_answered: perf.answered,
          correct_answers: perf.correct,
          errors_count: perf.errors,
          avg_difficulty: perf.totalDiff > 0 ? perf.totalDiff / (perf.errors || 1) : 3,
          last_studied_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,specialty" });
      }

      toast({ title: "Mapa recalculado", description: "Domínio atualizado com base nos seus dados." });
      await fetchDomains();
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao recalcular domínio.", variant: "destructive" });
    }
    setRecalculating(false);
  };

  useEffect(() => { fetchDomains(); }, [user]);

  const sorted = [...domains].sort((a, b) => b.domain_score - a.domain_score);
  const weakSpecialties = domains.filter((d) => d.domain_score < 50 && d.questions_answered > 0);
  const avgScore = domains.length > 0
    ? Math.round(domains.reduce((s, d) => s + d.domain_score, 0) / domains.length)
    : 0;
  const studiedCount = domains.filter((d) => d.questions_answered > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Mapa de Evolução
          </h1>
          <p className="text-muted-foreground mt-1">
            Seu nível de domínio em cada especialidade médica — clique para ver os assuntos
          </p>
        </div>
        <Button onClick={recalculateFromErrors} disabled={recalculating} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "Recalculando..." : "Recalcular"}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-primary">{avgScore}%</p>
            <p className="text-xs text-muted-foreground mt-1">Domínio Médio</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-foreground">{studiedCount}/{SPECIALTIES.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Especialidades Estudadas</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-bold text-red-400">{weakSpecialties.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Precisam Revisar (&lt;50%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Weak specialties recommendation */}
      {weakSpecialties.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Recomendação de Revisão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weakSpecialties.slice(0, 3).map((d) => (
              <div key={d.specialty} className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  Você apresenta menor domínio em <strong>{d.specialty}</strong> ({d.domain_score}%).
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-primary text-xs"
                  onClick={() => handleStudyTopic(d.specialty)}
                >
                  <BookOpen className="h-3 w-3 mr-1" /> Estudar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Full domain list */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Todas as Especialidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {sorted.map((d) => {
            const badge = getBadge(d.domain_score);
            const isExpanded = expanded.has(d.specialty);
            const subtopics = SPECIALTIES_WITH_TOPICS[d.specialty] || [];

            return (
              <div key={d.specialty} className="border border-border/50 rounded-lg overflow-hidden">
                {/* Specialty header row */}
                <button
                  onClick={() => toggleExpand(d.specialty)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground">{d.specialty}</span>
                    <Badge variant={badge.variant} className={`text-[10px] px-1.5 py-0 ${badge.className}`}>
                      {badge.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {subtopics.length} assuntos
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {d.questions_answered > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        ({d.correct_answers}/{d.questions_answered} questões)
                      </span>
                    )}
                    <span className={`text-sm font-bold ${getScoreColor(d.domain_score)}`}>
                      {d.domain_score}%
                    </span>
                  </div>
                </button>

                {/* Progress bar */}
                <div className="px-4 pb-2">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(d.domain_score)}`}
                      style={{ width: `${d.domain_score}%` }}
                    />
                  </div>
                </div>

                {/* Subtopics panel */}
                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-border/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
                      {subtopics.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => handleStudyTopic(d.specialty, sub)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-primary/10 transition-colors group"
                        >
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          <span className="text-foreground group-hover:text-primary transition-colors">{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

/** Maps a topic string to the closest specialty */
function mapTopicToSpecialty(topic: string): string | null {
  if (!topic) return null;
  const t = topic.toLowerCase();
  const map: [string[], string][] = [
    [["cardio", "coração", "iam", "arritmia", "hipertensão", "insuficiência cardíaca", "valv"], "Cardiologia"],
    [["pneumo", "pulmão", "asma", "dpoc", "pneumonia", "tuberculose", "respirat"], "Pneumologia"],
    [["neuro", "avc", "epilepsia", "cefaleia", "meningite", "parkinson", "alzheimer"], "Neurologia"],
    [["endocrino", "diabetes", "tireoide", "hipotireoid", "hipertireoid", "adrenal", "hipófise"], "Endocrinologia"],
    [["gastro", "fígado", "hepat", "intestin", "esôfago", "pancreat", "colite", "crohn"], "Gastroenterologia"],
    [["nefro", "rim", "renal", "diálise", "glomerul", "nefrit"], "Nefrologia"],
    [["infecto", "hiv", "aids", "sepse", "dengue", "malária", "antibiótico", "parasit"], "Infectologia"],
    [["hemato", "anemia", "leucemia", "linfoma", "coagul", "plaqueta"], "Hematologia"],
    [["reumato", "lúpus", "artrite", "vasculite", "fibromialgia"], "Reumatologia"],
    [["pediatr", "neonat", "criança", "lactente", "recém-nascido"], "Pediatria"],
    [["gineco", "obstet", "gravidez", "parto", "gestação", "pré-natal", "útero", "ovário"], "Ginecologia e Obstetrícia"],
    [["cirurg", "apendicite", "colecist", "hérnia", "abdome agudo", "trauma"], "Cirurgia"],
    [["psiqui", "depressão", "ansiedade", "esquizofrenia", "bipolar", "psicose"], "Psiquiatria"],
    [["dermato", "pele", "dermat", "psoríase", "melanoma"], "Dermatologia"],
    [["oftalmo", "olho", "glaucoma", "catarata", "retina"], "Oftalmologia"],
    [["otorrino", "ouvido", "nariz", "garganta", "sinusite", "otite"], "Otorrinolaringologia"],
    [["preventiva", "epidemio", "saúde pública", "sus", "atenção primária", "vacina"], "Medicina Preventiva"],
    [["emergência", "urgência", "pcr", "choque", "politrauma", "reanimação"], "Medicina de Emergência"],
    [["uti", "intensiva", "ventilação mecânica", "sedação", "choque séptico"], "Terapia Intensiva"],
  ];
  for (const [keywords, specialty] of map) {
    if (keywords.some((k) => t.includes(k))) return specialty;
  }
  return null;
}

export default MedicalDomainMap;
