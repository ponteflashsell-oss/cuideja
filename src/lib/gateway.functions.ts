import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function exigirAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Acesso restrito à equipe administrativa.");
}

const entradaConexao = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(2, "Informe um nome para a conexão."),
  url: z.string().trim().url("Informe a URL completa do projeto (https://...)."),
  chave: z.string().trim().min(10, "Informe a chave de serviço do banco.").optional(),
});

export const listarConexoesGateway = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);
    const { lerConexoes, publicar, TABELAS_ESPELHAVEIS } = await import("@/lib/gateway.server");
    return {
      conexoes: (await lerConexoes()).map(publicar),
      tabelas: [...TABELAS_ESPELHAVEIS],
    };
  });

export const salvarConexaoGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entradaConexao.parse(data))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { lerConexoes, gravarConexoes, publicar } = await import("@/lib/gateway.server");
    const conexoes = await lerConexoes();
    const existente = data.id ? conexoes.find((c) => c.id === data.id) : undefined;

    if (existente) {
      existente.nome = data.nome;
      existente.url = data.url;
      if (data.chave) existente.chave = data.chave;
      existente.status = "nao_testado";
      existente.mensagem = null;
    } else {
      if (!data.chave) throw new Error("Informe a chave de serviço do banco.");
      conexoes.push({
        id: crypto.randomUUID(),
        nome: data.nome,
        url: data.url,
        chave: data.chave,
        ativo: false,
        status: "nao_testado",
        mensagem: null,
        ultimoTesteEm: null,
        criadoEm: new Date().toISOString(),
      });
    }

    await gravarConexoes(conexoes);
    return conexoes.map(publicar);
  });

export const testarConexaoGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { lerConexoes, gravarConexoes, pingar } = await import("@/lib/gateway.server");
    const conexoes = await lerConexoes();
    const conexao = conexoes.find((c) => c.id === data.id);
    if (!conexao) throw new Error("Conexão não encontrada.");

    const resultado = await pingar(conexao.url, conexao.chave);
    conexao.status = resultado.ok ? "ok" : "erro";
    conexao.mensagem = resultado.mensagem;
    conexao.ultimoTesteEm = new Date().toISOString();
    await gravarConexoes(conexoes);
    return { ok: resultado.ok, mensagem: resultado.mensagem };
  });

export const ativarConexaoGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string(), ativo: z.boolean() }).parse(data))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { lerConexoes, gravarConexoes, publicar } = await import("@/lib/gateway.server");
    const conexoes = await lerConexoes();
    for (const c of conexoes) c.ativo = c.id === data.id ? data.ativo : false;
    await gravarConexoes(conexoes);
    return conexoes.map(publicar);
  });

export const excluirConexaoGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { lerConexoes, gravarConexoes, publicar } = await import("@/lib/gateway.server");
    const conexoes = (await lerConexoes()).filter((c) => c.id !== data.id);
    await gravarConexoes(conexoes);
    return conexoes.map(publicar);
  });

export const espelharDadosGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string(), tabelas: z.array(z.string()).min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { lerConexoes, espelharTabelas, TABELAS_ESPELHAVEIS } = await import("@/lib/gateway.server");
    const conexao = (await lerConexoes()).find((c) => c.id === data.id);
    if (!conexao) throw new Error("Conexão não encontrada.");
    const permitidas = data.tabelas.filter((t) =>
      (TABELAS_ESPELHAVEIS as readonly string[]).includes(t),
    );
    if (permitidas.length === 0) throw new Error("Selecione ao menos uma tabela válida.");
    return espelharTabelas(conexao, permitidas);
  });
