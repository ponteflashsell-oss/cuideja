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
    const { lerDocumentoComIA, validarCpf, formatarCpf, consultarAntecedentes } = await import(
      "./verificacao.server"
    );

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("A análise automática não está configurada.");

    const leitura = await lerDocumentoComIA(data.selfie, data.documento, apiKey);
    const cpfValido = validarCpf(leitura.cpf);
    const antecedentes = await consultarAntecedentes(
      leitura.cpf,
      leitura.data_nascimento,
      leitura.nome,
      {
        provedor: process.env["ANTECEDENTES_PROVEDOR"],
        token: process.env["ANTECEDENTES_API_TOKEN"] ?? process.env["INFOSIMPLES_TOKEN"],
        url: process.env["ANTECEDENTES_API_URL"],
      },
    );


    let score = 0;
    if (leitura.documento_legivel) score += 25;
    if (cpfValido) score += 25;
    if (leitura.face_confere) score += 30;
    score += Math.round(Math.min(Math.max(leitura.confianca_face, 0), 1) * 10);
    if (antecedentes.status === "limpo") score += 10;

    const reprovado = !leitura.documento_legivel || !cpfValido || !leitura.face_confere;
    const status = reprovado
      ? "reprovado"
      : antecedentes.status === "com_apontamento"
        ? "em_analise"
        : "em_analise";

    const { error } = await context.supabase.from("verificacoes").insert({
      user_id: context.userId,
      status,
      nome_documento: leitura.nome,
      cpf: formatarCpf(leitura.cpf),
      data_nascimento: leitura.data_nascimento,
      tipo_documento: leitura.tipo_documento,
      cpf_valido: cpfValido,
      face_confere: leitura.face_confere,
      score,
      observacoes: leitura.observacoes,
      antecedentes_status: antecedentes.status,
      antecedentes_dados: antecedentes.dados as never,
    });
    if (error) {
      console.error("[verificacao] insert", error);
      throw new Error("Não conseguimos registrar a análise. Tente novamente.");
    }

    return {
      status,
      score,
      nome: leitura.nome,
      cpf: formatarCpf(leitura.cpf),
      tipoDocumento: leitura.tipo_documento,
      cpfValido,
      faceConfere: leitura.face_confere,
      documentoLegivel: leitura.documento_legivel,
      antecedentes: antecedentes.status,
      observacoes: leitura.observacoes,
    };
  });

export const obterUltimaVerificacao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("verificacoes")
      .select(
        "status, score, nome_documento, cpf, tipo_documento, cpf_valido, face_confere, antecedentes_status, observacoes, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  });
