import { useState } from "react";
import { CalendarCheck, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  compromissos,
  diasSemana,
  disponibilidadeInicial,
  turnos,
} from "@/data/painel-cuidadora";

export function Agenda() {
  const [disp, setDisp] = useState<Record<string, string[]>>(disponibilidadeInicial);

  const toggle = (dia: string, turno: string) =>
    setDisp((prev) => {
      const atual = prev[dia] ?? [];
      return {
        ...prev,
        [dia]: atual.includes(turno) ? atual.filter((t) => t !== turno) : [...atual, turno],
      };
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="surface-card p-6">
        <h3 className="text-lg">Marcação de disponibilidade</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Marque os turnos livres. Você só recebe convites nos horários disponíveis.
        </p>
        <div className="mt-5 grid gap-3">
          {diasSemana.map((dia) => (
            <div key={dia} className="flex items-center gap-3">
              <span className="w-10 text-sm text-muted-foreground">{dia}</span>
              <div className="flex flex-1 gap-2">
                {turnos.map((t) => {
                  const ativo = (disp[dia] ?? []).includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => toggle(dia, t)}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-2 text-sm transition-colors",
                        ativo
                          ? "border-sage bg-accent text-accent-foreground"
                          : "border-border bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-5" onClick={() => toast.success("Disponibilidade atualizada.")}>
          Salvar disponibilidade
        </Button>
      </section>

      <section className="surface-card p-6">
        <h3 className="flex items-center gap-2 text-lg">
          <CalendarCheck className="size-4 text-primary" /> Compromissos confirmados
        </h3>
        <ul className="mt-4 grid gap-4">
          {compromissos.map((c) => (
            <li key={c.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {c.data} · {c.horario}
                </p>
                <Badge variant="secondary">R$ {c.valor}</Badge>
              </div>
              <p className="mt-2 text-sm">{c.familia}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {c.endereco}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="size-4" /> Emergência: {c.emergencia}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Endereço e telefone são liberados apenas depois que a família aceita a proposta.
        </p>
      </section>
    </div>
  );
}
