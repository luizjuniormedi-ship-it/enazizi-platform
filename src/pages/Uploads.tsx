import { Upload, FileText, File, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const mockFiles = [
  { name: "Edital DPF 2025.pdf", type: "edital", size: "2.4 MB", date: "2025-12-10" },
  { name: "Prova DPF 2021.pdf", type: "prova", size: "1.8 MB", date: "2025-12-08" },
  { name: "Curso Direito Penal.pdf", type: "curso", size: "5.1 MB", date: "2025-12-05" },
];

const Uploads = () => {
  const [files] = useState(mockFiles);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          Uploads
        </h1>
        <p className="text-muted-foreground">Envie materiais para análise automática por IA.</p>
      </div>

      <div className="glass-card p-8 border-dashed border-2 border-primary/30 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <Upload className="h-12 w-12 text-primary/50 mx-auto mb-4" />
        <p className="text-lg font-medium mb-1">Arraste ou clique para enviar</p>
        <p className="text-sm text-muted-foreground">PDF, DOCX, TXT — máx 50MB</p>
        <Button className="mt-4">Selecionar arquivos</Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Arquivos enviados</h2>
        <div className="space-y-3">
          {files.map((f) => (
            <div key={f.name} className="glass-card p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.type} • {f.size} • {f.date}</div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Uploads;
