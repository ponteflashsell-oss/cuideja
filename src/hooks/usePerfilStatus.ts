import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PerfilStatus = {
  carregando: boolean;
  verificado: boolean;
  cadastroCompleto: boolean;
  nome: string;
  cidade: string;
  etapas: {
    nome: boolean;
    cidade: boolean;
    bio: boolean;
    bairros: boolean;
    especialidades: boolean;
    tarifas: boolean;
  };
};

const vazio: PerfilStatus = {
  carregando: true,
  verificado: false,
  cadastroCompleto: false,
  nome: "",
  cidade: "",
  etapas: {
    nome: false,
    cidade: false,
    bio: false,
    bairros: false,
    especialidades: false,
    tarifas: false,
  },
};

/** Lê o perfil da cuidadora logada para saber se o acesso completo está liberado. */
export function usePerfilStatus(): PerfilStatus {
  const [status, setStatus] = useState<PerfilStatus>(vazio);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (ativo) setStatus({ ...vazio, carregando: false });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select(
          "nome, cidade, bio, bairros, especialidades, tarifa_hora, verificado",
        )
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!ativo) return;

      const etapas = {
        nome: Boolean(data?.nome?.trim()),
        cidade: Boolean(data?.cidade?.trim()),
        bio: Boolean(data?.bio?.trim()),
        bairros: Boolean(data?.bairros?.length),
        especialidades: Boolean(data?.especialidades?.length),
        tarifas: Number(data?.tarifa_hora ?? 0) > 0,
      };

      setStatus({
        carregando: false,
        verificado: Boolean(data?.verificado),
        cadastroCompleto: Object.values(etapas).every(Boolean),
        nome: data?.nome?.trim() ?? "",
        cidade: data?.cidade?.trim() ?? "",
        etapas,
      });
    })();
    return () => {
      ativo = false;
    };
  }, []);

  return status;
}
