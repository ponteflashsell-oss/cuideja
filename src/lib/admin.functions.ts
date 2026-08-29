import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEMO_EMAIL_CUIDADORA, DEMO_EMAIL_FAMILIA, DEMO_SENHA } from "@/lib/demo";

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

    const [{ data: perfis, error }, { data: papeis }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select(
          "id, tipo, nome, cidade, bairros, bio, especialidades, tarifa_hora, tarifa_diaria, tarifa_plantao12, tarifa_plantao24, verificado, created_at",
        )
        .order("created_at", { ascending: false }),
      context.supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    if (error) throw new Error("Não foi possível carregar os cadastros.");

    const admins = new Set((papeis ?? []).map((papel: { user_id: string }) => papel.user_id));

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
      admin: admins.has(p.id),
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

/** Exclui um cadastro e remove seus arquivos privados antes da conta de autenticação. */
export const excluirPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("O administrador não pode excluir a própria conta.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: documentos }, { data: verificacoes }] = await Promise.all([
      supabaseAdmin.from("documentos").select("caminho").eq("user_id", data.userId),
      supabaseAdmin
        .from("verificacoes")
        .select("selfie_path, documento_path")
        .eq("user_id", data.userId),
    ]);

    const caminhos = new Set<string>();
    for (const documento of documentos ?? []) if (documento.caminho) caminhos.add(documento.caminho);
    for (const verificacao of verificacoes ?? []) {
      if (verificacao.selfie_path) caminhos.add(verificacao.selfie_path);
      if (verificacao.documento_path) caminhos.add(verificacao.documento_path);
    }
    if (caminhos.size) {
      const { error } = await supabaseAdmin.storage
        .from("verificacoes")
        .remove([...caminhos]);
      if (error) throw new Error("Não foi possível remover os arquivos privados do perfil.");
    }

    await supabaseAdmin.from("admin_auditoria").insert({
      admin_id: context.userId,
      user_id: data.userId,
      acao: "excluiu_perfil",
      caminho: `perfil/${data.userId}`,
      detalhe: "perfil, dados vinculados e arquivos privados removidos",
    });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error("Não foi possível excluir o perfil.");
    return { ok: true };
  });

/** Cria ou atualiza duas contas completas para testar o fluxo ponta a ponta. */
export const criarPerfisSimulacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const senha = DEMO_SENHA;
    const senhaExpiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const contas = [
      {
        email: DEMO_EMAIL_FAMILIA,
        tipo: "familia" as const,
        nome: "Mariana Alencar",
        cidade: "São Paulo",
        bairros: ["Perdizes", "Pinheiros"],
        bio: "Família em busca de apoio para os cuidados da mãe durante a semana.",
        especialidades: ["Mobilidade reduzida", "Alzheimer e demências"],
      },
      {
        email: DEMO_EMAIL_CUIDADORA,
        tipo: "cuidadora" as const,
        nome: "Ana Paula Ribeiro",
        cidade: "São Paulo",
        bairros: ["Perdizes", "Pinheiros", "Vila Madalena"],
        bio: "Técnica em enfermagem com experiência em memória, medicação e mobilidade assistida.",
        especialidades: ["Alzheimer", "Mobilidade reduzida", "Primeiros socorros"],
      },
    ];
    const ids: string[] = [];
    const { data: usuarios } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });

    for (const conta of contas) {
      let usuario = usuarios?.users.find((item) => item.email === conta.email);
      if (!usuario) {
        const criado = await supabaseAdmin.auth.admin.createUser({
          email: conta.email,
          password: senha,
          email_confirm: true,
          user_metadata: {
            nome: conta.nome,
            tipo: conta.tipo,
            demo_password_expires_at: senhaExpiraEm,
          },
        });
        if (criado.error || !criado.data.user) throw criado.error ?? new Error("Não foi possível criar a conta de simulação.");
        usuario = criado.data.user;
      } else {
        const atualizado = await supabaseAdmin.auth.admin.updateUserById(usuario.id, {
          password: senha,
          user_metadata: {
            ...usuario.user_metadata,
            nome: conta.nome,
            tipo: conta.tipo,
            demo_password_expires_at: senhaExpiraEm,
          },
        });
        if (atualizado.error) throw atualizado.error;
      }
      ids.push(usuario.id);
      const { error } = await supabaseAdmin.from("profiles").upsert({
        id: usuario.id,
        tipo: conta.tipo,
        nome: conta.nome,
        cidade: conta.cidade,
        bairros: conta.bairros,
        bio: conta.bio,
        especialidades: conta.especialidades,
        tarifa_hora: conta.tipo === "cuidadora" ? 38 : 0,
        tarifa_diaria: conta.tipo === "cuidadora" ? 240 : 0,
        tarifa_plantao12: conta.tipo === "cuidadora" ? 320 : 0,
        tarifa_plantao24: conta.tipo === "cuidadora" ? 540 : 0,
        verificado: true,
      });
      if (error) throw error;
      const dadosVerificacao = {
          user_id: usuario.id,
          status: "aprovado",
          nome_documento: conta.nome,
          cpf: conta.tipo === "familia" ? "123.456.789-00" : "987.654.321-00",
          data_nascimento: "1988-05-12",
          tipo_documento: "RG",
          cpf_valido: true,
          face_confere: true,
          score: 98,
          observacoes: "Perfil de simulação aprovado automaticamente.",
          antecedentes_status: "aprovado",
        };
      const { data: verificacaoExistente } = await supabaseAdmin
        .from("verificacoes")
        .select("id")
        .eq("user_id", usuario.id)
        .limit(1)
        .maybeSingle();
      const { error: erroVerificacao } = verificacaoExistente
        ? await supabaseAdmin.from("verificacoes").update(dadosVerificacao).eq("id", verificacaoExistente.id)
        : await supabaseAdmin.from("verificacoes").insert(dadosVerificacao);
      if (erroVerificacao) throw erroVerificacao;
    }

    const familiaId = ids[0]!;
    const cuidadoraId = ids[1]!;
    const { data: existente } = await supabaseAdmin
      .from("contratos")
      .select("id, reserva_id")
      .eq("familia_id", familiaId)
      .eq("cuidadora_id", cuidadoraId)
      .eq("status", "ativo")
      .limit(1)
      .maybeSingle();
    if (!existente) {
      const agora = new Date().toISOString();
      const inicio = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const reservaId = `RES-DEMO-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
      const { error } = await supabaseAdmin.from("contratos").insert({
        reserva_id: reservaId,
        emitido_em: agora,
        familia_id: familiaId,
        cuidadora_id: cuidadoraId,
        criado_por: familiaId,
        familia_nome: contas[0]!.nome,
        familia_cpf: "123.456.789-00",
        familia_cidade: "São Paulo",
        familia_bairro: "Perdizes",
        familia_verificada: true,
        familia_telefone: "(11) 98888-1122",
        cuidadora_nome: contas[1]!.nome,
        cuidadora_cpf: "987.654.321-00",
        cuidadora_cidade: "São Paulo",
        cuidadora_verificada: true,
        cuidadora_telefone: "(11) 97777-3344",
        descricao_cuidado: "Acompanhamento da assistida, auxílio com mobilidade, medicação conforme ficha e companhia.",
        endereco: "Rua Cardoso de Almeida, 1120 — Perdizes, São Paulo",
        regime: "plantao12",
        data_inicio: inicio,
        hora_inicio: "07:00",
        hora_fim: "19:00",
        valor: 320,
        taxa_percentual: 10,
        observacoes: "Refeição da cuidadora combinada. Diário de bordo pelo aplicativo.",
        termo_texto: "TERMO DE SIMULAÇÃO — reserva criada para testar o fluxo completo do CuideJá.",
        status: "ativo",
        familia_aceite_em: agora,
        familia_aceite_nome: contas[0]!.nome,
        cuidadora_aceite_em: agora,
        cuidadora_aceite_nome: contas[1]!.nome,
        pagamento_status: "confirmado",
        pago_em: agora,
        pagamento_id: "demo-pagamento",
      });
      if (error) throw error;
    }

    return {
      familia: { email: contas[0]!.email, senha, senhaExpiraEm },
      cuidadora: { email: contas[1]!.email, senha, senhaExpiraEm },
    };
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

    const { data: papeis } = await context.supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const admins = new Set((papeis ?? []).map((papel: { user_id: string }) => papel.user_id));

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
      if (admins.has(user_id)) return;
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

/** Dossiê completo de um cadastro (cuidadora ou família) para inspeção de rotina. */
export const dossieCadastro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: perfil }, { data: verificacoes }, { data: documentos }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", data.userId).maybeSingle(),
      supabaseAdmin
        .from("verificacoes")
        .select("*")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("documentos")
        .select("id, tipo, nome_arquivo, caminho, mime, tamanho, origem, created_at")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false }),
    ]);

    let email = "";
    try {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      email = u?.user?.email ?? "";
    } catch (erro) {
      console.error("[admin] getUserById", erro);
    }

    const assinar = async (caminho: string) => {
      if (!caminho) return "";
      const { data: url } = await supabaseAdmin.storage
        .from("verificacoes")
        .createSignedUrl(caminho, 600);
      return url?.signedUrl ?? "";
    };

    const arquivos: {
      chave: string;
      titulo: string;
      caminho: string;
      url: string;
      pdf: boolean;
      origem: string;
      criado_em: string;
    }[] = [];

    for (const v of verificacoes ?? []) {
      if (v.selfie_path) {
        arquivos.push({
          chave: `v-selfie-${v.id}`,
          titulo: "Rosto com o documento (captura ao vivo)",
          caminho: v.selfie_path,
          url: await assinar(v.selfie_path),
          pdf: false,
          origem: "câmera ao vivo",
          criado_em: v.created_at,
        });
      }
      if (v.documento_path && v.documento_path !== v.selfie_path) {
        arquivos.push({
          chave: `v-doc-${v.id}`,
          titulo: "Documento capturado na verificação",
          caminho: v.documento_path,
          url: await assinar(v.documento_path),
          pdf: /\.pdf$/i.test(v.documento_path),
          origem: "câmera ao vivo",
          criado_em: v.created_at,
        });
      }
    }
    for (const d of documentos ?? []) {
      arquivos.push({
        chave: `d-${d.id}`,
        titulo: `${d.tipo === "documento_oficial" ? "Documento oficial com foto" : d.tipo}${
          d.nome_arquivo ? ` · ${d.nome_arquivo}` : ""
        }`,
        caminho: d.caminho,
        url: await assinar(d.caminho),
        pdf: d.mime === "application/pdf" || /\.pdf$/i.test(d.caminho),
        origem: d.origem === "camera" ? "câmera ao vivo" : "arquivo enviado",
        criado_em: d.created_at,
      });
    }

    await supabaseAdmin.from("admin_auditoria").insert({
      admin_id: context.userId,
      user_id: data.userId,
      acao: "abriu_dossie",
      caminho: `perfil/${data.userId}`,
      detalhe: "inspeção de rotina do cadastro completo",
    });

    return { perfil, email, verificacoes: verificacoes ?? [], documentos: documentos ?? [], arquivos };
  });
