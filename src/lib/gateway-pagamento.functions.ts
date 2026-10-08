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
      provedor: z.enum(["infinitepay"]),
      identificador: z.string().trim().transform((v) => v.replace(/^\$/, "")).pipe(z.string().min(2, "Informe o usuário da conta.").max(80).regex(/^[a-zA-Z0-9_.-]+$/, "Use apenas letras, números, ponto, hífen ou sublinhado.")),
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
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          handle: conta.identificador,
          order_nsu: `validacao-${crypto.randomUUID()}`,
          items: [{ quantity: 1, price: 100, description: "Validação de conta CuideJá" }],
        }),
      });
      const corpo: unknown = await r.json().catch(() => null);
      if (r.ok && corpo && typeof corpo === "object" && "url" in corpo && typeof corpo.url === "string") {
        const link = new URL(corpo.url);
        ok = link.protocol === "https:" && (link.hostname === "infinitepay.io" || link.hostname.endsWith(".infinitepay.io"));
      }
      mensagem = ok ? "Gateway gerou um link de R$ 1,00; nenhum pagamento foi efetuado. Titularidade não verificada." : `O gateway não validou a conta (${r.status}). Confira o usuário e tente novamente.`;
    } catch {
      mensagem = "Gateway indisponível ou resposta inválida. Tente novamente.";
    }

    const { error: erroSalvar } = await context.supabase.from("gateway_pagamento_contas").update({
      status: ok ? "validada" : "erro",
      mensagem,
      validado_em: new Date().toISOString(),
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
