/** Utilitários de CPF e data de nascimento (fluxo de acesso sem e-mail). */

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D+/g, "");
}

export function mascararCpf(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function mascararData(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function cpfValido(valor: string): boolean {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

/** Converte DD/MM/AAAA em AAAA-MM-DD; retorna null quando a data é inválida. */
export function dataNascimentoIso(valor: string): string | null {
  const d = somenteDigitos(valor);
  if (d.length !== 8) return null;
  const dia = Number(d.slice(0, 2));
  const mes = Number(d.slice(2, 4));
  const ano = Number(d.slice(4, 8));
  const agora = new Date();
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  if (ano < 1900 || ano > agora.getFullYear()) return null;
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCDate() !== dia || data.getUTCMonth() !== mes - 1) return null;
  if (data.getTime() > agora.getTime()) return null;
  const idade = (agora.getTime() - data.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (idade < 18) return null;
  return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
}

/**
 * Identificador interno usado no Supabase Auth. O usuário nunca vê nem informa
 * e-mail: o endereço é derivado do CPF apenas para autenticar. O e-mail real
 * poderá ser cadastrado depois, nas configurações do perfil.
 */
export function loginDoCpf(cpf: string): string {
  return `${somenteDigitos(cpf)}@cpf.cuideja.app`;
}
