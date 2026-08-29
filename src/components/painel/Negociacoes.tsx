import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Banknote, CalendarClock, CheckCircle2, MessageSquare, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listarPropostasCuidadora, responderProposta } from "@/lib/propostas.functions";

const rotuloStatus = {
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
  const [valorContraproposta, setValorContraproposta] = useState(220);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("19:00");
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
        new Notification("Nova proposta no CuidaJá", {
          body: novos.length === 1 ? texto : `${novos.length} propostas aguardam sua resposta.`,
          tag: "propostas-cuidadora",
        });
      }
    }

    ultimoIdsRef.current = idsAtuais;
    setPropostas(lista ?? []);
    setAtiva((atual) => {
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

  const responderPropostaAtual = async (acao: "aceitar" | "recusar" | "contraproposta") => {
    if (!ativa) return;
    setEnviando(true);
    try {
      await responder({
        data: {
          id: ativa.id,
          acao,
          valorProposto: acao === "contraproposta" ? Number(valorContraproposta) : undefined,
          horaInicio: acao === "contraproposta" ? horaInicio : undefined,
          horaFim: acao === "contraproposta" ? horaFim : undefined,
          observacao: acao === "contraproposta" ? "Contraproposta enviada pela cuidadora." : "",
        },
      });
      toast.success(acao === "aceitar" ? "Proposta aceita." : acao === "recusar" ? "Proposta recusada." : "Contraproposta enviada.");
      await carregar();
    } catch {
      toast.error("Não foi possível carregar as propostas.");
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
                <p className="mt-1 text-xs text-muted-foreground">{proposta.data_servico} · {proposta.hora_inicio} às {proposta.hora_fim}</p>
                <p className="mt-2 text-sm font-medium text-primary">R$ {Number(proposta.valor_proposto).toFixed(2).replace(".", ",")}</p>
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

            <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Data:</strong> {ativa.data_servico}</p>
              <p><strong className="text-foreground">Horário:</strong> {ativa.hora_inicio} às {ativa.hora_fim}</p>
              <p><strong className="text-foreground">Valor:</strong> R$ {Number(ativa.valor_proposto).toFixed(2).replace(".", ",")}</p>
              <p><strong className="text-foreground">Observação:</strong> {ativa.observacao || "Sem observações."}</p>
            </div>

            <div className="mt-5 rounded-xl border border-border p-4">
              <h4 className="text-base font-medium">Responder proposta</h4>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="valor-contraproposta">Novo valor (R$)</Label>
                  <Input id="valor-contraproposta" type="number" min={1} value={valorContraproposta} onChange={(e) => setValorContraproposta(Number(e.target.value) || 0)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="inicio-contraproposta">Início</Label>
                  <Input id="inicio-contraproposta" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="fim-contraproposta">Término</Label>
                  <Input id="fim-contraproposta" type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
                </div>
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
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Selecione uma proposta para responder.</p>
        )}

        <div className="mt-6 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
          <Banknote className="size-4 text-primary" />
          <span>Resumo da resposta</span>
          <strong className="ml-auto">R$ {Number(valorContraproposta || 0).toFixed(2).replace(".", ",")} · {horaInicio} às {horaFim}</strong>
        </div>
      </section>
    </div>
  );
}
