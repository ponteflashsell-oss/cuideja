import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, HeartHandshake, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  cpfValido,
  dataNascimentoIso,
  loginDoCpf,
  mascararCpf,
  mascararData,
  somenteDigitos,
} from "@/lib/cpf";
import { cpfTemConta, criarContaCpf } from "@/lib/acesso-cpf.functions";

type Etapa = "cpf" | "senha" | "cadastro1" | "cadastro2";

type Props = {
  tipo: "cuidadora" | "familia";
  titulo: string;
  descricao: React.ReactNode;
  rodape: React.ReactNode;
  aoAutenticar: () => void | Promise<void>;
};

function CampoSenha(props: {
  id: string;
  label: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={props.id}>{props.label}</Label>
      <div className="relative">
        <Input
          id={props.id}
          type={visivel ? "text" : "password"}
          value={props.valor}
          onChange={(e) => props.onChange(e.target.value)}
          maxLength={72}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:text-foreground"
        >
          {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function AcessoCpf({ tipo, titulo, descricao, rodape, aoAutenticar }: Props) {
  const [etapa, setEtapa] = useState<Etapa>("cpf");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) void aoAutenticar();
      })
      .catch((erro) => console.error("[acesso] sessão", erro));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) void aoAutenticar();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verificarCpf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpfValido(cpf)) {
      toast.error("Informe um CPF válido");
      return;
    }
    setCarregando(true);
    try {
      const { existe } = await cpfTemConta({ data: { cpf: somenteDigitos(cpf) } });
      setEtapa(existe ? "senha" : "cadastro1");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível verificar o CPF.");
    } finally {
      setCarregando(false);
    }
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length < 8) {
      toast.error("A senha precisa de ao menos 8 caracteres");
      return;
    }
    setCarregando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginDoCpf(cpf),
        password: senha,
      });
      if (error) throw new Error("Senha incorreta. Tente novamente.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  };

  const avancarCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataNascimentoIso(nascimento)) {
      toast.error("Informe uma data de nascimento válida (maior de 18 anos)");
      return;
    }
    setEtapa("cadastro2");
  };

  const finalizarCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    const iso = dataNascimentoIso(nascimento);
    if (!iso) {
      toast.error("Data de nascimento inválida");
      setEtapa("cadastro1");
      return;
    }
    if (nome.trim().split(/\s+/).length < 2) {
      toast.error("Informe nome e sobrenome");
      return;
    }
    if (senha.length < 8) {
      toast.error("A senha precisa de ao menos 8 caracteres");
      return;
    }
    if (senha !== confirmar) {
      toast.error("As senhas não conferem");
      return;
    }
    setCarregando(true);
    try {
      await criarContaCpf({
        data: { cpf: somenteDigitos(cpf), nome: nome.trim(), senha, dataNascimento: iso, tipo },
      });
      const { error } = await supabase.auth.signInWithPassword({
        email: loginDoCpf(cpf),
        password: senha,
      });
      if (error) throw error;
      toast.success("Cadastro concluído! Bem-vindo(a).");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível concluir o cadastro.");
    } finally {
      setCarregando(false);
    }
  };

  const voltar = () => {
    setSenha("");
    setConfirmar("");
    setEtapa(etapa === "cadastro2" ? "cadastro1" : "cpf");
  };

  return (
    <div className="hero-veil flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <HeartHandshake className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">CuideJá</span>
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">Voltar ao site</Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
        <div className="surface-card p-7">
          <h1 className="text-3xl">{titulo}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{descricao}</p>

          {etapa === "cpf" && (
            <form onSubmit={verificarCpf} className="mt-6 grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(mascararCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  autoComplete="username"
                />
              </div>
              <Button type="submit" disabled={carregando} className="w-full">
                {carregando && <Loader2 className="mr-2 size-4 animate-spin" />}
                Continuar
              </Button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                ou
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={carregando}
                onClick={entrarComGoogle}
              >
                <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z" />
                  <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.6-2-6.5-4.8H1.7v3A12 12 0 0 0 12 24Z" />
                  <path fill="#FBBC05" d="M5.5 14.6a7.2 7.2 0 0 1 0-4.6v-3H1.7a12 12 0 0 0 0 10.6l3.8-3Z" />
                  <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.6 11.6 0 0 0 12 0 12 12 0 0 0 1.7 6l3.8 3c.9-2.8 3.5-4.2 6.5-4.2Z" />
                </svg>
                Continuar com Google
              </Button>

              <p className="text-xs text-muted-foreground">
                Não pedimos e-mail para entrar com CPF. Você poderá cadastrar um e-mail depois, nas
                configurações do seu perfil.
              </p>
            </form>
          )}


          {etapa === "senha" && (
            <form onSubmit={entrar} className="mt-6 grid gap-4">
              <p className="text-sm text-muted-foreground">
                CPF <strong>{mascararCpf(cpf)}</strong>
              </p>
              <CampoSenha
                id="senha"
                label="Senha"
                valor={senha}
                onChange={setSenha}
                placeholder="Sua senha"
                autoComplete="current-password"
              />
              <Button type="submit" disabled={carregando} className="w-full">
                {carregando && <Loader2 className="mr-2 size-4 animate-spin" />}
                Entrar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={voltar}>
                <ArrowLeft className="mr-1 size-4" /> Usar outro CPF
              </Button>
            </form>
          )}

          {etapa === "cadastro1" && (
            <form onSubmit={avancarCadastro} className="mt-6 grid gap-4">
              <p className="text-sm text-muted-foreground">
                Primeiro acesso — passo 1 de 2
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="cpf1">CPF</Label>
                <Input
                  id="cpf1"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(mascararCpf(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="nascimento">Data de nascimento</Label>
                <Input
                  id="nascimento"
                  inputMode="numeric"
                  value={nascimento}
                  onChange={(e) => setNascimento(mascararData(e.target.value))}
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <Button type="submit" className="w-full">
                Avançar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={voltar}>
                <ArrowLeft className="mr-1 size-4" /> Voltar
              </Button>
            </form>
          )}

          {etapa === "cadastro2" && (
            <form onSubmit={finalizarCadastro} className="mt-6 grid gap-4">
              <p className="text-sm text-muted-foreground">
                Primeiro acesso — passo 2 de 2
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="nome">Nome e sobrenome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={80}
                  placeholder="Ana Paula Ribeiro"
                  autoComplete="name"
                />
              </div>
              <CampoSenha
                id="senha-nova"
                label="Senha"
                valor={senha}
                onChange={setSenha}
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
              />
              <CampoSenha
                id="senha-confirmar"
                label="Confirmar senha"
                valor={confirmar}
                onChange={setConfirmar}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
              <Button type="submit" disabled={carregando} className="w-full">
                {carregando && <Loader2 className="mr-2 size-4 animate-spin" />}
                Finalizar cadastro
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={voltar}>
                <ArrowLeft className="mr-1 size-4" /> Voltar
              </Button>
            </form>
          )}

          <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Seus dados são usados apenas para intermediar serviços, conforme a LGPD e nossos{" "}
            <Link to="/termos" className="underline">
              termos
            </Link>
            .
          </p>

          <div className="mt-3 text-xs text-muted-foreground">{rodape}</div>
        </div>
      </main>
    </div>
  );
}
