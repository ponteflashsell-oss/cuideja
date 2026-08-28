import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HeartHandshake, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/familia-entrar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar na área da família | CuidaJá" },
      {
        name: "description",
        content:
          "Área das famílias CuidaJá: entre com e-mail e senha ou Google para buscar cuidadoras verificadas, publicar pedidos e combinar plantões.",
      },
      { property: "og:title", content: "Entrar na área da família | CuidaJá" },
      {
        property: "og:description",
        content: "Acesse sua conta para encontrar cuidadoras verificadas e organizar os cuidados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FamiliaEntrarPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Informe um e-mail válido" }).max(255),
  senha: z.string().min(8, { message: "A senha precisa de ao menos 8 caracteres" }).max(72),
  nome: z.string().trim().max(80).optional(),
});

/** Define o painel correto sem alterar o papel de uma conta existente. */
async function destinoDaSessao() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return "/familia-entrar" as const;
  const [{ data: perfil }, { data: papelAdmin }] = await Promise.all([
    supabase.from("profiles").select("tipo").eq("id", auth.user.id).maybeSingle(),
    supabase.from("user_roles").select("user_id").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle(),
  ]);
  if (papelAdmin) return "/painel-familia" as const;
  return perfil?.tipo === "cuidadora" ? ("/painel-cuidadora" as const) : ("/painel-familia" as const);
}

function FamiliaEntrarPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const seguir = async () => {
      navigate({ to: await destinoDaSessao(), replace: true });
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void seguir();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) void seguir();
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, senha, nome });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setCarregando(true);
    try {
      if (modo === "criar") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome: parsed.data.nome ?? "", tipo: "familia" },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Bem-vindo à área da família.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.senha,
        });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setCarregando(false);
    }
  };

  const entrarComGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: await destinoDaSessao(), replace: true });
  };

  return (
    <div className="hero-veil flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <HeartHandshake className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">CuidaJá</span>
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">Voltar ao site</Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
        <div className="surface-card p-7">
          <h1 className="text-3xl">Área da família</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para quem <strong>busca cuidadora</strong>: descreva a necessidade, encontre perfis
            verificados e combine os plantões com segurança.
          </p>

          <Tabs value={modo} onValueChange={(v) => setModo(v as typeof modo)} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={enviar} className="mt-5 grid gap-4">
            {modo === "criar" && (
              <div className="grid gap-1.5">
                <Label htmlFor="nome">Nome do responsável</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={80}
                  placeholder="Carlos Duarte"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                placeholder="voce@email.com"
                autoComplete="email"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                maxLength={72}
                placeholder="Mínimo de 8 caracteres"
                autoComplete={modo === "criar" ? "new-password" : "current-password"}
              />
            </div>
            <Button type="submit" disabled={carregando} className="w-full">
              {carregando && <Loader2 className="mr-2 size-4 animate-spin" />}
              {modo === "criar" ? "Criar conta e entrar" : "Entrar na área da família"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={entrarComGoogle}>
            Continuar com Google
          </Button>

          <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Também verificamos as famílias com documento e selfie, para proteger as cuidadoras.
            Consulte nossos{" "}
            <Link to="/termos" className="underline">
              termos
            </Link>
            .
          </p>

          <p className="mt-3 text-xs text-muted-foreground">
            É cuidadora?{" "}
            <Link to="/entrar" className="underline">
              Entrar na área profissional
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
