import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { useCallback } from 'react';
import { criarCheckoutAtendimento } from '@/lib/payments.functions';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';

export function CheckoutAtendimento({ origem, id }: { origem: 'contrato' | 'proposta'; id: string }) {
  const fetchClientSecret = useCallback(async () => {
    const result = await criarCheckoutAtendimento({
      data: {
        origem,
        id,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/painel-familia?pagamento=retorno&session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if ('error' in result) throw new Error(result.error);
    return result.clientSecret;
  }, [id, origem]);

  return <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>;
}