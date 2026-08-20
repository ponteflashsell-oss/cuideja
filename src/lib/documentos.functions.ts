import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Registra na nuvem um documento já enviado ao armazenamento privado. */
export const registrarDocumento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        caminho: z.string().min(3).max(400),
        nomeArquivo: z.string().max(200).default(""),
        tipo: z.string().max(60).default("documento_oficial"),
        mime: z.string().max(120).default(""),
        tamanho: z.number().int().nonnegative().default(0),
        origem: z.enum(["camera", "upload"]).default("upload"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!data.caminho.startsWith(`${context.userId}/`)) {
      throw new Error("Caminho de arquivo inválido.");
    }
    const { data: existente } = await context.supabase
      .from("documentos")
      .select("id")
      .eq("user_id", context.userId)
      .eq("tipo", data.tipo)
      .limit(1)
      .maybeSingle();
    if (existente) {
      // Reenvio liberado apenas quando a última verificação foi reprovada.
      const { data: ultima } = await context.supabase
        .from("verificacoes")
        .select("status")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!ultima || ultima.status !== "reprovado") {
        throw new Error("Você já enviou este documento. A equipe está conferindo.");
      }
    }
    const { error } = await context.supabase.from("documentos").insert({
      user_id: context.userId,
      caminho: data.caminho,
      nome_arquivo: data.nomeArquivo,
      tipo: data.tipo,
      mime: data.mime,
      tamanho: data.tamanho,
      origem: data.origem,
    });
    if (error) throw new Error("Não foi possível registrar o documento.");
    return { ok: true };
  });

export const listarMeusDocumentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("documentos")
      .select("id, tipo, nome_arquivo, mime, tamanho, origem, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Não foi possível carregar seus documentos.");
    return data ?? [];
  });
