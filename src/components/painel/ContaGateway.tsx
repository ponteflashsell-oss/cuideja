import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  excluirContaGateway,
  listarContasGateway,
  salvarContaGateway,
  validarContaGateway,
} from "@/lib/gateway-pagamento.functions";

const rotulo: Record<string, string> = { nao_validado: "Não validada", validada: "Validada", erro: "Com erro" };

export function ContaGateway() {
  const qc = useQueryClient();
  const listar = useServerFn(listarContasGateway);
  const salvar = useServerFn(salvarContaGateway);
  const validar = useServerFn(validarContaGateway);
  const excluir = useServerFn(excluirContaGateway);
  const [identificador, setIdentificador] = useState("");
  const [titular, setTitular] = useState("");
  const [documento, setDocumento] = useState("");

  const contas = useQuery({ queryKey: ["admin", "contas-gateway"], queryFn: () => listar() });
  const recarregar = () => qc.invalidateQueries({ queryKey: ["admin", "contas-gateway"] });
  const falha = (e: unknown) => toast.error(e instanceof Error ? e.message : "Operação não concluída.");

  const mSalvar = useMutation({
    mutationFn: () => salvar({ data: { provedor: "infinitepay", identificador, titular, documento } }),
    onSuccess: () => { toast.success("Conta adicionada. Agora clique em Validar."); setIdentificador(""); setTitular(""); setDocumento(""); recarregar(); },
    onError: falha,
  });
  const mValidar = useMutation({
    mutationFn: (id: string) => validar({ data: { id } }),
    onSuccess: (r) => { r.ok ? toast.success(r.mensagem) : toast.error(r.mensagem); recarregar(); },
    onError: falha,
  });
  const mExcluir = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => { toast.success("Conta removida."); recarregar(); },
    onError: falha,
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Adicionar conta do gateway</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="gw-handle">Usuário InfinitePay</Label>
            <Input id="gw-handle" placeholder="ex.: cuideja" value={identificador} onChange={(e) => setIdentificador(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gw-titular">Titular</Label>
            <Input id="gw-titular" placeholder="Razão social ou nome" value={titular} onChange={(e) => setTitular(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gw-doc">CNPJ/CPF</Label>
            <Input id="gw-doc" value={documento} onChange={(e) => setDocumento(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={() => mSalvar.mutate()} disabled={mSalvar.isPending || identificador.trim().length < 2}>
              {mSalvar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Adicionar conta
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contas cadastradas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {contas.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {contas.isError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar as contas.</p>}
          {contas.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>}
          {contas.data?.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">${c.identificador}</span>
                  <Badge variant={c.status === "validada" ? "default" : c.status === "erro" ? "destructive" : "secondary"}>{rotulo[c.status] ?? c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">InfinitePay{c.titular ? ` · ${c.titular}` : ""}{c.documento ? ` · ${c.documento}` : ""}</p>
                {c.mensagem && <p className="text-xs text-muted-foreground">{c.mensagem}{c.validado_em ? ` (${new Date(c.validado_em).toLocaleString("pt-BR")})` : ""}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  if (window.confirm("A validação criará um link real de R$ 1,00 na InfinitePay, sem efetuar pagamento. Ela não confirma a titularidade nem altera o checkout atual. Continuar?")) mValidar.mutate(c.id);
                }} disabled={mValidar.isPending}>
                  {mValidar.isPending && mValidar.variables === c.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-1 h-4 w-4" />}Validar
                </Button>
                <Button size="icon" variant="ghost" aria-label="Remover conta" title="Remover conta" disabled={mExcluir.isPending} onClick={() => {
                  if (window.confirm("Remover esta conta cadastrada?")) mExcluir.mutate(c.id);
                }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
