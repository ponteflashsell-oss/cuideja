import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AcessoCpf } from "@/components/auth/AcessoCpf";
import { supabase } from "@/integrations/supabase/client";
import { renovarSessaoDemo } from "@/lib/demo.functions";

export const Route = createFileRoute("/familia-entrar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar na área da família | CuideJá" },
      {
        name: "description",
        content:
          "Área das famílias CuideJá: acesse com CPF e senha para buscar cuidadoras verificadas, publicar pedidos e combinar plantões.",
      },
      { property: "og:title", content: "Entrar na área da família | CuideJá" },
      {
        property: "og:description",
        content: "Acesse com CPF e senha para encontrar cuidadoras verificadas e organizar os cuidados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FamiliaEntrarPage,
});

/** Define o painel correto sem alterar o papel de uma conta existente. */
async function destinoDaSessao() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return "/familia-entrar" as const;
  try {
    await renovarSessaoDemo({ data: undefined });
  } catch (erro) {
    console.error("[demo] não foi possível renovar a sessão", erro);
  }
  const [{ data: perfil }, { data: papelAdmin }] = await Promise.all([
    supabase.from("profiles").select("tipo").eq("id", auth.user.id).maybeSingle(),
    supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", auth.user.id)
      .eq("role", "admin")
      .maybeSingle(),
  ]);
  if (papelAdmin) return "/painel-familia" as const;
  return perfil?.tipo === "cuidadora" ? ("/painel-cuidadora" as const) : ("/painel-familia" as const);
}

function FamiliaEntrarPage() {
  const navigate = useNavigate();

  const seguir = async () => {
    try {
      navigate({ to: await destinoDaSessao(), replace: true });
    } catch (erro) {
      console.error("[login] não foi possível redirecionar", erro);
      toast.error("Não foi possível abrir o painel. Tente atualizar a página.");
    }
  };

  return (
    <AcessoCpf
      tipo="familia"
      titulo="Área da família"
      descricao={
        <>
          Para quem <strong>busca cuidadora</strong>: acesse com CPF e senha, descreva a necessidade e
          combine os plantões com segurança.
        </>
      }
      aoAutenticar={seguir}
      rodape={
        <>
          É cuidadora?{" "}
          <Link to="/entrar" className="underline">
            Entrar na área profissional
          </Link>
        </>
      }
    />
  );
}
