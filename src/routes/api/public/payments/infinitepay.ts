import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const notificacao = z.object({
  order_nsu: z.string().uuid(),
  transaction_nsu: z.string().min(1).max(200),
  invoice_slug: z.string().min(1).max(200),
}).passthrough();

export const Route = createFileRoute("/api/public/payments/infinitepay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = notificacao.safeParse(await request.json());
          if (!payload.success) return new Response("Notificação inválida", { status: 400 });
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { conferirPagamentoInfinitePay } = await import("@/lib/infinitepay.server");
          const { order_nsu: id, transaction_nsu: transacao, invoice_slug: slug } = payload.data;

          const { data: contrato, error: erroContrato } = await supabaseAdmin.from("contratos")
            .select("id, valor, status, pagamento_status")
            .eq("id", id).maybeSingle();
          if (erroContrato) throw erroContrato;
          const { data: proposta, error: erroProposta } = contrato ? { data: null, error: null } : await supabaseAdmin.from("propostas")
            .select("id, valor_proposto, status")
            .eq("id", id).maybeSingle();
          if (erroProposta) throw erroProposta;
          if (!contrato && !proposta) return new Response("Pedido não encontrado", { status: 404 });
          if (contrato?.pagamento_status === "confirmado" || proposta?.status === "aceita") return Response.json({ ok: true });
          if ((contrato && (contrato.pagamento_status !== "pendente" || contrato.status !== "aguardando_pagamento")) ||
            (proposta && proposta.status !== "aguardando_pagamento")) {
            return new Response("Pedido indisponível", { status: 409 });
          }

          const valor = contrato ? Number(contrato.valor) : Number(proposta?.valor_proposto);
          const confirmado = await conferirPagamentoInfinitePay({ orderNsu: id, transactionNsu: transacao, slug, valor });
          if (!confirmado) return new Response("Pagamento não confirmado", { status: 400 });

          if (contrato) {
            const { error } = await supabaseAdmin.from("contratos")
              .update({ status: "ativo", pagamento_status: "confirmado", pagamento_id: transacao, pago_em: new Date().toISOString() })
              .eq("id", id).eq("pagamento_status", "pendente").eq("status", "aguardando_pagamento");
            if (error) throw error;
          } else {
            const { error } = await supabaseAdmin.from("propostas")
              .update({ status: "aceita" })
              .eq("id", id).eq("status", "aguardando_pagamento");
            if (error) throw error;
          }
          return Response.json({ ok: true });
        } catch (error) {
          console.error("[pagamentos] Falha ao verificar cobrança", error);
          return new Response("Não foi possível confirmar. Tente novamente.", { status: 503 });
        }
      },
    },
  },
});