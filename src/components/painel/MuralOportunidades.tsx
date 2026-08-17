import { useMemo, useState } from "react";
import { Clock, MapPin, Ruler, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { tagsCuidado, vagas } from "@/data/painel-cuidadora";

const periodos = ["Todos", "Diurno", "Noturno", "Final de semana"] as const;

export function MuralOportunidades() {
  const [distancia, setDistancia] = useState(10);
  const [valorMin, setValorMin] = useState(0);
  const [periodo, setPeriodo] = useState<string>("Todos");
  const [tipo, setTipo] = useState("");

  const lista = useMemo(
    () =>
      vagas.filter(
        (v) =>
          v.distanciaKm <= distancia &&
          v.valor >= valorMin &&
          (periodo === "Todos" || v.periodo === periodo) &&
          (!tipo || v.tipo === tipo),
      ),
    [distancia, valorMin, periodo, tipo],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="surface-card h-fit p-5">
        <h3 className="text-lg">Filtros rápidos</h3>

        <div className="mt-5 grid gap-2">
          <Label>Distância até {distancia} km</Label>
          <Slider
            value={[distancia]}
            min={1}
            max={30}
            step={1}
            onValueChange={([v]) => setDistancia(v ?? 10)}
          />
        </div>

        <div className="mt-5 grid gap-2">
          <Label>Valor mínimo: R$ {valorMin}</Label>
          <Slider
            value={[valorMin]}
            min={0}
            max={600}
            step={20}
            onValueChange={([v]) => setValorMin(v ?? 0)}
          />
        </div>

        <div className="mt-5 grid gap-2">
          <Label htmlFor="periodo">Período</Label>
          <select
            id="periodo"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="h-10 rounded-lg bg-muted px-3 text-sm outline-none"
          >
            {periodos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 grid gap-2">
          <Label htmlFor="tipo">Tipo de cuidado</Label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="h-10 rounded-lg bg-muted px-3 text-sm outline-none"
          >
            <option value="">Todos os cuidados</option>
            {tagsCuidado.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </aside>

      <div>
        <p className="text-sm text-muted-foreground">{lista.length} vaga(s) aberta(s) na sua região</p>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          {lista.map((v) => (
            <article key={v.id} className="surface-card flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl">{v.titulo}</h3>
                <Badge variant="secondary">{v.periodo}</Badge>
              </div>
              <p className="mt-2 text-sm">{v.resumo}</p>
              <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <MapPin className="size-4" /> Bairro {v.bairro}
                </li>
                <li className="flex items-center gap-1.5">
                  <Ruler className="size-4" /> {v.distanciaKm} km de você
                </li>
                <li className="flex items-center gap-1.5">
                  <Wallet className="size-4" /> R$ {v.valor}/{v.unidade}
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock className="size-4" /> Publicada {v.publicadoEm}
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  className="bg-sage text-sage-foreground hover:bg-sage/90"
                  onClick={() => toast.success(`Candidatura enviada para "${v.titulo}".`)}
                >
                  Candidatar-me
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Abra a aba Negociações para ajustar a proposta.")}
                >
                  Enviar proposta
                </Button>
              </div>
            </article>
          ))}
        </div>
        {lista.length === 0 && (
          <div className="surface-card mt-4 p-10 text-center text-muted-foreground">
            Nenhuma vaga com esses filtros. Amplie a distância ou reduza o valor mínimo.
          </div>
        )}
      </div>
    </div>
  );
}
