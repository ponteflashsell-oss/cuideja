import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FamiliaStatus = {
  carregando: boolean;
  verificado: boolean;
  cadastroCompleto: boolean;
  nome: string;
  cidade: string;
  etapas: {
    nome: boolean;
    cidade: boolean;
    bairros: boolean;
    necessidades: boolean;
    descricao: boolean;
  };
};

const vazio: FamiliaStatus = {
  carregando: true,
  verificado: false,
  cadastroCompleto: false,
  nome: "",
  cidade: "",
  etapas: { nome: false, cidade: false, bairros: false, necessidades: false, descricao: false },
};

/** Lê o perfil da família logada para saber se o acesso completo está liberado. */
export function useFamiliaStatus(): FamiliaStatus {
  const [status, setStatus] = useState<FamiliaStatus>(vazio);

  useEffect(() => {
    let ativo = true;
    let jaVerificado = false;
    let iniciado = false;

    const carregar = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (ativo) setStatus({ ...vazio, carregando: false });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("nome, cidade, bio, bairros, especialidades, verificado")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!ativo) return;

      const etapas = {
        nome: Boolean(data?.nome?.trim()),
        cidade: Boolean(data?.cidade?.trim()),
        bairros: Boolean(data?.bairros?.length),
        necessidades: Boolean(data?.especialidades?.length),
        descricao: Boolean(data?.bio?.trim()),
      };
      const verificado = Boolean(data?.verificado);

      setStatus({
        carregando: false,
        verificado,
        cadastroCompleto: Object.values(etapas).every(Boolean),
        nome: data?.nome?.trim() ?? "",
        cidade: data?.cidade?.trim() ?? "",
        etapas,
      });

      if (verificado && jaVerificado === false && iniciado) {
        window.location.reload();
        return;
      }
      jaVerificado = verificado;
      iniciado = true;
    };

    void carregar();
    const timer = window.setInterval(() => void carregar(), 20_000);
    return () => {
      ativo = false;
      window.clearInterval(timer);
    };
  }, []);

  return status;
}
