import { Sparkles, BookOpen, Brain, Zap, X } from "lucide-react";

interface TutorOnboardingCardProps {
  onDismiss: () => void;
}

const TutorOnboardingCard = ({ onDismiss }: TutorOnboardingCardProps) => (
  <div className="relative overflow-hidden rounded-xl border border-primary/20 p-4 mb-3 animate-fade-in bg-gradient-to-br from-primary/5 via-card to-accent/5">
    <div className="absolute inset-0 shimmer pointer-events-none" />
    <button onClick={onDismiss} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground z-10">
      <X className="h-4 w-4" />
    </button>
    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 relative z-10">
      <Sparkles className="h-4 w-4 text-primary" /> Como funciona o Tutor
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
);

export default TutorOnboardingCard;
