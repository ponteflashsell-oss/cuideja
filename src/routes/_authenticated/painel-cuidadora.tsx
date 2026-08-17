import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BellRing,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Search,
  UserRound,
  Wallet,
} from "lucide-react";
import { PainelHeader } from "@/components/painel/PainelHeader";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PerfilProfissional } from "@/components/painel/PerfilProfissional";
import { MuralOportunidades } from "@/components/painel/MuralOportunidades";
import { Negociacoes } from "@/components/painel/Negociacoes";
import { Agenda } from "@/components/painel/Agenda";
import { CarteiraAvaliacoes } from "@/components/painel/CarteiraAvaliacoes";
import { ResumoInicio, type SecaoPainel } from "@/components/painel/ResumoInicio";


export const Route = createFileRoute("/_authenticated/painel-cuidadora")({
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
  { value: "inicio", label: "Início", ajuda: "Resumo do dia", icone: LayoutDashboard },
  { value: "perfil", label: "Meu perfil", ajuda: "Sua vitrine e tarifas", icone: UserRound },
  { value: "mural", label: "Vagas", ajuda: "Trabalhos perto de você", icone: Search },
  { value: "negociacoes", label: "Conversas", ajuda: "Convites e propostas", icone: MessageSquare },
  { value: "agenda", label: "Agenda", ajuda: "Disponibilidade e plantões", icone: CalendarDays },
  { value: "carteira", label: "Carteira", ajuda: "Ganhos e avaliações", icone: Wallet },
] as const;

function PainelCuidadoraPage() {
  const [secao, setSecao] = useState<SecaoPainel>("inicio");
  const atual = secoes.find((s) => s.value === secao)!;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-4xl md:text-5xl">Painel da cuidadora</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Comece pelo <strong>Início</strong>: ele mostra o que precisa da sua atenção hoje e leva você
          direto para a seção certa.
        </p>

        <div className="surface-card mt-6 flex flex-wrap items-center gap-3 p-4 text-sm">
          <BellRing className="size-4 shrink-0 text-primary" />
          <span className="flex-1">
            Nova vaga para plantão de 12h perto de você — bairro Centro, R$ 320.
          </span>
          <Button size="sm" onClick={() => setSecao("mural")}>
            Ver vaga
          </Button>
        </div>

        <Tabs value={secao} onValueChange={(v) => setSecao(v as SecaoPainel)} className="mt-8">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1 md:grid-cols-6">
            {secoes.map((s) => (
              <TabsTrigger
                key={s.value}
                value={s.value}
                className="flex-col gap-1 py-2.5 text-xs sm:text-sm"
              >
                <s.icone className="size-4" />
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <p className="mt-3 text-sm text-muted-foreground">{atual.ajuda}</p>

          <TabsContent value="inicio" className="mt-6">
            <ResumoInicio onIr={setSecao} />
          </TabsContent>
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
