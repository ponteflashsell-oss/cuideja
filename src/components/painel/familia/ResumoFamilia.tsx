import { CheckCircle2, ClipboardList, MessageSquare, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FamiliaStatus } from "@/hooks/useFamiliaStatus";

export type SecaoFamilia = "inicio" | "perfil" | "buscar" | "pedidos" | "conversas" | "reservas";

export function ResumoFamilia({
  status,
  onIr,
}: {
  status: FamiliaStatus;
  onIr: (secao: SecaoFamilia) => void;
}) {
  const { verificado, cadastroCompleto, etapas, nome } = status;

  const passos = [
    { ok: etapas.nome && etapas.cidade, texto: "Informe o responsável e a cidade." },
    { ok: etapas.bairros, texto: "Diga em que bairro o cuidado acontece." },
    { ok: etapas.descricao, texto: "Descreva quem precisa de cuidado." },
    { ok: etapas.necessidades, texto: "Marque os cuidados necessários." },
    { ok: verificado, texto: "Envie documento e selfie do responsável para verificação." },
  ];

  return (
    <div className="grid gap-6">
      <section className="surface-card p-6">
        <h2 className="text-2xl">Olá{nome ? `, ${nome.split(" ")[0]}` : ""}!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {verificado
            ? "Sua conta está verificada. Busque cuidadoras, publique pedidos e acompanhe propostas formais."
            : "Complete os passos abaixo para liberar a busca de cuidadoras, os pedidos e as propostas."}
        </p>

        <ul className="mt-5 grid gap-3">
          {passos.map((p, i) => (
            <li
              key={p.texto}
              className="flex items-start gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm"
            >
              {p.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px]">
                  {i + 1}
                </span>
              )}
              <span className={p.ok ? "text-muted-foreground" : undefined}>{p.texto}</span>
            </li>
          ))}
        </ul>

        <Button className="mt-5 gap-2" onClick={() => onIr("perfil")}>
          <ShieldCheck className="size-4" />
          {cadastroCompleto ? "Revisar verificação" : "Completar cadastro"}
        </Button>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {(
          [
            ["buscar", "Buscar cuidadoras", "Perfis verificados perto de você", Search],
            ["pedidos", "Meus pedidos", "Publique a necessidade de cuidado", ClipboardList],
            ["conversas", "Propostas", "Convites e propostas formais", MessageSquare],
          ] as const
        ).map(([valor, titulo, texto, Icone]) => (
          <button
            key={valor}
            type="button"
            onClick={() => onIr(valor)}
            className="surface-card p-5 text-left transition-colors hover:bg-muted/50"
          >
            <Icone className="size-5 text-primary" />
            <p className="mt-3 font-display text-lg">{titulo}</p>
            <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
