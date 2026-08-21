import { useMemo, useState } from "react";
import { MapPin, Search, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { caregivers, especialidades } from "@/data/caregivers";

export function BuscaCuidadoras() {
  const [termo, setTermo] = useState("");
  const [filtro, setFiltro] = useState<string | null>(null);
  const [apenasVerificadas, setApenasVerificadas] = useState(true);

  const lista = useMemo(() => {
    const t = termo.trim().toLowerCase();
    return caregivers.filter((c) => {
      if (apenasVerificadas && !c.verificado) return false;
      if (filtro && !c.especialidades.includes(filtro)) return false;
      if (!t) return true;
      return (
        c.nome.toLowerCase().includes(t) ||
        c.cidade.toLowerCase().includes(t) ||
        c.especialidades.some((e) => e.toLowerCase().includes(t))
      );
    });
  }, [termo, filtro, apenasVerificadas]);

  return (
    <div className="grid gap-6">
      <section className="surface-card p-6">
        <h2 className="text-2xl">Buscar cuidadoras</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Filtre por cidade, especialidade e selo de verificação e envie um convite de conversa.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg bg-muted px-3">
            <Search className="size-4 text-muted-foreground" />
            <Input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Nome, cidade ou cuidado"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              aria-label="Buscar cuidadoras"
            />
          </div>
          <Button
            variant={apenasVerificadas ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setApenasVerificadas((v) => !v)}
          >
            <ShieldCheck className="size-4" /> Só verificadas
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {especialidades.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={filtro === e}
              onClick={() => setFiltro((prev) => (prev === e ? null : e))}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                filtro === e
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {lista.map((c) => (
          <article key={c.id} className="surface-card flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg">{c.nome}</h3>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {c.cidade} · {c.uf}
                </p>
              </div>
              {c.verificado && (
                <Badge className="gap-1">
                  <ShieldCheck className="size-3" /> Verificada
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{c.bio}</p>
            <div className="flex flex-wrap gap-1.5">
              {c.especialidades.map((e) => (
                <Badge key={e} variant="outline">
                  {e}
                </Badge>
              ))}
            </div>
            <p className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <Star className="size-3.5 text-primary" /> {c.nota} ({c.avaliacoes})
              </span>
              <span className="text-muted-foreground">
                R$ {c.hora}/h · R$ {c.diaria}/diária
              </span>
            </p>
            <Button
              size="sm"
              className="mt-1 self-start"
              onClick={() => toast.success(`Convite de conversa enviado para ${c.nome}.`)}
            >
              Convidar para conversar
            </Button>
          </article>
        ))}
        {lista.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma cuidadora encontrada com esses filtros.
          </p>
        )}
      </div>
    </div>
  );
}
