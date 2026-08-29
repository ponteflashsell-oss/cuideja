import { useEffect, useState } from "react";
import { FileCheck2, Home, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { documentosFamilia, necessidadesCuidado } from "@/data/painel-familia";
import { AnaliseIdentidade } from "@/components/painel/AnaliseIdentidade";
import { EnvioDocumento } from "@/components/painel/EnvioDocumento";

export function PerfilFamilia() {
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairros, setBairros] = useState("");
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [verificado, setVerificado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [biometriaEnviada, setBiometriaEnviada] = useState(false);
  const [docEnviado, setDocEnviado] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("nome, cidade, bio, bairros, especialidades, verificado")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!ativo || !data) return;
      if (data.nome) setNome(data.nome);
      if (data.cidade) setCidade(data.cidade);
      if (data.bio) setBio(data.bio);
      if (data.bairros?.length) setBairros(data.bairros.join(", "));
      if (data.especialidades?.length) setTags(data.especialidades);
      setVerificado(data.verificado);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const salvar = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Sessão expirada. Entre novamente.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("profiles").upsert({
      id: auth.user.id,
      tipo: "familia",
      nome: nome.trim().slice(0, 80),
      cidade: cidade.trim().slice(0, 60),
      bio: bio.trim().slice(0, 400),
      bairros: bairros
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean)
        .slice(0, 12),
      especialidades: tags,
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar agora.");
      return;
    }
    toast.success("Dados da família atualizados.");
  };

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="surface-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Home className="size-6 text-muted-foreground" />
          </span>
          <div>
            <h2 className="text-2xl">{nome || "Nome do responsável"}</h2>
            <p className="text-sm text-muted-foreground">{cidade || "Informe sua cidade"}</p>
            <Badge variant={verificado ? "default" : "secondary"} className="mt-2 gap-1">
              <ShieldCheck className="size-3" />
              {verificado ? "Família verificada" : "Família em verificação"}
            </Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="nome-familia">Nome do responsável</Label>
            <Input
              id="nome-familia"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cidade-familia">Cidade</Label>
            <Input
              id="cidade-familia"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="bairros-familia">Bairro(s) onde o cuidado acontece</Label>
            <Input
              id="bairros-familia"
              value={bairros}
              onChange={(e) => setBairros(e.target.value)}
              maxLength={160}
              placeholder="Centro, Pinheiros"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-1.5">
          <Label htmlFor="bio-familia">Quem precisa de cuidado</Label>
          <Textarea
            id="bio-familia"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 400))}
            rows={4}
            placeholder="Ex.: minha mãe, 82 anos, mora sozinha, precisa de apoio com medicação e mobilidade durante o dia."
          />
          <p className="text-xs text-muted-foreground">{bio.length}/400 caracteres</p>
        </div>

        <div className="mt-6">
          <h3 className="text-lg">Cuidados necessários</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Usamos essas marcações para sugerir cuidadoras com a experiência certa.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {necessidadesCuidado.map((tag) => {
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

        <Button className="mt-6" disabled={salvando} onClick={salvar}>
          Salvar dados da família
        </Button>
      </section>

      <div className="grid content-start gap-6">
        <section className="surface-card p-6">
          <h3 className="flex items-center gap-2 text-lg">
            <FileCheck2 className="size-4 text-primary" /> Verificação do responsável
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Antes de enviar propostas e negociar com cuidadoras, confirmamos a identidade de quem
            contrata. É o mesmo padrão exigido das profissionais.
          </p>
          <ul className="mt-4 grid gap-3">
            {documentosFamilia.map((doc) => {
              const enviado =
                (doc.id === "selfie" && biometriaEnviada) ||
                (doc.id === "documento" && docEnviado);
              const status = verificado ? "Aprovado" : enviado ? "Em análise" : "Pendente";
              return (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2.5"
                >
                  <p className="text-sm font-medium">{doc.nome}</p>
                  <Badge
                    variant={
                      status === "Aprovado"
                        ? "default"
                        : status === "Em análise"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {status}
                  </Badge>
                </li>
              );
            })}
          </ul>
          <EnvioDocumento onEnviado={() => setDocEnviado(true)} />
          <AnaliseIdentidade onEnviado={() => setBiometriaEnviada(true)} />
          <p className="mt-3 text-xs text-muted-foreground">
            Nada é reprovado automaticamente: cada envio fica salvo e passa por conferência manual da
            equipe CuideJá, conforme a LGPD.
          </p>
        </section>
      </div>
    </div>
  );
}
