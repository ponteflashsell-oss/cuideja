import { useRef, useState } from "react";
import { Camera, FileUp, IdCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const TIPOS = "image/*,application/pdf";
const MAX_MB = 10;

export function EnvioDocumento({ onEnviado }: { onEnviado?: (nomeArquivo: string) => void }) {
  const inputCamera = useRef<HTMLInputElement | null>(null);
  const inputArquivo = useRef<HTMLInputElement | null>(null);
  const [arquivo, setArquivo] = useState<{ nome: string; previa?: string | undefined } | null>(
    null,
  );

  const receber = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Envie até ${MAX_MB}MB.`);
      return;
    }
    const previa = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setArquivo({ nome: file.name, previa });
    onEnviado?.(file.name);
    toast.success("Documento enviado para conferência.");
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <IdCard className="size-4 text-primary" /> Documento oficial com foto
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Aceitamos <strong>CNH</strong> ou <strong>RG (identidade)</strong> — foto tirada na hora pela
        câmera do celular, imagem da galeria ou arquivo PDF, com os dados legíveis e sem reflexo.
      </p>

      {arquivo ? (
        <div className="mt-3 grid gap-2">
          {arquivo.previa ? (
            <img
              src={arquivo.previa}
              alt="Prévia do documento enviado"
              className="max-h-56 w-full rounded-lg object-contain bg-background"
            />
          ) : null}
          <p className="text-xs text-muted-foreground">Enviado: {arquivo.nome}</p>
        </div>
      ) : null}

      <input
        ref={inputCamera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => receber(e.target.files)}
      />
      <input
        ref={inputArquivo}
        type="file"
        accept={TIPOS}
        className="hidden"
        onChange={(e) => receber(e.target.files)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button className="flex-1 gap-2" onClick={() => inputCamera.current?.click()}>
          <Camera className="size-4" /> Abrir câmera e fotografar
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => inputArquivo.current?.click()}
        >
          {arquivo ? <RefreshCw className="size-4" /> : <FileUp className="size-4" />}
          {arquivo ? "Trocar arquivo" : "Enviar arquivo (foto ou PDF)"}
        </Button>
      </div>
    </div>
  );
}
