import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

async function exigirAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("Acesso restrito à equipe administrativa.");
}

export const listarContasGateway = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);
    const { data, error } = await context.supabase
      .from("gateway_pagamento_contas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const salvarContaGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      provedor: z.enum(["veopag"]),
      identificador: z.string().trim().min(2, "Informe um nome para a conta.").max(80),
      titular: z.string().trim().max(120).optional(),
      documento: z.string().trim().max(20).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { error } = await context.supabase.from("gateway_pagamento_contas").insert({
      provedor: data.provedor,
      identificador: data.identificador,
      titular: data.titular || null,
      documento: data.documento || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const validarContaGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { data: conta, error } = await context.supabase
      .from("gateway_pagamento_contas").select("*").eq("id", data.id).maybeSingle();
    if (error || !conta) throw new Error("Conta não encontrada.");

    if (conta.provedor !== "veopag") return { ok: false, mensagem: "Esta conta não é Veopag. Cadastre a conta do gateway escolhido." };
    const ok = false;
    const mensagem = "Validação Veopag pendente: configure as credenciais no formulário seguro da integração. Nenhuma cobrança foi criada.";

    const { error: erroSalvar } = await context.supabase.from("gateway_pagamento_contas").update({
      status: "pendente_configuracao",
      mensagem,
      validado_em: null,
    }).eq("id", data.id);
    if (erroSalvar) return { ok: false, mensagem: "Não foi possível salvar o resultado da validação." };
    return { ok, mensagem };
  });

export const excluirContaGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { error } = await context.supabase.from("gateway_pagamento_contas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
