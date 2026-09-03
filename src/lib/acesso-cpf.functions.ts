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

/** Verifica se o CPF já tem conta consultando a tabela profiles, que é a fonte do cadastro. */
export const cpfTemConta = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => cpfSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: perfil, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("cpf" as never, data.cpf as never)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error("Não foi possível verificar o CPF no cadastro.");
    }

    return { existe: Boolean(perfil?.id) };
  });

/** Cria a conta usando apenas CPF, data de nascimento, nome e senha (sem e-mail). */
export const criarContaCpf = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => cadastroSchema.parse(data))
  .handler(async ({ data }) => {
    const login = loginDoCpf(data.cpf);
    const metadata = {
      nome: data.nome,
      cpf: data.cpf,
      data_nascimento: data.dataNascimento,
      tipo: data.tipo,
      sem_email: true,
    };

    const jaExiste = (mensagem: string) =>
      /already|registered|exists/i.test(mensagem)
        ? new Error("Este CPF já possui conta. Informe sua senha para entrar.")
        : null;

    let userId: string | null = null;
    let supabaseAdmin: Awaited<
      typeof import("@/integrations/supabase/client.server")
    >["supabaseAdmin"] | null = null;

    try {
      ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
      const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
        email: login,
        password: data.senha,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error || !criado.user) {
        const conhecido = jaExiste(error?.message ?? "");
        if (conhecido) throw conhecido;
        throw new Error(error?.message ?? "Não foi possível criar a conta.");
      }
      userId = criado.user.id;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "";
      const conhecido = jaExiste(mensagem);
      if (conhecido) throw conhecido;

      // Chave de serviço ausente/incorreta neste ambiente: cadastra pela chave pública.
      const { createClient } = await import("@supabase/supabase-js");
      const { PROJECT_SUPABASE_URL, PROJECT_SUPABASE_PUBLISHABLE_KEY } = await import(
        "@/integrations/supabase/project-config"
      );
      const publico = createClient(PROJECT_SUPABASE_URL, PROJECT_SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: cadastro, error: erroCadastro } = await publico.auth.signUp({
        email: login,
        password: data.senha,
        options: { data: metadata },
      });
      if (erroCadastro || !cadastro.user) {
        const conhecidoPublico = jaExiste(erroCadastro?.message ?? "");
        if (conhecidoPublico) throw conhecidoPublico;
        throw new Error(erroCadastro?.message ?? "Não foi possível criar a conta.");
      }
      return { criada: true as const };
    }

    const base = { id: userId, nome: data.nome, tipo: data.tipo };
    const completo = { ...base, cpf: data.cpf, data_nascimento: data.dataNascimento };

    const { error: erroPerfil } = await supabaseAdmin.from("profiles").upsert(completo as never);
    if (erroPerfil) {
      // Bancos que ainda não receberam as colunas cpf/data_nascimento.
      await supabaseAdmin.from("profiles").upsert(base as never);
    }

    return { criada: true as const };
  });
