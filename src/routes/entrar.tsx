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
import { renovarSessaoDemo } from "@/lib/demo.functions";
import { criarContaConfirmada } from "@/lib/cadastro.functions";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar no painel da cuidadora | CuideJá" },
      {
        name: "description",
        content:
          "Área exclusiva das cuidadoras CuideJá: entre com e-mail e senha ou Google para acessar perfil, vagas, agenda e ganhos.",
      },
      { property: "og:title", content: "Entrar no painel da cuidadora | CuideJá" },
      {
        property: "og:description",
        content: "Acesse sua conta para gerenciar perfil, candidaturas, agenda e pagamentos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntrarPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Informe um e-mail válido" }).max(255),
  senha: z.string().min(8, { message: "A senha precisa de ao menos 8 caracteres" }).max(72),
  nome: z.string().trim().max(80).optional(),
});

function EntrarPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const acessarPainel = async () => {
    try {
      await renovarSessaoDemo({ data: undefined });
    } catch (erro) {
      console.error("[demo] não foi possível renovar a sessão", erro);
    }
    navigate({ to: "/painel-cuidadora", replace: true });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void acessarPainel();
    }).catch((erro) => console.error("[login] sessão", erro));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        void acessarPainel();
      }
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
        const resultado = await criarContaConfirmada({
          data: {
            email: parsed.data.email,
            senha: parsed.data.senha,
            nome: parsed.data.nome ?? "",
            tipo: "cuidadora",
          },
        });
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.senha,
        });
        if (error) {
          if (resultado.jaExistia) {
            throw new Error("Já existe uma conta com este e-mail. Use a aba Entrar.");
          }
          throw error;
        }
        toast.success("Conta criada! Bem-vinda ao seu painel.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.senha,
        });
        if (error) {
          if (/confirm/i.test(error.message)) {
            throw new Error("E-mail ainda não confirmado. Tente criar a conta novamente para liberar o acesso.");
          }
          throw error;
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setCarregando(false);
    }
  };

  const entrarComGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(
        /not enabled|unsupported/i.test(error.message)
          ? "Login com Google ainda não está ativado no backend."
          : "Não foi possível entrar com Google.",
      );
    }
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
          <h1 className="text-3xl">Área da cuidadora</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Espaço privado para gerenciar seu perfil, vagas, agenda e ganhos.
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
                <Label htmlFor="nome">Seu nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={80}
                  placeholder="Ana Paula Ribeiro"
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
              {modo === "criar" ? "Criar conta e entrar" : "Entrar no painel"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={entrarComGoogle}>
            Continuar com Google
          </Button>

          <p className="mt-5 text-xs text-muted-foreground">
            Busca uma cuidadora?{" "}
            <Link to="/familia-entrar" className="underline">
              Entrar na área da família
            </Link>
          </p>

          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Seus dados são usados apenas para intermediar serviços, conforme a LGPD e nossos{" "}
            <Link to="/termos" className="underline">
              termos
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
