import { supabase } from "@/integrations/supabase/client";

/** Initialize only missing profiles; existing account types are never changed. */
export async function prepararPerfilAcesso(tipoPadrao: "familia" | "cuidadora") {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Não foi possível confirmar o login. Tente novamente.");
  const { data: perfil, error } = await supabase.from("profiles").select("tipo").eq("id", auth.user.id).maybeSingle();
  if (error) throw error;
  if (perfil) return perfil.tipo === "familia" ? "familia" : "cuidadora";

  const escolhido = window.sessionStorage.getItem("cuideja:google:tipo");
  const tipo = escolhido === "familia" || escolhido === "cuidadora" ? escolhido : tipoPadrao;
  const nome = auth.user.user_metadata?.['full_name'] ?? auth.user.user_metadata?.['name'];
  const { error: insertError } = await supabase.from("profiles").upsert({
    id: auth.user.id,
    tipo,
    nome: typeof nome === "string" ? nome : "",
    email: auth.user.email ?? null,
    verificado: false,
    status_verificacao: "pendente",
  }, { onConflict: "id", ignoreDuplicates: true });
  if (insertError) throw insertError;
  const { data: salvo, error: readError } = await supabase.from("profiles").select("tipo").eq("id", auth.user.id).single();
  if (readError) throw readError;
  window.sessionStorage.removeItem("cuideja:google:tipo");
  return salvo.tipo === "familia" ? "familia" : "cuidadora";
}