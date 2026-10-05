import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from '@/lib/stripe.server';

type CheckoutResult = { clientSecret: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error('Invalid userId');
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data[0]) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.['userId'] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const criarCheckoutAtendimento = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    origem: z.enum(['contrato', 'proposta']),
    id: z.string().uuid(),
    returnUrl: z.string().url(),
    environment: z.enum(['sandbox', 'live']),
  }).parse(input))
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      let atendimento: { id: string; familia_id: string; status: string; valor: number };
      if (data.origem === 'contrato') {
        const { data: contrato, error } = await context.supabase
          .from('contratos').select('id, familia_id, status, valor').eq('id', data.id).single();
        if (error) throw error;
        atendimento = { ...contrato, valor: Number(contrato.valor) };
      } else {
        const { data: proposta, error } = await context.supabase
          .from('propostas').select('id, familia_id, status, valor_proposto').eq('id', data.id).single();
        if (error) throw error;
        atendimento = { ...proposta, valor: Number(proposta.valor_proposto) };
      }
      if (atendimento.familia_id !== context.userId) throw new Error('Pagamento restrito à família.');
      if (atendimento.status !== 'aguardando_pagamento') throw new Error('Este atendimento não aguarda pagamento.');

      const valor = atendimento.valor;
      if (!Number.isFinite(valor) || valor < 0.5) throw new Error('Valor do atendimento inválido.');

      const email = typeof context.claims['email'] === 'string' ? context.claims['email'] : undefined;
      const stripe = createStripeClient(data.environment as StripeEnv);
      const customerId = await resolveOrCreateCustomer(stripe, {
        ...(email ? { email } : {}),
        userId: context.userId,
      });
      const description = `Atendimento CuideJá — ${data.id.slice(0, 8).toUpperCase()}`;
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: { name: 'Atendimento de cuidado', tax_code: 'txcd_20060007' },
            unit_amount: Math.round(valor * 100),
            tax_behavior: 'exclusive',
          },
          quantity: 1,
        }],
        mode: 'payment',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        customer: customerId,
        automatic_tax: { enabled: true },
        payment_intent_data: {
          description,
          metadata: { userId: context.userId, origem: data.origem, atendimentoId: data.id },
        },
        metadata: { userId: context.userId, origem: data.origem, atendimentoId: data.id },
      });
      if (!session.client_secret) throw new Error('Stripe did not return a client secret');
      return { clientSecret: session.client_secret };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });