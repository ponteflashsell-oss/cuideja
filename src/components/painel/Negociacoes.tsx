import { useEffect, useState } from "react";
import { Banknote, CalendarClock, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { negociacoes, type Negociacao } from "@/data/painel-cuidadora";
import { supabase } from "@/integrations/supabase/client";
import { ehContaDemo } from "@/lib/demo";
import { ChatReal } from "@/components/painel/ChatReal";
import { enviarMensagemDemo, listarMensagensDemo } from "@/lib/chat.functions";
import { finalizarContratoDemo } from "@/lib/demo.functions";

const abas = [
  { key: "analise", label: "Em análise" },
  { key: "convite", label: "Convites recebidos" },
  { key: "conversa", label: "Em conversa" },
] as const;

export function Negociacoes() {
  const [ativo, setAtivo] = useState<Negociacao>(negociacoes[2]!);
  const [proposta, setProposta] = useState({ data: "2026-08-24", inicio: "07:00", fim: "19:00", valor: 320 });
  const [permitida, setPermitida] = useState<boolean | null>(null);
  const [mensagens, setMensagens] = useState<{ id: string; remetente_id: string; mensagem: string }[]>([]);
  const [userId, setUserId] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aceitando, setAceitando] = useState(false);
  const listarMensagens = useServerFn(listarMensagensDemo);
  const enviarMensagem = useServerFn(enviarMensagemDemo);
  const finalizar = useServerFn(finalizarContratoDemo);
  const termosValidos = Boolean(proposta.data && proposta.inicio && proposta.fim && proposta.valor > 0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const demo = ehContaDemo(data.user?.email, "cuidadora");
      setPermitida(demo);
      if (data.user && demo) {
        setUserId(data.user.id);
        try { setMensagens((await listarMensagens({ data: undefined })).mensagens); } catch (erro) { console.error(erro); }
      }
    });
  }, [listarMensagens]);

  const enviar = async () => {
    if (!mensagem.trim() || enviando) return;
    setEnviando(true);
    try {
      const criada = await enviarMensagem({ data: { mensagem: mensagem.trim() } });
      setMensagens((atual) => [...atual, criada]);
      setMensagem("");
    } catch (erro) { toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar a mensagem."); }
    finally { setEnviando(false); }
  };

  const aceitarAgora = async () => {
    setAceitando(true);
    try {
      await finalizar({ data: { valor: proposta.valor, dataInicio: proposta.data, horaInicio: proposta.inicio, horaFim: proposta.fim } });
      toast.success("Contrato aceito e reserva finalizada.");
    } catch (erro) { toast.error(erro instanceof Error ? erro.message : "Não foi possível aceitar o contrato."); }
    finally { setAceitando(false); }
  };

  if (permitida === null) return <p className="text-sm text-muted-foreground">Carregando negociação...</p>;
  if (!permitida) return <ChatReal papel="cuidadora" />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Tabs defaultValue="conversa" className="surface-card p-5">
        <TabsList className="w-full">
          {abas.map((a) => (
            <TabsTrigger key={a.key} value={a.key} className="flex-1 text-xs sm:text-sm">
              {a.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {abas.map((a) => {
          const itens = negociacoes.filter((n) => n.status === a.key);
          return (
            <TabsContent key={a.key} value={a.key} className="mt-4 grid gap-3">
              {itens.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setAtivo(n)}
                  className="rounded-lg border border-border bg-muted/60 p-4 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{n.familia}</p>
                    <span className="text-xs text-muted-foreground">{n.quando}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.assunto}</p>
                  <p className="mt-2 line-clamp-2 text-sm">{n.ultimaMensagem}</p>
                </button>
              ))}
              {itens.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nada por aqui no momento.
                </p>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <section className="surface-card flex flex-col p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <MessageSquare className="size-4 text-primary" />
          <div>
            <p className="font-medium">{ativo.familia}</p>
            <p className="text-xs text-muted-foreground">{ativo.assunto}</p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            Contato direto
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 text-sm">
          {mensagens.length === 0 ? <p className="max-w-[85%] rounded-lg bg-muted px-3 py-2">{ativo.ultimaMensagem}</p> : mensagens.map((item) => (
            <p key={item.id} className={`max-w-[85%] rounded-lg px-3 py-2 ${item.remetente_id === userId ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
              {item.mensagem}
            </p>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border p-4">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-5 text-primary" />
            <div>
              <h3 className="text-base">Alinhe os termos do plantão</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Confirme data, horário e valor com a família. Quando estiver tudo certo, aceite para reservar o compromisso.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="p-data">Data</Label>
              <Input
                id="p-data"
                type="date"
                value={proposta.data}
                onChange={(e) => setProposta((p) => ({ ...p, data: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-valor">Valor combinado (R$)</Label>
              <Input
                id="p-valor"
                type="number"
                min={0}
                max={5000}
                value={proposta.valor}
                onChange={(e) => setProposta((p) => ({ ...p, valor: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-inicio">Início</Label>
              <Input
                id="p-inicio"
                type="time"
                value={proposta.inicio}
                onChange={(e) => setProposta((p) => ({ ...p, inicio: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-fim">Término</Label>
              <Input
                id="p-fim"
                type="time"
                value={proposta.fim}
                onChange={(e) => setProposta((p) => ({ ...p, fim: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
            <Banknote className="size-4 text-primary" />
            <span>{proposta.inicio} às {proposta.fim}</span>
            <strong className="ml-auto">R$ {proposta.valor.toFixed(2).replace(".", ",")}</strong>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              className="gap-2"
              disabled={!termosValidos}
              disabled={aceitando}
              onClick={aceitarAgora}
            >
              <CheckCircle2 className="size-4" /> Aceitar agora
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              disabled={!termosValidos}
              onClick={() => toast.success(`Proposta enviada a ${ativo.familia}.`)}
            >
              <Send className="size-4" /> Enviar proposta
            </Button>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Input placeholder="Escreva uma mensagem" maxLength={500} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
          <Button variant="outline" disabled={enviando} onClick={enviar}>
            Enviar
          </Button>
        </div>
      </section>
    </div>
  );
}
