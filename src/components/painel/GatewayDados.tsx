import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database, Link2, Loader2, Plug, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ativarConexaoGateway,
  espelharDadosGateway,
  excluirConexaoGateway,
  listarConexoesGateway,
  salvarConexaoGateway,
  testarConexaoGateway,
} from "@/lib/gateway.functions";

type Conexao = {
  id: string;
  nome: string;
  url: string;
  ativo: boolean;
  status: "nao_testado" | "ok" | "erro";
  mensagem: string | null;
  ultimoTesteEm: string | null;
  criadoEm: string;
  chaveMascarada: string;
};

const rotuloStatus: Record<Conexao["status"], string> = {
  nao_testado: "Não testado",
  ok: "Conectado",
  erro: "Com erro",
};

export function GatewayDados() {
  const queryClient = useQueryClient();
  const listar = useServerFn(listarConexoesGateway);
  const salvar = useServerFn(salvarConexaoGateway);
  const testar = useServerFn(testarConexaoGateway);
  const ativar = useServerFn(ativarConexaoGateway);
  const excluir = useServerFn(excluirConexaoGateway);
  const espelhar = useServerFn(espelharDadosGateway);

  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [chave, setChave] = useState("");
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [relatorio, setRelatorio] = useState<{ tabela: string; enviados: number; erro: string | null }[] | null>(null);

  const dados = useQuery({
    queryKey: ["admin", "gateway"],
    queryFn: () => listar() as Promise<{ conexoes: Conexao[]; tabelas: string[] }>,
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["admin", "gateway"] });
  const erro = (e: unknown) => toast.error(e instanceof Error ? e.message : "Operação não concluída.");

  const criar = useMutation({
    mutationFn: () => salvar({ data: { nome, url, chave } }),
    onSuccess: () => {
      setNome("");
      setUrl("");
      setChave("");
      toast.success("Conexão salva.");
      invalidar();
    },
    onError: erro,
  });

  const testarConexao = useMutation({
    mutationFn: (id: string) => testar({ data: { id } }),
    onSuccess: (r) => {
      r.ok ? toast.success(r.mensagem) : toast.error(r.mensagem);
      invalidar();
    },
    onError: erro,
  });

  const alternar = useMutation({
    mutationFn: (v: { id: string; ativo: boolean }) => ativar({ data: v }),
    onSuccess: () => invalidar(),
    onError: erro,
  });

  const remover = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => {
      toast.success("Conexão removida.");
      invalidar();
    },
    onError: erro,
  });

  const sincronizar = useMutation({
    mutationFn: (id: string) => espelhar({ data: { id, tabelas: selecionadas } }),
    onSuccess: (r) => {
      setRelatorio(r);
      toast.success("Espelhamento concluído.");
    },
    onError: erro,
  });

  const conexoes = dados.data?.conexoes ?? [];
  const tabelas = dados.data?.tabelas ?? [];
  const ativa = conexoes.find((c) => c.ativo) ?? null;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="size-4 text-primary" /> Vincular banco de dados independente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cadastre o seu próprio projeto de banco (URL e chave de serviço). O gateway testa a
            conexão e permite espelhar os dados atuais para o seu banco, sem depender do backend
            padrão.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="gw-nome">Nome</Label>
              <Input
                id="gw-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Meu banco de produção"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gw-url">URL do projeto</Label>
              <Input
                id="gw-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxx.supabase.co"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gw-chave">Chave de serviço</Label>
              <Input
                id="gw-chave"
                type="password"
                value={chave}
                onChange={(e) => setChave(e.target.value)}
                placeholder="service_role / sb_secret_..."
              />
            </div>
          </div>
          <Button onClick={() => criar.mutate()} disabled={criar.isPending}>
            {criar.isPending ? "Salvando..." : "Salvar conexão"}
          </Button>
          <p className="text-xs text-muted-foreground">
            A chave é gravada em área privada acessível apenas por administradores e nunca é
            devolvida ao navegador.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-primary" /> Conexões cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dados.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!dados.isLoading && conexoes.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum banco vinculado ainda.</p>
          )}
          {conexoes.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-56 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {c.nome}
                    <Badge variant={c.status === "ok" ? "default" : c.status === "erro" ? "destructive" : "secondary"}>
                      {rotuloStatus[c.status]}
                    </Badge>
                    {c.ativo && <Badge variant="outline">Ativa</Badge>}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {c.url} · chave {c.chaveMascarada}
                  </p>
                  {c.mensagem && <p className="mt-1 text-xs text-muted-foreground">{c.mensagem}</p>}
                  {c.ultimoTesteEm && (
                    <p className="text-xs text-muted-foreground">
                      Último teste: {new Date(c.ultimoTesteEm).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={c.ativo}
                    onCheckedChange={(ativo) => alternar.mutate({ id: c.id, ativo })}
                    aria-label="Definir como conexão ativa"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testarConexao.mutate(c.id)}
                    disabled={testarConexao.isPending}
                  >
                    <Link2 className="mr-1 size-4" /> Testar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remover.mutate(c.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCcw className="size-4 text-primary" /> Espelhar dados para o banco ativo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!ativa && (
            <p className="text-sm text-muted-foreground">
              Ative uma conexão acima para liberar o espelhamento.
            </p>
          )}
          {ativa && (
            <>
              <p className="text-sm text-muted-foreground">
                Destino: <strong>{ativa.nome}</strong>. As tabelas precisam existir no banco de
                destino com a mesma estrutura; registros são inseridos ou atualizados por
                <code className="mx-1">id</code>.
              </p>
              <div className="flex flex-wrap gap-2">
                {tabelas.map((t) => {
                  const marcada = selecionadas.includes(t);
                  return (
                    <Button
                      key={t}
                      type="button"
                      size="sm"
                      variant={marcada ? "default" : "outline"}
                      onClick={() =>
                        setSelecionadas((atual) =>
                          marcada ? atual.filter((x) => x !== t) : [...atual, t],
                        )
                      }
                    >
                      {t}
                    </Button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelecionadas(tabelas)}>
                  Selecionar todas
                </Button>
                <Button
                  size="sm"
                  onClick={() => sincronizar.mutate(ativa.id)}
                  disabled={selecionadas.length === 0 || sincronizar.isPending}
                >
                  {sincronizar.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
                  Espelhar selecionadas
                </Button>
              </div>
              {relatorio && (
                <div className="rounded-lg border border-border p-3 text-sm">
                  {relatorio.map((r) => (
                    <p key={r.tabela} className={r.erro ? "text-destructive" : ""}>
                      {r.tabela}: {r.erro ? r.erro : `${r.enviados} registro(s) enviados`}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
