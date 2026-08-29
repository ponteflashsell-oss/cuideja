import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Search,
  MapPin,
  Star,
  FileCheck2,
  CalendarClock,
  Wallet,
  ScanFace,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { caregivers, especialidades } from "@/data/caregivers";
import heroImg from "@/assets/hero-cuidadora.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CuideJá — Cuidadores verificados perto de você" },
      {
        name: "description",
        content:
          "Encontre cuidadores autônomos verificados em todo o Brasil. Antecedentes checados, avaliações reais e contratação direta com segurança jurídica.",
      },
      { property: "og:title", content: "CuideJá — Cuidadores verificados perto de você" },
      {
        property: "og:description",
        content:
          "Marketplace de intermediação entre famílias e cuidadores autônomos, com verificação de antecedentes e termos claros.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [local, setLocal] = useState("");
  const [esp, setEsp] = useState<string>("");

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero */}
        <section className="hero-veil border-b border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div>
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                <ShieldCheck className="size-3.5" /> Antecedentes verificados por API
              </Badge>
              <h1 className="text-balance-tight mt-5 text-4xl leading-[1.05] md:text-6xl">
                Cuidado em casa, com quem sua família pode confiar.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Conectamos famílias diretamente a cuidadores autônomos de todo o Brasil. Triagem de
                CPF e antecedentes criminais, avaliações reais e documentos prontos para contratar
                sem burocracia.
              </p>

              <form
                className="surface-card mt-8 flex flex-col gap-3 p-4 md:flex-row md:items-center"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="flex flex-1 items-center gap-2 rounded-lg bg-muted px-3">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <Input
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Cidade ou CEP"
                    aria-label="Cidade ou CEP"
                    maxLength={80}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-lg bg-muted px-3">
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <select
                    value={esp}
                    onChange={(e) => setEsp(e.target.value)}
                    aria-label="Especialidade"
                    className="h-9 w-full bg-transparent text-sm outline-none"
                  >
                    <option value="">Todas as especialidades</option>
                    {especialidades.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <Button asChild size="lg">
                  <Link
                    to="/cuidadores"
                    search={{ local: local || undefined, esp: esp || undefined }}
                  >
                    Buscar cuidadores
                  </Link>
                </Button>
              </form>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Star className="size-4 fill-primary text-primary" /> 4,9 de média em 3.400
                  atendimentos
                </span>
                <span>Presente em 120+ cidades</span>
              </div>
            </div>

            <div className="relative">
              <img
                src={heroImg}
                alt="Cuidadora sentada ao lado de uma senhora idosa em casa, conversando"
                width={1408}
                height={1104}
                className="rounded-3xl object-cover shadow-[var(--shadow-lift)]"
              />
              <div className="surface-card absolute -bottom-6 left-4 flex items-center gap-3 p-4 md:left-8">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <ScanFace className="size-5" />
                </span>
                <div className="text-sm">
                  <p className="font-semibold">Perfil Verificado</p>
                  <p className="text-muted-foreground">CPF, antecedentes e selfie conferidos</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dois públicos */}
        <section className="mx-auto grid max-w-6xl gap-5 px-5 py-20 md:grid-cols-2">
          {[
            {
              titulo: "Para famílias",
              texto:
                "Compare perfis com selo de verificação, veja avaliações e feche o atendimento com minuta pronta e aceite digital dos termos.",
              cta: "Ver cuidadores disponíveis",
              to: "/cuidadores" as const,
            },
            {
              titulo: "Para cuidadores(as)",
              texto:
                "Você define agenda, preços e região. Envie seus documentos uma vez, receba o selo verificado e apareça para famílias da sua cidade.",
              cta: "Quero me cadastrar",
              to: "/para-profissionais" as const,
            },
          ].map((c) => (
            <div key={c.titulo} className="surface-card flex flex-col p-8">
              <h2 className="text-2xl">{c.titulo}</h2>
              <p className="mt-3 flex-1 text-muted-foreground">{c.texto}</p>
              <Button asChild variant="outline" className="mt-6 w-fit">
                <Link to={c.to}>
                  {c.cta} <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          ))}
        </section>

        {/* Como funciona */}
        <section className="border-y border-border bg-secondary/40 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl md:text-4xl">Como funciona</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-4">
              {[
                {
                  icon: Search,
                  t: "1. Busque",
                  d: "Filtre por cidade, especialidade e faixa de diária.",
                },
                {
                  icon: ShieldCheck,
                  t: "2. Confira a triagem",
                  d: "Veja o selo de verificação e o histórico de avaliações.",
                },
                {
                  icon: CalendarClock,
                  t: "3. Combine a agenda",
                  d: "Fale pelo chat, alinhe rotina, valores e datas.",
                },
                {
                  icon: FileCheck2,
                  t: "4. Aceite e comece",
                  d: "Minuta de prestação de serviços com aceite digital das duas partes.",
                },
              ].map((s) => (
                <div key={s.t} className="surface-card p-6">
                  <s.icon className="size-6 text-primary" />
                  <h3 className="mt-4 text-lg">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Destaques */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl">Profissionais em destaque</h2>
              <p className="mt-2 text-muted-foreground">
                Perfis com verificação completa e melhores avaliações.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/cuidadores">Ver todos</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {caregivers
              .filter((c) => c.destaque)
              .map((c) => (
                <article key={c.id} className="surface-card p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg">{c.nome}</h3>
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="size-4 fill-primary text-primary" />
                      {c.nota.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.cidade} · {c.uf} · {c.experiencia} anos
                  </p>
                  <p className="mt-3 text-sm">{c.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.verificado && (
                      <Badge className="gap-1">
                        <ShieldCheck className="size-3" /> Verificado
                      </Badge>
                    )}
                    {c.especialidades.map((e) => (
                      <Badge key={e} variant="secondary">
                        {e}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Wallet className="size-4" /> Diária a partir de{" "}
                    <strong className="text-foreground">R$ {c.diaria}</strong>
                  </p>
                </article>
              ))}
          </div>
        </section>

        {/* Segurança */}
        <section className="bg-primary/5 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
            <div>
              <h2 className="text-3xl md:text-4xl">Triagem que a família consegue conferir</h2>
              <p className="mt-4 text-muted-foreground">
                A verificação é feita por integração com provedores de background check. Nada de
                promessa vaga: cada selo mostra o que foi checado e quando.
              </p>
              <Button asChild className="mt-6">
                <Link to="/seguranca">Entender a verificação</Link>
              </Button>
            </div>
            <ul className="space-y-3">
              {[
                "Validação de CPF e situação cadastral",
                "Consulta de antecedentes criminais e mandados de prisão",
                "Biometria facial: documento com foto + selfie",
                "Consentimento LGPD registrado antes de qualquer consulta",
              ].map((i) => (
                <li key={i} className="surface-card flex items-start gap-3 p-4 text-sm">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Aviso jurídico */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="surface-card border-dashed p-8">
            <h2 className="text-2xl">Intermediação, não intermediação de emprego</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              O CuideJá é uma plataforma tecnológica de conexão. Os cuidadores são profissionais
              autônomos, sem subordinação, exclusividade ou jornada imposta pela plataforma. A
              contratação é celebrada diretamente entre família e profissional, com base na minuta
              disponibilizada.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/termos">Ler os termos e a minuta</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
