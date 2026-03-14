import { Upload, FileText, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UploadRecord {
  id: string;
  filename: string;
  file_type: string | null;
  category: string | null;
  status: string | null;
  created_at: string;
  extracted_json: any;
}

const Uploads = () => {
  const [files, setFiles] = useState<UploadRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUploads = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("uploads")
      .select("id, filename, file_type, category, status, created_at, extracted_json")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setFiles(data);
  };

  useEffect(() => { fetchUploads(); }, [user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 20MB para processamento estável.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const storagePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("user-uploads")
        .upload(storagePath, file);

      if (storageError) throw storageError;

      const { data: uploadRecord, error: dbError } = await supabase
        .from("uploads")
        .insert({
          user_id: user.id,
          filename: file.name,
          file_type: ext || "unknown",
          category: "material",
          storage_path: storagePath,
          status: "uploaded",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({ title: "Upload concluído!", description: "Processando com IA..." });
      await fetchUploads();

      // Process with AI
      setProcessing(uploadRecord.id);
      const { data: session } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({ uploadId: uploadRecord.id }),
      });

      const result = await resp.json();
      if (!resp.ok) {
        toast({ title: "Erro no processamento", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Processado!", description: result.message });
      }

      await fetchUploads();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setProcessing(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (upload: UploadRecord) => {
    const { error } = await supabase.from("uploads").delete().eq("id", upload.id);
    if (!error) {
      setFiles((prev) => prev.filter((f) => f.id !== upload.id));
      toast({ title: "Arquivo removido" });
    }
  };

  const statusIcon = (status: string | null) => {
    switch (status) {
      case "processed": return <CheckCircle className="h-4 w-4 text-success" />;
      case "processing": return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          Uploads
        </h1>
        <p className="text-muted-foreground">Envie materiais de medicina para gerar flashcards automaticamente com IA. Apenas conteúdo médico é aceito.</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div
        className="glass-card p-8 border-dashed border-2 border-primary/30 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium mb-1">Enviando e processando...</p>
            <p className="text-sm text-muted-foreground">Gerando flashcards com IA</p>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-primary/50 mx-auto mb-4" />
            <p className="text-lg font-medium mb-1">Clique para enviar arquivo</p>
            <p className="text-sm text-muted-foreground">PDF, DOCX, TXT — máx 50MB</p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Arquivos enviados</h2>
          <div className="space-y-3">
            {files.map((f) => (
              <div key={f.id} className="glass-card p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {processing === f.id ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : statusIcon(f.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{f.filename}</div>
                  <div className="text-xs text-muted-foreground">
                    {f.file_type} • {f.status === "processed" ? `✅ ${f.extracted_json?.flashcards_count || 0} flashcards gerados` : f.status} • {new Date(f.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(f)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Uploads;
