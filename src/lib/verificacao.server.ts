/** Helpers server-only da verificação de identidade (OCR + CPF + antecedentes). */

export type LeituraDocumento = {
  nome: string;
  cpf: string;
  data_nascimento: string;
  tipo_documento: string;
  documento_legivel: boolean;
  face_confere: boolean;
  confianca_face: number;
  observacoes: string;
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function validarCpf(valor: string): boolean {
  const cpf = valor.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return (
    digito(cpf.slice(0, 9), 10) === Number(cpf[9]) &&
    digito(cpf.slice(0, 10), 11) === Number(cpf[10])
  );
}

export function formatarCpf(valor: string): string {
  const cpf = valor.replace(/\D/g, "");
  return cpf.length === 11 ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : cpf;
}

/** OCR do documento + comparação facial com a selfie, via IA do Lovable. */
export async function lerDocumentoComIA(
  selfie: string,
  documento: string,
  apiKey: string,
): Promise<LeituraDocumento> {
  const resposta = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        {
          role: "system",
          content:
            "Você analisa documentos de identidade brasileiros (RG/CNH) para verificação antifraude. Responda SOMENTE com JSON válido, sem texto extra.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `A primeira imagem é uma selfie ao vivo e a segunda é o documento com foto.
Responda no formato:
{"nome":"","cpf":"","data_nascimento":"","tipo_documento":"RG|CNH|outro","documento_legivel":true,"face_confere":true,"confianca_face":0.0,"observacoes":""}
Regras: cpf apenas dígitos; data_nascimento em DD/MM/AAAA; face_confere true só se a pessoa da selfie for a mesma da foto do documento; observacoes curtas em português citando sinais de fraude, reflexo, corte ou má qualidade.`,
            },
            { type: "image_url", image_url: { url: selfie } },
            { type: "image_url", image_url: { url: documento } },
          ],
        },
      ],
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    console.error("[verificacao] gateway", resposta.status, detalhe);
    if (resposta.status === 429) throw new Error("Muitas análises ao mesmo tempo. Tente em 1 minuto.");
    if (resposta.status === 402 || resposta.status === 403)
      throw new Error("A análise automática está temporariamente indisponível.");
    throw new Error("Não conseguimos analisar as imagens agora.");
  }

  const json = (await resposta.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const bruto = json.choices?.[0]?.message?.content ?? "";
  const recorte = bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1);
  let dados: Partial<LeituraDocumento> = {};
  try {
    dados = JSON.parse(recorte) as Partial<LeituraDocumento>;
  } catch {
    throw new Error("A leitura do documento falhou. Refaça as fotos com mais luz.");
  }

  return {
    nome: String(dados.nome ?? "").slice(0, 120),
    cpf: String(dados.cpf ?? "").replace(/\D/g, "").slice(0, 11),
    data_nascimento: String(dados.data_nascimento ?? "").slice(0, 10),
    tipo_documento: String(dados.tipo_documento ?? "outro").slice(0, 20),
    documento_legivel: Boolean(dados.documento_legivel),
    face_confere: Boolean(dados.face_confere),
    confianca_face: Number(dados.confianca_face ?? 0),
    observacoes: String(dados.observacoes ?? "").slice(0, 400),
  };
}

export type ResultadoAntecedentes = {
  status: "nao_consultado" | "limpo" | "com_apontamento" | "erro";
  dados: unknown;
  fonte: string;
};

export type ConfigAntecedentes = {
  /** "sinic" (CAC/SINIC2), "infosimples" ou vazio (sem consulta automática). */
  provedor: string | undefined;
  token: string | undefined;
  /** URL do endpoint SINIC2/CAC do convênio (só para provedor "sinic"). */
  url: string | undefined;
};

function classificar(texto: string): "limpo" | "com_apontamento" {
  const t = texto.toLowerCase();
  const limpo =
    t.includes("nada consta") ||
    t.includes("nao consta") ||
    t.includes("não consta") ||
    t.includes("negativa");
  return limpo ? "limpo" : "com_apontamento";
}

/**
 * Consulta a Certidão de Antecedentes Criminais.
 *
 * - provedor "sinic": chama o endpoint CAC/SINIC2 do convênio (Polícia Federal),
 *   informado em ANTECEDENTES_API_URL, com token Bearer.
 * - provedor "infosimples": usa a consulta de antecedentes criminais da Infosimples.
 * - sem configuração: a etapa fica pendente para revisão humana.
 */
export async function consultarAntecedentes(
  cpf: string,
  nascimento: string,
  nome: string,
  config: ConfigAntecedentes,
): Promise<ResultadoAntecedentes> {
  const provedor = (config.provedor ?? (config.token ? "infosimples" : "")).toLowerCase();
  if (!provedor || !config.token) {
    return { status: "nao_consultado", dados: null, fonte: provedor || "revisao_humana" };
  }

  try {
    if (provedor === "sinic") {
      if (!config.url) return { status: "nao_consultado", dados: null, fonte: "sinic" };
      const resposta = await fetch(config.url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ cpf, nome, data_nascimento: nascimento }),
      });
      const json = (await resposta.json()) as unknown;
      if (!resposta.ok) return { status: "erro", dados: json, fonte: "sinic" };
      return { status: classificar(JSON.stringify(json)), dados: json, fonte: "sinic" };
    }

    const corpo = new URLSearchParams({
      token: config.token,
      timeout: "300",
      cpf,
      nome,
      birthdate: nascimento,
    });
    const resposta = await fetch(
      "https://api.infosimples.com/api/v2/consultas/policia-federal/antecedentes-criminais",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: corpo,
      },
    );
    const json = (await resposta.json()) as { code?: number; data?: unknown };
    if (json.code !== 200) return { status: "erro", dados: json, fonte: "infosimples" };
    return {
      status: classificar(JSON.stringify(json.data ?? {})),
      dados: json.data ?? null,
      fonte: "infosimples",
    };
  } catch (erro) {
    console.error("[verificacao] antecedentes", provedor, erro);
    return { status: "erro", dados: null, fonte: provedor };
  }
}

