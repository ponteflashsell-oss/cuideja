import { useEffect, useState } from "react";
import { Camera, FileCheck2, ShieldCheck, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  documentos,
  especialidadesAtivas,
  perfilCuidadora,
  tagsCuidado,
} from "@/data/painel-cuidadora";

const statusLabel = {
  aprovado: "Aprovado",
  em_analise: "Em análise",
  pendente: "Pendente",
} as const;

export function PerfilProfissional() {
  const [tags, setTags] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [tarifas, setTarifas] = useState({ hora: 0, diaria: 0, plantao12: 0, plantao24: 0 });
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairros, setBairros] = useState("");
  const [verificado, setVerificado] = useState(false);
  const [salvando, setSalvando] = useState(false);


  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("profiles")
        .select(
          "nome, cidade, bio, bairros, especialidades, tarifa_hora, tarifa_diaria, tarifa_plantao12, tarifa_plantao24, verificado",
        )
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!ativo || !data) return;
      if (data.nome) setNome(data.nome);
      if (data.cidade) setCidade(data.cidade);
      if (data.bio) setBio(data.bio);
      if (data.bairros?.length) setBairros(data.bairros.join(", "));
      if (data.especialidades?.length) setTags(data.especialidades);
      setVerificado(data.verificado);
      if (Number(data.tarifa_hora) > 0) {

        setTarifas({
          hora: Number(data.tarifa_hora),
          diaria: Number(data.tarifa_diaria),
          plantao12: Number(data.tarifa_plantao12),
          plantao24: Number(data.tarifa_plantao24),
        });
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const salvar = async (mensagem: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Sessão expirada. Entre novamente.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("profiles").upsert({
      id: auth.user.id,
      nome: nome.trim().slice(0, 80),
      bio: bio.trim().slice(0, 400),
      bairros: bairros
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean)
        .slice(0, 12),
      especialidades: tags,
      tarifa_hora: tarifas.hora,
      tarifa_diaria: tarifas.diaria,
      tarifa_plantao12: tarifas.plantao12,
      tarifa_plantao24: tarifas.plantao24,
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar agora.");
      return;
    }
    toast.success(mensagem);
  };

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="surface-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <span className="flex size-20 items-center justify-center rounded-full bg-muted font-display text-2xl">
              {nome
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("") || "?"}
            </span>
            <button
              type="button"
              onClick={() => toast.info("Envio de foto disponível no cadastro completo.")}
              className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground"
              aria-label="Trocar foto de perfil"
            >
              <Camera className="size-3.5" />
            </button>
          </div>
          <div>
            <h2 className="text-2xl">{nome || "Seu nome"}</h2>
            <p className="text-sm text-muted-foreground">{cidade || "Informe sua cidade"}</p>
            {verificado ? (
              <Badge className="mt-2 gap-1">
                <ShieldCheck className="size-3" /> Perfil Verificado
              </Badge>
            ) : (
              <Badge variant="secondary" className="mt-2 gap-1">
                <ShieldCheck className="size-3" /> Perfil em verificação
              </Badge>
            )}

          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="nome">Nome exibido</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bairros">Bairros de atuação</Label>
            <Input
              id="bairros"
              value={bairros}
              onChange={(e) => setBairros(e.target.value)}
              maxLength={160}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-1.5">
          <Label htmlFor="bio">Mini-biografia</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 400))}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">{bio.length}/400 caracteres</p>
        </div>

        <div className="mt-6">
          <h3 className="text-lg">Especialidades e cuidados</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione as tags que as famílias usam para filtrar profissionais.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tagsCuidado.map((tag) => {
              const ativo = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={ativo}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    ativo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <Button className="mt-6" disabled={salvando} onClick={() => salvar("Perfil atualizado.")}>
          Salvar vitrine
        </Button>
      </section>

      <div className="grid gap-6 content-start">
        <section className="surface-card p-6">
          <h3 className="flex items-center gap-2 text-lg">
            <FileCheck2 className="size-4 text-primary" /> Certificados e documentos
          </h3>
          <ul className="mt-4 grid gap-3">
            {documentos.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">{doc.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.enviadoEm ? `Enviado em ${doc.enviadoEm}` : "Nenhum arquivo enviado"}
                  </p>
                </div>
                <Badge
                  variant={
                    doc.status === "aprovado"
                      ? "default"
                      : doc.status === "em_analise"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {statusLabel[doc.status]}
                </Badge>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            className="mt-4 w-full gap-2"
            onClick={() => toast.info("Upload de documentos entra com o cadastro na nuvem.")}
          >
            <Upload className="size-4" /> Enviar novo documento
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            O selo "Perfil Verificado" é emitido pela administração após a checagem de CPF,
            antecedentes e biometria.
          </p>
        </section>

        <section className="surface-card p-6">
          <h3 className="flex items-center gap-2 text-lg">
            <Wallet className="size-4 text-primary" /> Valores e tarifas
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["hora", "Valor por hora"],
                ["diaria", "Diária fixa"],
                ["plantao12", "Plantão 12h"],
                ["plantao24", "Plantão 24h"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={key}>{label}</Label>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    max={5000}
                    value={tarifas[key]}
                    onChange={(e) =>
                      setTarifas((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))
                    }
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            disabled={salvando}
            onClick={() => salvar("Tarifas salvas.")}
          >
            Salvar tarifas
          </Button>
        </section>
      </div>
    </div>
  );
}
