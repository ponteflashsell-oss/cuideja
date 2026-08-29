import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ClipboardList,
  CalendarCheck,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FamiliaHeader } from "@/components/painel/familia/FamiliaHeader";
import { PerfilFamilia } from "@/components/painel/familia/PerfilFamilia";
import { BuscaCuidadoras } from "@/components/painel/familia/BuscaCuidadoras";
import { PedidosFamilia } from "@/components/painel/familia/PedidosFamilia";
import { ConversasFamilia } from "@/components/painel/familia/ConversasFamilia";
import { ResumoFamilia, type SecaoFamilia } from "@/components/painel/familia/ResumoFamilia";
import { AcessoBloqueado } from "@/components/painel/AcessoBloqueado";
import { useFamiliaStatus } from "@/hooks/useFamiliaStatus";
import { Contratos } from "@/components/painel/Contratos";

export const Route = createFileRoute("/_authenticated/painel-familia")({
  head: () => ({
    meta: [
      { title: "Painel da família: buscar cuidadora e pedidos | CuidaJá" },
      {
        name: "description",
        content:
          "Área da família CuidaJá: cadastre quem precisa de cuidado, verifique sua conta, busque cuidadoras verificadas, publique pedidos e combine plantões.",
      },
      { property: "og:title", content: "Painel da família | CuidaJá" },
      {
        property: "og:description",
        content:
          "Encontre cuidadoras verificadas, publique pedidos de cuidado e acompanhe propostas em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PainelFamiliaPage,
});

const secoes = [
  { value: "inicio", label: "Início", ajuda: "Resumo da sua conta", icone: LayoutDashboard },
  { value: "perfil", label: "Minha família", ajuda: "Dados e verificação", icone: UserRound },
  { value: "buscar", label: "Buscar", ajuda: "Cuidadoras verificadas", icone: Search },
  { value: "pedidos", label: "Pedidos", ajuda: "Publique a necessidade", icone: ClipboardList },
  {
    value: "conversas",
    label: "Propostas",
    ajuda: "Convites e propostas formais",
    icone: MessageSquare,
  },
  {
    value: "reservas",
    label: "Minhas reservas",
    ajuda: "Atendimentos confirmados e checklist",
    icone: CalendarCheck,
  },
] as const;

const bloqueaveis: SecaoFamilia[] = ["buscar", "pedidos", "conversas"];

const passosFamilia = [
  "Complete os dados: responsável, cidade, bairro, quem precisa de cuidado e cuidados necessários.",
  "Envie o documento oficial com foto e a selfie com o documento na mão.",
  "Aguarde a conferência manual da equipe (checagem de identidade e CPF).",
];

function PainelFamiliaPage() {
  const [secao, setSecao] = useState<SecaoFamilia>("inicio");
  const status = useFamiliaStatus();
  const { carregando, verificado, cadastroCompleto } = status;
  const atual = secoes.find((s) => s.value === secao)!;

  const bloqueada = (valor: SecaoFamilia) =>
    !verificado && !carregando && bloqueaveis.includes(valor);

  const irPara = (valor: SecaoFamilia) => {
    if (bloqueada(valor)) {
      toast.info("Libere esta seção concluindo a verificação da sua conta.");
      setSecao("perfil");
      return;
    }
    setSecao(valor);
  };

  return (
    <div className="min-h-screen">
      <FamiliaHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-4xl md:text-5xl">Painel da família</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Aqui você organiza o cuidado de quem ama: descreva a necessidade, encontre cuidadoras
          verificadas e combine os plantões com segurança.
        </p>

        {!carregando && !verificado && (
          <div className="surface-card mt-6 flex flex-wrap items-center gap-3 p-4 text-sm">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            <span className="flex-1">
              Sua conta está <strong>em verificação</strong>. Busca, pedidos e conversas ficam
              bloqueados até a aprovação da equipe.
            </span>
            <Button size="sm" onClick={() => setSecao("perfil")}>
              Concluir verificação
            </Button>
          </div>
        )}

        <Tabs value={secao} onValueChange={(v) => irPara(v as SecaoFamilia)} className="mt-8">
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
            <ResumoFamilia status={status} onIr={irPara} />
          </TabsContent>
          <TabsContent value="perfil" className="mt-6">
            <PerfilFamilia />
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
                    passos={passosFamilia}
                    descricao="Para proteger as cuidadoras, liberamos a contratação somente após a verificação da sua conta. Assim que a análise for aprovada, esta seção abre automaticamente."
                  />
                ) : valor === "buscar" ? (
                  <BuscaCuidadoras />
                ) : valor === "pedidos" ? (
                  <PedidosFamilia />
                ) : valor === "reservas" ? (
                  <Contratos papel="familia" />
                ) : (
                  <ConversasFamilia />
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
    </div>
  );
}
