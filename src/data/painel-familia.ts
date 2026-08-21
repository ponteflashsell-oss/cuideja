export const necessidadesCuidado = [
  "Idosos",
  "Alzheimer e demências",
  "Parkinson",
  "Pós-operatório",
  "Mobilidade reduzida",
  "Acompanhante hospitalar",
  "Cuidados paliativos",
  "Pessoa com deficiência",
  "Crianças",
] as const;

export const documentosFamilia = [
  {
    id: "documento",
    nome: "Documento oficial com foto (CNH ou RG) do responsável",
  },
  { id: "selfie", nome: "Selfie com o documento na mão" },
] as const;

export type PedidoFamilia = {
  id: string;
  titulo: string;
  resumo: string;
  bairro: string;
  periodo: "Diurno" | "Noturno" | "Final de semana";
  valor: number;
  unidade: string;
  candidatas: number;
  status: "aberto" | "em_selecao" | "confirmado";
  publicadoEm: string;
};

export const pedidosFamilia: PedidoFamilia[] = [
  {
    id: "p1",
    titulo: "Plantão 12h diurno para minha mãe",
    resumo: "Idosa de 82 anos, auxílio com medicação e mobilidade.",
    bairro: "Centro",
    periodo: "Diurno",
    valor: 320,
    unidade: "plantão",
    candidatas: 4,
    status: "em_selecao",
    publicadoEm: "hoje",
  },
  {
    id: "p2",
    titulo: "Acompanhante hospitalar por 3 noites",
    resumo: "Internação prevista para cirurgia de quadril.",
    bairro: "Pinheiros",
    periodo: "Noturno",
    valor: 300,
    unidade: "plantão",
    candidatas: 2,
    status: "aberto",
    publicadoEm: "há 2 dias",
  },
];

export type ConversaFamilia = {
  id: string;
  cuidadora: string;
  assunto: string;
  ultimaMensagem: string;
  quando: string;
  status: "convite" | "conversa" | "proposta";
};

export const conversasFamilia: ConversaFamilia[] = [
  {
    id: "c1",
    cuidadora: "Ana Paula Ribeiro",
    assunto: "Plantão 12h diurno · Centro",
    ultimaMensagem: "Tenho disponibilidade a partir de segunda, R$ 320 por plantão.",
    quando: "há 20 min",
    status: "proposta",
  },
  {
    id: "c2",
    cuidadora: "Márcia Souza",
    assunto: "Acompanhante hospitalar · Pinheiros",
    ultimaMensagem: "Já fiz acompanhamentos pós-cirúrgicos parecidos, posso detalhar.",
    quando: "há 3 h",
    status: "conversa",
  },
];
