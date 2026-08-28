import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEMO_EMAIL_CUIDADORA, DEMO_EMAIL_FAMILIA } from "@/lib/demo";

const mensagemInput = z.object({ mensagem: z.string().trim().min(1).max(500) });

async function participantesDemo(supabaseAdmin: any) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const familia = data.users.find((u: any) => u.email?.toLowerCase() === DEMO_EMAIL_FAMILIA);
  const cuidadora = data.users.find((u: any) => u.email?.toLowerCase() === DEMO_EMAIL_CUIDADORA);
  if (!familia || !cuidadora) throw new Error("Crie os perfis demo antes de usar o bate-papo.");
  return { familiaId: familia.id, cuidadoraId: cuidadora.id };
}

export const listarMensagensDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const participantes = await participantesDemo(supabaseAdmin);
    if (![participantes.familiaId, participantes.cuidadoraId].includes(context.userId)) {
      throw new Error("O bate-papo está disponível somente para os perfis demo.");
    }
    const { data, error } = await supabaseAdmin
      .from("mensagens_conversa")
      .select("id, remetente_id, mensagem, created_at")
      .eq("familia_id", participantes.familiaId)
      .eq("cuidadora_id", participantes.cuidadoraId)
      .order("created_at");
    if (error) throw error;
    return { ...participantes, mensagens: data ?? [] };
  });

export const enviarMensagemDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => mensagemInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const participantes = await participantesDemo(supabaseAdmin);
    if (![participantes.familiaId, participantes.cuidadoraId].includes(context.userId)) {
      throw new Error("O bate-papo está disponível somente para os perfis demo.");
    }
    const { data: criado, error } = await supabaseAdmin
      .from("mensagens_conversa")
      .insert({ ...participantes, remetente_id: context.userId, mensagem: data.mensagem })
      .select("id, remetente_id, mensagem, created_at")
      .single();
    if (error) throw error;
    return criado;
  });
