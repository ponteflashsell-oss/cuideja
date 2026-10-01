import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Banknote, CalendarClock, CheckCircle2, Clock3, MessageSquare, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listarPropostasCuidadora, responderProposta } from "@/lib/propostas.functions";
import { horarioFinal, horasEntre, moeda } from "@/lib/proposta-horario";

const rotuloStatus = {
  aguardando_pagamento: "Aguardando pagamento da família",
  pendente_cuidadora: "Pendente da sua resposta",
  pendente_familia: "Aguardando família",
  contraproposta: "Contraproposta aberta",
  aceita: "Aceita",
  recusada: "Recusada",
  expirada: "Expirada",
} as const;

export function Negociacoes() {
  const [propostas, setPropostas] = useState<any[]>([]);
  const [ativa, setAtiva] = useState<any | null>(null);
  const [valorContraproposta, setValorContraproposta] = useState(0);
  const [quantidadeHoras, setQuantidadeHoras] = useState(8);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [enviando, setEnviando] = useState(false);
  const ultimoIdsRef = useRef<string[]>([]);
  const listar = useServerFn(listarPropostasCuidadora);
  const responder = useServerFn(responderProposta);

  const carregar = async () => {
    const lista = await listar({ data: undefined });
    const idsAtuais = (lista ?? []).map((item: any) => item.id);
    const novos = (lista ?? []).filter((item: any) => {
      const ehNova = !ultimoIdsRef.current.includes(item.id);
      const relevante = ["pendente_cuidadora", "pendente_familia", "contraproposta"].includes(item.status);
      return ehNova && relevante;
    });

    if (novos.length) {
      const texto = novos.length === 1
        ? `Nova proposta recebida de ${novos[0]?.familia?.nome ?? "uma família"}.`
        : `${novos.length} novas propostas recebidas.`;
      toast.success(texto);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Nova proposta no CuideJá", {
          body: novos.length === 1 ? texto : `${novos.length} propostas aguardam sua resposta.`,
          tag: "propostas-cuidadora",
        });
      }
    }

    ultimoIdsRef.current = idsAtuais;
    setPropostas(lista ?? []);
    setAtiva((atual: any) => {
      const proximo = (lista ?? []).find((item: any) => item.id === atual?.id) ?? (lista ?? [])[0] ?? null;
      return proximo;
    });
  };

  useEffect(() => {
    void carregar().catch(() => {
      toast.error("Não foi possível carregar as propostas.");
    });
    const timer = window.setInterval(() => void carregar(), 15000);
    return () => window.clearInterval(timer);
  }, [listar]);

  useEffect(() => {
    if (!ativa) return;
    setValorContraproposta(Number(ativa.valor_proposto));
    setHoraInicio(ativa.hora_inicio);
    setQuantidadeHoras(horasEntre(ativa.hora_inicio, ativa.hora_fim));
  }, [ativa?.id, ativa?.updated_at]);

  const responderPropostaAtual = async (acao: "aceitar" | "recusar" | "contraproposta") => {
    if (!ativa) return;
    if (acao === "contraproposta" && (quantidadeHoras < 1 || quantidadeHoras > 24 || valorContraproposta <= 0)) {
      toast.error("Informe entre 1 e 24 horas e um valor válido.");
      return;
    }
    setEnviando(true);
    try {
      await responder({
        data: {
          id: ativa.id,
          acao,
          valorProposto: acao === "contraproposta" ? Number(valorContraproposta) : undefined,
          horaInicio: acao === "contraproposta" ? horaInicio : undefined,
          horaFim: acao === "contraproposta" ? horarioFinal(horaInicio, quantidadeHoras) : undefined,
          observacao: acao === "contraproposta" ? "Contraproposta enviada pela cuidadora." : "",
        },
      });
      toast.success(acao === "aceitar" ? "Proposta aceita." : acao === "recusar" ? "Proposta recusada." : "Contraproposta enviada.");
      await carregar();
    } catch {
      toast.error("Não foi possível enviar sua resposta.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
      <section className="surface-card p-4">
        <h2 className="flex items-center gap-2 px-2 py-1 text-lg">
          <MessageSquare className="size-4 text-primary" /> Propostas
        </h2>
        <div className="mt-3 grid gap-2">
          {propostas.length === 0 ? (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Nenhuma proposta recebida no momento.</p>
          ) : (
            propostas.map((proposta) => (
              <button
                key={proposta.id}
                type="button"
                onClick={() => setAtiva(proposta)}
                className={`rounded-lg border p-3 text-left transition-colors ${ativa?.id === proposta.id ? "border-primary bg-primary/5" : "border-border bg-muted/40 hover:bg-muted"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{proposta.familia?.nome ?? "Família"}</p>
                  <Badge variant="outline">{rotuloStatus[proposta.status as keyof typeof rotuloStatus] ?? proposta.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{proposta.data_servico} · {horasEntre(proposta.hora_inicio, proposta.hora_fim)}h de atendimento</p>
                <p className="mt-2 text-sm font-medium text-primary">{moeda(Number(proposta.valor_proposto))}</p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="surface-card p-5">
        {ativa ? (
          <>
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <CalendarClock className="size-4 text-primary" />
              <div>
                <h3 className="text-lg">{ativa.familia?.nome ?? "Família"}</h3>
                <p className="text-xs text-muted-foreground">Proposta de plantão</p>
              </div>
              <Badge variant="secondary" className="ml-auto">{rotuloStatus[ativa.status as keyof typeof rotuloStatus] ?? ativa.status}</Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Horas</p>
                <p className="mt-1 text-xl font-semibold">{horasEntre(ativa.hora_inicio, ativa.hora_fim)}h</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Valor total</p>
                <p className="mt-1 text-xl font-semibold text-primary">{moeda(Number(ativa.valor_proposto))}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Valor por hora</p>
                <p className="mt-1 text-xl font-semibold">{moeda(Number(ativa.valor_proposto) / horasEntre(ativa.hora_inicio, ativa.hora_fim))}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-1 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Data:</strong> {ativa.data_servico}</p>
              <p><strong className="text-foreground">Horário:</strong> {ativa.hora_inicio} às {ativa.hora_fim}</p>
              <p><strong className="text-foreground">Observação:</strong> {ativa.observacao || "Sem observações."}</p>
            </div>

            {(ativa.status === "pendente_cuidadora" || ativa.status === "contraproposta") && (
            <div className="mt-5 rounded-lg border border-border p-4">
              <h4 className="text-base font-medium">Sua contraproposta</h4>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="horas-contraproposta">Quantidade de horas</Label>
                  <Input id="horas-contraproposta" type="number" min={1} max={24} step={0.5} value={quantidadeHoras} onChange={(e) => setQuantidadeHoras(Number(e.target.value) || 0)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="valor-contraproposta">Valor total (R$)</Label>
                  <Input id="valor-contraproposta" type="number" min={1} value={valorContraproposta} onChange={(e) => setValorContraproposta(Number(e.target.value) || 0)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="inicio-contraproposta">Início</Label>
                  <Input id="inicio-contraproposta" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5"><Clock3 className="size-4 text-primary" /> {horaInicio} às {horarioFinal(horaInicio, quantidadeHoras)}</span>
                <strong>{quantidadeHoras > 0 ? moeda(valorContraproposta / quantidadeHoras) : moeda(0)} por hora</strong>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => void responderPropostaAtual("aceitar")} disabled={enviando}>
                  <CheckCircle2 className="size-4" /> {enviando ? "Processando..." : "Aceitar"}
                </Button>
                <Button variant="outline" onClick={() => void responderPropostaAtual("recusar")} disabled={enviando}>
                  <XCircle className="size-4" /> Recusar
                </Button>
                <Button variant="secondary" onClick={() => void responderPropostaAtual("contraproposta")} disabled={enviando}>
                  <Send className="size-4" /> Fazer contraproposta
                </Button>
              </div>
            </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Selecione uma proposta para responder.</p>
        )}

        <div className="mt-6 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
          <Banknote className="size-4 text-primary" />
          <span>Resumo da resposta</span>
          <strong className="ml-auto">{quantidadeHoras}h × {moeda(quantidadeHoras > 0 ? valorContraproposta / quantidadeHoras : 0)} = {moeda(valorContraproposta)}</strong>
        </div>
      </section>
    </div>
  );
}
