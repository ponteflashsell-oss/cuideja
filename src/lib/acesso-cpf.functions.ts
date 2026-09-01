import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cpfValido, loginDoCpf, somenteDigitos } from "@/lib/cpf";

const cpfSchema = z.object({
  cpf: z.string().transform(somenteDigitos).refine(cpfValido, { message: "CPF inválido" }),
});

const cadastroSchema = cpfSchema.extend({
  nome: z.string().trim().min(3, { message: "Informe nome e sobrenome" }).max(80),
  senha: z.string().min(8, { message: "A senha precisa de ao menos 8 caracteres" }).max(72),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data de nascimento inválida" }),
  tipo: z.enum(["cuidadora", "familia"]),
});

/** Verifica se o CPF já tem conta, para decidir entre login e primeiro acesso. */
export const cpfTemConta = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => cpfSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const login = loginDoCpf(data.cpf);
    const { data: lista } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existe = Boolean(lista?.users.some((u) => u.email?.toLowerCase() === login));
    return { existe };
  });

/** Cria a conta usando apenas CPF, data de nascimento, nome e senha (sem e-mail). */
export const criarContaCpf = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => cadastroSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const login = loginDoCpf(data.cpf);

    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: login,
      password: data.senha,
      email_confirm: true,
      user_metadata: {
        nome: data.nome,
        cpf: data.cpf,
        data_nascimento: data.dataNascimento,
        tipo: data.tipo,
        sem_email: true,
      },
    });

    if (error || !criado.user) {
      const mensagem = (error?.message ?? "").toLowerCase();
      if (mensagem.includes("already") || mensagem.includes("registered") || mensagem.includes("exists")) {
        throw new Error("Este CPF já possui conta. Informe sua senha para entrar.");
      }
      throw new Error(error?.message ?? "Não foi possível criar a conta.");
    }

    const base = { id: criado.user.id, nome: data.nome, tipo: data.tipo };
    const completo = { ...base, cpf: data.cpf, data_nascimento: data.dataNascimento };

    const { error: erroPerfil } = await supabaseAdmin.from("profiles").upsert(completo as never);
    if (erroPerfil) {
      // Bancos que ainda não receberam as colunas cpf/data_nascimento.
      await supabaseAdmin.from("profiles").upsert(base as never);
    }

    return { criada: true as const };
  });
