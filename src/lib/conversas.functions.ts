import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

export const iniciarConversa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ cuidadoraId: uuid, assunto: z.string().trim().max(200).default("") }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: cuidadora, error: erroPerfil } = await context.supabase
      .from("profiles")
      .select("id, tipo, verificado")
      .eq("id", data.cuidadoraId)
      .maybeSingle();
    if (erroPerfil) throw erroPerfil;
    if (!cuidadora || cuidadora.tipo !== "cuidadora" || !cuidadora.verificado) throw new Error("Cuidadora não encontrada ou não verificada.");
    const { data: conversa, error } = await context.supabase
      .from("conversas")
      .upsert({ familia_id: context.userId, cuidadora_id: data.cuidadoraId, assunto: data.assunto }, { onConflict: "familia_id,cuidadora_id" })
      .select("*")
      .single();
    if (error) throw error;
    return conversa;
  });

export const minhasConversas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("conversas")
      .select("*, familia:profiles!conversas_familia_id_fkey(nome), cuidadora:profiles!conversas_cuidadora_id_fkey(nome)")
      .or(`familia_id.eq.${context.userId},cuidadora_id.eq.${context.userId}`)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listarMensagens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ conversaId: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: conversa } = await context.supabase.from("conversas").select("id").eq("id", data.conversaId).or(`familia_id.eq.${context.userId},cuidadora_id.eq.${context.userId}`).maybeSingle();
    if (!conversa) throw new Error("Conversa não encontrada.");
    const { data: mensagens, error } = await context.supabase.from("mensagens").select("id, remetente_id, mensagem, created_at").eq("conversa_id", data.conversaId).order("created_at");
    if (error) throw error;
    return mensagens ?? [];
  });

export const enviarMensagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ conversaId: uuid, mensagem: z.string().trim().min(1).max(2000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: conversa } = await context.supabase.from("conversas").select("id").eq("id", data.conversaId).or(`familia_id.eq.${context.userId},cuidadora_id.eq.${context.userId}`).maybeSingle();
    if (!conversa) throw new Error("Conversa não encontrada.");
    const { data: criada, error } = await context.supabase.from("mensagens").insert({ conversa_id: data.conversaId, remetente_id: context.userId, mensagem: data.mensagem }).select("id, remetente_id, mensagem, created_at").single();
    if (error) throw error;
    return criada;
  });
