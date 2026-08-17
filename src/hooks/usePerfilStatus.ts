import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PerfilStatus = {
  carregando: boolean;
  verificado: boolean;
  cadastroCompleto: boolean;
};

/** Lê o perfil da cuidadora logada para saber se o acesso completo está liberado. */
export function usePerfilStatus(): PerfilStatus {
  const [status, setStatus] = useState<PerfilStatus>({
    carregando: true,
    verificado: false,
    cadastroCompleto: false,
  });

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (ativo) setStatus({ carregando: false, verificado: false, cadastroCompleto: false });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("nome, bio, bairros, especialidades, tarifa_hora, verificado")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!ativo) return;
      const cadastroCompleto = Boolean(
        data &&
          data.nome?.trim() &&
          data.bio?.trim() &&
          data.bairros?.length &&
          data.especialidades?.length &&
          Number(data.tarifa_hora) > 0,
      );
      setStatus({
        carregando: false,
        verificado: Boolean(data?.verificado),
        cadastroCompleto,
      });
    })();
    return () => {
      ativo = false;
    };
  }, []);

  return status;
}
