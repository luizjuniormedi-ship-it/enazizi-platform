import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSearch, FlaskConical, Image as ImageIcon } from "lucide-react";

interface ExamEntry {
  type: "lab" | "imaging";
  content: string;
  timestamp: number;
}

interface ExamsPanelProps {
  exams: ExamEntry[];
}

const ExamsPanel = ({ exams }: ExamsPanelProps) => {
  if (exams.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-3">
          <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
            <FileSearch className="h-3.5 w-3.5 text-blue-500" />
            Exames Solicitados
          </h4>
          <p className="text-[10px] text-muted-foreground text-center py-3">
            Nenhum exame solicitado ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  const labExams = exams.filter((e) => e.type === "lab");
  const imagingExams = exams.filter((e) => e.type === "imaging");

  return (
    <Card className="border-border/50">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold flex items-center gap-1.5">
            <FileSearch className="h-3.5 w-3.5 text-blue-500" />
            Exames Solicitados
          </h4>
          <Badge variant="outline" className="text-[10px]">{exams.length}</Badge>
        </div>

        <ScrollArea className="max-h-[250px]">
          <div className="space-y-2">
            {labExams.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                  <FlaskConical className="h-3 w-3" /> Laboratoriais
                </p>
                {labExams.map((exam, i) => (
                  <div key={i} className="p-2 rounded-md bg-blue-500/5 border border-blue-500/20 mb-1">
                    <p className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed">{exam.content}</p>
                  </div>
                ))}
              </div>
            )}

            {imagingExams.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                  <ImageIcon className="h-3 w-3" /> Imagem
                </p>
                {imagingExams.map((exam, i) => (
                  <div key={i} className="p-2 rounded-md bg-purple-500/5 border border-purple-500/20 mb-1">
                    <p className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed">{exam.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ExamsPanel;
