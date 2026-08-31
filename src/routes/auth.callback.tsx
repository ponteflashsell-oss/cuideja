import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Conectando... | CuideJá" },
      { name: "description", content: "Redirecionando após login social." },
      { property: "og:title", content: "Conectando... | CuideJá" },
      { property: "og:description", content: "Redirecionando após login social." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const redirecionar = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setErro("Não foi possível confirmar o login. Tente entrar novamente.");
        return;
      }

      const { data: perfil } = await supabase
        .from("profiles")
        .select("tipo")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (perfil?.tipo === "familia") {
        navigate({ to: "/painel-familia", replace: true });
      } else if (perfil?.tipo === "cuidadora") {
        navigate({ to: "/painel-cuidadora", replace: true });
      } else {
        navigate({ to: "/entrar", replace: true });
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        if (timeout) clearTimeout(timeout);
        void redirecionar();
      }
    });

    timeout = setTimeout(() => {
      sub.subscription.unsubscribe();
      void redirecionar();
    }, 2500);

    return () => {
      sub.subscription.unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, [navigate]);

  if (erro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <p className="text-red-500">{erro}</p>
        <Link to="/entrar" className="mt-4 text-primary underline">
          Voltar para entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">Conectando sua conta...</p>
    </div>
  );
}
