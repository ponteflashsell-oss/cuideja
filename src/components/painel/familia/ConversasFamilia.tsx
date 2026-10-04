import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Banknote, CalendarClock, CheckCircle2, Clock3, ClipboardList, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listarCuidadorasContrato } from "@/lib/contratos.functions";
import { criarProposta, listarPropostasFamilia, responderProposta } from "@/lib/propostas.functions";
import { horarioFinal, horasEntre, moeda } from "@/lib/proposta-horario";
import { CheckoutAtendimento } from "@/components/painel/CheckoutAtendimento";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const rotuloStatus = {
  pendente_cuidadora: "Pendente da cuidadora",
  pendente_familia: "Aguardando sua decisão",
  contraproposta: "Contraproposta",
  aguardando_pagamento: "Aguardando pagamento",
  aceita: "Pagamento confirmado",
  recusada: "Recusada",
  expirada: "Expirada",
} as const;

const hoje = new Date().toISOString().slice(0, 10);

export function ConversasFamilia() {
  const [cuidadoras, setCuidadoras] = useState<any[]>([]);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [ativa, setAtiva] = useState<any | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aceitando, setAceitando] = useState(false);
  const [recusando, setRecusando] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [contraproposta, setContraproposta] = useState({ valor: 0, inicio: "09:00", horas: 8 });
  const buscarCuidadoras = useServerFn(listarCuidadorasContrato);
  const listar = useServerFn(listarPropostasFamilia);
  const criar = useServerFn(criarProposta);
  const responder = useServerFn(responderProposta);
  const [form, setForm] = useState({
    cuidadoraId: "",
    dataServico: hoje,
    horaInicio: "08:00",
    horaFim: "18:00",
    valorProposto: 180,
    observacao: "",
  });

  const carregarDados = async () => {
    const [listaCuidadoras, listaPropostas] = await Promise.all([
      buscarCuidadoras({ data: undefined }),
      listar({ data: undefined }),
    ]);
    setCuidadoras(listaCuidadoras ?? []);
    setPropostas(listaPropostas ?? []);
    setAtiva((atual: any) => {
      const proximo = (listaPropostas ?? []).find((item: any) => item.id === atual?.id) ?? (listaPropostas ?? [])[0] ?? null;
      return proximo;
    });
    if (!form.cuidadoraId && (listaCuidadoras ?? []).length) {
      setForm((atual) => ({ ...atual, cuidadoraId: listaCuidadoras?.[0]?.id ?? "" }));
    }
  };

  useEffect(() => {
    void carregarDados().catch(() => {
      toast.error("Não foi possível carregar as propostas.");
    });
  }, [buscarCuidadoras, listar]);

  useEffect(() => {
    if (!ativa) return;
    setContraproposta({
      valor: Number(ativa.valor_proposto),
      inicio: ativa.hora_inicio,
      horas: horasEntre(ativa.hora_inicio, ativa.hora_fim),
    });
  }, [ativa?.id, ativa?.updated_at]);

  const enviarProposta = async () => {
    if (!form.cuidadoraId || !form.dataServico || form.valorProposto <= 0) {
      toast.error("Selecione uma cuidadora e informe um valor válido.");
      return;
    }
    setEnviando(true);
    try {
      await criar({
        data: {
          cuidadoraId: form.cuidadoraId,
          dataServico: form.dataServico,
          horaInicio: form.horaInicio,
          horaFim: form.horaFim,
          valorProposto: Number(form.valorProposto),
          observacao: form.observacao,
        },
      });
      toast.success("Proposta enviada para a cuidadora.");
      setForm((atual) => ({ ...atual, dataServico: hoje, horaInicio: "08:00", horaFim: "18:00", valorProposto: 180, observacao: "" }));
      await carregarDados();
    } catch {
      toast.error("Não foi possível carregar as propostas.");
    } finally {
      setEnviando(false);
    }
  };

  const atualizarStatus = async (acao: "aceitar" | "recusar" | "contraproposta") => {
    if (!ativa) return;
    if (acao === "contraproposta" && (contraproposta.horas < 1 || contraproposta.horas > 24 || contraproposta.valor <= 0)) {
      toast.error("Informe entre 1 e 24 horas e um valor válido.");
      return;
    }
    const operacao = acao === "aceitar" ? setAceitando : acao === "recusar" ? setRecusando : setAceitando;
    operacao(true);
    try {
      const resultado = await responder({
        data: {
          id: ativa.id,
          acao,
          valorProposto: acao === "contraproposta" ? Number(contraproposta.valor) : undefined,
          horaInicio: acao === "contraproposta" ? contraproposta.inicio : undefined,
          horaFim: acao === "contraproposta" ? horarioFinal(contraproposta.inicio, contraproposta.horas) : undefined,
          observacao: acao === "contraproposta" ? "Nova contraproposta enviada pela família." : "",
        },
      });
      if (acao === "aceitar" && resultado.status === "aguardando_pagamento") setCheckoutId(resultado.id);
      toast.success(
        acao === "aceitar"
          ? "Aceite registrado. Aguarde a confirmação do pagamento."
          : acao === "recusar"
            ? "Proposta recusada."
            : "Nova contraproposta enviada para a cuidadora.",
      );
      await carregarDados();
    } catch {
      toast.error("Não foi possível carregar as propostas.");
    } finally {
      operacao(false);
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
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Nenhuma proposta enviada ainda.</p>
          ) : (
            propostas.map((proposta) => (
              <button
                key={proposta.id}
                type="button"
                onClick={() => setAtiva(proposta)}
                className={`rounded-lg border p-3 text-left transition-colors ${ativa?.id === proposta.id ? "border-primary bg-primary/5" : "border-border bg-muted/40 hover:bg-muted"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{proposta.cuidadora?.nome ?? "Cuidadora"}</p>
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
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <ClipboardList className="size-4 text-primary" />
          <h3 className="text-lg">Nova proposta</h3>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cuidadora">Cuidadora</Label>
            <select
              id="cuidadora"
              value={form.cuidadoraId}
              onChange={(e) => setForm((atual) => ({ ...atual, cuidadoraId: e.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {cuidadoras.map((cuidadora) => (
                <option key={cuidadora.id} value={cuidadora.id}>{cuidadora.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" value={form.dataServico} onChange={(e) => setForm((atual) => ({ ...atual, dataServico: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="valor">Valor oferecido (R$)</Label>
              <Input id="valor" type="number" min={1} value={form.valorProposto} onChange={(e) => setForm((atual) => ({ ...atual, valorProposto: Number(e.target.value) || 0 }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="inicio">Início</Label>
              <Input id="inicio" type="time" value={form.horaInicio} onChange={(e) => setForm((atual) => ({ ...atual, horaInicio: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fim">Término</Label>
              <Input id="fim" type="time" value={form.horaFim} onChange={(e) => setForm((atual) => ({ ...atual, horaFim: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="observacao">Observação curta</Label>
            <Textarea id="observacao" rows={3} value={form.observacao} maxLength={140} onChange={(e) => setForm((atual) => ({ ...atual, observacao: e.target.value }))} placeholder="Ex.: idoso de 82 anos, lúcido e com mobilidade reduzida." />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="flex items-center gap-2"><Banknote className="size-4 text-primary" /> Resumo</span>
            <strong>{form.horaInicio} às {form.horaFim} · R$ {Number(form.valorProposto || 0).toFixed(2).replace(".", ",")}</strong>
          </div>

          <Button size="lg" onClick={enviarProposta} disabled={enviando}>
            <Send className="size-4" /> {enviando ? "Enviando..." : "Enviar proposta"}
          </Button>
        </div>

        {ativa && (
          <div className="mt-6 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-medium">Detalhes da proposta</h4>
              <Badge variant="secondary">{rotuloStatus[ativa.status as keyof typeof rotuloStatus] ?? ativa.status}</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Cuidadora:</strong> {ativa.cuidadora?.nome ?? "Cuidadora"}</p>
              <p><strong className="text-foreground">Data:</strong> {ativa.data_servico}</p>
              <p><strong className="text-foreground">Horário:</strong> {ativa.hora_inicio} às {ativa.hora_fim} ({horasEntre(ativa.hora_inicio, ativa.hora_fim)}h)</p>
              <p><strong className="text-foreground">Valor:</strong> {moeda(Number(ativa.valor_proposto))} · {moeda(Number(ativa.valor_proposto) / horasEntre(ativa.hora_inicio, ativa.hora_fim))}/hora</p>
              <p><strong className="text-foreground">Observação:</strong> {ativa.observacao || "Sem observações."}</p>
            </div>

            {ativa.status === "aguardando_pagamento" && <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
              <p>O atendimento ainda não está confirmado. Conclua o pagamento pela plataforma.</p>
              <Button className="mt-3" onClick={() => setCheckoutId(ativa.id)} disabled={aceitando}>
                <Banknote className="size-4" /> {aceitando ? "Abrindo cobrança…" : "Pagar pela plataforma"}
              </Button>
            </div>}

            {(ativa.status === "pendente_familia" || ativa.status === "contraproposta") && (
              <div className="mt-4 space-y-3 rounded-lg border border-dashed border-border p-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="horas-contraproposta-familia">Quantidade de horas</Label>
                    <Input id="horas-contraproposta-familia" type="number" min={1} max={24} step={0.5} value={contraproposta.horas} onChange={(e) => setContraproposta((atual) => ({ ...atual, horas: Number(e.target.value) || 0 }))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="valor-contraproposta-familia">Valor total (R$)</Label>
                    <Input id="valor-contraproposta-familia" type="number" min={1} value={contraproposta.valor} onChange={(e) => setContraproposta((atual) => ({ ...atual, valor: Number(e.target.value) || 0 }))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="inicio-contraproposta-familia">Início</Label>
                    <Input id="inicio-contraproposta-familia" type="time" value={contraproposta.inicio} onChange={(e) => setContraproposta((atual) => ({ ...atual, inicio: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5"><Clock3 className="size-4 text-primary" /> {contraproposta.inicio} às {horarioFinal(contraproposta.inicio, contraproposta.horas)}</span>
                  <strong>{contraproposta.horas > 0 ? moeda(contraproposta.valor / contraproposta.horas) : moeda(0)} por hora</strong>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void atualizarStatus("aceitar")} disabled={aceitando}>
                    <CheckCircle2 className="size-4" /> {aceitando ? "Aguardando..." : "Aceitar proposta"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void atualizarStatus("recusar")} disabled={recusando}>
                    <CalendarClock className="size-4" /> {recusando ? "Aguardando..." : "Recusar"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void atualizarStatus("contraproposta")}>
                    <Send className="size-4" /> Fazer contraproposta
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      <Dialog open={Boolean(checkoutId)} onOpenChange={(open) => !open && setCheckoutId(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Pagamento do atendimento</DialogTitle>
            <DialogDescription>A reserva será confirmada somente após o pagamento aprovado.</DialogDescription>
          </DialogHeader>
          <div className="min-h-[540px] px-2 pb-4">{checkoutId && <CheckoutAtendimento origem="proposta" id={checkoutId} />}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
