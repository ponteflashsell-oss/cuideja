import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { conversasFamilia } from "@/data/painel-familia";

const rotulo = {
  convite: "Convite enviado",
  conversa: "Em conversa",
  proposta: "Proposta recebida",
} as const;

export function ConversasFamilia() {
  const [ativa, setAtiva] = useState(conversasFamilia[0]?.id ?? "");
  const [mensagem, setMensagem] = useState("");
  const conversa = conversasFamilia.find((c) => c.id === ativa);

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
              {conversa.ultimaMensagem}
              <span className="mt-1 block text-xs text-muted-foreground">{conversa.quando}</span>
            </div>

            {conversa.status === "proposta" && (
              <div className="mt-4 rounded-lg border border-primary/40 p-4">
                <p className="text-sm font-medium">Proposta formal</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plantão de 12h, R$ 320 por dia, início na próxima segunda. Ao aceitar, o
                  compromisso entra na sua agenda e a minuta de prestação de serviços é gerada.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => toast.success("Proposta aceita e agendada.")}>
                    Aceitar proposta
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info("Pedido de ajuste enviado à cuidadora.")}
                  >
                    Pedir ajuste
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
                onClick={() => {
                  if (!mensagem.trim()) return;
                  setMensagem("");
                  toast.success("Mensagem enviada.");
                }}
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
