import { useState } from "react";
import { Check, ClipboardCheck, DoorOpen, FileText, HeartPulse, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Reserva = {
  reserva_id: string;
  assistido_nome: string;
  data_inicio: string;
  hora_inicio: string;
  hora_fim: string;
  valor: number;
  endereco: string;
  familia_nome: string;
  familia_telefone: string;
  cuidadora_nome: string;
  cuidadora_telefone: string;
  observacoes: string;
};

const dinheiro = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataBr = (iso: string) => {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return dia ? `${dia}/${mes}/${ano}` : iso;
};

export function BoasVindasReserva({ reserva }: { reserva: Reserva }) {
  const [aberta, setAberta] = useState(false);
  const [concluidos, setConcluidos] = useState<string[]>([]);
  const alternar = (id: string) =>
    setConcluidos((atual) => (atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]));

  const grupos = [
    {
      titulo: "Informações essenciais",
      icone: HeartPulse,
      itens: [
        "Deixar prontuário ou ficha de medicação com nomes, doses, horários e orientação sobre refeições.",
        `Anotar contatos de emergência: família (${reserva.familia_telefone || "não informado"}), médico, plano de saúde, SAMU 192 e Bombeiros 193.`,
        "Registrar rotina, preferências alimentares, limitações de mobilidade e comportamentos conhecidos.",
      ],
    },
    {
      titulo: "Ambiente e insumos",
      icone: ClipboardCheck,
      itens: [
        "Conferir luvas, fraldas, lenços, pomadas, sabonete líquido e álcool em gel.",
        "Liberar caminhos, retirar tapetes soltos e garantir boa iluminação no banheiro e corredores.",
        "Separar trocas de roupa do dia e toalhas limpas.",
      ],
    },
    {
      titulo: "Acesso e alimentação",
      icone: DoorOpen,
      itens: [
        `Orientar a portaria sobre a chegada de ${reserva.cuidadora_nome || "cuidadora"} e organizar chaves ou senhas.`,
        "Combinar a refeição da cuidadora e deixar espaço na geladeira e no micro-ondas, se ela trouxer marmita.",
      ],
    },
    {
      titulo: "Primeiros 15 minutos",
      icone: Utensils,
      itens: [
        "Apresentar a cuidadora ao assistido de forma calma e natural.",
        "Mostrar suprimentos, primeiros socorros, copos, água e o banheiro destinado à profissional.",
        "Combinar como será o diário de bordo e onde as atualizações serão registradas.",
      ],
    },
  ];

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setAberta(true)}>
        <FileText className="size-4" /> Boas-vindas e alinhamento
      </Button>
      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lista de boas-vindas e alinhamento</DialogTitle>
            <DialogDescription>
              Reserva #{reserva.reserva_id} · {reserva.assistido_nome || "Assistido não informado"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 rounded-lg bg-muted p-4 text-sm sm:grid-cols-2">
            <p><strong>Data:</strong> {dataBr(reserva.data_inicio)}</p>
            <p><strong>Horário:</strong> {reserva.hora_inicio} às {reserva.hora_fim}</p>
            <p><strong>Valor:</strong> {dinheiro(reserva.valor)}</p>
            <p className="sm:col-span-2"><strong>Endereço:</strong> {reserva.endereco || "Não informado"}</p>
            <p><strong>Família:</strong> {reserva.familia_nome} · {reserva.familia_telefone || "telefone não informado"}</p>
            <p><strong>Cuidadora:</strong> {reserva.cuidadora_nome} · {reserva.cuidadora_telefone || "telefone não informado"}</p>
          </div>

          {reserva.observacoes && (
            <p className="rounded-lg border border-primary/30 p-3 text-sm"><strong>Combinados:</strong> {reserva.observacoes}</p>
          )}

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