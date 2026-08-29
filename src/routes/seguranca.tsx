import { createFileRoute } from "@tanstack/react-router";
import { ScanFace, ShieldCheck, FileSearch, Lock, RefreshCw } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/seguranca")({
  head: () => ({
    meta: [
      { title: "Verificação de antecedentes e LGPD | CuideJá" },
      {
        name: "description",
        content:
          "Como funciona a verificação automática de CPF, antecedentes criminais e identidade dos cuidadores, com consentimento LGPD.",
      },
      { property: "og:title", content: "Verificação de antecedentes e LGPD | CuideJá" },
      {
        property: "og:description",
        content:
          "Checagem em tempo real via provedores de background check e selo Perfil Verificado.",
      },
    ],
  }),
  component: SegurancaPage,
});

const etapas = [
  {
    icon: Lock,
    t: "1. Consentimento LGPD",
    d: "Antes de qualquer consulta, o profissional autoriza expressamente o tratamento dos dados, com finalidade, prazo e base legal registrados.",
  },
  {
    icon: ScanFace,
    t: "2. Validação de identidade",
    d: "Foto do documento oficial + selfie com prova de vida. A biometria confirma que a pessoa do cadastro é a titular do CPF.",
  },
  {
    icon: FileSearch,
    t: "3. Checagem em tempo real",
    d: "Integração com provedores de background check para CPF/situação cadastral, antecedentes criminais e mandados de prisão em aberto.",
  },
  {
    icon: ShieldCheck,
    t: "4. Selo Perfil Verificado",
    d: "Aprovado, o perfil recebe o selo com a data da checagem e a lista do que foi conferido — visível para a família.",
  },
  {
    icon: RefreshCw,
    t: "5. Recheck periódico",
    d: "A verificação é renovada a cada 12 meses ou antes, se houver denúncia. Selo expirado perde destaque nas buscas.",
  },
];

function SegurancaPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-5 py-16">
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          Confiança verificável
        </Badge>
        <h1 className="mt-5 text-4xl md:text-5xl">Como verificamos cada cuidador</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A triagem é automatizada por integração de API com empresas especializadas em background
          check. A família vê exatamente o que foi checado e quando.
        </p>

        <ol className="mt-12 space-y-5">
          {etapas.map((e) => (
            <li key={e.t} className="surface-card flex gap-4 p-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <e.icon className="size-5" />
              </span>
              <div>
                <h2 className="text-lg">{e.t}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{e.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-14">
          <h2 className="text-2xl">Limites do que verificamos</h2>
          <p className="mt-3 text-muted-foreground">
            O selo indica que as consultas disponíveis nas bases públicas e nos provedores parceiros
            não apontaram impedimentos na data da checagem. Ele não substitui a entrevista da
            família, nem garante desempenho profissional. Recomendamos sempre conversar com o
            profissional, pedir referências e formalizar o atendimento pela minuta da plataforma.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl">Seus dados</h2>
          <p className="mt-3 text-muted-foreground">
            Documentos e resultados de checagem são armazenados de forma criptografada, acessíveis
            apenas ao time de triagem. Nenhum documento é exibido às famílias — apenas o resultado
            resumido. O titular pode solicitar acesso, correção ou exclusão dos dados a qualquer
            momento pelo canal de privacidade.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
