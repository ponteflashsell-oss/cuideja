import { useRef, useState } from "react";
import { Camera, FileUp, IdCard, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { registrarDocumento } from "@/lib/documentos.functions";
import { CapturaDocumento } from "./CapturaDocumento";

const TIPOS = "image/*,application/pdf";
const MAX_MB = 10;

export function EnvioDocumento({ onEnviado }: { onEnviado?: (nomeArquivo: string) => void }) {
  const inputArquivo = useRef<HTMLInputElement | null>(null);
  const registrar = useServerFn(registrarDocumento);
  const [enviando, setEnviando] = useState(false);
  const [arquivo, setArquivo] = useState<{ nome: string; previa?: string | undefined } | null>(
    null,
  );

  const guardarNaNuvem = async (
    corpo: Blob,
    nome: string,
    mime: string,
    origem: "camera" | "upload",
  ) => {
    setEnviando(true);
    try {
      const { data: sessao } = await supabase.auth.getUser();
      const userId = sessao.user?.id;
      if (!userId) throw new Error("sem sessão");
      const extensao = mime === "application/pdf" ? "pdf" : "jpg";
      const caminho = `${userId}/documentos/${Date.now()}-documento.${extensao}`;
      const { error } = await supabase.storage
        .from("verificacoes")
        .upload(caminho, corpo, { contentType: mime, upsert: true });
      if (error) throw error;
      await registrar({
        data: {
          caminho,
          nomeArquivo: nome,
          tipo: "documento_oficial",
          mime,
          tamanho: corpo.size,
          origem,
        },
      });
      toast.success("Documento guardado com segurança para conferência.");
    } catch (erro) {
      console.error("[documento] envio", erro);
      toast.error("Não foi possível guardar o documento. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const receber = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Envie até ${MAX_MB}MB.`);
      return;
    }
    const previa = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setArquivo({ nome: file.name, previa });
    onEnviado?.(file.name);
    await guardarNaNuvem(file, file.name, file.type || "application/octet-stream", "upload");
  };

  const aoFotografar = async (imagem: string) => {
    setArquivo({ nome: "foto_documento.jpg", previa: imagem });
    onEnviado?.("foto_documento.jpg");
    const resposta = await fetch(imagem);
    const blob = await resposta.blob();
    await guardarNaNuvem(blob, "foto_documento.jpg", blob.type || "image/jpeg", "camera");
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <IdCard className="size-4 text-primary" /> Documento oficial com foto
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Aceitamos <strong>CNH</strong> ou <strong>RG (identidade)</strong> — foto tirada na hora
        pela câmera do celular, com os dados legíveis e sem reflexo.
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
        ref={inputArquivo}
        type="file"
        accept={TIPOS}
        className="hidden"
        onChange={(e) => receber(e.target.files)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <CapturaDocumento onConcluir={aoFotografar}>
          <Button className="flex-1 gap-2">
            <Camera className="size-4" /> Abrir câmera e fotografar
          </Button>
        </CapturaDocumento>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          disabled={enviando}
          onClick={() => inputArquivo.current?.click()}
        >
          {enviando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : arquivo ? (
            <RefreshCw className="size-4" />
          ) : (
            <FileUp className="size-4" />
          )}
          {enviando ? "Guardando…" : arquivo ? "Trocar arquivo" : "Enviar arquivo (foto ou PDF)"}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Seus arquivos ficam guardados em nuvem privada e são acessados apenas pela equipe de
        conferência, com registro de auditoria (LGPD).
      </p>
    </div>
  );
}
