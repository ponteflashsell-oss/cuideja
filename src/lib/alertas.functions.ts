import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idsValidator = z.object({ contratoIds: z.array(z.string().uuid()).max(100) });

export const dispararAlertaPlantao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ contratoId: z.string().uuid(), mensagem: z.string().trim().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: contrato, error: erroContrato } = await context.supabase
      .from("contratos")
      .select("id, cuidadora_id, status")
      .eq("id", data.contratoId)
      .maybeSingle();
    if (erroContrato) throw erroContrato;
    if (!contrato || contrato.cuidadora_id !== context.userId || contrato.status !== "ativo") {
      throw new Error("Alerta disponível apenas para a cuidadora de um plantão ativo.");
    }

    const { data: alerta, error } = await (context.supabase as any)
      .from("alertas_plantao")
      .insert({ contrato_id: data.contratoId, criado_por: context.userId, mensagem: data.mensagem })
      .select("id, created_at")
      .single();
    if (error) throw error;
    return alerta;
  });

export const listarAlertasPlantao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idsValidator.parse(input))
  .handler(async ({ data, context }) => {
    if (!data.contratoIds.length) return [];
    const { data: alertas, error } = await (context.supabase as any)
      .from("alertas_plantao")
      .select("id, contrato_id, mensagem, created_at")
      .in("contrato_id", data.contratoIds)
      .is("lido_em", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return alertas ?? [];
  });

export const marcarAlertaPlantaoLido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ alertaId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("alertas_plantao")
      .update({ lido_em: new Date().toISOString() })
      .eq("id", data.alertaId);
    if (error) throw error;
    return { ok: true };
  });
