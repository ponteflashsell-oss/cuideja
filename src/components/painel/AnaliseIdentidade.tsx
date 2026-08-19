import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Loader2, ScanFace, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CapturaSelfie } from "@/components/painel/CapturaSelfie";
import { analisarVerificacao, obterUltimaVerificacao } from "@/lib/verificacao.functions";

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
  const analisar = useServerFn(analisarVerificacao);
  const buscar = useServerFn(obterUltimaVerificacao);
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    let ativo = true;
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
          documentoLegivel: true,
          antecedentes: registro.antecedentes_status,
          observacoes: registro.observacoes,
        });
        onEnviado?.();
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviar = async (imagens: { selfie: string; documento: string }) => {
    setAnalisando(true);
    try {
      const dados = (await analisar({ data: imagens })) as Resultado;
      setResultado(dados);
      onEnviado?.();
      if (dados.status === "reprovado") {
        toast.error("A leitura automática não confirmou seus dados. Refaça as fotos.");
      } else {
        toast.success("Documento lido e enviado para aprovação final.");
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não conseguimos analisar agora.");
    } finally {
      setAnalisando(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <ScanFace className="size-4 text-primary" /> Checagem automática de identidade
        </h4>
        {resultado ? (
          <Badge variant={resultado.status === "reprovado" ? "outline" : "secondary"}>
            {resultado.status === "reprovado" ? "Refazer captura" : "Em análise"}
          </Badge>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Ao capturar selfie + documento, o sistema lê os dados do RG/CNH, valida o CPF, compara o
        rosto com a foto do documento e envia para a checagem de antecedentes.
      </p>

      <CapturaSelfie onConcluir={(imagens) => void enviar(imagens)} />

      {analisando ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Lendo documento e comparando com a selfie…
        </p>
      ) : null}

      {resultado ? (
        <div className="mt-4 grid gap-2">
          <ul className="grid gap-1.5">
            <Item ok={resultado.documentoLegivel} texto="Documento legível" />
            <Item
              ok={resultado.cpfValido}
              texto={`CPF ${resultado.cpf || "não identificado"} ${resultado.cpfValido ? "válido" : "inválido"}`}
            />
            <Item ok={resultado.faceConfere} texto="Rosto da selfie confere com o documento" />
          </ul>
          <p className="text-xs text-muted-foreground">
            Nome no documento: <strong>{resultado.nome || "não identificado"}</strong> ·{" "}
            {resultado.tipoDocumento?.toUpperCase() || "DOC"} · pontuação {resultado.score}/100
          </p>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Antecedentes: {rotuloAntecedentes[resultado.antecedentes] ?? resultado.antecedentes}
          </p>
          {resultado.observacoes ? (
            <p className="text-xs text-muted-foreground">Observações: {resultado.observacoes}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
