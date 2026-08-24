/** Montagem do termo de prestação de serviços entre família e cuidadora. */

export const regimes = {
  hora: "Por hora",
  diaria: "Diária",
  plantao12: "Plantão de 12 horas",
  plantao24: "Plantão de 24 horas",
} as const;

export type Regime = keyof typeof regimes;

export type DadosTermo = {
  familia: { nome: string; cpf: string; cidade: string; bairro: string; verificada: boolean };
  cuidadora: { nome: string; cpf: string; cidade: string; verificada: boolean };
  servico: {
    descricao: string;
    endereco: string;
    regime: Regime;
    dataInicio: string;
    dataFim: string;
    horaInicio: string;
    horaFim: string;
    valor: number;
    taxaPercentual: number;
    observacoes: string;
  };
};

const dataBr = (iso: string) => {
  if (!iso) return "não informada";
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
};

const dinheiro = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const ou = (v: string, alternativa = "não informado") => (v.trim() ? v.trim() : alternativa);

export function montarTermo(d: DadosTermo): string {
  const { familia, cuidadora, servico } = d;
  const taxa = (servico.valor * servico.taxaPercentual) / 100;
  const liquido = servico.valor - taxa;

  return `TERMO DE PRESTAÇÃO DE SERVIÇOS DE CUIDADO — CUIDAJÁ

1. PARTES

CONTRATANTE (família / responsável)
Nome: ${ou(familia.nome)}
CPF: ${ou(familia.cpf, "pendente de conferência")}
Cidade: ${ou(familia.cidade)}
Bairro do atendimento: ${ou(familia.bairro)}
Identidade conferida pela plataforma: ${familia.verificada ? "sim" : "em conferência"}

CONTRATADA (profissional autônoma de cuidado)
Nome: ${ou(cuidadora.nome)}
CPF: ${ou(cuidadora.cpf, "pendente de conferência")}
Cidade de atuação: ${ou(cuidadora.cidade)}
Identidade conferida pela plataforma: ${cuidadora.verificada ? "sim" : "em conferência"}

2. OBJETO
Prestação de serviços de cuidado, de forma autônoma e sem vínculo empregatício, conforme o plano combinado entre as partes:
${ou(servico.descricao, "plano de cuidados a combinar")}

Local do atendimento: ${ou(servico.endereco)}

3. PRAZO, REGIME E HORÁRIO
Regime combinado: ${regimes[servico.regime]}
Início: ${dataBr(servico.dataInicio)}${servico.dataFim ? ` · Término previsto: ${dataBr(servico.dataFim)}` : " · Sem data final definida (atendimento eventual)"}
Horário: ${ou(servico.horaInicio, "a combinar")} às ${ou(servico.horaFim, "a combinar")}
O atendimento é eventual ou por período determinado, sem jornada fixa imposta, exclusividade ou subordinação.

4. VALOR E PAGAMENTO
Valor combinado por ${regimes[servico.regime].toLowerCase()}: ${dinheiro(servico.valor)}
Taxa de intermediação da plataforma: ${servico.taxaPercentual}% (${dinheiro(taxa)})
Valor líquido estimado à profissional: ${dinheiro(liquido)}
O pagamento é acordado diretamente entre as partes, na forma e periodicidade combinadas antes do início do atendimento.

5. AUTONOMIA E AUSÊNCIA DE VÍNCULO
A CuidaJá atua exclusivamente como intermediadora tecnológica. Não há relação de emprego, subordinação, pessoalidade obrigatória, habitualidade imposta ou exclusividade entre as partes, nem entre qualquer das partes e a plataforma. A profissional define livremente sua agenda e pode atuar em outras plataformas.

6. OBRIGAÇÕES DAS PARTES
A CONTRATADA compromete-se a cumprir o plano de cuidados combinado, comunicar imediatamente qualquer intercorrência e manter sigilo sobre a rotina e os dados da família.
A CONTRATANTE compromete-se a fornecer condições adequadas ao atendimento, informar o histórico de saúde relevante, não exigir tarefas fora do plano combinado e efetuar o pagamento no prazo acordado.

7. DADOS PESSOAIS (LGPD)
As partes autorizam o tratamento dos dados pessoais indicados neste termo para a finalidade exclusiva de identificação, registro do consentimento e segurança do atendimento, conforme a Lei 13.709/2018.

8. RESCISÃO
Qualquer das partes pode encerrar o atendimento comunicando a outra com antecedência mínima de 24 horas, salvo caso de urgência ou descumprimento grave, quando o encerramento é imediato.

9. CONSENTIMENTO
Este termo passa a valer quando as duas partes registrarem o aceite eletrônico na plataforma, com data, hora e identificação do titular da conta. O registro do aceite fica arquivado na CuidaJá.

${ou(servico.observacoes, "") ? `10. OBSERVAÇÕES COMBINADAS\n${servico.observacoes.trim()}\n` : ""}`;
}
