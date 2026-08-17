import { Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { depoimentos, ganhos, perfilCuidadora } from "@/data/painel-cuidadora";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CarteiraAvaliacoes() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          ["Ganhos do mês", brl(ganhos.mes)],
          ["Saldo a receber", brl(ganhos.aReceber)],
          ["Plantões realizados", String(ganhos.plantoesMes)],
        ].map(([label, valor]) => (
          <div key={label} className="surface-card p-6">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl">{valor}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="surface-card p-6">
          <h3 className="flex items-center gap-2 text-lg">
            <TrendingUp className="size-4 text-primary" /> Extrato de pagamentos
          </h3>
          <ul className="mt-4 divide-y divide-border">
            {ganhos.extrato.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium">{e.descricao}</p>
                  <p className="text-xs text-muted-foreground">{e.data}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{brl(e.valor)}</span>
                  <Badge variant={e.status === "pago" ? "secondary" : "outline"}>
                    {e.status === "pago" ? "Pago" : "A receber"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg">Minhas avaliações</h3>
            <span className="flex items-center gap-1 font-display text-2xl">
              <Star className="size-5 fill-primary text-primary" />
              {perfilCuidadora.nota.toFixed(1)}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {perfilCuidadora.avaliacoes} famílias avaliaram seu atendimento
          </p>
          <ul className="mt-4 grid gap-4">
            {depoimentos.map((d) => (
              <li key={d.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{d.familia}</p>
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < d.nota ? "size-3.5 fill-primary text-primary" : "size-3.5 text-border"
                        }
                      />
                    ))}
                  </span>
                </div>
                <p className="mt-2 text-sm">{d.texto}</p>
                <p className="mt-1 text-xs text-muted-foreground">{d.data}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
