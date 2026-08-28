import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEMO_EMAIL_CUIDADORA, DEMO_EMAIL_FAMILIA, DEMO_SENHA } from "@/lib/demo";

export const renovarSessaoDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: usuario, error } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (error) throw error;
    const email = usuario.user?.email?.toLowerCase();
    if (email !== DEMO_EMAIL_FAMILIA && email !== DEMO_EMAIL_CUIDADORA) {
      return { demo: false, renovada: false };
    }

    const expiraEm = usuario.user.user_metadata?.demo_password_expires_at;
    const expirou = typeof expiraEm === "string" && new Date(expiraEm).getTime() <= Date.now();
    if (!expirou) return { demo: true, renovada: false };

    const novaExpiracao = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: erroAtualizacao } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: DEMO_SENHA,
      user_metadata: { ...usuario.user.user_metadata, demo_password_expires_at: novaExpiracao },
    });
    if (erroAtualizacao) throw erroAtualizacao;

    const { data: demoUsuarios } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const ids = (demoUsuarios?.users ?? [])
      .filter((item) => [DEMO_EMAIL_FAMILIA, DEMO_EMAIL_CUIDADORA].includes(item.email?.toLowerCase() ?? ""))
      .map((item) => item.id);
    if (ids.length) {
      await (supabaseAdmin as any).from("alertas_plantao").delete().in("criado_por", ids);
    }
    return { demo: true, renovada: true, novaExpiracao };
  });
