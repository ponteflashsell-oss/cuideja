import { Link } from "@tanstack/react-router";
import { HeartHandshake, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/cuidadores", label: "Encontrar cuidadores" },
  { to: "/para-profissionais", label: "Para profissionais" },
  { to: "/seguranca", label: "Segurança e verificação" },
  { to: "/termos", label: "Termos" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <HeartHandshake className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">CuidaJá</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-foreground font-semibold" }}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/para-profissionais">Sou cuidador(a)</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/cuidadores">Buscar agora</Link>
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="size-4" />
        </Button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-5 pb-5 pt-3 lg:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {nav.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Button asChild size="sm" className="mt-2">
              <Link to="/cuidadores" onClick={() => setOpen(false)}>
                Buscar agora
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
