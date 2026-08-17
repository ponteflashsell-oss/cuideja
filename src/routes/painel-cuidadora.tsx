import { createFileRoute } from "@tanstack/react-router";
import { BellRing } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerfilProfissional } from "@/components/painel/PerfilProfissional";
import { MuralOportunidades } from "@/components/painel/MuralOportunidades";
import { Negociacoes } from "@/components/painel/Negociacoes";
import { Agenda } from "@/components/painel/Agenda";
import { CarteiraAvaliacoes } from "@/components/painel/CarteiraAvaliacoes";

export const Route = createFileRoute("/painel-cuidadora")({
  head: () => ({
    meta: [
      { title: "Painel da cuidadora: perfil, vagas e agenda | CuidaJá" },
      {
        name: "description",
        content:
          "Painel da cuidadora autônoma: vitrine profissional, mural de vagas, negociações com famílias, agenda de plantões e carteira de ganhos.",
      },
      { property: "og:title", content: "Painel da cuidadora | CuidaJá" },
      {
        property: "og:description",
        content:
          "Gerencie perfil verificado, candidaturas, propostas formais, escala de trabalho e avaliações.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PainelCuidadoraPage,
});

const secoes = [
  { value: "perfil", label: "Meu perfil" },
  { value: "mural", label: "Mural de vagas" },
  { value: "negociacoes", label: "Negociações" },
  { value: "agenda", label: "Minha agenda" },
  { value: "carteira", label: "Carteira e avaliações" },
] as const;

function PainelCuidadoraPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-4xl md:text-5xl">Painel da cuidadora</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Tudo o que você precisa para trabalhar com autonomia: vitrine, vagas na sua região,
          negociação direta com as famílias, escala e finanças.
        </p>

        <div className="surface-card mt-6 flex flex-wrap items-center gap-3 p-4 text-sm">
          <BellRing className="size-4 text-primary" />
          <span>Nova vaga para plantão de 12h perto de você — bairro Centro, R$ 320.</span>
        </div>

        <Tabs defaultValue="perfil" className="mt-8">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            {secoes.map((s) => (
              <TabsTrigger key={s.value} value={s.value} className="text-xs sm:text-sm">
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="perfil" className="mt-6">
            <PerfilProfissional />
          </TabsContent>
          <TabsContent value="mural" className="mt-6">
            <MuralOportunidades />
          </TabsContent>
          <TabsContent value="negociacoes" className="mt-6">
            <Negociacoes />
          </TabsContent>
          <TabsContent value="agenda" className="mt-6">
            <Agenda />
          </TabsContent>
          <TabsContent value="carteira" className="mt-6">
            <CarteiraAvaliacoes />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
