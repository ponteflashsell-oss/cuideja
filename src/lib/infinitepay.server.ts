const INFINITEPAY_LINKS_URL = "https://api.checkout.infinitepay.io/links";
const REDIRECT_URL = "https://www.cuideja.com/plantao-confirmado";
const WEBHOOK_URL = "https://jwfaxfgothgrlixfyfad.supabase.co/functions/v1/infinitepay-webhook";

type InfinitePayResponse = {
  url?: unknown;
};

export async function criarLinkPagamentoInfinitePay(input: { orderNsu: string; valor: number }) {
  const resposta = await fetch(INFINITEPAY_LINKS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: "cuideja",
      redirect_url: REDIRECT_URL,
      webhook_url: WEBHOOK_URL,
      order_nsu: input.orderNsu,
      items: [
        {
          quantity: 1,
          price: Math.round(input.valor * 100),
          description: "Fechamento de Plantão - CuideJá",
        },
      ],
    }),
  });

  if (!resposta.ok) {
    throw new Error(`Não foi possível criar o pagamento (${resposta.status}).`);
  }

  const resultado = (await resposta.json()) as InfinitePayResponse;
  if (typeof resultado.url !== "string" || !resultado.url) {
    throw new Error("A InfinitePay não retornou uma URL de pagamento.");
  }

  return resultado.url;
}