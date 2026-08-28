import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, ClipboardCheck, DoorOpen, FileText, MapPinned, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dispararAlertaPlantao } from "@/lib/alertas.functions";

type Reserva = {
  id: string;
  reserva_id: string;
  assistido_nome: string;
  data_inicio: string;
  hora_inicio: string;
  hora_fim: string;
  valor: number;
  endereco: string;
  familia_nome: string;
  familia_telefone: string;
  observacoes: string;
};

const dataBr = (iso: string) => {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return dia ? `${dia}/${mes}/${ano}` : iso;
};

const dinheiro = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PreparacaoPlantao({ reserva }: { reserva: Reserva }) {
  const disparar = useServerFn(dispararAlertaPlantao);
  const chave = `cuideja:checklist-plantao:${reserva.reserva_id}`;
  const [aberta, setAberta] = useState(false);
  const [concluidos, setConcluidos] = useState<string[]>([]);
  const [enviandoAlerta, setEnviandoAlerta] = useState(false);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(chave);
      if (salvo) setConcluidos(JSON.parse(salvo) as string[]);
    } catch {
      setConcluidos([]);
    }
  }, [chave]);

  const alternar = (id: string) => {
    setConcluidos((atual) => {
      const proximo = atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id];
      window.localStorage.setItem(chave, JSON.stringify(proximo));
      return proximo;
    });
  };

  const enviarAlerta = async () => {
    const mensagem = window.prompt("Descreva brevemente a intercorrência para a família:", "Preciso falar com você sobre o atendimento.");
    if (!mensagem?.trim()) return;
    setEnviandoAlerta(true);
    try {
      await disparar({ data: { contratoId: reserva.id, mensagem: mensagem.trim() } });
      toast.success("Alerta enviado para a família.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar o alerta.");
    } finally {
      setEnviandoAlerta(false);
    }
  };

  const grupos = [
    {
      titulo: "Antes de sair de casa",
      icone: MapPinned,
      itens: [
        `Conferir endereço (${reserva.endereco || "não informado"}), assistido, data ${dataBr(reserva.data_inicio)} e horário ${reserva.hora_inicio} às ${reserva.hora_fim}.`,
        "Planejar a rota para chegar com 10 a 15 minutos de antecedência.",
        "Levar RG ou CNH original para identificação na portaria.",
        "Usar roupa confortável e profissional, calçado fechado antiderrapante e unhas curtas.",
        "Levar água, marmita ou lanche se a refeição não tiver sido combinada e medicações pessoais.",
      ],
    },
    {
      titulo: "Na chegada: primeiros 15 minutos",
      icone: DoorOpen,
      itens: [
        "Cumprimentar família e assistido com empatia, voz calma e postura profissional.",
        "Confirmar ficha de medicação, horários e prescrições diretamente com o responsável.",
        "Localizar luvas, fraldas, itens de higiene, toalhas e roupas de cama e banho.",
        "Reconhecer saídas, banheiro adaptado e caixa de primeiros socorros.",
        "Confirmar que os telefones da família, médico e SAMU 192 estão visíveis.",
      ],
    },
    {
      titulo: "Durante o atendimento",
      icone: ClipboardCheck,
      itens: [
        "Registrar no diário de bordo medicações, refeições, água, higiene, humor e sinais vitais.",
        "Manter atenção contínua e evitar uso pessoal do celular durante o cuidado.",
        "Avisar a família imediatamente pelo app ou telefone sobre alterações, acidentes ou intercorrências.",
      ],
    },
    {
      titulo: "Ao final do plantão",
      icone: MessageCircle,
      itens: [
        "Deixar o ambiente limpo, organizado e descartar lixos de higiene corretamente.",
        "Entregar à família o resumo do turno e o diário de bordo preenchido.",
        "Registrar o check-out no app para encerrar o atendimento e liberar o repasse financeiro.",
      ],
    },
  ];

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setAberta(true)}>
        <FileText className="size-4" /> Preparação para o plantão
      </Button>
      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Checklist de preparação do plantão</DialogTitle>
            <DialogDescription>
              Reserva #{reserva.reserva_id} · {reserva.assistido_nome || "Assistido não informado"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 rounded-lg bg-muted p-4 text-sm sm:grid-cols-2">
            <p><strong>Data:</strong> {dataBr(reserva.data_inicio)}</p>
            <p><strong>Horário:</strong> {reserva.hora_inicio} às {reserva.hora_fim}</p>
            <p><strong>Valor:</strong> {dinheiro(reserva.valor)}</p>
            <p className="sm:col-span-2"><strong>Família:</strong> {reserva.familia_nome} · {reserva.familia_telefone || "telefone não informado"}</p>
            <p className="sm:col-span-2"><strong>Endereço:</strong> {reserva.endereco || "não informado"}</p>
          </div>

          {reserva.observacoes && (
            <p className="rounded-lg border border-primary/30 p-3 text-sm"><strong>Combinados:</strong> {reserva.observacoes}</p>
          )}

          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Precisa chamar a família?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use o alarme para enviar uma atualização urgente. Em emergência médica, ligue também para o SAMU 192.
                </p>
                <Button variant="destructive" size="sm" className="mt-3 gap-2" disabled={enviandoAlerta} onClick={enviarAlerta}>
                  <AlertTriangle className="size-4" /> {enviandoAlerta ? "Enviando..." : "Disparar alarme para a família"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {grupos.map((grupo) => {
              const Icone = grupo.icone;
              return (
                <section key={grupo.titulo}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold"><Icone className="size-4 text-primary" /> {grupo.titulo}</h3>
                  <ul className="mt-2 grid gap-2">
                    {grupo.itens.map((item) => {
                      const id = `${grupo.titulo}-${item}`;
                      const feito = concluidos.includes(id);
                      return (
                        <li key={id}>
                          <button type="button" onClick={() => alternar(id)} className="flex w-full items-start gap-2 rounded-md p-2 text-left text-sm hover:bg-muted">
                            <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border ${feito ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
                              {feito && <Check className="size-3" />}
                            </span>
                            <span className={feito ? "text-muted-foreground line-through" : undefined}>{item}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
