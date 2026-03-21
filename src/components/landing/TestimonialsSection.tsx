import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackRow {
  feedback_text: string;
  ratings: Record<string, number>;
  display_name: string | null;
}

const MODULE_LABELS: Record<string, string> = {
  agentes_ia: "Agentes IA",
  anamnese: "Anamnese",
  banco_questoes: "Banco de Questões",
  caderno_erros: "Caderno de Erros",
  cronograma: "Cronograma",
  flashcards: "Flashcards",
  simulacao_clinica: "Simulação Clínica",
  simulados: "Simulados",
};

const getAvgRating = (ratings: Record<string, number>) => {
  const vals = Object.values(ratings);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${
          i < Math.round(rating)
            ? "fill-primary text-primary"
            : "text-muted-foreground/30"
        }`}
      />
    ))}
  </div>
);

const TestimonialsSection = () => {
  const { data: feedbacks } = useQuery({
    queryKey: ["landing-testimonials"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      // Fetch feedbacks with valid text and good ratings
      const { data: fbData } = await supabase
        .from("user_feedback")
        .select("feedback_text, ratings, user_id")
        .not("feedback_text", "eq", "")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!fbData || fbData.length === 0) return [];

      // Get profile names
      const userIds = [...new Set(fbData.map((f) => f.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const nameMap = new Map(
        (profiles || []).map((p) => [p.user_id, p.display_name])
      );

      return fbData
        .map((f) => ({
          feedback_text: f.feedback_text,
          ratings: (f.ratings || {}) as Record<string, number>,
          display_name: nameMap.get(f.user_id) || "Aluno",
        }))
        .filter((f) => {
          // Filter: avg >= 4, text length >= 5, no gibberish
          const avg = getAvgRating(f.ratings);
          const text = f.feedback_text.trim();
          if (avg < 4 || text.length < 5) return false;
          // Skip gibberish (repeated chars, only dots, etc.)
          if (/^[.\s]+$/.test(text) || /^(.)\1{4,}/.test(text)) return false;
          return true;
        })
        .slice(0, 6) as FeedbackRow[];
    },
  });

  if (!feedbacks || feedbacks.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden bg-card/20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Avaliações reais
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            O que nossos alunos <span className="gradient-text">dizem</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Feedbacks enviados diretamente pela plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {feedbacks.map((f, i) => {
            const avg = getAvgRating(f.ratings);
            return (
              <div
                key={i}
                className="rounded-2xl border border-border/40 bg-card/80 p-6 transition-all duration-300 hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                    {getInitials(f.display_name || "A")}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {(f.display_name || "Aluno").split(" ").slice(0, 2).join(" ")}
                    </p>
                    <StarRating rating={avg} />
                  </div>
                </div>

                {/* Comment */}
                <p className="text-sm text-foreground/85 leading-relaxed mb-4">
                  "{f.feedback_text}"
                </p>

                {/* Top-rated modules */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(f.ratings)
                    .filter(([, v]) => v >= 4)
                    .slice(0, 3)
                    .map(([key, val]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                      >
                        {MODULE_LABELS[key] || key} {val}/5
                      </span>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
