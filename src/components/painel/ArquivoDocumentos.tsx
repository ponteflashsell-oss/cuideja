import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, FolderLock, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { abrirDocumentoNuvem, listarAuditoria, listarDocumentosNuvem } from "@/lib/admin.functions";

type Arquivo = {
  chave: string;
  user_id: string;
  nome: string;
  conta: string;
  tipo: string;
  caminho: string;
  origem: string;
  criado_em: string;
};

const rotulos: Record<string, string> = {
  selfie: "Selfie ao vivo",
  documento_identidade: "Documento com foto",
  documento_oficial: "Documento oficial",
};

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ArquivoDocumentos() {
  const buscarArquivos = useServerFn(listarDocumentosNuvem);
  const buscarAuditoria = useServerFn(listarAuditoria);
  const abrir = useServerFn(abrirDocumentoNuvem);
  const [busca, setBusca] = useState("");

  const arquivos = useQuery({
    queryKey: ["admin", "documentos"],
    queryFn: () => buscarArquivos() as Promise<Arquivo[]>,
  });
  const auditoria = useQuery({
    queryKey: ["admin", "auditoria"],
    queryFn: () => buscarAuditoria(),
  });

  const termo = busca.trim().toLowerCase();
  const lista = (arquivos.data ?? []).filter(
    (a) => !termo || a.nome.toLowerCase().includes(termo) || a.conta.includes(termo),
  );
  const grupos = (conta: Arquivo["conta"]) => {
    const porUsuario = new Map<string, { nome: string; arquivos: Arquivo[] }>();
    for (const arquivo of lista.filter((item) => item.conta === conta)) {
      const grupo = porUsuario.get(arquivo.user_id) ?? { nome: arquivo.nome, arquivos: [] };
      grupo.arquivos.push(arquivo);
      porUsuario.set(arquivo.user_id, grupo);
    }
    return [...porUsuario.entries()];
  };

  const visualizar = async (a: Arquivo) => {
    try {
      const r = (await abrir({ data: { caminho: a.caminho, userId: a.user_id } })) as {
        url: string;
      };
      window.open(r.url, "_blank", "noopener,noreferrer");
      auditoria.refetch();
    } catch {
      toast.error("Não foi possível abrir o arquivo.");
    }
  };

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderLock className="size-4 text-primary" /> Arquivo em nuvem (guarda jurídica)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Todas as selfies e documentos enviados por cuidadoras e famílias ficam guardados em
            armazenamento privado. Os links são temporários (10 minutos) e cada abertura é registrada
            na auditoria.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input
            placeholder="Buscar por nome ou tipo de conta…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {arquivos.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando arquivos…</p>
          ) : (
            <Tabs defaultValue="familia" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-2">
                <TabsTrigger value="familia">Família ({grupos("familia").length})</TabsTrigger>
                <TabsTrigger value="cuidadora">
                  Cuidadora ({grupos("cuidadora").length})
                </TabsTrigger>
              </TabsList>

              {(["familia", "cuidadora"] as const).map((conta) => {
                const gruposDaConta = grupos(conta);
                return (
                  <TabsContent key={conta} value={conta} className="grid gap-4">
                    {gruposDaConta.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum arquivo de {conta === "familia" ? "família" : "cuidadora"} encontrado.
                      </p>
                    ) : (
                      gruposDaConta.map(([userId, grupo]) => (
                        <section key={userId} className="rounded-lg border border-border p-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{grupo.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {grupo.arquivos.length} arquivo(s) deste cadastro
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {conta === "familia" ? "Família" : "Cuidadora"}
                            </Badge>
                          </div>
                          <div className="grid gap-2">
                            {grupo.arquivos.map((a) => (
                              <div
                                key={a.chave}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 p-3"
                              >
                                <div>
                                  <p className="text-sm font-medium">{rotulos[a.tipo] ?? a.tipo}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {a.origem === "camera" ? "câmera ao vivo" : "arquivo enviado"} · {dataHora(a.criado_em)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                  onClick={() => visualizar(a)}
                                >
                                  <Eye className="size-4" /> Visualizar
                                </Button>
                              </div>
                            ))}
                          </div>
                        </section>
                      ))
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="size-4 text-primary" /> Auditoria de acessos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Registro imutável de quem da equipe abriu cada arquivo e quando (LGPD).
          </p>
        </CardHeader>
        <CardContent className="grid gap-2">
          {(auditoria.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum acesso registrado ainda.</p>
          ) : (
            (auditoria.data ?? []).map((r: any) => (
              <p key={r.id} className="text-xs text-muted-foreground">
                <span className="text-foreground">{dataHora(r.created_at)}</span> · {r.acao} ·{" "}
                {r.caminho}
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
