import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FolderLock, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DossieCadastro } from "@/components/painel/DossieCadastro";
import { listarAuditoria, listarDocumentosNuvem } from "@/lib/admin.functions";

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
  const [busca, setBusca] = useState("");
  const [dossie, setDossie] = useState<{ id: string; nome: string } | null>(null);

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
                        <button
                          key={userId}
                          type="button"
                          className="rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setDossie({ id: userId, nome: grupo.nome })}
                          aria-label={`Abrir dossiê completo de ${grupo.nome || "cadastro"}`}
                        >
                          <p className="text-sm font-medium underline-offset-4 hover:underline">
                            {grupo.nome || "Nome não informado"}
                          </p>
                        </button>
                      ))
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      <DossieCadastro
        userId={dossie?.id ?? null}
        nome={dossie?.nome ?? ""}
        onClose={() => setDossie(null)}
      />

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
