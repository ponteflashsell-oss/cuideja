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
    const {
      lerDocumentoComIA,
      validarCpf,
      formatarCpf,
      consultarAntecedentes,
      dataUrlParaArquivo,
    } = await import("./verificacao.server");

    const apiKey = process.env["LOVABLE_API_KEY"];

    // 1) Guarda as imagens sempre — mesmo se a leitura automática falhar,
    //    a equipe consegue conferir manualmente.
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

    // 2) Leitura automática — falha aqui não descarta o envio.
    let leitura = {
      nome: "",
      cpf: "",
      data_nascimento: "",
      tipo_documento: "outro",
      documento_legivel: false,
      face_confere: false,
      confianca_face: 0,
      observacoes: "",
    };
    let falhaLeitura = "";
    if (!apiKey) {
      falhaLeitura = "Leitura automática não configurada.";
    } else {
      try {
        leitura = await lerDocumentoComIA(data.selfie, data.documento, apiKey);
      } catch (erro) {
        falhaLeitura = erro instanceof Error ? erro.message : "Falha na leitura automática.";
        console.error("[verificacao] leitura", erro);
      }
    }

    const cpfValido = validarCpf(leitura.cpf);
    const antecedentes = cpfValido
      ? await consultarAntecedentes(leitura.cpf, leitura.data_nascimento, leitura.nome, {
          provedor: process.env["ANTECEDENTES_PROVEDOR"],
          token: process.env["ANTECEDENTES_API_TOKEN"] ?? process.env["INFOSIMPLES_TOKEN"],
          url: process.env["ANTECEDENTES_API_URL"],
        })
      : { status: "nao_consultado" as const, dados: null, fonte: "revisao_humana" };

    let score = 0;
    if (leitura.documento_legivel) score += 25;
    if (cpfValido) score += 25;
    if (leitura.face_confere) score += 30;
    score += Math.round(Math.min(Math.max(leitura.confianca_face, 0), 1) * 10);
    if (antecedentes.status === "limpo") score += 10;

    // Nada é reprovado automaticamente: o que a IA não confirmou vai para fila manual.
    const revisaoManual =
      Boolean(falhaLeitura) ||
      !leitura.documento_legivel ||
      !cpfValido ||
      !leitura.face_confere ||
      antecedentes.status !== "limpo";
    const status = "em_analise";

    const observacoes = [falhaLeitura, leitura.observacoes]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 400);

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
      observacoes,
      antecedentes_status: antecedentes.status,
      antecedentes_dados: antecedentes.dados as never,
      selfie_path: selfiePath,
      documento_path: documentoPath,
      revisao_manual: revisaoManual,
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
      observacoes,
      revisaoManual,
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
