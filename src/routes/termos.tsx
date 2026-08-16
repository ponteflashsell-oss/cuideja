import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso e minuta de prestação de serviços | CuidaJá" },
      {
        name: "description",
        content:
          "Termos para famílias e profissionais autônomos e minuta padrão de prestação de serviços de cuidado, sem vínculo empregatício com a plataforma.",
      },
      { property: "og:title", content: "Termos de uso e minuta | CuidaJá" },
      {
        property: "og:description",
        content: "Documentação base da intermediação: famílias, profissionais e minuta padrão.",
      },
    ],
  }),
  component: TermosPage,
});

function Bloco({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl">{titulo}</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {itens.map((i) => (
          <li key={i} className="surface-card p-4">
            {i}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TermosPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-5 py-16">
        <h1 className="text-4xl md:text-5xl">Termos e documentos</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Modelos-base da plataforma. Este conteúdo é um resumo operacional para validação do
          produto e deve ser revisado por advogado antes da publicação definitiva.
        </p>

        <Tabs defaultValue="profissionais" className="mt-10">
          <TabsList>
            <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
            <TabsTrigger value="familias">Famílias</TabsTrigger>
            <TabsTrigger value="minuta">Minuta padrão</TabsTrigger>
          </TabsList>

          <TabsContent value="profissionais">
            <Bloco
              titulo="Termos de uso para profissionais autônomos"
              itens={[
                "Natureza da relação: a plataforma é intermediadora tecnológica. Não há vínculo empregatício, subordinação, exclusividade, controle de jornada ou obrigação de aceitar chamados.",
                "Autonomia: o profissional define livremente agenda, região de atuação, valores de diária e hora, e pode atuar em outras plataformas.",
                "Cadastro e veracidade: o profissional declara que as informações e documentos enviados são verdadeiros e autoriza a verificação de antecedentes.",
                "Remuneração: os valores são pactuados diretamente com a família; a plataforma retém taxa de intermediação sobre cada atendimento confirmado.",
                "Conduta: sigilo sobre a rotina da família, respeito ao plano de cuidados combinado e comunicação de qualquer intercorrência.",
                "Suspensão: perfis com denúncias graves, selo expirado ou documentação inconsistente podem ser suspensos até a apuração.",
              ]}
            />
          </TabsContent>

          <TabsContent value="familias">
            <Bloco
              titulo="Termos de uso para famílias"
              itens={[
                "Contratação direta: a família contrata o profissional autônomo. A plataforma não presta o serviço de cuidado e não responde pela execução.",
                "Triagem: o selo de verificação informa as checagens realizadas na data indicada e não substitui a avaliação própria da família.",
                "Pagamentos: valores, forma e periodicidade são acordados no perfil e no checkout, incluindo a taxa de intermediação.",
                "Cancelamentos: regras de aviso prévio e reembolso conforme a política exibida antes da confirmação.",
                "Uso adequado: é proibido pedir tarefas fora do plano de cuidados combinado ou tratar o profissional como empregado (jornada fixa imposta, subordinação, exclusividade).",
                "Assinatura premium: recursos opcionais como substituição prioritária, relatórios e histórico ampliado.",
              ]}
            />
          </TabsContent>

          <TabsContent value="minuta">
            <Bloco
              titulo="Minuta padrão de prestação de serviços"
              itens={[
                "Qualificação das partes: contratante (família/responsável) e contratado (cuidador autônomo, CPF e endereço).",
                "Objeto: prestação de serviços de cuidado descritos no plano combinado (higiene, alimentação, medicação sob orientação, acompanhamento).",
                "Prazo e regime: datas, turnos e local do atendimento, com natureza eventual ou por período determinado.",
                "Valor e pagamento: diária/hora, forma de pagamento, reembolso de despesas e prazo de quitação.",
                "Autonomia: ausência de subordinação, pessoalidade exclusiva e habitualidade caracterizadoras de vínculo.",
                "Obrigações e sigilo: deveres de cada parte, confidencialidade e comunicação de intercorrências.",
                "Rescisão: hipóteses de encerramento, aviso prévio e multa, se houver.",
                "Foro e aceite: eleição de foro e aceite eletrônico das duas partes, com data e registro na plataforma.",
              ]}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
