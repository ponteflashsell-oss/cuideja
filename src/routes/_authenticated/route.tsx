import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const paraFamilia = location.pathname.startsWith("/painel-familia");
      throw redirect({ to: paraFamilia ? "/familia-entrar" : "/entrar" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
