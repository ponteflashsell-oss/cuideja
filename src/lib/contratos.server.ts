/** Montagem do termo de prestação de serviços entre família e cuidadora. */

export type DadosTermo = {
  reservaId: string;
  emitidoEm: string;
  familia: { nome: string; cpf: string; telefone: string };
  cuidadora: { nome: string; cpf: string; telefone: string };
  servico: {
    endereco: string;
    dataInicio: string;
    dataFim: string;
    horaInicio: string;
    horaFim: string;
    assistido: string;
    valor: number;
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
  const emitido = new Date(d.emitidoEm);
  const dataEmissao = emitido.toLocaleDateString("pt-BR");
  const horaEmissao = emitido.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `CONTRATO DE PRESTACAO DE SERVICOS DE CUIDADO AUTONOMO

================================================================================
                 ORDEM DE SERVICO / RESUMO DA CONTRATACAO
================================================================================
Data de Emissao do Contrato: ${dataEmissao} as ${horaEmissao}
Codigo da Reserva / ID: #${d.reservaId}

1. DADOS DO CONTRATANTE (CLIENTE/FAMILIA)
  Nome Completo: ${ou(familia.nome)}
  CPF: ${ou(familia.cpf, "pendente de conferencia")} | Telefone: ${ou(familia.telefone)}

2. DADOS DA CONTRATADA (CUIDADORA)
  Nome Completo: ${ou(cuidadora.nome)}
  CPF: ${ou(cuidadora.cpf, "pendente de conferencia")} | Telefone: ${ou(cuidadora.telefone)}

3. LOCAL E PERIODO DE ATENDIMENTO
  Endereco da Prestacao: ${ou(servico.endereco)}
  Data de Inicio: ${dataBr(servico.dataInicio)} | Horario de Entrada (Chegada): ${ou(servico.horaInicio)}
  Data de Termino: ${dataBr(servico.dataFim)} | Horario de Saida (Termino): ${ou(servico.horaFim)}
  Assistido(a): ${ou(servico.assistido)}

4. VALORES E CONDICOES FINANCEIRAS
  Valor Bruto da Diaria/Servico: ${dinheiro(servico.valor)}
  Forma de Pagamento: Processado via Plataforma
================================================================================

CLAUSULA 1 - DO OBJETO
1.1. O presente contrato tem por objeto a prestacao de servicos autonomos de acompanhamento, suporte e cuidados a pessoa indicada no cabecalho deste instrumento, estritamente no local, datas, horario de chegada e horario de saida especificados na Ordem de Servico.

CLAUSULA 2 - DA AUTONOMIA E AUSENCIA DE VINCULO
2.1. A CONTRATADA declara ser profissional autonoma, atuando por conta propria, sem relacao de exclusividade, subordinacao juridica, habitualidade compulsoria ou vinculo empregaticio com o CONTRATANTE.
2.2. A CONTRATADA possui liberdade para gerenciar sua agenda, aceitar ou recusar atendimentos e prestar servicos a outros tomadores ou plataformas.
2.3. A CuideJa atua exclusivamente como intermediadora tecnologica, nao sendo parte integrante deste contrato nem empregadora de qualquer das partes.

CLAUSULA 3 - DAS OBRIGACOES DA CONTRATADA
3.1. Apresentar-se no local no horario de entrada e prestar os servicos com zelo, pontualidade, respeito e etica ate o horario de saida.
3.2. Seguir as orientacoes fornecidas pelo CONTRATANTE sobre a rotina do assistido, incluindo medicacao oral prescrita, alimentacao e higiene.
3.3. Comunicar imediatamente qualquer intercorrencia de saude, acidente ou emergencia.
3.4. Manter sigilo sobre informacoes pessoais, medicas e rotinas familiares.

CLAUSULA 4 - DAS OBRIGACOES DO CONTRATANTE
4.1. Garantir o acesso da CONTRATADA ao local no horario de entrada e libera-la no horario de saida.
4.2. Fornecer informacoes precisas sobre o estado de saude, limitacoes, necessidades e medicacao do assistido.
4.3. Garantir ambiente de trabalho seguro e respeito a integridade fisica e moral da CONTRATADA.
4.4. Efetuar o pagamento do valor total exclusivamente pelos metodos da plataforma.

CLAUSULA 5 - DO PRECO E FORMA DE PAGAMENTO
5.1. O CONTRATANTE pagara o valor total indicado na Ordem de Servico.
5.2. O pagamento sera processado via plataforma no momento da reserva ou conforme a modalidade escolhida.
5.3. E vedado realizar pagamentos por fora da plataforma para servicos intermediados por ela.

CLAUSULA 6 - DO CANCELAMENTO, REAGENDAMENTO E PENALIDADES
6.1. Cancelamentos ou alteracoes devem ser feitos na plataforma com antecedencia minima de 24 horas.
6.2. Cancelamento com menos de 24 horas ou no-show implicara retencao ou cobranca de 50% do valor da diaria, repassada a CONTRATADA.
6.3. Cancelamento no momento da chegada ou com menos de 2 horas do inicio, sem forca maior, implicara retencao integral de 100% do valor da diaria.
6.4. Condutas que causem prejuizos sujeitarao o responsavel as medidas judiciais cabiveis, nos termos dos artigos 186, 389 e 927 do Codigo Civil.

CLAUSULA 7 - DO FORO
7.1. Fica eleito o Foro da Comarca de domicilio do CONTRATANTE.

Este contrato fica vinculado a reserva #${d.reservaId} e passa a valer apos o aceite eletronico das duas partes, com registro de data, hora e titular da conta.`;
}
