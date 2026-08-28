import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const imagem = z
  .string()
  .startsWith("data:image/")
  .max(9_000_000, "Imagem muito grande. Refaça a captura.");

export const analisarVerificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ selfie: imagem, documento: imagem }).parse(input))
  .handler(async ({ data, context }) => {
    const { dataUrlParaArquivo } = await import("./verificacao.server");

    // Envio único: só libera novo envio quando a última verificação foi reprovada.
    const { data: ultima } = await context.supabase
      .from("verificacoes")
      .select("status")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ultima && ultima.status !== "reprovado") {
      throw new Error("Você já enviou sua foto de verificação. Aguarde a conferência da equipe.");
    }

    const agora = Date.now();
    const enviarImagem = async (nome: string, dataUrl: string) => {
      const arquivo = dataUrlParaArquivo(dataUrl);
      const caminho = `${context.userId}/${agora}-${nome}.${arquivo.extensao}`;
      const { error } = await context.supabase.storage
        .from("verificacoes")
        .upload(caminho, arquivo.bytes, { contentType: arquivo.tipo, upsert: true });
      if (error) {
        console.error("[verificacao] upload", nome, error);
        return "";
      }
      return caminho;
    };
    const [selfiePath, documentoPath] = await Promise.all([
      enviarImagem("selfie", data.selfie),
      enviarImagem("documento", data.documento),
    ]);

    const status = "em_analise";
    const observacoes = "Aguardando conferência manual da equipe.";

    const { error } = await context.supabase.from("verificacoes").insert({
      user_id: context.userId,
      status,
      nome_documento: "",
      cpf: "",
      data_nascimento: "",
      tipo_documento: "outro",
      cpf_valido: false,
      face_confere: false,
      score: 0,
      observacoes,
      antecedentes_status: "nao_consultado",
      antecedentes_dados: null,
      selfie_path: selfiePath,
      documento_path: documentoPath,
      revisao_manual: true,
    });
    if (error) {
      console.error("[verificacao] insert", error);
      throw new Error("Não conseguimos registrar a análise. Tente novamente.");
    }

    return {
      status,
      score: 0,
      nome: "",
      cpf: "",
      tipoDocumento: "outro",
      cpfValido: false,
      faceConfere: false,
      documentoLegivel: false,
      antecedentes: "nao_consultado",
      observacoes,
      revisaoManual: true,
    };
  });

export const obterUltimaVerificacao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("verificacoes")
      .select(
        "status, score, nome_documento, cpf, tipo_documento, cpf_valido, face_confere, antecedentes_status, observacoes, revisao_manual, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  });
