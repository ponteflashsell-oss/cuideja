import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const entrada = z.object({
  email: z.string().trim().email().max(255),
  senha: z.string().min(8).max(72),
  nome: z.string().trim().max(80).optional(),
  tipo: z.enum(["cuidadora", "familia"]),
});

/**
 * Cria a conta já com e-mail confirmado (o projeto exige confirmação por e-mail,
 * o que impedia o login imediato após o cadastro). Se a conta já existir e estiver
 * pendente de confirmação, confirma para liberar o login.
 */
export const criarContaConfirmada = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => entrada.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome ?? "", tipo: data.tipo },
    });

    if (!error && criado.user) return { criada: true as const, jaExistia: false as const };

    const mensagem = (error?.message ?? "").toLowerCase();
    const jaExiste =
      mensagem.includes("already") || mensagem.includes("registered") || mensagem.includes("exists");
    if (!jaExiste) throw new Error(error?.message ?? "Não foi possível criar a conta.");

    // Conta já existe: garante que o e-mail esteja confirmado para permitir o login.
    const { data: lista } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existente = lista?.users.find(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
    );
    if (existente && !existente.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(existente.id, { email_confirm: true });
    }
    return { criada: false as const, jaExistia: true as const };
  });
