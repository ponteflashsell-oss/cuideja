import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleAlert,
  MessageSquare,
  Search,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  compromissos,
  documentos,
  ganhos,
  negociacoes,
  perfilCuidadora,
  vagas,
} from "@/data/painel-cuidadora";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export type SecaoPainel = "inicio" | "perfil" | "mural" | "negociacoes" | "agenda" | "carteira";

export function ResumoInicio({ onIr }: { onIr: (secao: SecaoPainel) => void }) {
  const pendentes = documentos.filter((d) => d.status !== "aprovado");
  const completude = Math.round(
    (documentos.filter((d) => d.status === "aprovado").length / documentos.length) * 100,
  );
  const proximo = compromissos[0];
  const vagasNovas = vagas.filter((v) => v.publicadoEm === "hoje").length;
  const aguardando = negociacoes.filter((n) => n.status !== "analise").length;

  const numeros = [
    {
      rotulo: "Novas vagas perto de você",
      valor: String(vagasNovas),
      detalhe: "publicadas hoje",
      icone: Search,
      secao: "mural" as SecaoPainel,
      acao: "Ver vagas",
    },
    {
      rotulo: "Conversas esperando você",
      valor: String(aguardando),
      detalhe: "responda para não perder a vaga",
      icone: MessageSquare,
      secao: "negociacoes" as SecaoPainel,
      acao: "Responder",
    },
    {
      rotulo: "Plantões confirmados",
      valor: String(compromissos.length),
      detalhe: "nos próximos dias",
      icone: CalendarDays,
      secao: "agenda" as SecaoPainel,
      acao: "Abrir agenda",
    },
    {
      rotulo: "A receber",
      valor: brl(ganhos.aReceber),
      detalhe: `${brl(ganhos.mes)} ganhos no mês`,
      icone: Wallet,
      secao: "carteira" as SecaoPainel,
      acao: "Ver extrato",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="surface-card flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Olá, {perfilCuidadora.nome.split(" ")[0]} 👋</p>
          <h2 className="mt-1 text-2xl">Seu resumo de hoje</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {perfilCuidadora.verificado && (
              <Badge className="gap-1">
                <BadgeCheck className="size-3.5" /> Perfil verificado
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <Star className="size-3.5" /> {perfilCuidadora.nota} · {perfilCuidadora.avaliacoes} avaliações
            </Badge>
            <Badge variant="secondary">{perfilCuidadora.cidade}</Badge>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Perfil completo</span>
            <span className="font-medium">{completude}%</span>
          </div>
          <Progress value={completude} className="mt-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Perfis 100% completos recebem até 3x mais convites.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {numeros.map((n) => (
          <button
            key={n.rotulo}
            type="button"
            onClick={() => onIr(n.secao)}
            className="surface-card group p-5 text-left transition hover:-translate-y-0.5"
          >
            <n.icone className="size-5 text-primary" />
            <p className="mt-3 text-3xl leading-none">{n.valor}</p>
            <p className="mt-2 text-sm font-medium">{n.rotulo}</p>
            <p className="mt-1 text-xs text-muted-foreground">{n.detalhe}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
              {n.acao}
              <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h3 className="text-lg">Próximos passos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça na ordem: quanto mais completo o perfil, mais famílias encontram você.
          </p>
          <ol className="mt-4 space-y-3 text-sm">
            {pendentes.length > 0 ? (
              pendentes.map((d) => (
                <li key={d.id} className="flex items-start gap-3">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="flex-1">
                    {d.status === "pendente" ? "Enviar" : "Aguardando análise:"} {d.nome}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => onIr("perfil")}>
                    Abrir
                  </Button>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Documentação completa. Tudo em ordem!</li>
            )}
            <li className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="flex-1">Confirmar sua disponibilidade da semana</span>
              <Button size="sm" variant="ghost" onClick={() => onIr("agenda")}>
                Abrir
              </Button>
            </li>
            <li className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="flex-1">Candidatar-se a uma vaga nova de hoje</span>
              <Button size="sm" variant="ghost" onClick={() => onIr("mural")}>
                Abrir
              </Button>
            </li>
          </ol>
        </div>

        <div className="surface-card p-6">
          <h3 className="text-lg">Seu próximo plantão</h3>
          {proximo ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-2xl">{proximo.data}</p>
              <p className="text-muted-foreground">{proximo.horario}</p>
              <p className="font-medium">{proximo.familia}</p>
              <p className="text-muted-foreground">{proximo.endereco}</p>
              <p className="text-muted-foreground">
                Emergência: {proximo.emergencia} · {brl(proximo.valor)}
              </p>
              <Button className="mt-3" variant="secondary" onClick={() => onIr("agenda")}>
                Ver toda a agenda
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum plantão confirmado ainda.</p>
          )}
        </div>
      </div>

      <div className="surface-card p-6">
        <h3 className="text-lg">Como funciona na prática</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            { n: 1, t: "Vaga aparece", d: "Você recebe aviso das vagas na sua região." },
            { n: 2, t: "Você se candidata", d: "Envia sua tarifa em um clique." },
            { n: 3, t: "Acerta no chat", d: "Combina valores e envia proposta formal." },
            { n: 4, t: "Confirma na agenda", d: "O plantão entra na sua escala." },
          ].map((p) => (
            <div key={p.n} className="rounded-xl border border-border/60 p-4">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {p.n}
              </span>
              <p className="mt-2 text-sm font-medium">{p.t}</p>
              <p className="mt-1 text-xs text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
