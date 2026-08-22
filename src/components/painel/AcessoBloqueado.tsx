import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const etapasPadrao = [
  "Complete a vitrine: nome, bairros, mini-biografia, especialidades e tarifas.",
  "Envie os documentos: curso/diploma, certidão de antecedentes e selfie com documento.",
  "Aguarde a análise da equipe (checagem de CPF, antecedentes e biometria).",
];

const descricaoPadrao =
  "Para proteger as famílias, a prestação de serviços é liberada somente após a verificação do seu perfil. Assim que a análise for aprovada, esta seção abre automaticamente.";

export function AcessoBloqueado({
  secao,
  cadastroCompleto,
  onIrPerfil,
  passos,
  descricao,
}: {
  secao: string;
  cadastroCompleto: boolean;
  onIrPerfil: () => void;
  passos?: string[];
  descricao?: string;
}) {
  const etapas = passos ?? etapasPadrao;
  return (
    <section className="surface-card p-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
        <Lock className="size-6 text-muted-foreground" />
      </span>
      <h2 className="mt-4 text-2xl">{secao} ainda está bloqueada</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
        {descricao ?? descricaoPadrao}
      </p>

      <ul className="mx-auto mt-6 grid max-w-lg gap-3 text-left">
        {etapas.map((etapa, i) => (
          <li key={etapa} className="flex items-start gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm">
            {i === 0 && cadastroCompleto ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px]">
                {i + 1}
              </span>
            )}
            <span className={i === 0 && cadastroCompleto ? "text-muted-foreground" : undefined}>
              {etapa}
            </span>
          </li>
        ))}
      </ul>

      <Button className="mt-6 gap-2" onClick={onIrPerfil}>
        <ShieldCheck className="size-4" /> Ir para verificação do perfil
      </Button>
    </section>
  );
}
