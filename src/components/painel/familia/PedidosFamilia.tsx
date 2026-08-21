import { useState } from "react";
import { ClipboardList, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { pedidosFamilia, type PedidoFamilia } from "@/data/painel-familia";

const rotuloStatus: Record<PedidoFamilia["status"], string> = {
  aberto: "Aberto",
  em_selecao: "Em seleção",
  confirmado: "Confirmado",
};

export function PedidosFamilia() {
  const [pedidos, setPedidos] = useState<PedidoFamilia[]>(pedidosFamilia);
  const [titulo, setTitulo] = useState("");
  const [bairro, setBairro] = useState("");
  const [valor, setValor] = useState(0);
  const [resumo, setResumo] = useState("");

  const publicar = () => {
    if (!titulo.trim() || !bairro.trim()) {
      toast.error("Informe ao menos o título e o bairro do pedido.");
      return;
    }
    setPedidos((prev) => [
      {
        id: `p-${Date.now()}`,
        titulo: titulo.trim().slice(0, 90),
        resumo: resumo.trim().slice(0, 200),
        bairro: bairro.trim().slice(0, 60),
        periodo: "Diurno",
        valor,
        unidade: "plantão",
        candidatas: 0,
        status: "aberto",
        publicadoEm: "agora",
      },
      ...prev,
    ]);
    setTitulo("");
    setBairro("");
    setResumo("");
    setValor(0);
    toast.success("Pedido publicado no mural das cuidadoras.");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className="surface-card p-6">
        <h2 className="flex items-center gap-2 text-xl">
          <ClipboardList className="size-4 text-primary" /> Publicar pedido de cuidado
        </h2>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="titulo-pedido">Título</Label>
            <Input
              id="titulo-pedido"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={90}
              placeholder="Plantão 12h diurno para meu pai"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="bairro-pedido">Bairro</Label>
              <Input
                id="bairro-pedido"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="valor-pedido">Valor por plantão (R$)</Label>
              <Input
                id="valor-pedido"
                type="number"
                min={0}
                max={5000}
                value={valor}
                onChange={(e) => setValor(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="resumo-pedido">Detalhes do cuidado</Label>
            <Textarea
              id="resumo-pedido"
              value={resumo}
              onChange={(e) => setResumo(e.target.value.slice(0, 200))}
              rows={3}
              placeholder="Idade, rotina, medicação e o que é mais importante para vocês."
            />
          </div>
          <Button onClick={publicar}>Publicar pedido</Button>
        </div>
      </section>

      <section className="grid content-start gap-4">
        {pedidos.map((p) => (
          <article key={p.id} className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-lg">{p.titulo}</h3>
              <Badge variant={p.status === "confirmado" ? "default" : "secondary"}>
                {rotuloStatus[p.status]}
              </Badge>
            </div>
            {p.resumo && <p className="mt-1 text-sm text-muted-foreground">{p.resumo}</p>}
            <p className="mt-2 text-sm text-muted-foreground">
              {p.bairro} · {p.periodo} · R$ {p.valor}/{p.unidade} · publicado {p.publicadoEm}
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm">
              <Users className="size-4 text-primary" /> {p.candidatas} candidatura(s)
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
