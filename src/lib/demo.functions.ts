import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEMO_EMAIL_CUIDADORA, DEMO_EMAIL_FAMILIA, DEMO_SENHA } from "@/lib/demo";

export const finalizarContratoDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ valor: z.number().min(1).max(100000), dataInicio: z.string(), horaInicio: z.string(), horaFim: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const participantes = await participantesDemo(supabaseAdmin);
    if (![participantes.familiaId, participantes.cuidadoraId].includes(context.userId)) {
      throw new Error("Somente as contas demo podem finalizar este contrato.");
    }
    const { data: contratoAtivo } = await supabaseAdmin
      .from("contratos")
      .select("id")
      .eq("familia_id", participantes.familiaId)
      .eq("cuidadora_id", participantes.cuidadoraId)
      .eq("status", "ativo")
      .limit(1)
      .maybeSingle();
    if (contratoAtivo) return { ok: true, jaFinalizado: true };
    const agora = new Date().toISOString();
    const { error } = await supabaseAdmin.from("contratos").insert({
      reserva_id: `RES-DEMO-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`,
      emitido_em: agora,
      familia_id: participantes.familiaId,
      cuidadora_id: participantes.cuidadoraId,
      criado_por: context.userId,
      familia_nome: "Mariana Alencar",
      familia_cpf: "123.456.789-00",
      familia_cidade: "São Paulo",
      familia_bairro: "Perdizes",
      familia_verificada: true,
      familia_telefone: "(11) 98888-1122",
      cuidadora_nome: "Ana Paula Ribeiro",
      cuidadora_cpf: "987.654.321-00",
      cuidadora_cidade: "São Paulo",
      cuidadora_verificada: true,
      cuidadora_telefone: "(11) 97777-3344",
      descricao_cuidado: "Acompanhamento da assistida, auxílio com mobilidade e medicação conforme ficha.",
      endereco: "Rua Cardoso de Almeida, 1120 - Perdizes, São Paulo",
      regime: "plantao12",
      data_inicio: data.dataInicio,
      hora_inicio: data.horaInicio,
      hora_fim: data.horaFim,
      valor: data.valor,
      taxa_percentual: 10,
      observacoes: "Negociação realizada no bate-papo demo.",
      termo_texto: "TERMO DE SIMULAÇÃO - contratação realizada no bate-papo demo.",
      status: "ativo",
      familia_aceite_em: agora,
      familia_aceite_nome: "Mariana Alencar",
      cuidadora_aceite_em: agora,
      cuidadora_aceite_nome: "Ana Paula Ribeiro",
      pagamento_status: "confirmado",
      pagamento_id: "demo-chat-pagamento",
      pago_em: agora,
    });
    if (error) throw error;
    return { ok: true };
  });

async function participantesDemo(supabaseAdmin: any) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const familia = data.users.find((u: any) => u.email?.toLowerCase() === DEMO_EMAIL_FAMILIA);
  const cuidadora = data.users.find((u: any) => u.email?.toLowerCase() === DEMO_EMAIL_CUIDADORA);
  if (!familia || !cuidadora) throw new Error("Crie os perfis demo antes de finalizar o contrato.");
  return { familiaId: familia.id, cuidadoraId: cuidadora.id };
}

export const renovarSessaoDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: usuario, error } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (error) throw error;
    const email = usuario.user?.email?.toLowerCase();
    if (email !== DEMO_EMAIL_FAMILIA && email !== DEMO_EMAIL_CUIDADORA) {
      return { demo: false, renovada: false };
    }

    const expiraEm = usuario.user.user_metadata?.['demo_password_expires_at'];
    const expirou = typeof expiraEm === "string" && new Date(expiraEm).getTime() <= Date.now();
    if (!expirou) return { demo: true, renovada: false };

    const novaExpiracao = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: erroAtualizacao } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: DEMO_SENHA,
      user_metadata: { ...usuario.user.user_metadata, demo_password_expires_at: novaExpiracao },
    });
    if (erroAtualizacao) throw erroAtualizacao;

    const { data: demoUsuarios } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const ids = (demoUsuarios?.users ?? [])
      .filter((item) => [DEMO_EMAIL_FAMILIA, DEMO_EMAIL_CUIDADORA].includes(item.email?.toLowerCase() ?? ""))
      .map((item) => item.id);
    if (ids.length) {
      await (supabaseAdmin as any).from("alertas_plantao").delete().in("criado_por", ids);
      await supabaseAdmin.from("contratos").delete().in("familia_id", ids).in("cuidadora_id", ids);
    }
    return { demo: true, renovada: true, novaExpiracao };
  });
