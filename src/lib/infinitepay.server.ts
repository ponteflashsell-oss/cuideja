import { getRequest } from "@tanstack/react-start/server";

const INFINITEPAY_LINKS_URL = "https://api.checkout.infinitepay.io/links";

const HANDLE = "cuideja";

function origemPublica() {
  const request = getRequest();
  const origem = process.env['PAYMENT_PUBLIC_ORIGIN'] || new URL(request.url).origin;
  if (!origem.startsWith("https://") || origem.includes("localhost")) throw new Error("Configure PAYMENT_PUBLIC_ORIGIN com uma URL pública HTTPS para receber a confirmação do pagamento.");
  return origem;
}

type InfinitePayResponse = {
  url?: unknown;
};

export async function criarLinkPagamentoInfinitePay(input: { orderNsu: string; valor: number }) {
  const origem = origemPublica();
  const resposta = await fetch(INFINITEPAY_LINKS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: HANDLE,
      redirect_url: `${origem}/painel-familia`,
      webhook_url: `${origem}/api/public/payments/infinitepay`,
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

/** A notificação ou o retorno do navegador nunca prova que houve pagamento. */
export async function conferirPagamentoInfinitePay(input: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
  valor: number;
}) {
  const resposta = await fetch("https://api.checkout.infinitepay.io/payment_check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: HANDLE, order_nsu: input.orderNsu, transaction_nsu: input.transactionNsu, slug: input.slug }),
  });
  if (!resposta.ok) throw new Error("Consulta de pagamento indisponível.");
  const resultado: unknown = await resposta.json();
  if (!resultado || typeof resultado !== "object") return false;
  const status = resultado as { success?: unknown; paid?: unknown; amount?: unknown };
  return status.success === true && status.paid === true && status.amount === Math.round(input.valor * 100);
}