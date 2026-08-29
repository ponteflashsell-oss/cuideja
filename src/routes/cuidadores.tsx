import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Star, MapPin, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { caregivers, especialidades } from "@/data/caregivers";

const searchSchema = z.object({
  local: z.string().trim().max(80).optional(),
  esp: z.string().trim().max(60).optional(),
});

export const Route = createFileRoute("/cuidadores")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Cuidadores verificados por cidade | CuideJá" },
      {
        name: "description",
        content:
          "Compare cuidadores autônomos verificados: especialidade, diária, avaliações e selo de antecedentes checados.",
      },
      { property: "og:title", content: "Cuidadores verificados por cidade | CuideJá" },
      {
        property: "og:description",
        content: "Perfis com verificação de CPF, antecedentes e biometria facial.",
      },
    ],
  }),
  component: CuidadoresPage,
});

function CuidadoresPage() {
  const search = Route.useSearch();
  const [local, setLocal] = useState(search.local ?? "");
  const [esp, setEsp] = useState(search.esp ?? "");
  const [soVerificados, setSoVerificados] = useState(false);

  const lista = useMemo(() => {
    const q = local.trim().toLowerCase();
    return caregivers.filter(
      (c) =>
        (!q || `${c.cidade} ${c.uf}`.toLowerCase().includes(q)) &&
        (!esp || c.especialidades.includes(esp)) &&
        (!soVerificados || c.verificado),
    );
  }, [local, esp, soVerificados]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-14">
        <h1 className="text-4xl md:text-5xl">Cuidadores disponíveis</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Todos os perfis mostram o que foi verificado. A contratação é direta com o profissional
          autônomo, com aceite dos termos no checkout.
        </p>

        <div className="surface-card mt-8 grid gap-4 p-5 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3">
            <MapPin className="size-4 text-muted-foreground" />
            <Input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Cidade ou UF"
              aria-label="Cidade ou UF"
              maxLength={80}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <select
            value={esp}
            onChange={(e) => setEsp(e.target.value)}
            aria-label="Especialidade"
            className="h-10 rounded-lg bg-muted px-3 text-sm outline-none"
          >
            <option value="">Todas as especialidades</option>
            {especialidades.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={soVerificados}
              onCheckedChange={(v) => setSoVerificados(v === true)}
            />
            Só verificados
          </label>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {lista.length} profissional(is) encontrado(s)
        </p>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {lista.map((c) => (
            <article key={c.id} className="surface-card flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl">{c.nome}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.cidade} · {c.uf} · {c.experiencia} anos de experiência
                  </p>
                </div>
                <span className="flex items-center gap-1 text-sm">
                  <Star className="size-4 fill-primary text-primary" />
                  {c.nota.toFixed(1)}{" "}
                  <span className="text-muted-foreground">({c.avaliacoes})</span>
                </span>
              </div>
              <p className="mt-3 text-sm">{c.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.verificado ? (
                  <Badge className="gap-1">
                    <ShieldCheck className="size-3" /> Perfil Verificado
                  </Badge>
                ) : (
                  <Badge variant="outline">Verificação em análise</Badge>
                )}
                {c.especialidades.map((e) => (
                  <Badge key={e} variant="secondary">
                    {e}
                  </Badge>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Wallet className="size-4" /> R$ {c.diaria}/diária · R$ {c.hora}/hora
                </p>
                <Button size="sm">Solicitar atendimento</Button>
              </div>
            </article>
          ))}
        </div>

        {lista.length === 0 && (
          <div className="surface-card mt-4 p-10 text-center text-muted-foreground">
            Nenhum profissional com esses filtros. Tente outra cidade ou especialidade.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
