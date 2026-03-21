import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "O MedStudy AI substitui meu cursinho?",
    a: "O MedStudy AI é um complemento inteligente à sua preparação. Ele potencializa qualquer método de estudo com IA, active recall e repetição espaçada — acelerando sua fixação e identificando lacunas que cursinhos tradicionais não detectam.",
  },
  {
    q: "As questões são confiáveis? Seguem o padrão das provas?",
    a: "Sim! Nossas questões são geradas no padrão ENARE, USP, UNIFESP e Revalida, com casos clínicos, 5 alternativas e discussão clínica completa de cada opção. A IA é treinada com provas reais.",
  },
  {
    q: "Posso usar no celular?",
    a: "Sim! A plataforma é 100% responsiva e funciona como um app no navegador do celular. Você pode instalar como PWA na tela inicial para acesso rápido.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Absolutamente. Usamos criptografia de ponta, autenticação segura e seus dados são armazenados em servidores protegidos. Seu progresso e informações pessoais são privados.",
  },
  {
    q: "Quanto tempo leva para ver resultados?",
    a: "Alunos relatam melhora na taxa de acerto já nas primeiras 2 semanas de uso consistente. O preditor de aprovação começa a gerar estimativas confiáveis após 100 questões respondidas.",
  },
  {
    q: "Posso enviar provas e materiais próprios?",
    a: "Sim! Você pode fazer upload de PDFs, provas anteriores e simulados. A IA analisa o conteúdo e gera questões, flashcards e resumos personalizados a partir do seu material.",
  },
];

const FAQSection = () => (
  <section id="faq" className="py-16 sm:py-24 relative overflow-hidden">
    <div className="container relative z-10 px-4">
      <div className="text-center mb-10 sm:mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          FAQ
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">
          Perguntas <span className="gradient-text">frequentes</span>
        </h2>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="space-y-2 sm:space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-xl border border-border/40 bg-card/60 px-4 sm:px-6 data-[state=open]:border-primary/30 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-sm md:text-base py-4 sm:py-5 hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 sm:pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </section>
);

export default FAQSection;
