import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Eye, FileText, IdCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cpfDoLogin, ehLoginDeCpf } from "@/lib/cpf";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FotoAmpliavel } from "@/components/painel/FotoAmpliavel";
import { dossieCadastro } from "@/lib/admin.functions";

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const moeda = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border/60 py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right font-medium">{valor || "—"}</span>
    </div>
  );
}

export function DossieCadastro({
  userId,
  nome,
  onClose,
}: {
  userId: string | null;
  nome: string;
  onClose: () => void;
}) {
  const buscar = useServerFn(dossieCadastro);
  const dossie = useQuery({
    queryKey: ["admin", "dossie", userId],
    queryFn: () => buscar({ data: { userId: userId as string } }),
    enabled: Boolean(userId),
  });

  const d = dossie.data as any;
  const p = d?.perfil;
  const familia = p?.tipo === "familia";

  return (
    <Dialog open={Boolean(userId)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IdCard className="size-5 text-primary" /> {nome || "Cadastro"}
          </DialogTitle>
          <DialogDescription>
            Inspeção de rotina: dados completos, fotos e documentos. Os links expiram em 10 minutos e
            cada abertura fica registrada na auditoria.
          </DialogDescription>
        </DialogHeader>

        {dossie.isLoading || !d ? (
          <p className="text-sm text-muted-foreground">Carregando dossiê…</p>
        ) : (
          <div className="grid gap-6">
            <section>
              <h3 className="mb-2 text-sm font-semibold">Dados do cadastro</h3>
              <div className="rounded-lg border border-border p-3">
                <Linha rotulo="Tipo de conta" valor={familia ? "Família" : "Cuidadora"} />
                <Linha rotulo="Nome" valor={p?.nome ?? ""} />
                {ehLoginDeCpf(d.email) ? (
                  <Linha rotulo="CPF (login)" valor={cpfDoLogin(d.email)} />
                ) : (
                  <Linha rotulo="E-mail" valor={d.email} />
                )}

                <Linha rotulo="Cidade" valor={p?.cidade ?? ""} />
                <Linha rotulo="Bairros" valor={(p?.bairros ?? []).join(", ")} />
                <Linha
                  rotulo={familia ? "Necessidades de cuidado" : "Especialidades"}
                  valor={(p?.especialidades ?? []).join(", ")}
                />
                <Linha rotulo={familia ? "Descrição da rotina" : "Bio"} valor={p?.bio ?? ""} />
                {!familia && (
                  <>
                    <Linha rotulo="Tarifa por hora" valor={moeda(p?.tarifa_hora)} />
                    <Linha rotulo="Diária" valor={moeda(p?.tarifa_diaria)} />
                    <Linha rotulo="Plantão 12h" valor={moeda(p?.tarifa_plantao12)} />
                    <Linha rotulo="Plantão 24h" valor={moeda(p?.tarifa_plantao24)} />
                  </>
                )}
                <Linha
                  rotulo="Selo de verificação"
                  valor={p?.verificado ? "Liberado" : "Não liberado"}
                />
                <Linha rotulo="Cadastro criado em" valor={p ? dataHora(p.created_at) : ""} />
                <Linha rotulo="Última atualização" valor={p ? dataHora(p.updated_at) : ""} />
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Histórico de verificações</h3>
              {d.verificacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma verificação enviada.</p>
              ) : (
                <div className="grid gap-2">
                  {d.verificacoes.map((v: any) => (
                    <div key={v.id} className="rounded-lg border border-border p-3 text-sm">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {v.nome_documento || "Nome não identificado"}
                        <Badge variant={v.status === "aprovado" ? "default" : "outline"}>
                          {v.status}
                        </Badge>
                        {v.revisao_manual && <Badge variant="secondary">conferência manual</Badge>}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        CPF {v.cpf || "não identificado"} · nascimento {v.data_nascimento || "—"} ·{" "}
                        {String(v.tipo_documento || "").toUpperCase() || "documento não identificado"} ·
                        pontuação {v.score}/100
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CPF válido: {v.cpf_valido ? "sim" : "não"} · rosto confere:{" "}
                        {v.face_confere ? "sim" : "não"} · antecedentes: {v.antecedentes_status} ·
                        enviado {dataHora(v.created_at)}
                      </p>
                      {v.observacoes && <p className="mt-1 text-xs">{v.observacoes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <BadgeCheck className="size-4 text-primary" /> Fotos e documentos
              </h3>
              {d.arquivos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum arquivo enviado.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {d.arquivos.map((a: any) => (
                    <figure key={a.chave} className="space-y-2">
                      <figcaption className="text-xs text-muted-foreground">
                        {a.titulo} · {a.origem} · {dataHora(a.criado_em)}
                      </figcaption>
                      {!a.url ? (
                        <p className="text-xs text-muted-foreground">Arquivo indisponível.</p>
                      ) : a.pdf ? (
                        <div className="space-y-2 rounded-lg border border-border p-3">
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="size-4" /> Arquivo em PDF
                          </p>
                          <Button
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => window.open(a.url, "_blank", "noopener,noreferrer")}
                          >
                            <Eye className="size-4" /> Abrir PDF em nova aba
                          </Button>
                        </div>
                      ) : (
                        <FotoAmpliavel src={a.url} alt={a.titulo} legenda={a.origem} />
                      )}
                    </figure>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
