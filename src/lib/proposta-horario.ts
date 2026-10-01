export function minutosDoHorario(horario: string) {
  const [horas, minutos] = horario.split(":").map(Number);
  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return 0;
  return horas * 60 + minutos;
}

export function horasEntre(inicio: string, fim: string) {
  const minutosInicio = minutosDoHorario(inicio);
  let diferenca = minutosDoHorario(fim) - minutosInicio;
  if (diferenca <= 0) diferenca += 24 * 60;
  return Math.max(1, Math.round((diferenca / 60) * 2) / 2);
}

export function horarioFinal(inicio: string, quantidadeHoras: number) {
  const total = minutosDoHorario(inicio) + Math.round(quantidadeHoras * 60);
  const horas = Math.floor((total % (24 * 60)) / 60);
  const minutos = total % 60;
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

export function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}