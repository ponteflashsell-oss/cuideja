import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();
const horaSchema = z.string().regex(/^\d{2}:\d{2}$/);
const dataSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const criarProposta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        cuidadoraId: uuid,
        dataServico: dataSchema,
        horaInicio: horaSchema,
        horaFim: horaSchema,
        valorProposto: z.number().positive().max(100000),
        observacao: z.string().trim().max(140).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: cuidadora, error: erroCuidadora } = await context.supabase
      .from("profiles")
      .select("id, tipo, verificado")
      .eq("id", data.cuidadoraId)
      .maybeSingle();

    if (erroCuidadora) throw erroCuidadora;
    if (!cuidadora || cuidadora.tipo !== "cuidadora" || !cuidadora.verificado) {
      throw new Error("Cuidadora não encontrada ou não verificada.");
    }

    const expiraEm = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const { data: proposta, error } = await context.supabase
      .from("propostas")
      .insert({
        familia_id: context.userId,
        cuidadora_id: data.cuidadoraId,
        data_servico: data.dataServico,
        hora_inicio: data.horaInicio,
        hora_fim: data.horaFim,
        valor_proposto: data.valorProposto,
        observacao: data.observacao,
        status: "pendente_cuidadora",
        expira_em: expiraEm,
      })
      .select("*, cuidadora:profiles!propostas_cuidadora_id_fkey(nome), familia:profiles!propostas_familia_id_fkey(nome)")
      .single();

    if (error) throw error;
    return proposta;
  });

export const listarPropostasFamilia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("propostas")
      .select("*")
      .eq("familia_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const lista = data ?? [];
    const nomes = await nomesDePerfis(
      context.supabase,
      lista.map((p) => p.cuidadora_id),
    );
    return lista.map((p) => ({ ...p, cuidadora: { nome: nomes[p.cuidadora_id] ?? "" } }));
  });

export const listarPropostasCuidadora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("propostas")
      .select("*")
      .eq("cuidadora_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const lista = data ?? [];
    const nomes = await nomesDePerfis(
      context.supabase,
      lista.map((p) => p.familia_id),
    );
    return lista.map((p) => ({ ...p, familia: { nome: nomes[p.familia_id] ?? "" } }));
  });

export const responderProposta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: uuid,
        acao: z.enum(["aceitar", "recusar", "contraproposta"]),
        valorProposto: z.number().positive().max(100000).optional(),
        horaInicio: horaSchema.optional(),
        horaFim: horaSchema.optional(),
        observacao: z.string().trim().max(140).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: proposta, error: erroSelecao } = await context.supabase
      .from("propostas")
      .select("id, familia_id, cuidadora_id, status")
      .eq("id", data.id)
      .single();

    if (erroSelecao) throw erroSelecao;
    const ehFamilia = proposta.familia_id === context.userId;
    const ehCuidadora = proposta.cuidadora_id === context.userId;

    if (!ehFamilia && !ehCuidadora) {
      throw new Error("Você não tem acesso a esta proposta.");
    }

    let status = proposta.status;
    const update: {
      status?: string;
      observacao?: string;
      valor_proposto?: number;
      hora_inicio?: string;
      hora_fim?: string;
      expira_em?: string;
      updated_at?: string;
    } = {
      status,
      observacao: data.observacao || undefined,
      updated_at: new Date().toISOString(),
    };

    if (data.acao === "recusar") {
      status = "recusada";
    } else if (data.acao === "aceitar") {
      if (ehCuidadora && (proposta.status === "pendente_cuidadora" || proposta.status === "contraproposta")) {
        status = "pendente_familia";
      } else if (ehFamilia && (proposta.status === "pendente_familia" || proposta.status === "contraproposta")) {
        status = "aceita";
      } else {
        throw new Error("Esta ação não está disponível para o status atual da proposta.");
      }
    } else if (data.acao === "contraproposta") {
      if (!ehFamilia && !ehCuidadora) {
        throw new Error("Você não pode responder esta proposta.");
      }
      status = "contraproposta";
      if (data.valorProposto) update.valor_proposto = data.valorProposto;
      if (data.horaInicio) update.hora_inicio = data.horaInicio;
      if (data.horaFim) update.hora_fim = data.horaFim;
      if (data.observacao) update.observacao = data.observacao;
      update.expira_em = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    }

    if (data.acao !== "contraproposta" && data.valorProposto) {
      update.valor_proposto = data.valorProposto;
    }
    if (data.acao !== "contraproposta" && data.horaInicio) {
      update.hora_inicio = data.horaInicio;
    }
    if (data.acao !== "contraproposta" && data.horaFim) {
      update.hora_fim = data.horaFim;
    }
    update.status = status;

    const { data: atualizada, error } = await context.supabase
      .from("propostas")
      .update(update)
      .eq("id", data.id)
      .select("*")
      .single();

    if (error) throw error;
    return atualizada;
  });
