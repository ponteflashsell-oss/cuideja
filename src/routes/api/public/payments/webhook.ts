import { createFileRoute } from '@tanstack/react-router';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';

async function confirmarAtendimento(session: any) {
  const origem = session.metadata?.origem;
  const id = session.metadata?.atendimentoId;
  if ((origem !== 'contrato' && origem !== 'proposta') || typeof id !== 'string') return;

  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const agora = new Date().toISOString();
  if (origem === 'contrato') {
    const { error } = await supabaseAdmin.from('contratos').update({
      status: 'ativo',
      pagamento_status: 'confirmado',
      pagamento_id: String(session.payment_intent ?? session.id),
      pago_em: agora,
    }).eq('id', id).eq('status', 'aguardando_pagamento').eq('pagamento_status', 'pendente');
    if (error) throw error;
    return;
  }
  const { error } = await supabaseAdmin.from('propostas').update({ status: 'aceita' })
    .eq('id', id).eq('status', 'aguardando_pagamento');
  if (error) throw error;
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: { handlers: { POST: async ({ request }) => {
    const rawEnv = new URL(request.url).searchParams.get('env');
    if (rawEnv !== 'sandbox' && rawEnv !== 'live') return Response.json({ received: true, ignored: 'invalid env' });
    try {
      const event = await verifyWebhook(request, rawEnv as StripeEnv);
      if (event.type === 'checkout.session.completed' && event.data.object.payment_status !== 'unpaid') {
        await confirmarAtendimento(event.data.object);
      }
      if (event.type === 'checkout.session.async_payment_succeeded') {
        await confirmarAtendimento(event.data.object);
      }
      return Response.json({ received: true });
    } catch (error) {
      console.error('[payments] webhook error', error);
      return new Response('Webhook error', { status: 400 });
    }
  } } },
});