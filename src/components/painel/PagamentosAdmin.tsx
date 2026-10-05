import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Banknote, CircleAlert, CreditCard, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listarPagamentosAdmin } from "@/lib/admin.functions";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBr = (valor: string | null) => valor ? new Date(valor).toLocaleDateString("pt-BR") : "—";

export function PagamentosAdmin() {
  const listar = useServerFn(listarPagamentosAdmin);
  const { data = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "pagamentos"], queryFn: () => listar(), refetchInterval: 30000,
  });
  const pagos = data.filter((item) => item.situacao === "Pago");
  const total = pagos.reduce((soma, item) => soma + item.valor, 0);
  const taxas = pagos.reduce((soma, item) => soma + item.valor * item.taxa / 100, 0);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">Pagamentos</h2>
        <p className="mt-1 text-sm text-muted-foreground">Cobranças dos atendimentos e valores a repassar às cuidadoras.</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching} title="Atualizar pagamentos">
        <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} /> Atualizar
      </Button>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <Resumo icone={CreditCard} rotulo="Recebido" valor={moeda(total)} />
      <Resumo icone={Banknote} rotulo="Taxa CuideJá" valor={moeda(taxas)} />
      <Resumo icone={ArrowUpRight} rotulo="A repassar" valor={moeda(total - taxas)} />
    </div>

    <div className="border-l-2 border-primary bg-muted px-4 py-3 text-sm text-foreground">
      <p className="font-medium">Stripe · cobrança integrada pela plataforma</p>
      <p className="mt-1 text-muted-foreground">Taxa de intermediação: 15%. Cancelamento gratuito até 24 horas antes do início. O valor só é considerado pago após confirmação da operadora.</p>
    </div>
    <div className="flex gap-2 border-l-2 border-border px-4 py-3 text-sm text-muted-foreground">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <p>Repasses não são automáticos: a integração atual não oferece transferência para cuidadoras. Confirme o término com a família e concilie o repasse fora desta tela; os valores acima não são saldo disponível.</p>
    </div>

    {isLoading ? <p className="text-sm text-muted-foreground">Carregando pagamentos…</p> : isError ?
      <p className="text-sm text-destructive">Não foi possível carregar os pagamentos. Tente atualizar.</p> :
      data.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada.</p> :
      <div className="overflow-x-auto border-y border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted text-xs text-muted-foreground"><tr>
            <th className="px-3 py-3 font-medium">Referência</th><th className="px-3 py-3 font-medium">Família / cuidadora</th>
            <th className="px-3 py-3 font-medium">Atendimento</th><th className="px-3 py-3 font-medium">Valor</th>
            <th className="px-3 py-3 font-medium">Taxa / cuidadora</th><th className="px-3 py-3 font-medium">Situação</th>
          </tr></thead>
          <tbody className="divide-y divide-border">{data.map((item) => <tr key={`${item.tipo}-${item.id}`}>
            <td className="px-3 py-3"><span className="font-medium">{item.referencia}</span><span className="block text-xs text-muted-foreground">{item.tipo} · {dataBr(item.criadoEm)}</span></td>
            <td className="px-3 py-3">{item.familia}<span className="block text-muted-foreground">{item.cuidadora}</span></td>
            <td className="px-3 py-3">{item.dataServico}</td>
            <td className="px-3 py-3 font-medium">{moeda(item.valor)}</td>
            <td className="px-3 py-3">{moeda(item.valor * item.taxa / 100)}<span className="block text-muted-foreground">{moeda(item.valor * (1 - item.taxa / 100))}</span></td>
            <td className="px-3 py-3"><Badge variant={item.situacao === "Pago" ? "default" : "outline"}>{item.situacao}</Badge>
              {item.pagoEm && <span className="mt-1 block text-xs text-muted-foreground">{dataBr(item.pagoEm)}</span>}
            </td>
          </tr>)}</tbody>
        </table>
      </div>}
  </div>;
}

function Resumo({ icone: Icone, rotulo, valor }: { icone: typeof CreditCard; rotulo: string; valor: string }) {
  return <div className="border-t-2 border-primary bg-card px-4 py-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icone className="size-4" />{rotulo}</div>
    <p className="mt-2 font-display text-2xl font-semibold">{valor}</p>
  </div>;
}