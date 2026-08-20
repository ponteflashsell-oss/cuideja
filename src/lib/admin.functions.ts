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

export const souAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: Boolean(data) };
  });

export const listarCadastros = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);

    const { data: perfis, error } = await context.supabase
      .from("profiles")
      .select(
        "id, tipo, nome, cidade, bairros, bio, especialidades, tarifa_hora, tarifa_diaria, tarifa_plantao12, tarifa_plantao24, verificado, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os cadastros.");

    const { data: verificacoes } = await context.supabase
      .from("verificacoes")
      .select("user_id, status, score, revisao_manual, created_at")
      .order("created_at", { ascending: false });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const emails = new Map<string, string>();
    try {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
      for (const u of users?.users ?? []) if (u.email) emails.set(u.id, u.email);
    } catch (erro) {
      console.error("[admin] listUsers", erro);
    }

    const ultima = new Map<string, { status: string; score: number; revisao_manual: boolean }>();
    for (const v of verificacoes ?? []) if (!ultima.has(v.user_id)) ultima.set(v.user_id, v);

    return (perfis ?? []).map((p) => ({
      ...p,
      email: emails.get(p.id) ?? "",
      verificacao: ultima.get(p.id) ?? null,
    }));
  });

export const listarVerificacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);
    const { data, error } = await context.supabase
      .from("verificacoes")
      .select("*")
      .not("status", "in", "(aprovado,reprovado)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error("Não foi possível carregar as verificações.");
    return data ?? [];
  });

export const imagensVerificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        selfiePath: z.string(),
        documentoPath: z.string(),
        userId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const assinar = async (caminho: string) => {
      if (!caminho) return "";
      const { data: url } = await supabaseAdmin.storage
        .from("verificacoes")
        .createSignedUrl(caminho, 600);
      return url?.signedUrl ?? "";
    };

    // O documento oficial vem do arquivo enviado pela cuidadora (foto ou PDF).
    // A foto rosto+documento (selfie) nunca é reaproveitada como documento.
    let documentoPath = "";
    let documentoMime = "";
    let documentoNome = "";
    if (data.userId) {
      const { data: doc } = await supabaseAdmin
        .from("documentos")
        .select("caminho, mime, nome_arquivo")
        .eq("user_id", data.userId)
        .eq("tipo", "documento_oficial")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (doc) {
        documentoPath = doc.caminho;
        documentoMime = doc.mime ?? "";
        documentoNome = doc.nome_arquivo ?? "";
      }
    }
    if (!documentoPath && data.documentoPath !== data.selfiePath) {
      documentoPath = data.documentoPath;
    }

    return {
      selfie: await assinar(data.selfiePath),
      documento: await assinar(documentoPath),
      documentoMime,
      documentoNome,
      documentoPdf: documentoMime === "application/pdf" || /\.pdf$/i.test(documentoPath),
    };
  });


export const decidirVerificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        verificacaoId: z.string().uuid(),
        userId: z.string().uuid(),
        decisao: z.enum(["aprovado", "reprovado", "em_analise"]),
        observacoes: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);

    const atualizacao = {
      status: data.decisao,
      revisao_manual: false,
      ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
    };


    const { error } = await context.supabase
      .from("verificacoes")
      .update(atualizacao)
      .eq("id", data.verificacaoId);
    if (error) throw new Error("Não foi possível salvar a decisão.");

    const { error: erroPerfil } = await context.supabase
      .from("profiles")
      .update({ verificado: data.decisao === "aprovado" })
      .eq("id", data.userId);
    if (erroPerfil) throw new Error("Não foi possível atualizar o perfil.");

    return { ok: true };
  });

export const definirVerificado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), verificado: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({ verificado: data.verificado })
      .eq("id", data.userId);
    if (error) throw new Error("Não foi possível atualizar o perfil.");
    return { ok: true };
  });

/** Arquivo jurídico: todos os documentos e fotos enviados por cuidadoras e famílias. */
export const listarDocumentosNuvem = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);

    const [{ data: docs }, { data: verifs }, { data: perfis }] = await Promise.all([
      context.supabase
        .from("documentos")
        .select("id, user_id, tipo, nome_arquivo, caminho, mime, tamanho, origem, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      context.supabase
        .from("verificacoes")
        .select("id, user_id, selfie_path, documento_path, status, created_at")
        .order("created_at", { ascending: false })
        .limit(300),
      context.supabase.from("profiles").select("id, nome, tipo"),
    ]);

    const perfil = new Map<string, { nome: string; tipo: string }>();
    for (const p of perfis ?? []) perfil.set(p.id, { nome: p.nome, tipo: p.tipo });

    type Arquivo = {
      chave: string;
      user_id: string;
      nome: string;
      conta: string;
      tipo: string;
      caminho: string;
      origem: string;
      criado_em: string;
    };

    const itens: Arquivo[] = [];
    const push = (
      user_id: string,
      tipo: string,
      caminho: string,
      origem: string,
      criado_em: string,
      chave: string,
    ) => {
      if (!caminho) return;
      const p = perfil.get(user_id);
      itens.push({
        chave,
        user_id,
        nome: p?.nome || "(sem nome)",
        conta: p?.tipo === "familia" ? "familia" : "cuidadora",
        tipo,
        caminho,
        origem,
        criado_em,
      });
    };

    for (const v of verifs ?? []) {
      push(v.user_id, "selfie", v.selfie_path, "camera", v.created_at, `v-selfie-${v.id}`);
      push(v.user_id, "documento_identidade", v.documento_path, "camera", v.created_at, `v-doc-${v.id}`);
    }
    for (const d of docs ?? []) {
      push(d.user_id, d.tipo, d.caminho, d.origem, d.created_at, `d-${d.id}`);
    }

    itens.sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
    return itens;
  });

/** Gera link temporário e grava quem acessou o arquivo (trilha de auditoria). */
export const abrirDocumentoNuvem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ caminho: z.string().min(3), userId: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: url, error } = await supabaseAdmin.storage
      .from("verificacoes")
      .createSignedUrl(data.caminho, 600);
    if (error || !url?.signedUrl) throw new Error("Não foi possível abrir o arquivo.");

    await supabaseAdmin.from("admin_auditoria").insert({
      admin_id: context.userId,
      user_id: data.userId ?? null,
      acao: "abriu_documento",
      caminho: data.caminho,
      detalhe: "link temporário de 10 minutos",
    });

    return { url: url.signedUrl };
  });

export const listarAuditoria = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_auditoria")
      .select("id, admin_id, user_id, acao, caminho, detalhe, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error("Não foi possível carregar a auditoria.");
    return data ?? [];
  });
