import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BellRing,
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Search,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PainelHeader } from "@/components/painel/PainelHeader";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PerfilProfissional } from "@/components/painel/PerfilProfissional";
import { MuralOportunidades } from "@/components/painel/MuralOportunidades";
import { Negociacoes } from "@/components/painel/Negociacoes";
import { Agenda } from "@/components/painel/Agenda";
import { CarteiraAvaliacoes } from "@/components/painel/CarteiraAvaliacoes";
import { AcessoBloqueado } from "@/components/painel/AcessoBloqueado";
import { ResumoInicio, type SecaoPainel } from "@/components/painel/ResumoInicio";
import { usePerfilStatus } from "@/hooks/usePerfilStatus";
import { Contratos } from "@/components/painel/Contratos";



export const Route = createFileRoute("/_authenticated/painel-cuidadora")({
  head: () => ({
    meta: [
      { title: "Painel da cuidadora: perfil, vagas e agenda | CuideJá" },
      {
        name: "description",
        content:
          "Painel da cuidadora autônoma: vitrine profissional, mural de vagas, negociações com famílias, agenda de plantões e carteira de ganhos.",
      },
      { property: "og:title", content: "Painel da cuidadora | CuideJá" },
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
  { value: "negociacoes", label: "Propostas", ajuda: "Convites e propostas formais", icone: MessageSquare },
  { value: "agenda", label: "Agenda", ajuda: "Disponibilidade e plantões", icone: CalendarDays },
  { value: "reservas", label: "Meus plantões", ajuda: "Reservas confirmadas e preparação", icone: CalendarCheck },
  { value: "carteira", label: "Carteira", ajuda: "Ganhos e avaliações", icone: Wallet },
] as const;

const bloqueaveis: SecaoPainel[] = ["mural", "negociacoes", "agenda", "reservas", "carteira"];

function PainelCuidadoraPage() {
  const [secao, setSecao] = useState<SecaoPainel>("inicio");
  const status = usePerfilStatus();
  const { carregando, verificado, cadastroCompleto } = status;
  const atual = secoes.find((s) => s.value === secao)!;

  const bloqueada = (valor: SecaoPainel) =>
    !verificado && !carregando && bloqueaveis.includes(valor);

  const irPara = (valor: SecaoPainel) => {
    if (bloqueada(valor)) {
      toast.info("Libere esta seção concluindo a verificação do seu perfil.");
      setSecao("perfil");
      return;
    }
    setSecao(valor);
  };

  return (
    <div className="min-h-screen">
      <PainelHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-4xl md:text-5xl">Painel da cuidadora</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Comece pelo <strong>Início</strong>: ele mostra o que precisa da sua atenção hoje e leva você
          direto para a seção certa.
        </p>

        {!carregando && !verificado ? (
          <div className="surface-card mt-6 flex flex-wrap items-center gap-3 p-4 text-sm">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            <span className="flex-1">
              Seu perfil está <strong>em verificação</strong>. Vagas, conversas, agenda e carteira
              ficam bloqueadas até a aprovação.
            </span>
            <Button size="sm" onClick={() => setSecao("perfil")}>
              Concluir verificação
            </Button>
          </div>
        ) : (
          <div className="surface-card mt-6 flex flex-wrap items-center gap-3 p-4 text-sm">
            <BellRing className="size-4 shrink-0 text-primary" />
            <span className="flex-1">
              Nova vaga para plantão de 12h perto de você — bairro Centro, R$ 320.
            </span>
            <Button size="sm" onClick={() => setSecao("mural")}>
              Ver vaga
            </Button>
          </div>
        )}

        <Tabs value={secao} onValueChange={(v) => irPara(v as SecaoPainel)} className="mt-8">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1 md:grid-cols-6">
            {secoes.map((s) => {
              const trancada = bloqueada(s.value);
              return (
                <TabsTrigger
                  key={s.value}
                  value={s.value}
                  className="flex-col gap-1 py-2.5 text-xs sm:text-sm"
                  aria-label={trancada ? `${s.label} (bloqueada)` : s.label}
                >
                  {trancada ? <Lock className="size-4" /> : <s.icone className="size-4" />}
                  <span className={trancada ? "opacity-60" : undefined}>{s.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <p className="mt-3 text-sm text-muted-foreground">{atual.ajuda}</p>

          <TabsContent value="inicio" className="mt-6">
            <ResumoInicio onIr={irPara} status={status} />
          </TabsContent>
          <TabsContent value="perfil" className="mt-6">
            <PerfilProfissional />
          </TabsContent>
          {bloqueaveis.map((valor) => {
            const meta = secoes.find((s) => s.value === valor)!;
            return (
              <TabsContent key={valor} value={valor} className="mt-6">
                {bloqueada(valor) ? (
                  <AcessoBloqueado
                    secao={meta.label}
                    cadastroCompleto={cadastroCompleto}
                    onIrPerfil={() => setSecao("perfil")}
                  />
                ) : valor === "mural" ? (
                  <MuralOportunidades />
                ) : valor === "negociacoes" ? (
                  <Negociacoes />
                ) : valor === "agenda" ? (
                  <Agenda />
                ) : valor === "reservas" ? (
                  <Contratos papel="cuidadora" />
                ) : (
                  <CarteiraAvaliacoes />
                )}
              </TabsContent>
            );
          })}
        </Tabs>

      </main>
    </div>
  );
}
