import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  Clock,
  Eye,
  HeartHandshake,
  IdCard,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/painel/AdminHeader";
import { ArquivoDocumentos } from "@/components/painel/ArquivoDocumentos";
import { DossieCadastro } from "@/components/painel/DossieCadastro";
import { GatewayDados } from "@/components/painel/GatewayDados";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  decidirVerificacao,
  definirVerificado,
  excluirPerfil,
  criarPerfisSimulacao,
  imagensVerificacao,
  listarCadastros,
  listarVerificacoes,
  souAdmin,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin-entrar" });
  },
  head: () => ({
    meta: [
      { title: "Admin: cadastros de cuidadoras e famílias | CuideJá" },
      {
        name: "description",
        content:
          "Painel administrativo do CuideJá: conferência manual de verificações, aprovação de cuidadoras e gestão de cadastros de famílias.",
      },
      { property: "og:title", content: "Painel administrativo | CuideJá" },
      {
        property: "og:description",
        content: "Aprove verificações, libere selos e acompanhe cadastros de cuidadoras e famílias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type Cadastro = {
  id: string;
  tipo: string;
  admin: boolean;
  nome: string;
  cidade: string;
  email: string;
  verificado: boolean;
  created_at: string;
  tarifa_hora: number;
  especialidades: string[];
  verificacao: { status: string; score: number; revisao_manual: boolean } | null;
};

const dataBr = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const CREDENCIAIS_DEMO = {
  familia: "demo.familia@cuideja.app",
  cuidadora: "demo.cuidadora@cuideja.app",
  senha: "CuideJa#Demo2026",
};

function AdminPage() {
  const checarAdmin = useServerFn(souAdmin);
  const buscarCadastros = useServerFn(listarCadastros);
  const buscarVerificacoes = useServerFn(listarVerificacoes);
  const criarSimulacao = useServerFn(criarPerfisSimulacao);
  const [credenciaisDemo, setCredenciaisDemo] = useState<Awaited<ReturnType<typeof criarPerfisSimulacao>> | null>(null);
  const [criandoDemo, setCriandoDemo] = useState(false);

  const acesso = useQuery({ queryKey: ["admin", "acesso"], queryFn: () => checarAdmin() });
  const habilitado = acesso.data?.admin === true;

  const cadastros = useQuery({
    queryKey: ["admin", "cadastros"],
    queryFn: () => buscarCadastros() as Promise<Cadastro[]>,
    enabled: habilitado,
  });
  const verificacoes = useQuery({
    queryKey: ["admin", "verificacoes"],
    queryFn: () => buscarVerificacoes(),
    enabled: habilitado,
  });

  if (acesso.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <p className="mx-auto max-w-6xl px-5 py-16 text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!habilitado) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="mx-auto max-w-2xl px-5 py-20 text-center">
          <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-semibold">Área restrita</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta página é exclusiva da equipe administrativa do CuideJá. Se você deveria ter acesso,
            peça para a sua conta receber o papel de administrador.
          </p>
        </div>
      </div>
    );
  }

  const lista = cadastros.data ?? [];
  const cadastrosDeClientes = lista.filter((c) => !c.admin);
  const cuidadoras = cadastrosDeClientes.filter((c) => c.tipo === "cuidadora");
  const familias = cadastrosDeClientes.filter((c) => c.tipo === "familia");
  const pendentes = (verificacoes.data ?? []).filter(
    (v: any) => v.status === "em_analise" || v.revisao_manual,
  );

  const provisionarDemo = async () => {
    setCriandoDemo(true);
    try {
      setCredenciaisDemo(await criarSimulacao({ data: undefined }));
      toast.success("Ambiente de simulação pronto.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível criar a simulação.");
    } finally {
      setCriandoDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Administração
          </p>
          <h1 className="font-display text-3xl font-semibold">Controle de cadastros</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuidadoras e famílias são gerenciadas separadamente. Verificações aguardando conferência
            manual aparecem primeiro.
          </p>
          <Card className="mt-4 border-primary/30">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <HeartHandshake className="size-5 text-primary" />
              <div className="min-w-56 flex-1">
                <p className="text-sm font-semibold">Simulação ponta a ponta</p>
                <p className="text-xs text-muted-foreground">
                  Cria família, cuidadora, verificações aprovadas e uma reserva ativa.
                </p>
              </div>
              <Button size="sm" onClick={provisionarDemo} disabled={criandoDemo}>
                {criandoDemo ? "Renovando..." : "Criar ou renovar acessos"}
              </Button>
            </CardContent>
            <CardContent className="border-t border-border pt-4 text-sm">
              <p className="font-medium">Acessos de demonstração</p>
              <p className="mt-2">Família: <strong>{CREDENCIAIS_DEMO.familia}</strong></p>
              <p>Cuidadora: <strong>{CREDENCIAIS_DEMO.cuidadora}</strong></p>
              <p>Senha: <strong>{CREDENCIAIS_DEMO.senha}</strong></p>
              <p className="mt-2 text-xs text-muted-foreground">
                A senha vale por 24 horas após criar ou renovar os acessos.
                {credenciaisDemo && <> Expira em {new Date(credenciaisDemo.familia.senhaExpiraEm).toLocaleString("pt-BR")}.</>}
              </p>
            </CardContent>
          </Card>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Resumo icone={ShieldCheck} titulo="Cuidadoras" valor={cuidadoras.length} />
          <Resumo icone={Users} titulo="Famílias" valor={familias.length} />
          <Resumo icone={Clock} titulo="Verificações pendentes" valor={pendentes.length} />
        </div>

        <Tabs defaultValue="verificacoes">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="verificacoes">Verificações</TabsTrigger>
            <TabsTrigger value="cuidadoras">Cuidadoras</TabsTrigger>
            <TabsTrigger value="familias">Famílias</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="gateway">Gateway de dados</TabsTrigger>
          </TabsList>

          <TabsContent value="documentos" className="mt-5">
            <ArquivoDocumentos />
          </TabsContent>

          <TabsContent value="gateway" className="mt-5">
            <GatewayDados />
          </TabsContent>


          <TabsContent value="verificacoes" className="mt-5">
            <FilaVerificacoes
              itens={verificacoes.data ?? []}
              carregando={verificacoes.isLoading}
              cadastros={lista}
            />
          </TabsContent>

          <TabsContent value="cuidadoras" className="mt-5">
            <ListaCadastros
              itens={cuidadoras}
              carregando={cadastros.isLoading}
              vazio="Nenhuma cuidadora cadastrada ainda."
              mostrarVerificacao
            />
          </TabsContent>

          <TabsContent value="familias" className="mt-5">
            <ListaCadastros
              itens={familias}
              carregando={cadastros.isLoading}
              vazio="Nenhuma família cadastrada ainda."
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Resumo({
  icone: Icone,
  titulo,
  valor,
}: {
  icone: typeof Users;
  titulo: string;
  valor: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Icone className="size-5" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{titulo}</p>
          <p className="font-display text-2xl font-semibold">{valor}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ListaCadastros({
  itens,
  carregando,
  vazio,
  mostrarVerificacao = false,
}: {
  itens: Cadastro[];
  carregando: boolean;
  vazio: string;
  mostrarVerificacao?: boolean;
}) {
  const [busca, setBusca] = useState("");
  const [dossie, setDossie] = useState<{ id: string; nome: string } | null>(null);
  const [excluir, setExcluir] = useState<Cadastro | null>(null);
  const queryClient = useQueryClient();
  const alternar = useServerFn(definirVerificado);
  const apagar = useServerFn(excluirPerfil);

  const mutacao = useMutation({
    mutationFn: (v: { userId: string; verificado: boolean }) => alternar({ data: v }),
    onSuccess: () => {
      toast.success("Cadastro atualizado.");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exclusao = useMutation({
    mutationFn: (userId: string) => apagar({ data: { userId } }),
    onSuccess: () => {
      toast.success("Perfil excluído.");
      setExcluir(null);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtrados = itens.filter((c) =>
    `${c.nome} ${c.email} ${c.cidade}`.toLowerCase().includes(busca.trim().toLowerCase()),
  );

  if (carregando) return <p className="text-sm text-muted-foreground">Carregando cadastros…</p>;
  if (!itens.length) return <p className="text-sm text-muted-foreground">{vazio}</p>;

  return (
    <div className="space-y-4">
      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome, e-mail ou cidade"
        className="max-w-sm"
      />
      <div className="grid gap-3">
        {filtrados.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <button
                type="button"
                className="min-w-[200px] flex-1 text-left"
                onClick={() => setDossie({ id: c.id, nome: c.nome })}
                aria-label={`Abrir dossiê completo de ${c.nome || "cadastro"}`}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium underline-offset-4 hover:underline">
                    {c.nome || "Sem nome informado"}
                  </p>
                  {c.verificado ? (
                    <Badge className="gap-1">
                      <BadgeCheck className="size-3" /> Verificado
                    </Badge>
                  ) : (
                    <Badge variant="outline">Não verificado</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.email || "e-mail indisponível"} · {c.cidade || "cidade não informada"} ·
                  cadastro {dataBr(c.created_at)}
                </p>
                {mostrarVerificacao && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.verificacao
                      ? `Última análise: ${c.verificacao.status} · pontuação ${c.verificacao.score}/100${
                          c.verificacao.revisao_manual ? " · aguarda conferência manual" : ""
                        }`
                      : "Nenhuma verificação enviada"}
                  </p>
                )}
                <p className="mt-1 text-xs text-primary">
                  Clique para inspecionar fotos, documentos e dados completos
                </p>
              </button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setDossie({ id: c.id, nome: c.nome })}
                >
                  <Eye className="size-4" /> Ver dossiê
                </Button>
                <Button
                  variant={c.verificado ? "outline" : "default"}
                  size="sm"
                  disabled={mutacao.isPending || exclusao.isPending}
                  onClick={() => mutacao.mutate({ userId: c.id, verificado: !c.verificado })}
                >
                  {c.verificado ? "Revogar selo" : "Liberar acesso"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={mutacao.isPending || exclusao.isPending}
                  onClick={() => setExcluir(c)}
                >
                  Excluir perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!filtrados.length && (
          <p className="text-sm text-muted-foreground">Nenhum resultado para essa busca.</p>
        )}
      </div>

      <DossieCadastro
        userId={dossie?.id ?? null}
        nome={dossie?.nome ?? ""}
        onClose={() => setDossie(null)}
      />

      <AlertDialog open={Boolean(excluir)} onOpenChange={(aberto) => !aberto && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente {excluir?.nome || "este cadastro"}, os dados
              vinculados e todos os documentos privados enviados. Não será possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={exclusao.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={exclusao.isPending || !excluir}
              onClick={(evento) => {
                evento.preventDefault();
                if (excluir) exclusao.mutate(excluir.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {exclusao.isPending ? "Excluindo..." : "Sim, excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilaVerificacoes({
  itens,
  carregando,
  cadastros,
}: {
  itens: any[];
  carregando: boolean;
  cadastros: Cadastro[];
}) {
  const queryClient = useQueryClient();
  const decidir = useServerFn(decidirVerificacao);
  const buscarImagens = useServerFn(imagensVerificacao);
  const [aberta, setAberta] = useState<any | null>(null);
  const [dossie, setDossie] = useState<{ id: string; nome: string } | null>(null);
  const [imagens, setImagens] = useState<{
    selfie: string;
    documento: string;
    documentoPdf?: boolean;
    documentoNome?: string;
  } | null>(null);

  const mutacao = useMutation({
    mutationFn: (v: { verificacaoId: string; userId: string; decisao: "aprovado" | "reprovado" }) =>
      decidir({ data: v }),
    onSuccess: () => {
      toast.success("Decisão registrada.");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abrir = async (v: any) => {
    setAberta(v);
    setImagens(null);
    try {
      const urls = await buscarImagens({
        data: {
          selfiePath: v.selfie_path ?? "",
          documentoPath: v.documento_path ?? "",
          userId: v.user_id,
        },
      });
      setImagens(urls);
    } catch {
      toast.error("Não foi possível abrir as imagens.");
    }
  };


  if (carregando) return <p className="text-sm text-muted-foreground">Carregando verificações…</p>;
  if (!itens.length)
    return <p className="text-sm text-muted-foreground">Nenhuma verificação enviada até agora.</p>;

  const emailDe = (userId: string) => cadastros.find((c) => c.id === userId)?.email ?? "";

  return (
    <div className="grid gap-3">
      {itens.map((v) => (
        <Card key={v.id}>
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {v.nome_documento || "Nome não identificado"}
              <Badge variant={v.status === "aprovado" ? "default" : "outline"}>{v.status}</Badge>
              {v.revisao_manual && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="size-3" /> conferência manual
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {emailDe(v.user_id) || v.user_id} · CPF {v.cpf || "não identificado"} ·{" "}
              {String(v.tipo_documento).toUpperCase()} · pontuação {v.score}/100 · enviado{" "}
              {dataBr(v.created_at)}
            </p>
            {v.observacoes && <p className="text-xs text-muted-foreground">{v.observacoes}</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => abrir(v)}>
                <Eye className="size-4" /> Ver selfie e documento
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  setDossie({
                    id: v.user_id,
                    nome: v.nome_documento || emailDe(v.user_id) || "Cadastro",
                  })
                }
              >
                <IdCard className="size-4" /> Ver dossiê completo
              </Button>
              <Button
                size="sm"
                className="gap-2"
                disabled={mutacao.isPending}
                onClick={() =>
                  mutacao.mutate({
                    verificacaoId: v.id,
                    userId: v.user_id,
                    decisao: "aprovado",
                  })
                }
              >
                <ShieldCheck className="size-4" /> Aprovar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={mutacao.isPending}
                onClick={() =>
                  mutacao.mutate({
                    verificacaoId: v.id,
                    userId: v.user_id,
                    decisao: "reprovado",
                  })
                }
              >
                <XCircle className="size-4" /> Reprovar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={Boolean(aberta)} onOpenChange={(o) => !o && setAberta(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartHandshake className="size-5 text-primary" /> Conferência manual
            </DialogTitle>
            <DialogDescription>
              Compare o rosto da selfie com a foto do documento. Os links expiram em 10 minutos.
            </DialogDescription>
          </DialogHeader>
          {imagens ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <figure className="space-y-2">
                <figcaption className="text-xs text-muted-foreground">
                  Rosto com o documento (selfie)
                </figcaption>
                {imagens.selfie ? (
                  <img
                    src={imagens.selfie}
                    alt="Rosto com o documento enviado para verificação"
                    className="w-full rounded-lg border border-border object-cover"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">Imagem não disponível.</p>
                )}
              </figure>
              <figure className="space-y-2">
                <figcaption className="text-xs text-muted-foreground">
                  Documento oficial com foto {imagens.documentoNome ? `· ${imagens.documentoNome}` : ""}
                </figcaption>
                {!imagens.documento ? (
                  <p className="text-xs text-muted-foreground">
                    Documento oficial ainda não enviado pela cuidadora.
                  </p>
                ) : imagens.documentoPdf ? (
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">
                      Documento enviado em PDF. Abra em uma nova aba para conferir os dados.
                    </p>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() =>
                        window.open(imagens.documento, "_blank", "noopener,noreferrer")
                      }
                    >
                      <Eye className="size-4" /> Abrir PDF em nova aba
                    </Button>
                    <a
                      href={imagens.documento}
                      target="_blank"
                      rel="noreferrer"
                      download={imagens.documentoNome || "documento.pdf"}
                      className="block text-xs text-primary underline"
                    >
                      Baixar arquivo
                    </a>
                  </div>
                ) : (
                  <img
                    src={imagens.documento}
                    alt="Documento oficial com foto"
                    className="w-full rounded-lg border border-border object-cover"
                  />
                )}
              </figure>
            </div>

          ) : (
            <p className="text-sm text-muted-foreground">Carregando imagens…</p>
          )}
        </DialogContent>
      </Dialog>

      <DossieCadastro
        userId={dossie?.id ?? null}
        nome={dossie?.nome ?? ""}
        onClose={() => setDossie(null)}
      />
    </div>
  );
}
