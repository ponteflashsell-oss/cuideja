import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AcessoCpf } from "@/components/auth/AcessoCpf";
import { renovarSessaoDemo } from "@/lib/demo.functions";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar no painel da cuidadora | CuideJá" },
      {
        name: "description",
        content:
          "Área exclusiva das cuidadoras CuideJá: acesse com CPF e senha para gerenciar perfil, vagas, agenda e ganhos.",
      },
      { property: "og:title", content: "Entrar no painel da cuidadora | CuideJá" },
      {
        property: "og:description",
        content: "Acesse com CPF e senha para gerenciar perfil, candidaturas, agenda e pagamentos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();

  const acessarPainel = async () => {
    try {
      await renovarSessaoDemo({ data: undefined });
    } catch (erro) {
      console.error("[demo] não foi possível renovar a sessão", erro);
    }
    navigate({ to: "/painel-cuidadora", replace: true });
  };

  return (
    <AcessoCpf
      tipo="cuidadora"
      titulo="Área da cuidadora"
      descricao="Espaço privado para gerenciar seu perfil, vagas, agenda e ganhos. Acesso apenas com CPF e senha."
      aoAutenticar={acessarPainel}
      rodape={
        <>
          Busca uma cuidadora?{" "}
          <Link to="/familia-entrar" className="underline">
            Entrar na área da família
          </Link>
        </>
      }
    />
  );
}
