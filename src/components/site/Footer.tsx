import { Link } from "@tanstack/react-router";
import { HeartHandshake } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <HeartHandshake className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold">CuideJá</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Plataforma nacional de intermediação tecnológica entre famílias e cuidadores autônomos.
            Não somos agência de empregos nem empregadora: a contratação é direta entre as partes.
          </p>
        </div>
        <div className="text-sm">
          <h3 className="font-display text-base">Plataforma</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/cuidadores">Encontrar cuidadores</Link>
            </li>
            <li>
              <Link to="/para-profissionais">Para profissionais</Link>
            </li>
            <li>
              <Link to="/seguranca">Segurança e verificação</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-display text-base">Jurídico</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/termos">Termos de uso</Link>
            </li>
            <li>
              <Link to="/termos">Minuta de prestação de serviços</Link>
            </li>
            <li>
              <Link to="/seguranca">Privacidade e LGPD</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-5 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CuideJá Tecnologia. Intermediação de serviços — sem vínculo
        empregatício.
      </div>
    </footer>
  );
}
