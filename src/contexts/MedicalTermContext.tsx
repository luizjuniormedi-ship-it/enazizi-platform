import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Stethoscope, Pill, FlaskConical, BookMarked } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermDefinition {
  definicao: string;
  fisiopatologia: string;
  diagnostico: string;
  tratamento: string;
  specialty: string;
  fontes: string[];
}

interface MedicalTermContextType {
  openTerm: (term: string) => void;
}

const MedicalTermContext = createContext<MedicalTermContextType>({ openTerm: () => {} });

export const useMedicalTerm = () => useContext(MedicalTermContext);

export const MedicalTermProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [currentTerm, setCurrentTerm] = useState("");
  const [definition, setDefinition] = useState<TermDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, TermDefinition>>(new Map());
  const { user } = useAuth();

  const openTerm = useCallback(async (term: string) => {
    const normalized = term.trim().toLowerCase();
    setCurrentTerm(term);
    setOpen(true);

    // Check in-memory cache
    const cached = cacheRef.current.get(normalized);
    if (cached) {
      setDefinition(cached);
      return;
    }

    setDefinition(null);
    setLoading(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-term-lookup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ term }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: TermDefinition = await res.json();
      cacheRef.current.set(normalized, data);
      setDefinition(data);
    } catch (err) {
      console.error("medical-term-lookup error:", err);
      toast({
        title: "Erro ao buscar termo",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <MedicalTermContext.Provider value={{ openTerm }}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle className="capitalize text-lg">{currentTerm}</SheetTitle>
            {definition?.specialty && (
              <SheetDescription>
                <Badge variant="secondary" className="text-xs">{definition.specialty}</Badge>
              </SheetDescription>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {loading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : definition ? (
              <div className="space-y-5 py-4">
                {/* Definição */}
                <Section icon={BookOpen} title="Definição" content={definition.definicao} />
                
                {/* Fisiopatologia */}
                {definition.fisiopatologia && (
                  <Section icon={FlaskConical} title="Fisiopatologia" content={definition.fisiopatologia} />
                )}

                {/* Diagnóstico */}
                {definition.diagnostico && (
                  <Section icon={Stethoscope} title="Diagnóstico" content={definition.diagnostico} />
                )}

                {/* Tratamento */}
                {definition.tratamento && (
                  <Section icon={Pill} title="Tratamento" content={definition.tratamento} />
                )}

                {/* Fontes */}
                {definition.fontes && definition.fontes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                      <BookMarked className="h-4 w-4" /> Referências
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      {definition.fontes.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </MedicalTermContext.Provider>
  );
};

function Section({ icon: Icon, title, content }: { icon: typeof BookOpen; title: string; content: string }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}
