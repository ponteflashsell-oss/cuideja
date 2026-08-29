const BUCKET = "gateway";
const ARQUIVO = "conexoes.json";

export const TABELAS_ESPELHAVEIS = [
  "profiles",
  "user_roles",
  "verificacoes",
  "documentos",
  "alertas_plantao",
  "propostas",
  "conversas",
  "mensagens",
  "mensagens_conversa",
  "contratos",
  "admin_auditoria",
] as const;

export type Conexao = {
  id: string;
  nome: string;
  url: string;
  chave: string;
  ativo: boolean;
  status: "nao_testado" | "ok" | "erro";
  mensagem: string | null;
  ultimoTesteEm: string | null;
  criadoEm: string;
};

export type ConexaoPublica = Omit<Conexao, "chave"> & { chaveMascarada: string };

export const mascarar = (chave: string) =>
  chave.length <= 10 ? "•••" : `${chave.slice(0, 6)}…${chave.slice(-4)}`;

export const publicar = (c: Conexao): ConexaoPublica => {
  const { chave, ...resto } = c;
  return { ...resto, chaveMascarada: mascarar(chave) };
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function garantirBucket() {
  const sb = await admin();
  const { data } = await sb.storage.listBuckets();
  if (!(data ?? []).some((b) => b.name === BUCKET)) {
    await sb.storage.createBucket(BUCKET, { public: false });
  }
}

export async function lerConexoes(): Promise<Conexao[]> {
  const sb = await admin();
  const { data, error } = await sb.storage.from(BUCKET).download(ARQUIVO);
  if (error || !data) return [];
  try {
    const json = JSON.parse(await data.text());
    return Array.isArray(json) ? (json as Conexao[]) : [];
  } catch {
    return [];
  }
}

export async function gravarConexoes(conexoes: Conexao[]) {
  await garantirBucket();
  const sb = await admin();
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(ARQUIVO, new Blob([JSON.stringify(conexoes, null, 2)], { type: "application/json" }), {
      upsert: true,
      contentType: "application/json",
    });
  if (error) throw new Error("Não foi possível salvar a configuração do gateway.");
}

const cabecalhos = (chave: string) => ({
  apikey: chave,
  Authorization: `Bearer ${chave}`,
  "Content-Type": "application/json",
});

export async function pingar(url: string, chave: string) {
  const base = url.replace(/\/$/, "");
  try {
    const resposta = await fetch(`${base}/rest/v1/?apikey=${encodeURIComponent(chave)}`, {
      headers: cabecalhos(chave),
    });
    if (!resposta.ok) {
      return { ok: false as const, mensagem: `Resposta ${resposta.status} do banco informado.` };
    }
    return { ok: true as const, mensagem: "Conexão respondeu normalmente." };
  } catch (erro) {
    return {
      ok: false as const,
      mensagem: erro instanceof Error ? erro.message : "Falha de rede ao contatar o banco.",
    };
  }
}

export async function espelharTabelas(conexao: Conexao, tabelas: readonly string[]) {
  const sb = await admin();
  const base = conexao.url.replace(/\/$/, "");
  const relatorio: { tabela: string; enviados: number; erro: string | null }[] = [];

  for (const tabela of tabelas) {
    const { data, error } = await sb.from(tabela as never).select("*").limit(1000);
    if (error) {
      relatorio.push({ tabela, enviados: 0, erro: `Leitura local: ${error.message}` });
      continue;
    }
    const linhas = data ?? [];
    if (linhas.length === 0) {
      relatorio.push({ tabela, enviados: 0, erro: null });
      continue;
    }
    const resposta = await fetch(`${base}/rest/v1/${tabela}?on_conflict=id`, {
      method: "POST",
      headers: { ...cabecalhos(conexao.chave), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(linhas),
    });
    relatorio.push({
      tabela,
      enviados: resposta.ok ? linhas.length : 0,
      erro: resposta.ok ? null : `Destino respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 180)}`,
    });
  }

  return relatorio;
}
