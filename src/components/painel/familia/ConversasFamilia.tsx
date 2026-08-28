import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Banknote, CalendarClock, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { conversasFamilia } from "@/data/painel-familia";
import { supabase } from "@/integrations/supabase/client";
import { ehContaDemo } from "@/lib/demo";
import { ChatReal } from "@/components/painel/ChatReal";
import { finalizarContratoDemo } from "@/lib/demo.functions";
import { enviarMensagemDemo, listarMensagensDemo } from "@/lib/chat.functions";

const rotulo = {
  convite: "Convite enviado",
  conversa: "Em conversa",
  proposta: "Proposta recebida",
} as const;

export function ConversasFamilia() {
  const [ativa, setAtiva] = useState(conversasFamilia[0]?.id ?? "");
  const [mensagem, setMensagem] = useState("");
  const [permitida, setPermitida] = useState<boolean | null>(null);
  const [mensagens, setMensagens] = useState<{ id: string; remetente_id: string; mensagem: string }[]>([]);
  const [userId, setUserId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [contratando, setContratando] = useState(false);
  const listar = useServerFn(listarMensagensDemo);
  const enviar = useServerFn(enviarMensagemDemo);
  const contratar = useServerFn(finalizarContratoDemo);
  const [termos, setTermos] = useState({ data: "2026-08-31", inicio: "07:00", fim: "19:00", valor: 320 });
  const conversa = conversasFamilia.find((c) => c.id === ativa);
  const valorValido = termos.valor > 0;

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const demo = ehContaDemo(data.user?.email, "familia");
      setPermitida(demo);
      if (data.user && demo) {
        setUserId(data.user.id);
        try { setMensagens((await listar({ data: undefined })).mensagens); } catch (erro) { console.error(erro); }
      }
    });
  }, [listar]);

  const enviarMensagem = async () => {
    if (!mensagem.trim() || enviando) return;
    setEnviando(true);
    try {
      const criada = await enviar({ data: { mensagem: mensagem.trim() } });
      setMensagens((atual) => [...atual, criada]);
      setMensagem("");
    } catch (erro) {
      const mensagemErro = erro instanceof Error ? erro.message : "Não foi possível enviar a mensagem.";
      toast.error(
        mensagemErro.includes("CHAT_DEMO_MIGRATION_NECESSARIA") || mensagemErro.includes("mensagens_conversa")
          ? "O chat demo ainda não foi ativado no banco. Aplique a migração do chat e tente novamente."
          : mensagemErro,
      );
    }
    finally { setEnviando(false); }
  };

  const contratarAgora = async () => {
    setContratando(true);
    try {
      await contratar({ data: { valor: termos.valor, dataInicio: termos.data, horaInicio: termos.inicio, horaFim: termos.fim } });
      toast.success("Contrato finalizado e reserva criada.");
    } catch (erro) { toast.error(erro instanceof Error ? erro.message : "Não foi possível finalizar o contrato."); }
    finally { setContratando(false); }
  };

  if (permitida === null) return <p className="text-sm text-muted-foreground">Carregando conversa...</p>;
  if (!permitida) return <ChatReal papel="familia" />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <section className="surface-card p-4">
        <h2 className="flex items-center gap-2 px-2 py-1 text-lg">
          <MessageSquare className="size-4 text-primary" /> Conversas
        </h2>
        <ul className="mt-2 grid gap-2">
          {conversasFamilia.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setAtiva(c.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                  ativa === c.id ? "bg-primary/10" : "bg-muted hover:bg-muted/70",
                )}
              >
                <p className="text-sm font-medium">{c.cuidadora}</p>
                <p className="truncate text-xs text-muted-foreground">{c.ultimaMensagem}</p>
                <Badge variant="outline" className="mt-2">
                  {rotulo[c.status]}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card p-6">
        {conversa ? (
          <>
            <h3 className="text-xl">{conversa.cuidadora}</h3>
            <p className="text-sm text-muted-foreground">{conversa.assunto}</p>
            <div className="mt-4 rounded-lg bg-muted px-4 py-3 text-sm">
              {mensagens.length === 0 ? conversa.ultimaMensagem : mensagens.map((item) => (
                <p key={item.id} className={`mb-2 rounded-md px-3 py-2 ${item.remetente_id === userId ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-background"}`}>
                  {item.mensagem}
                </p>
              ))}
              <span className="mt-1 block text-xs text-muted-foreground">{conversa.quando}</span>
            </div>

            {conversa.status === "proposta" && (
              <div className="mt-4 rounded-lg border border-primary/40 p-4">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Confira e combine os termos</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ajuste data, horário e valor antes de contratar. A agenda e o contrato só são criados após a confirmação.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-medium">
                    Data
                    <input
                      type="date"
                      value={termos.data}
                      onChange={(e) => setTermos((t) => ({ ...t, data: e.target.value }))}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium">
                    Valor do plantão (R$)
                    <input
                      type="number"
                      min={1}
                      value={termos.valor}
                      onChange={(e) => setTermos((t) => ({ ...t, valor: Number(e.target.value) || 0 }))}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium">
                    Início
                    <input
                      type="time"
                      value={termos.inicio}
                      onChange={(e) => setTermos((t) => ({ ...t, inicio: e.target.value }))}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium">
                    Término
                    <input
                      type="time"
                      value={termos.fim}
                      onChange={(e) => setTermos((t) => ({ ...t, fim: e.target.value }))}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal"
                    />
                  </label>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                  <Banknote className="size-4 text-primary" />
                  <span>{termos.inicio} às {termos.fim}</span>
                  <strong className="ml-auto">R$ {termos.valor.toFixed(2).replace(".", ",")}</strong>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!termos.data || !valorValido}
                    onClick={contratarAgora}
                  >
                    <CheckCircle2 className="size-4" /> Contratar agora
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info("Pedido de ajuste enviado à cuidadora.")}
                  >
                    Ajustar termos
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-2">
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Escreva para a cuidadora..."
              />
              <Button
                className="justify-self-start gap-2"
                disabled={enviando}
                onClick={enviarMensagem}
              >
                <Send className="size-4" /> Enviar
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma conversa iniciada.</p>
        )}
      </section>
    </div>
  );
}
