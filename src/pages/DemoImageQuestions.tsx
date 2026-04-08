import { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, GraduationCap, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ecgWpw from "@/assets/ecg-wpw.jpg";
import ecgAesp from "@/assets/ecg-aesp.jpg";
import rxSinalVela from "@/assets/rx-sinal-vela.jpg";

const IMAGE_TYPE_LABELS: Record<string, string> = {
  ecg: "🫀 ECG",
  xray: "🦴 Raio-X",
  dermatology: "🔬 Dermatologia",
  ct: "📡 Tomografia",
};

interface DemoQuestion {
  code: string;
  statement: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: string;
  examStyle: string;
  imageType: string;
  diagnosis: string;
  imageUrl: string;
}

const QUESTION_IMAGES: Record<string, string> = {
  Q_ECG_002: ecgWpw,
  Q_ECG_003: ecgAesp,
  Q_IMG_RX_001: rxSinalVela,
};

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    code: "Q_ECG_002",
    imageType: "ecg",
    diagnosis: "Síndrome de Wolff-Parkinson-White",
    difficulty: "hard",
    examStyle: "ENARE",
    statement: "Um adolescente de 16 anos, sexo masculino, é admitido no pronto-socorro com queixa de palpitações intensas de início súbito, acompanhadas de tontura e dor precordial leve. Ele nega antecedentes médicos relevantes ou uso de medicações. Ao exame físico, encontra-se pálido, levemente taquipneico, com frequência cardíaca de 180 bpm e pressão arterial de 90/60 mmHg, sem outros achados notáveis. O eletrocardiograma (ECG) de 12 derivações realizado na admissão demonstra taquicardia de complexo QRS alargado, ritmo regular, com frequência ventricular de aproximadamente 180 bpm. Observa-se um intervalo PR curto (<0,12s) e a presença de uma \"onda delta\" (empastamento da porção inicial do complexo QRS) em diversas derivações, além de alargamento do complexo QRS (>0,12s). Qual o diagnóstico eletrocardiográfico mais provável para este paciente?",
    options: ["Fibrilação atrial", "Taquicardia ventricular (TV)", "Síndrome de Wolff-Parkinson-White", "Flutter atrial", "ECG Normal"],
    correct: 2,
    explanation: "A presença de PR curto, onda delta e QRS alargado são características clássicas da Síndrome de Wolff-Parkinson-White, indicando pré-excitação ventricular. Fibrilação atrial e flutter atrial não têm onda delta. Taquicardia ventricular é um diagnóstico diferencial, mas a combinação de PR curto e onda delta é mais específica.",
  },
  {
    code: "Q_ECG_003",
    imageType: "ecg",
    diagnosis: "Atividade elétrica sem pulso",
    difficulty: "medium",
    examStyle: "ENARE",
    statement: "Durante o atendimento a uma mulher de 55 anos que sofreu uma parada cardiorrespiratória súbita, os paramédicos iniciam manobras de reanimação cardiopulmonar (RCP) e conectam o desfibrilador. Ao visualizar o monitor do desfibrilador, observa-se um ritmo cardíaco organizado, com QRS estreito e regular a uma frequência de 70 bpm, porém, a equipe não consegue palpar pulso radial ou carotídeo. A paciente está inconsciente, sem resposta a estímulos e não apresenta respiração efetiva. Foi realizada ventilação com bolsa-máscara e iniciada compressão torácica de alta qualidade. Diante deste cenário, qual é o diagnóstico eletrocardiográfico mais provável que define a condição da paciente?",
    options: ["Assistolia", "Fibrilação ventricular (FV) fina", "Atividade elétrica sem pulso (AESP)", "Bradicardia sinusal com pulso", "Choque cardiogênico"],
    correct: 2,
    explanation: "A descrição de um ritmo cardíaco organizado no monitor, mas sem pulso palpável, é a definição clássica de Atividade Elétrica Sem Pulso (AESP). Assistolia seria ausência completa de atividade elétrica. FV fina seria um ritmo caótico e irregular. Bradicardia com pulso significaria pulso presente.",
  },
  {
    code: "Q_IMG_RX_001",
    imageType: "xray",
    diagnosis: "Timo normal no lactente",
    difficulty: "easy",
    examStyle: "ENARE",
    statement: "Um lactente de 2 meses, sexo masculino, é levado à emergência pela mãe devido a um quadro de tosse ocasional e leve coriza nos últimos dois dias. Não apresenta febre, dificuldade respiratória ou alterações na alimentação e sono. Os antecedentes gestacionais e perinatais são normais, e o desenvolvimento neuropsicomotor está dentro do esperado para a idade. Ao exame físico, o bebê está ativo, reativo, afebril, com boa coloração de pele e mucosas. Ausculta pulmonar com murmúrios vesiculares presentes e simétricos, sem ruídos adventícios. Ausculta cardíaca rítmica, bulhas normofonéticas, sem sopros. Abdome flácido, indolor, sem visceromegalias. Uma radiografia de tórax é realizada, evidenciando um alargamento mediastinal anterior, com contornos lobulados e bem definidos, projetando-se para o hemitórax direito, formando uma imagem que lembra a \"vela de um barco\". Não há sinais de infiltrados pulmonares, derrame pleural ou cardiomegalia. Qual o diagnóstico mais provável para este achado radiológico?",
    options: ["Linfoma mediastinal", "Massa teratoma", "Timo normal", "Cardiomegalia", "Massa mediastinal congênita"],
    correct: 2,
    explanation: "O alargamento mediastinal com o \"sinal da vela\" em um lactente assintomático é característico de um timo normal. Linfoma, teratoma e outras massas mediastinais seriam etiologias atípicas com achados clínicos inespecíficos ou inexistentes, além de geralmente apresentarem contornos mais irregulares ou outros sinais patológicos. Cardiomegalia seria descartada por ausência de sinais cardíacos e forma característica.",
  },
];

const DIFF_COLORS: Record<string, string> = {
  easy: "bg-green-500/10 text-green-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  hard: "bg-destructive/10 text-destructive",
};
const DIFF_LABELS: Record<string, string> = { easy: "Fácil", medium: "Médio", hard: "Difícil" };

const DemoImageQuestions = () => {
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const q = DEMO_QUESTIONS[current];
  const isRevealed = revealed.has(current);
  const userAnswer = answers[current];

  const selectAnswer = (optIdx: number) => {
    if (isRevealed) return;
    setAnswers(prev => ({ ...prev, [current]: optIdx }));
    setRevealed(prev => new Set(prev).add(current));
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl font-bold">Demo — Questões com Imagem</h1>
          <p className="text-sm text-muted-foreground">
            Prévia do banco de questões multimodais do ENAZIZI
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{current + 1}/{DEMO_QUESTIONS.length}</span>
          <div className="flex gap-2">
            <Badge className={DIFF_COLORS[q.difficulty]}>{DIFF_LABELS[q.difficulty]}</Badge>
            <Badge variant="outline">{q.examStyle}</Badge>
          </div>
        </div>
        <div className="h-1 rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((current + 1) / DEMO_QUESTIONS.length) * 100}%` }} />
        </div>

        {/* Question card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          {/* Image type badge */}
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {IMAGE_TYPE_LABELS[q.imageType] || q.imageType}
            </span>
            <span className="text-xs text-muted-foreground">Questão baseada em imagem médica</span>
          </div>

          {/* Statement */}
          <p className="text-sm md:text-base font-medium leading-relaxed">{q.statement}</p>

          {/* Options */}
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              let cls = "border-border bg-secondary/50 hover:border-primary/30 cursor-pointer";
              if (isRevealed) {
                if (i === q.correct) cls = "border-green-500 bg-green-500/10";
                else if (i === userAnswer) cls = "border-destructive bg-destructive/10";
                else cls = "border-border bg-secondary/30 opacity-60";
              } else if (userAnswer === i) {
                cls = "border-primary bg-primary/10";
              }

              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  disabled={isRevealed}
                  className={`w-full text-left p-3.5 rounded-lg border text-sm transition-all ${cls} ${isRevealed ? "cursor-default" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {isRevealed && i === q.correct && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                    {isRevealed && i === userAnswer && i !== q.correct && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                    <span>
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + i)})</span>
                      {opt}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {isRevealed && (
            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-fade-in">
              <p className="text-sm font-medium mb-1 text-primary">📖 Explicação</p>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(c => c - 1)} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <Button disabled={current >= DEMO_QUESTIONS.length - 1} onClick={() => setCurrent(c => c + 1)} className="flex-1">
            Próxima <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Banco com {DEMO_QUESTIONS.length} questões de demonstração • Padrão ENARE/USP
        </p>
      </div>
    </div>
  );
};

export default DemoImageQuestions;
