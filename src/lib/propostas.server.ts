import type { SupabaseClient } from "@supabase/supabase-js";

export async function nomesDePerfis(
  supabase: SupabaseClient<any, any, any>,
  ids: string[],
): Promise<Record<string, string>> {
  const unicos = Array.from(new Set(ids.filter(Boolean)));
  if (!unicos.length) return {};

  const { data } = await supabase.from("profiles").select("id, nome").in("id", unicos);
  const mapa: Record<string, string> = {};
  for (const item of data ?? []) {
    mapa[item.id as string] = (item.nome as string) ?? "";
  }
  return mapa;
}
