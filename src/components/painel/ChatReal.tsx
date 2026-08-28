import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { iniciarConversa, listarMensagens, minhasConversas, enviarMensagem } from "@/lib/conversas.functions";
import { listarCuidadorasContrato } from "@/lib/contratos.functions";

export function ChatReal({ papel }: { papel: "familia" | "cuidadora" }) {
  const buscarConversas = useServerFn(minhasConversas);
  const buscarMensagens = useServerFn(listarMensagens);
  const enviar = useServerFn(enviarMensagem);
  const buscarCuidadoras = useServerFn(listarCuidadorasContrato);
  const iniciar = useServerFn(iniciarConversa);
  const [conversas, setConversas] = useState<any[]>([]);
  const [cuidadoras, setCuidadoras] = useState<any[]>([]);
  const [ativa, setAtiva] = useState<any | null>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [texto, setTexto] = useState("");
  const [novaCuidadora, setNovaCuidadora] = useState("");

  const carregar = async () => {
    const lista = await buscarConversas();
    setConversas(lista);
    setAtiva((atual) => lista.find((item: any) => item.id === atual?.id) ?? lista[0] ?? null);
  };

  useEffect(() => {
    void carregar().catch((erro) => toast.error(erro instanceof Error ? erro.message : "Não foi possível carregar as conversas."));
    if (papel === "familia") void buscarCuidadoras({ data: undefined }).then(setCuidadoras).catch(console.error);
  }, [buscarConversas, buscarCuidadoras, papel]);

  useEffect(() => {
    if (!ativa) { setMensagens([]); return; }
    void buscarMensagens({ data: { conversaId: ativa.id } }).then(setMensagens).catch(console.error);
    const timer = window.setInterval(() => void buscarMensagens({ data: { conversaId: ativa.id } }).then(setMensagens), 5000);
    return () => window.clearInterval(timer);
  }, [ativa, buscarMensagens]);

  const iniciarNova = async () => {
    if (!novaCuidadora) return;
    try {
      const conversa = await iniciar({ data: { cuidadoraId: novaCuidadora, assunto: "Nova oportunidade de atendimento" } });
      await carregar();
      setAtiva(conversa);
      setNovaCuidadora("");
    } catch (erro) { toast.error(erro instanceof Error ? erro.message : "Não foi possível iniciar a conversa."); }
  };

  const enviarTexto = async () => {
    if (!ativa || !texto.trim()) return;
    try {
      const criada = await enviar({ data: { conversaId: ativa.id, mensagem: texto.trim() } });
      setMensagens((atual) => [...atual, criada]);
      setTexto("");
    } catch (erro) { toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar a mensagem."); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <section className="surface-card p-5">
        <h2 className="flex items-center gap-2 text-lg"><MessageSquare className="size-4 text-primary" /> Conversas</h2>
        {papel === "familia" && (
          <div className="mt-4 flex gap-2">
            <Select value={novaCuidadora} onValueChange={setNovaCuidadora}>
              <SelectTrigger><SelectValue placeholder="Escolha uma cuidadora verificada" /></SelectTrigger>
              <SelectContent>{cuidadoras.map((cuidadora) => <SelectItem key={cuidadora.id} value={cuidadora.id}>{cuidadora.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="icon" aria-label="Iniciar conversa" onClick={iniciarNova}>+</Button>
          </div>
        )}
        <div className="mt-4 grid gap-2">
          {conversas.map((conversa) => (
            <button key={conversa.id} type="button" onClick={() => setAtiva(conversa)} className={`rounded-lg p-3 text-left ${ativa?.id === conversa.id ? "bg-primary/10" : "bg-muted"}`}>
              <p className="text-sm font-medium">{papel === "familia" ? conversa.cuidadora?.nome : conversa.familia?.nome}</p>
              <p className="text-xs text-muted-foreground">{conversa.assunto || "Conversa de atendimento"}</p>
            </button>
          ))}
          {!conversas.length && <p className="py-6 text-sm text-muted-foreground">Nenhuma conversa iniciada.</p>}
        </div>
      </section>

      <section className="surface-card flex min-h-80 flex-col p-5">
        {ativa ? <>
          <h3 className="border-b border-border pb-3 text-lg">{papel === "familia" ? ativa.cuidadora?.nome : ativa.familia?.nome}</h3>
          <div className="mt-4 flex-1 space-y-2 text-sm">
            {mensagens.map((item) => <p key={item.id} className={`max-w-[85%] rounded-lg px-3 py-2 ${item.remetente_id === ativa[`${papel}_id`] ? "bg-muted" : "ml-auto bg-primary text-primary-foreground"}`}>{item.mensagem}</p>)}
            {!mensagens.length && <p className="text-muted-foreground">Envie a primeira mensagem.</p>}
          </div>
          <div className="mt-4 flex gap-2"><Input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void enviarTexto()} placeholder="Escreva uma mensagem" maxLength={2000} /><Button size="icon" aria-label="Enviar mensagem" onClick={enviarTexto}><Send className="size-4" /></Button></div>
        </> : <p className="text-sm text-muted-foreground">Selecione uma conversa para começar.</p>}
      </section>
    </div>
  );
}
