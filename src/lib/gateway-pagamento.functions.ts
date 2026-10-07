import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function exigirAdmin(context: { supabase: any; userId: string }) {
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
      provedor: z.enum(["infinitepay"]),
      identificador: z.string().trim().min(2, "Informe o usuário (handle) da conta.").max(80).regex(/^[a-zA-Z0-9_.-]+$/, "Use apenas letras, números, ponto, hífen ou sublinhado."),
      titular: z.string().trim().max(120).optional(),
      documento: z.string().trim().max(20).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { error } = await context.supabase.from("gateway_pagamento_contas").insert({
      provedor: data.provedor,
      identificador: data.identificador.replace(/^\$/, ""),
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

    let ok = false;
    let mensagem = "";
    try {
      const r = await fetch("https://api.checkout.infinitepay.io/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: conta.identificador,
          order_nsu: `validacao-${crypto.randomUUID()}`,
          items: [{ quantity: 1, price: 100, description: "Validação de conta CuideJá" }],
        }),
      });
      const corpo = (await r.json().catch(() => ({}))) as { url?: string; message?: string };
      ok = r.ok && typeof corpo.url === "string";
      mensagem = ok ? "Conta respondeu e gerou cobrança de teste." : `Recusada pelo gateway (${r.status})${corpo.message ? `: ${corpo.message}` : ""}.`;
    } catch (e) {
      mensagem = e instanceof Error ? e.message : "Gateway indisponível.";
    }

    await context.supabase.from("gateway_pagamento_contas").update({
      status: ok ? "validada" : "erro",
      mensagem,
      validado_em: new Date().toISOString(),
    }).eq("id", data.id);
    return { ok, mensagem };
  });

export const ativarContaGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { data: conta } = await context.supabase
      .from("gateway_pagamento_contas").select("status").eq("id", data.id).maybeSingle();
    if (conta?.status !== "validada") throw new Error("Valide a conta antes de ativá-la.");
    await context.supabase.from("gateway_pagamento_contas").update({ ativo: false }).neq("id", data.id);
    const { error } = await context.supabase.from("gateway_pagamento_contas").update({ ativo: true }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
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
