import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Coins, IdCard, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { especialidades } from "@/data/caregivers";

export const Route = createFileRoute("/para-profissionais")({
  head: () => ({
    meta: [
      { title: "Cadastro de cuidadores autônomos | CuidaJá" },
      {
        name: "description",
        content:
          "Cadastre-se como cuidador autônomo: você define agenda e preços, envia documentos uma vez e recebe o selo de perfil verificado.",
      },
      { property: "og:title", content: "Cadastro de cuidadores autônomos | CuidaJá" },
      {
        property: "og:description",
        content: "Liberdade de agenda e preços, com verificação que gera confiança nas famílias.",
      },
    ],
  }),
  component: ProfissionaisPage,
});

const cadastroSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  cidade: z.string().trim().min(2, "Informe sua cidade").max(80),
  cpf: z
    .string()
    .trim()
    .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  especialidade: z.string().trim().min(1, "Selecione uma especialidade"),
  diaria: z.coerce.number().min(50, "Valor mínimo R$ 50").max(2000),
  apresentacao: z.string().trim().min(20, "Conte um pouco da sua experiência").max(600),
  consentimento: z.literal(true, { errorMap: () => ({ message: "É necessário consentir" }) }),
});

function ProfissionaisPage() {
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = cadastroSchema.safeParse({
      nome: fd.get("nome"),
      email: fd.get("email"),
      telefone: fd.get("telefone"),
      cidade: fd.get("cidade"),
      cpf: fd.get("cpf"),
      especialidade: fd.get("especialidade"),
      diaria: fd.get("diaria"),
      apresentacao: fd.get("apresentacao"),
      consentimento: fd.get("consentimento") === "on",
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErros(next);
      toast.error("Revise os campos destacados.");
      return;
    }
    setErros({});
    setEnviado(true);
    toast.success("Cadastro recebido! A triagem de documentos é o próximo passo.");
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="hero-veil border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h1 className="max-w-3xl text-4xl md:text-5xl">
              Sua autonomia, com a confiança que as famílias procuram.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              No CuidaJá você é profissional autônomo: define agenda, preços, região e quais
              atendimentos aceita. Nós cuidamos da vitrine, da triagem e dos documentos.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-4">
              {[
                { icon: CalendarClock, t: "Agenda livre", d: "Você aceita só o que couber na sua rotina." },
                { icon: Coins, t: "Preço seu", d: "Defina diária e valor/hora sem tabela imposta." },
                { icon: ShieldCheck, t: "Selo verificado", d: "Mais visualizações e menos desconfiança." },
                { icon: Sparkles, t: "Destaque opcional", d: "Apareça no topo das buscas da sua cidade." },
              ].map((b) => (
                <div key={b.t} className="surface-card p-6">
                  <b.icon className="size-6 text-primary" />
                  <h2 className="mt-4 text-lg">{b.t}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{b.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="text-3xl">Cadastro simplificado</h2>
            <p className="mt-2 text-muted-foreground">
              Leva 5 minutos. Depois enviamos o link seguro para foto do documento e selfie.
            </p>

            {enviado ? (
              <div className="surface-card mt-8 p-8">
                <ShieldCheck className="size-7 text-primary" />
                <h3 className="mt-4 text-xl">Cadastro recebido</h3>
                <p className="mt-2 text-muted-foreground">
                  Você receberá um e-mail com o link para envio de documentos. Após a checagem de
                  CPF e antecedentes, seu perfil recebe o selo verificado.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setEnviado(false)}>
                  Fazer outro cadastro
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="surface-card mt-8 grid gap-5 p-6 md:grid-cols-2">
                <Field label="Nome completo" name="nome" erro={erros["nome"]} />
                <Field label="E-mail" name="email" type="email" erro={erros["email"]} />
                <Field label="Telefone / WhatsApp" name="telefone" erro={erros["telefone"]} />
                <Field label="Cidade" name="cidade" erro={erros["cidade"]} />
                <Field label="CPF" name="cpf" erro={erros["cpf"]} />
                <div className="grid gap-2">
                  <Label htmlFor="especialidade">Especialidade principal</Label>
                  <select
                    id="especialidade"
                    name="especialidade"
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    defaultValue=""
                  >
                    <option value="">Selecione</option>
                    {especialidades.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {erros["especialidade"] && (
                    <p className="text-xs text-destructive">{erros["especialidade"]}</p>
                  )}
                </div>
                <Field label="Diária desejada (R$)" name="diaria" type="number" erro={erros["diaria"]} />
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="apresentacao">Sua apresentação</Label>
                  <Textarea
                    id="apresentacao"
                    name="apresentacao"
                    rows={4}
                    maxLength={600}
                    placeholder="Experiências, cursos e tipos de cuidado que você domina."
                  />
                  {erros["apresentacao"] && (
                    <p className="text-xs text-destructive">{erros["apresentacao"]}</p>
                  )}
                </div>
                <label className="flex items-start gap-3 text-sm md:col-span-2">
                  <Checkbox id="consentimento" name="consentimento" className="mt-0.5" />
                  <span className="text-muted-foreground">
                    Autorizo, conforme a LGPD, a consulta dos meus dados de CPF, antecedentes
                    criminais e validação de identidade para fins de verificação do perfil, e declaro
                    atuar como profissional autônomo, sem vínculo empregatício com a plataforma.
                  </span>
                </label>
                {erros["consentimento"] && (
                  <p className="text-xs text-destructive md:col-span-2">{erros["consentimento"]}</p>
                )}
                <Button type="submit" size="lg" className="md:col-span-2">
                  Enviar cadastro
                </Button>
              </form>
            )}
          </div>

          <aside className="surface-card h-fit p-6">
            <IdCard className="size-6 text-primary" />
            <h2 className="mt-4 text-xl">Documentos da triagem</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>Documento oficial com foto (RG ou CNH)</li>
              <li>Selfie para conferência biométrica</li>
              <li>Comprovante de residência</li>
              <li>Certificados de cursos (opcional, aumenta a conversão)</li>
            </ul>
            <h3 className="mt-6 text-base font-semibold">Custos</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cadastro gratuito. A plataforma cobra taxa de intermediação por atendimento fechado, e
              a verificação/destaque é opcional.
            </p>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  erro,
}: {
  label: string;
  name: string;
  type?: string;
  erro?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} maxLength={255} />
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
