import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, FileUp, IdCard, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  abrirMeuDocumento,
  listarMeusDocumentos,
  registrarDocumento,
} from "@/lib/documentos.functions";

import { obterUltimaVerificacao } from "@/lib/verificacao.functions";
import { CapturaDocumento } from "./CapturaDocumento";
import { FotoAmpliavel } from "./FotoAmpliavel";

const TIPOS = "image/*,application/pdf";
const MAX_MB = 10;

export function EnvioDocumento({ onEnviado }: { onEnviado?: (nomeArquivo: string) => void }) {
  const inputArquivo = useRef<HTMLInputElement | null>(null);
  const registrar = useServerFn(registrarDocumento);
  const listar = useServerFn(listarMeusDocumentos);
  const abrirArquivo = useServerFn(abrirMeuDocumento);
  const buscarVerificacao = useServerFn(obterUltimaVerificacao);
  const [enviando, setEnviando] = useState(false);
  const [jaEnviado, setJaEnviado] = useState(false);
  const [arquivo, setArquivo] = useState<{
    nome: string;
    previa?: string | undefined;
    caminho?: string | undefined;
    pdf?: boolean;
  } | null>(null);

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      void Promise.all([listar(), buscarVerificacao()])
        .then(([docs, verificacao]) => {
          if (!ativo) return;
          const oficial = docs.find((d) => d.tipo === "documento_oficial");
          const reprovado = verificacao?.status === "reprovado";
          setJaEnviado(Boolean(oficial) && !reprovado);
          if (oficial)
            setArquivo({
              nome: oficial.nome_arquivo || "documento enviado",
              caminho: oficial.caminho,
              pdf:
                oficial.mime === "application/pdf" || /\.pdf$/i.test(oficial.nome_arquivo ?? ""),
            });
        })
        .catch(() => undefined);
    carregar();
    const timer = window.setInterval(carregar, 20_000);
    return () => {
      ativo = false;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verArquivo = async () => {
    if (!arquivo?.caminho) return;
    try {
      const { url } = await abrirArquivo({ data: { caminho: arquivo.caminho } });
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Não foi possível abrir o arquivo agora.");
    }
  };


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
      setJaEnviado(true);
      toast.success("Documento guardado com segurança para conferência.");
    } catch (erro) {
      console.error("[documento] envio", erro);
      toast.error(
        erro instanceof Error && erro.message.includes("já enviou")
          ? erro.message
          : "Não foi possível guardar o documento. Tente novamente.",
      );
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
    setArquivo({ nome: file.name, previa, pdf: file.type === "application/pdf" });
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
        <div className="mt-3 grid gap-1.5">
          {arquivo.previa && !arquivo.pdf ? (
            <FotoAmpliavel
              src={arquivo.previa}
              alt="Documento oficial com foto"
              legenda="Apenas o documento oficial (CNH ou RG), sem o rosto."
            />
          ) : null}
          <p className="text-xs text-muted-foreground">
            {arquivo.pdf ? "PDF salvo no seu arquivo: " : "Enviado: "}
            {arquivo.nome}
          </p>
          {arquivo.caminho ? (
            <button
              type="button"
              onClick={() => void verArquivo()}
              className="justify-self-start text-xs text-primary underline"
            >
              {arquivo.pdf ? "Abrir PDF salvo" : "Abrir arquivo salvo"}
            </button>
          ) : null}
        </div>
      ) : null}


      <input
        ref={inputArquivo}
        type="file"
        accept={TIPOS}
        className="hidden"
        onChange={(e) => receber(e.target.files)}
      />

      {jaEnviado ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-primary" />
          Documento já enviado — o envio é único e está na fila de conferência da equipe.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <CapturaDocumento onConcluir={aoFotografar}>
            <Button className="flex-1 gap-2" disabled={enviando}>
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
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Seus arquivos ficam guardados em nuvem privada e são acessados apenas pela equipe de
        conferência, com registro de auditoria (LGPD).
      </p>
    </div>
  );
}
