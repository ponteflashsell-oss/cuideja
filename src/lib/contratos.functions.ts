import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { criarLinkPagamentoInfinitePay } from "./infinitepay.server";

const regimeEnum = z.enum(["hora", "diaria", "plantao12", "plantao24"]);

/** Lista cuidadoras verificadas para a família escolher no contrato. */
export const listarCuidadorasContrato = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, nome, cidade, bairros, especialidades, tarifa_hora, tarifa_diaria, tarifa_plantao12, tarifa_plantao24, verificado",
      )
      .eq("tipo", "cuidadora")
      .eq("verificado", true)
      .order("nome");
    if (error) throw error;
    return (data ?? []).filter((c) => c.nome.trim());
  });

/** Contratos em que o usuário logado é família ou cuidadora. */
export const listarMeusContratos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("contratos")
      .select("*")
      .or(`familia_id.eq.${context.userId},cuidadora_id.eq.${context.userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { userId: context.userId, contratos: data ?? [] };
  });

/** Gera o termo com os dados reais das duas partes e deixa aguardando consentimento. */
export const criarContrato = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        cuidadoraId: z.string().uuid(),
        descricao: z.string().trim().min(10).max(1200),
        endereco: z.string().trim().min(5).max(300),
        regime: regimeEnum,
        dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dataFim: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).default(""),
        horaInicio: z.string().max(5).default(""),
        horaFim: z.string().max(5).default(""),
        assistido: z.string().trim().min(2).max(120),
        familiaTelefone: z.string().trim().max(30).default(""),
        cuidadoraTelefone: z.string().trim().max(30).default(""),
        valor: z.number().min(0).max(100000),
        observacoes: z.string().trim().max(1000).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { montarTermo } = await import("./contratos.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.cuidadoraId === context.userId) {
      throw new Error("Selecione uma cuidadora diferente da sua própria conta.");
    }

    const { data: perfis, error } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, cidade, bairros, tipo, verificado")
      .in("id", [context.userId, data.cuidadoraId]);
    if (error) throw error;

    const familia = perfis?.find((p) => p.id === context.userId);
    const cuidadora = perfis?.find((p) => p.id === data.cuidadoraId);
    if (!familia || familia.tipo !== "familia") {
      throw new Error("Apenas contas de família podem gerar o termo de contratação.");
    }
    if (!cuidadora || cuidadora.tipo !== "cuidadora") {
      throw new Error("Cuidadora não encontrada.");
    }
    if (!familia.verificado) {
      throw new Error("Conclua a verificação da sua conta antes de gerar o termo.");
    }
    if (!cuidadora.verificado) {
      throw new Error("Esta cuidadora ainda não está com o perfil verificado.");
    }

    // CPF conferido na verificação de identidade de cada parte.
    const { data: verificacoes } = await supabaseAdmin
      .from("verificacoes")
      .select("user_id, cpf, status, created_at")
      .in("user_id", [context.userId, data.cuidadoraId])
      .eq("status", "aprovado")
      .order("created_at", { ascending: false });
    const cpfDe = (id: string) => verificacoes?.find((v) => v.user_id === id)?.cpf ?? "";

    const reservaId = `RES-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    const emitidoEm = new Date().toISOString();
    const dados = {
      reservaId,
      emitidoEm,
      familia: {
        nome: familia.nome,
        cpf: cpfDe(familia.id),
        cidade: familia.cidade,
        bairro: familia.bairros?.[0] ?? "",
        verificada: familia.verificado,
        telefone: data.familiaTelefone,
      },
      cuidadora: {
        nome: cuidadora.nome,
        cpf: cpfDe(cuidadora.id),
        cidade: cuidadora.cidade,
        verificada: cuidadora.verificado,
        telefone: data.cuidadoraTelefone,
      },
      servico: {
        endereco: data.endereco,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        assistido: data.assistido,
        valor: data.valor,
      },
    };

    const { data: criado, error: erroInsert } = await context.supabase
      .from("contratos")
      .insert({
        reserva_id: reservaId,
        emitido_em: emitidoEm,
        familia_id: familia.id,
        cuidadora_id: cuidadora.id,
        criado_por: context.userId,
        familia_nome: dados.familia.nome,
        familia_cpf: dados.familia.cpf,
        familia_cidade: dados.familia.cidade,
        familia_bairro: dados.familia.bairro,
        familia_verificada: dados.familia.verificada,
        cuidadora_nome: dados.cuidadora.nome,
        cuidadora_cpf: dados.cuidadora.cpf,
        cuidadora_cidade: dados.cuidadora.cidade,
        cuidadora_verificada: dados.cuidadora.verificada,
        familia_telefone: data.familiaTelefone,
        cuidadora_telefone: data.cuidadoraTelefone,
        descricao_cuidado: data.descricao,
        assistido_nome: data.assistido,
        endereco: data.endereco,
        regime: data.regime,
        data_inicio: data.dataInicio,
        data_fim: data.dataFim || null,
        hora_inicio: data.horaInicio,
        hora_fim: data.horaFim,
        valor: data.valor,
        taxa_percentual: 10,
        observacoes: data.observacoes,
        termo_texto: montarTermo(dados),
        status: "aguardando",
      })
      .select("id")
      .single();
    if (erroInsert) throw erroInsert;

    return { id: criado.id };
  });

/** Registra o consentimento (ou a recusa) de uma das partes. */
export const responderContrato = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        acao: z.enum(["aceitar", "recusar"]),
        motivo: z.string().trim().max(500).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: contrato, error } = await context.supabase
      .from("contratos")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!contrato) throw new Error("Contrato não encontrado.");

    const ehFamilia = contrato.familia_id === context.userId;
    const ehCuidadora = contrato.cuidadora_id === context.userId;
    if (!ehFamilia && !ehCuidadora) throw new Error("Você não faz parte deste contrato.");
    if (contrato.status !== "aguardando") {
      throw new Error("Este contrato já foi finalizado.");
    }

    if (data.acao === "recusar") {
      const { error: erroRecusa } = await context.supabase
        .from("contratos")
        .update({
          status: "recusado",
          recusado_por: context.userId,
          motivo_recusa: data.motivo,
        })
        .eq("id", contrato.id);
      if (erroRecusa) throw erroRecusa;
      return { status: "recusado" as const };
    }

    const agora = new Date().toISOString();
    const nome = ehFamilia ? contrato.familia_nome : contrato.cuidadora_nome;
    const familiaAceite = ehFamilia ? agora : contrato.familia_aceite_em;
    const cuidadoraAceite = ehCuidadora ? agora : contrato.cuidadora_aceite_em;
    const status = familiaAceite && cuidadoraAceite ? "aguardando_pagamento" : "aguardando";
    const checkoutUrl =
      status === "aguardando_pagamento" && ehFamilia
        ? await criarLinkPagamentoInfinitePay({ orderNsu: contrato.id, valor: Number(contrato.valor) })
        : undefined;

    const { error: erroAceite } = await context.supabase
      .from("contratos")
      .update({
        status,
        ...(checkoutUrl ? { checkout_url: checkoutUrl, pagamento_status: "pendente" } : {}),
        ...(ehFamilia
          ? { familia_aceite_em: agora, familia_aceite_nome: nome }
          : { cuidadora_aceite_em: agora, cuidadora_aceite_nome: nome }),
      })
      .eq("id", contrato.id);
    if (erroAceite) throw erroAceite;

    return { status, checkoutUrl };
  });
