import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { souAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin-entrar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso administrativo restrito | CuideJá" },
      {
        name: "description",
        content:
          "Entrada exclusiva da equipe administrativa do CuideJá para conferência de verificações, cadastros e documentos.",
      },
      { property: "og:title", content: "Acesso administrativo | CuideJá" },
      {
        property: "og:description",
        content: "Console interno do CuideJá, separado da área das cuidadoras e das famílias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminEntrarPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Informe um e-mail válido" }).max(255),
  senha: z.string().min(8, { message: "A senha precisa de ao menos 8 caracteres" }).max(72),
});

function AdminEntrarPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, senha });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setCarregando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.senha,
      });
      if (error) throw error;

      const acesso = await souAdmin();
      if (!acesso.admin) {
        await supabase.auth.signOut();
        throw new Error("Esta conta não tem permissão administrativa.");
      }
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <div className="surface-card p-7">
          <span className="flex size-10 items-center justify-center rounded-full bg-foreground text-background">
            <ShieldCheck className="size-5" />
          </span>
          <h1 className="mt-4 text-3xl">Acesso administrativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Área interna da equipe CuideJá, separada do painel de cuidadoras e famílias.
          </p>

          <form onSubmit={enviar} className="mt-6 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="admin-email">E-mail corporativo</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                placeholder="equipe@cuideja.com"
                autoComplete="email"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="admin-senha">Senha</Label>
              <Input
                id="admin-senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                maxLength={72}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" disabled={carregando} className="w-full">
              {carregando && <Loader2 className="mr-2 size-4 animate-spin" />}
              Entrar no console
            </Button>
          </form>

          <p className="mt-5 text-xs text-muted-foreground">
            Não é da equipe?{" "}
            <Link to="/entrar" className="underline">
              acessar a área da cuidadora
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
