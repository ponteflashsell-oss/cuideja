import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, HandshakeIcon, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BoasVindasReserva } from "@/components/painel/BoasVindasReserva";
import { PreparacaoPlantao } from "@/components/painel/PreparacaoPlantao";
import { listarAlertasPlantao, marcarAlertaPlantaoLido } from "@/lib/alertas.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  criarContrato,
  listarCuidadorasContrato,
  listarMeusContratos,
  responderContrato,
} from "@/lib/contratos.functions";

type Contrato = Awaited<ReturnType<typeof listarMeusContratos>>["contratos"][number];
type Cuidadora = Awaited<ReturnType<typeof listarCuidadorasContrato>>[number];

const regimeLabel: Record<string, string> = {
  hora: "Por hora",
  diaria: "Diária",
  plantao12: "Plantão de 12 horas",
  plantao24: "Plantão de 24 horas",
};

const statusLabel: Record<string, string> = {
  aguardando: "Aguardando consentimento",
  aguardando_pagamento: "Aguardando pagamento da família",
  ativo: "Ativo — pagamento confirmado",
  recusado: "Recusado",
  cancelado: "Cancelado",
};

const dataBr = (iso: string | null) => {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return d ? `${d}/${m}/${a}` : iso;
};

const dinheiro = (v: number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Contratos({ papel }: { papel: "familia" | "cuidadora" }) {
  const carregarContratos = useServerFn(listarMeusContratos);
  const carregarCuidadoras = useServerFn(listarCuidadorasContrato);
  const gerar = useServerFn(criarContrato);
  const responder = useServerFn(responderContrato);
  const buscarAlertas = useServerFn(listarAlertasPlantao);
  const marcarAlerta = useServerFn(marcarAlertaPlantaoLido);

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [userId, setUserId] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [cuidadoras, setCuidadoras] = useState<Cuidadora[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [respondendo, setRespondendo] = useState("");
  const [aberto, setAberto] = useState<Contrato | null>(null);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted",
  );

  const [form, setForm] = useState({
    cuidadoraId: "",
    descricao: "",
    endereco: "",
    regime: "plantao12",
    dataInicio: "",
    dataFim: "",
    horaInicio: "07:00",
    horaFim: "19:00",
    assistido: "",
    familiaTelefone: "",
    cuidadoraTelefone: "",
    valor: 320,
    observacoes: "",
  });

  const atualizar = useCallback(async () => {
    try {
      const r = await carregarContratos({ data: undefined });
      setContratos(r.contratos as Contrato[]);
      setUserId(r.userId);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, [carregarContratos]);

  useEffect(() => {
    void atualizar();
  }, [atualizar]);

  useEffect(() => {
    if (papel !== "familia" || !contratos.length) return;
    let ativo = true;
    const conferirAlertas = async () => {
      try {
        const alertas = await buscarAlertas({
          data: { contratoIds: contratos.filter((c) => c.status === "ativo").map((c) => c.id) },
        });
        if (!ativo) return;
        for (const alerta of alertas as { id: string; mensagem: string }[]) {
          toast.error("Alerta da cuidadora", { description: alerta.mensagem, duration: 12000 });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Alerta da cuidadora", { body: alerta.mensagem, tag: alerta.id });
          }
          await marcarAlerta({ data: { alertaId: alerta.id } });
        }
      } catch (erro) {
        console.error("[plantao] alertas", erro);
      }
    };
    void conferirAlertas();
    const timer = window.setInterval(() => void conferirAlertas(), 15000);
    return () => {
      ativo = false;
      window.clearInterval(timer);
    };
  }, [buscarAlertas, contratos, marcarAlerta, papel]);

  const ativarNotificacoes = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Este navegador não oferece notificações web.");
      return;
    }
    const permissao = await Notification.requestPermission();
    setNotificacoesAtivas(permissao === "granted");
    toast[permissao === "granted" ? "success" : "info"](
      permissao === "granted"
        ? "Notificações ativas. Você receberá alertas da cuidadora enquanto esta área estiver aberta."
        : "Ative as notificações do site nas configurações do navegador para receber alertas.",
    );
  };

  useEffect(() => {
    if (papel !== "familia") return;
    carregarCuidadoras({ data: undefined })
      .then((r) => setCuidadoras(r as Cuidadora[]))
      .catch((e) => console.error(e));
  }, [papel, carregarCuidadoras]);

  const selecionada = useMemo(
    () => cuidadoras.find((c) => c.id === form.cuidadoraId),
    [cuidadoras, form.cuidadoraId],
  );

  const enviar = async () => {
    setSalvando(true);
    try {
      await gerar({
        data: {
          cuidadoraId: form.cuidadoraId,
          descricao: form.descricao,
          endereco: form.endereco,
          regime: form.regime as "hora" | "diaria" | "plantao12" | "plantao24",
          dataInicio: form.dataInicio,
          dataFim: form.dataFim,
          horaInicio: form.horaInicio,
          horaFim: form.horaFim,
          assistido: form.assistido,
          familiaTelefone: form.familiaTelefone,
          cuidadoraTelefone: form.cuidadoraTelefone,
          valor: form.valor,
          observacoes: form.observacoes,
        },
      });
      toast.success("Termo gerado. Registre seu consentimento e aguarde o da cuidadora.");
      setForm((f) => ({ ...f, descricao: "", observacoes: "" }));
      await atualizar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar o termo.");
    } finally {
      setSalvando(false);
    }
  };

  const decidir = async (c: Contrato, acao: "aceitar" | "recusar") => {
    setRespondendo(c.id);
    try {
      const r = await responder({ data: { id: c.id, acao, motivo: "" } });
      if (r.checkoutUrl) {
        window.location.href = r.checkoutUrl;
        return;
      }
      toast.success(
        r.status === "aguardando_pagamento"
          ? "Os dois consentimentos foram registrados."
          : r.status === "recusado"
            ? "Termo recusado."
            : "Consentimento registrado. Aguardando a outra parte.",
      );
      setAberto(null);
      await atualizar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível registrar a resposta.");
    } finally {
      setRespondendo("");
    }
  };

  const meuAceite = (c: Contrato) =>
    c.familia_id === userId ? c.familia_aceite_em : c.cuidadora_aceite_em;

  const podeGerar =
    form.cuidadoraId &&
    form.descricao.trim().length >= 10 &&
    form.endereco.trim().length >= 5 &&
    form.assistido.trim().length >= 2 &&
    form.dataInicio;

  return (
    <div className="grid gap-6">
      {papel === "familia" && (
        <section className="surface-card p-6">
          <h2 className="flex items-center gap-2 text-2xl">
            <HandshakeIcon className="size-5 text-primary" /> Novo termo de contratação
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O termo é gerado com os dados reais das duas partes (nome, CPF conferido na verificação,
            cidade) e só passa a valer quando você e a cuidadora registrarem o consentimento.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5 md:col-span-2">
              <Label>Cuidadora verificada</Label>
              <Select
                value={form.cuidadoraId}
                onValueChange={(v) => {
                  const c = cuidadoras.find((x) => x.id === v);
                  setForm((f) => ({
                    ...f,
                    cuidadoraId: v,
                    valor: c?.tarifa_plantao12 || f.valor,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      cuidadoras.length ? "Selecione a cuidadora" : "Nenhuma cuidadora verificada"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {cuidadoras.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                      {c.cidade ? ` · ${c.cidade}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selecionada && (
                <p className="text-xs text-muted-foreground">
                  {selecionada.especialidades.join(", ") || "Sem especialidades cadastradas"} · hora{" "}
                  {dinheiro(selecionada.tarifa_hora)} · diária{" "}
                  {dinheiro(selecionada.tarifa_diaria)}
                </p>
              )}
            </div>

            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="c-descricao">Plano de cuidados combinado</Label>
              <Textarea
                id="c-descricao"
                rows={3}
                maxLength={1200}
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex.: acompanhar minha mãe de 82 anos, auxílio com medicação, higiene e mobilidade."
              />
            </div>

            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="c-endereco">Endereço do atendimento</Label>
              <Input
                id="c-endereco"
                maxLength={300}
                value={form.endereco}
                onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                placeholder="Rua, número, bairro e cidade"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="c-assistido">Nome do assistido(a)</Label>
              <Input
                id="c-assistido"
                maxLength={120}
                value={form.assistido}
                onChange={(e) => setForm((f) => ({ ...f, assistido: e.target.value }))}
                placeholder="Nome da pessoa que receberá o cuidado"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="c-telefone-familia">Telefone da família</Label>
              <Input
                id="c-telefone-familia"
                maxLength={30}
                value={form.familiaTelefone}
                onChange={(e) => setForm((f) => ({ ...f, familiaTelefone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="c-telefone-cuidadora">Telefone da cuidadora</Label>
              <Input
                id="c-telefone-cuidadora"
                maxLength={30}
                value={form.cuidadoraTelefone}
                onChange={(e) => setForm((f) => ({ ...f, cuidadoraTelefone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Regime</Label>
              <Select
                value={form.regime}
                onValueChange={(v) => setForm((f) => ({ ...f, regime: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(regimeLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="c-valor">Valor combinado (R$)</Label>
              <Input
                id="c-valor"
                type="number"
                min={0}
                max={100000}
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: Number(e.target.value) || 0 }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="c-inicio">Início</Label>
              <Input
                id="c-inicio"
                type="date"
                value={form.dataInicio}
                onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="c-fim">Término previsto (opcional)</Label>
              <Input
                id="c-fim"
                type="date"
                value={form.dataFim}
                onChange={(e) => setForm((f) => ({ ...f, dataFim: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="c-hi">Horário de início</Label>
              <Input
                id="c-hi"
                type="time"
                value={form.horaInicio}
                onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="c-hf">Horário de término</Label>
              <Input
                id="c-hf"
                type="time"
                value={form.horaFim}
                onChange={(e) => setForm((f) => ({ ...f, horaFim: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="c-obs">Observações (opcional)</Label>
              <Textarea
                id="c-obs"
                rows={2}
                maxLength={1000}
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                placeholder="Combinados extras: refeições, transporte, chaves, contatos de emergência."
              />
            </div>
          </div>

          <Button className="mt-5 gap-2" disabled={!podeGerar || salvando} onClick={enviar}>
            {salvando ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            Gerar termo para consentimento
          </Button>
        </section>
      )}

      {papel === "familia" && !notificacoesAtivas && (
        <section className="surface-card flex flex-wrap items-center gap-3 border border-primary/30 p-4 text-sm">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          <p className="flex-1">
            Ative as notificações deste site para receber atualizações e alarmes da cuidadora durante o plantão.
          </p>
          <Button size="sm" onClick={ativarNotificacoes}>Ativar notificações</Button>
        </section>
      )}

      <section className="surface-card p-6">
        <h2 className="flex items-center gap-2 text-2xl">
          <FileText className="size-5 text-primary" /> Termos e consentimentos
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {papel === "familia"
            ? "Acompanhe os termos gerados e o consentimento de cada parte."
            : "Termos recebidos das famílias. Leia e registre seu consentimento para confirmar o atendimento."}
        </p>

        {carregando ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando termos...
          </p>
        ) : contratos.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            {papel === "familia"
              ? "Nenhum termo gerado ainda."
              : "Nenhum termo recebido ainda. Quando uma família confirmar a contratação, ele aparece aqui."}
          </p>
        ) : (
          <ul className="mt-5 grid gap-4">
            {contratos.map((c) => (
              <li key={c.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {papel === "familia" ? c.cuidadora_nome : c.familia_nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reserva #{c.reserva_id} · {regimeLabel[c.regime] ?? c.regime} · {dataBr(c.data_inicio)}
                      {c.data_fim ? ` até ${dataBr(c.data_fim)}` : ""} ·{" "}
                      {c.hora_inicio && c.hora_fim ? `${c.hora_inicio}–${c.hora_fim} · ` : ""}
                      {dinheiro(c.valor)}
                    </p>
                  </div>
                  <Badge variant={c.status === "ativo" ? "default" : "outline"} className="gap-1">
                    {c.status === "ativo" && <ShieldCheck className="size-3" />}
                    {statusLabel[c.status] ?? c.status}
                  </Badge>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {c.descricao_cuidado}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assistido(a): {c.assistido_nome || "não informado"} · Emitido em {dataBr(c.emitido_em)}
                </p>

                <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>
                    Família: {c.familia_aceite_em ? `consentiu em ${dataBr(c.familia_aceite_em)}` : "aguardando consentimento"}
                  </span>
                  <span>
                    Cuidadora:{" "}
                    {c.cuidadora_aceite_em
                      ? `consentiu em ${dataBr(c.cuidadora_aceite_em)}`
                      : "aguardando consentimento"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setAberto(c)}>
                    <FileText className="size-4" /> Ler termo completo
                  </Button>
                  {c.status === "ativo" && papel === "familia" && <BoasVindasReserva reserva={c} />}
                  {c.status === "ativo" && papel === "cuidadora" && <PreparacaoPlantao reserva={c} />}
                  {c.status === "aguardando" && !meuAceite(c) && (
                    <>
                      <Button
                        size="sm"
                        disabled={respondendo === c.id}
                        onClick={() => decidir(c, "aceitar")}
                      >
                        {respondendo === c.id && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Concordo com o termo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={respondendo === c.id}
                        onClick={() => decidir(c, "recusar")}
                      >
                        Recusar
                      </Button>
                    </>
                  )}
                  {c.status === "aguardando_pagamento" && papel === "familia" && (
                    <p className="w-full text-xs text-muted-foreground">
                      A cobrança será concluída pela VeoPag. O atendimento só será liberado após a confirmação do pagamento.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(aberto)} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Termo de prestação de serviços</DialogTitle>
            <DialogDescription>
              Documento gerado com os dados reais das duas partes. O aceite eletrônico fica
              registrado com data e hora.
            </DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs leading-relaxed">
            {aberto?.termo_texto}
          </pre>
          {aberto && aberto.status === "aguardando" && !meuAceite(aberto) && (
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={respondendo === aberto.id}
                onClick={() => decidir(aberto, "aceitar")}
              >
                {respondendo === aberto.id && <Loader2 className="mr-2 size-4 animate-spin" />}
                Li e concordo
              </Button>
              <Button
                variant="outline"
                disabled={respondendo === aberto.id}
                onClick={() => decidir(aberto, "recusar")}
              >
                Recusar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
