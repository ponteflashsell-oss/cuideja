import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function exigirAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Acesso restrito à equipe administrativa.");
}

export const souAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: Boolean(data) };
  });

export const listarCadastros = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);

    const { data: perfis, error } = await context.supabase
      .from("profiles")
      .select(
        "id, tipo, nome, cidade, bairros, bio, especialidades, tarifa_hora, tarifa_diaria, tarifa_plantao12, tarifa_plantao24, verificado, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os cadastros.");

    const { data: verificacoes } = await context.supabase
      .from("verificacoes")
      .select("user_id, status, score, revisao_manual, created_at")
      .order("created_at", { ascending: false });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const emails = new Map<string, string>();
    try {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
      for (const u of users?.users ?? []) if (u.email) emails.set(u.id, u.email);
    } catch (erro) {
      console.error("[admin] listUsers", erro);
    }

    const ultima = new Map<string, { status: string; score: number; revisao_manual: boolean }>();
    for (const v of verificacoes ?? []) if (!ultima.has(v.user_id)) ultima.set(v.user_id, v);

    return (perfis ?? []).map((p) => ({
      ...p,
      email: emails.get(p.id) ?? "",
      verificacao: ultima.get(p.id) ?? null,
    }));
  });

export const listarVerificacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);
    const { data, error } = await context.supabase
      .from("verificacoes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error("Não foi possível carregar as verificações.");
    return data ?? [];
  });

export const imagensVerificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ selfiePath: z.string(), documentoPath: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const assinar = async (caminho: string) => {
      if (!caminho) return "";
      const { data: url } = await supabaseAdmin.storage
        .from("verificacoes")
        .createSignedUrl(caminho, 600);
      return url?.signedUrl ?? "";
    };
    return {
      selfie: await assinar(data.selfiePath),
      documento: await assinar(data.documentoPath),
    };
  });

export const decidirVerificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        verificacaoId: z.string().uuid(),
        userId: z.string().uuid(),
        decisao: z.enum(["aprovado", "reprovado", "em_analise"]),
        observacoes: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);

    const atualizacao: Record<string, unknown> = {
      status: data.decisao,
      revisao_manual: false,
    };
    if (data.observacoes !== undefined) atualizacao["observacoes"] = data.observacoes;

    const { error } = await context.supabase
      .from("verificacoes")
      .update(atualizacao)
      .eq("id", data.verificacaoId);
    if (error) throw new Error("Não foi possível salvar a decisão.");

    const { error: erroPerfil } = await context.supabase
      .from("profiles")
      .update({ verificado: data.decisao === "aprovado" })
      .eq("id", data.userId);
    if (erroPerfil) throw new Error("Não foi possível atualizar o perfil.");

    return { ok: true };
  });

export const definirVerificado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), verificado: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({ verificado: data.verificado })
      .eq("id", data.userId);
    if (error) throw new Error("Não foi possível atualizar o perfil.");
    return { ok: true };
  });
