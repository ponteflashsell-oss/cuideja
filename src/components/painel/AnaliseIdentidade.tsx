import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CapturaSelfie } from "@/components/painel/CapturaSelfie";
import { FotoAmpliavel } from "@/components/painel/FotoAmpliavel";
import { supabase } from "@/integrations/supabase/client";

type Resultado = {
  status: string;
  score: number;
  nome: string;
  cpf: string;
  tipoDocumento: string;
  cpfValido: boolean;
  faceConfere: boolean;
  documentoLegivel: boolean;
  antecedentes: string;
  observacoes: string;
  revisaoManual?: boolean;
};

const rotuloAntecedentes: Record<string, string> = {
  nao_consultado: "Aguardando consulta oficial",
  limpo: "Sem apontamentos",
  com_apontamento: "Com apontamento — revisão humana",
  erro: "Falha na consulta — revisão humana",
};

function Item({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="size-4 text-primary" />
      ) : (
        <Clock className="size-4 text-muted-foreground" />
      )}
      <span className={ok ? "" : "text-muted-foreground"}>{texto}</span>
    </li>
  );
}

export function AnaliseIdentidade({ onEnviado }: { onEnviado?: () => void }) {
  const [analisando, setAnalisando] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [tipo, setTipo] = useState<"familia" | "cuidadora">("cuidadora");
  const ehFamilia = tipo === "familia";

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data: sessao } = await supabase.auth.getUser();
      const userId = sessao.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("tipo")
        .eq("id", userId)
        .maybeSingle();
      if (!ativo) return;
      if (data?.tipo === "familia") setTipo("familia");
    })();
    return () => {
      ativo = false;
    };
  }, []);


  const buscar = async () => {
    const { data: sessao } = await supabase.auth.getUser();
    const userId = sessao.user?.id;
    if (!userId) return null;
    const { data } = await supabase
      .from("verificacoes")
      .select(
        "status, score, nome_documento, cpf, tipo_documento, cpf_valido, face_confere, antecedentes_status, observacoes, revisao_manual, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  };

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      void buscar()
      .then((registro) => {
        if (!ativo || !registro) return;
        setResultado({
          status: registro.status,
          score: registro.score,
          nome: registro.nome_documento,
          cpf: registro.cpf,
          tipoDocumento: registro.tipo_documento,
          cpfValido: registro.cpf_valido,
          faceConfere: registro.face_confere,
          documentoLegivel: registro.cpf_valido || registro.score > 0,
          antecedentes: registro.antecedentes_status,
          observacoes: registro.observacoes,
          revisaoManual: registro.revisao_manual,
        });
        onEnviado?.();
      })
      .catch(() => undefined);
    carregar();
    // Enquanto aguarda análise, verifica a cada 20s se a equipe decidiu.
    const timer = window.setInterval(carregar, 20_000);
    return () => {
      ativo = false;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reprovado = resultado?.status === "reprovado";

  const enviar = async (imagens: { selfie: string; documento: string }) => {
    setAnalisando(true);
    setFoto(imagens.selfie);
    try {
      const { data: sessao } = await supabase.auth.getUser();
      const userId = sessao.user?.id;
      if (!userId) throw new Error("Sua sessão expirou. Entre novamente.");

      const agora = Date.now();
      const subir = async (nome: string, dataUrl: string) => {
        const blob = await (await fetch(dataUrl)).blob();
        const caminho = `${userId}/${agora}-${nome}.jpg`;
        const { error } = await supabase.storage
          .from("verificacoes")
          .upload(caminho, blob, { contentType: blob.type || "image/jpeg", upsert: true });
        if (error) throw new Error(`Falha ao guardar a foto: ${error.message}`);
        return caminho;
      };
      const selfiePath = await subir("selfie", imagens.selfie);
      const documentoPath =
        imagens.documento === imagens.selfie ? selfiePath : await subir("documento", imagens.documento);

      const observacoes = "Aguardando conferência manual da equipe.";
      const { error: erroInsert } = await supabase.from("verificacoes").insert({
        user_id: userId,
        status: "em_analise",
        nome_documento: "",
        cpf: "",
        tipo_documento: "outro",
        cpf_valido: false,
        face_confere: false,
        score: 0,
        observacoes,
        antecedentes_status: "nao_consultado",
        antecedentes_dados: null,
        selfie_path: selfiePath,
        documento_path: documentoPath,
        revisao_manual: true,
      });
      if (erroInsert) {
        await supabase.storage.from("verificacoes").remove([selfiePath]);
        throw new Error(`Falha ao registrar a conferência: ${erroInsert.message}`);
      }

      const { data: publico } = supabase.storage.from("verificacoes").getPublicUrl(selfiePath);
      // Marca o perfil como pendente de conferência (colunas opcionais no banco).
      const { error: erroPerfil } = await supabase
        .from("profiles")
        .update({ selfie_url: publico.publicUrl, status_verificacao: "pendente" } as never)
        .eq("id", userId);
      if (erroPerfil) {
        console.warn("[verificacao] perfil sem campos complementares", erroPerfil.message);
      }

      setResultado({
        status: "em_analise",
        score: 0,
        nome: "",
        cpf: "",
        tipoDocumento: "outro",
        cpfValido: false,
        faceConfere: false,
        documentoLegivel: false,
        antecedentes: "nao_consultado",
        observacoes,
        revisaoManual: true,
      });
      onEnviado?.();
      toast.success("Fotos recebidas e guardadas para conferência manual da nossa equipe.");
    } catch (erro) {
      console.error("[verificacao] envio direto", erro);
      toast.error(erro instanceof Error ? erro.message : "Não conseguimos enviar a foto agora.");
    } finally {
      setAnalisando(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <ScanFace className="size-4 text-primary" />
          {ehFamilia ? "Conferência de identidade do responsável" : "Conferência manual de identidade"}
        </h4>
        {resultado ? (
          <Badge variant={reprovado ? "destructive" : "secondary"}>
            {reprovado
              ? "Reprovado — reenvio liberado"
              : resultado.status === "aprovado"
                ? "Aprovado"
                : resultado.revisaoManual
                  ? "Conferência manual"
                  : "Em análise"}
          </Badge>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {ehFamilia
          ? "Envie uma foto do seu rosto com o documento ao lado. A equipe confere se a foto e o documento são da mesma pessoa — é a única etapa exigida das famílias."
          : "Envie uma foto do seu rosto com o documento ao lado. A equipe confere manualmente os dados, a autenticidade do documento e a correspondência da foto."}
      </p>


      {resultado && !reprovado ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-primary" />
          Foto de verificação já enviada — o envio é único. Só é possível reenviar se a equipe
          reprovar o envio.
        </p>
      ) : (
        <>
          {reprovado ? (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-muted-foreground">
              <AlertTriangle className="size-4 shrink-0 text-destructive" />
              Envio reprovado pela equipe. Faça uma nova foto do rosto com o documento.
            </p>
          ) : null}
          <CapturaSelfie onConcluir={(imagens) => void enviar(imagens)} />
        </>
      )}

      {foto ? (
        <div className="mt-3 grid gap-1.5">
          <p className="text-xs font-medium">Rosto com o documento (foto enviada)</p>
          <FotoAmpliavel
            src={foto}
            alt="Rosto com o documento oficial"
            legenda="Foto única enviada para prova de vida: rosto e documento juntos."
          />
        </div>
      ) : null}

      {analisando ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Enviando fotos para conferência manual…
        </p>
      ) : null}


      {resultado ? (
        <div className="mt-4 grid gap-2">
          <ul className="grid gap-1.5">
            <Item
              ok={resultado.documentoLegivel}
              texto={
                resultado.documentoLegivel
                  ? "Documento legível"
                  : "Documento aguardando conferência manual"
              }
            />
            {ehFamilia ? null : (
              <Item
                ok={resultado.cpfValido}
                texto={
                  resultado.cpfValido
                    ? `CPF ${resultado.cpf} validado`
                    : "CPF será conferido manualmente pela equipe"
                }
              />
            )}
            <Item
              ok={resultado.faceConfere}
              texto={
                resultado.faceConfere
                  ? "Rosto da selfie confere com o documento"
                  : "Comparação de rosto em conferência manual"
              }
            />
          </ul>
          {ehFamilia ? null : (
            <p className="text-xs text-muted-foreground">
              Nome no documento:{" "}
              <strong>{resultado.nome || "aguardando conferência manual"}</strong>
              {resultado.tipoDocumento && resultado.tipoDocumento !== "outro"
                ? ` · ${resultado.tipoDocumento.toUpperCase()}`
                : ""}{" "}
              · pontuação automática {resultado.score}/100
            </p>
          )}
          {ehFamilia ? null : (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Antecedentes: {rotuloAntecedentes[resultado.antecedentes] ?? resultado.antecedentes}
            </p>
          )}

          {resultado.revisaoManual ? (
            <p className="text-xs text-muted-foreground">
              Seu envio foi salvo e está na fila de análise humana — você não precisa refazer as
              fotos. Avisamos aqui quando a verificação for concluída.
            </p>
          ) : null}
          {resultado.observacoes ? (
            <p className="text-xs text-muted-foreground">Observações: {resultado.observacoes}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
