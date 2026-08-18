export type Tarifa = { hora: number; diaria: number; plantao12: number; plantao24: number };

export const perfilCuidadora = {
  nome: "Ana Paula Ribeiro",
  idade: 38,
  cidade: "São Paulo",
  bairros: ["Pinheiros", "Vila Madalena", "Perdizes"],
  bio: "Técnica em enfermagem com 11 anos de experiência em rotinas de memória, medicação e mobilidade assistida.",
  verificado: true,
  nota: 4.9,
  avaliacoes: 87,
  tarifas: { hora: 38, diaria: 240, plantao12: 300, plantao24: 520 } as Tarifa,
};

export const tagsCuidado = [
  "Alzheimer",
  "Parkinson",
  "Cuidados pós-operatórios",
  "Mobilidade reduzida",
  "Aplicação de injeção/sondas",
  "Primeiros socorros",
  "Acompanhante hospitalar",
  "Cuidados paliativos",
] as const;

export const especialidadesAtivas = ["Alzheimer", "Mobilidade reduzida", "Primeiros socorros"];

export type Documento = {
  id: string;
  nome: string;
  status: "aprovado" | "em_analise" | "pendente";
  enviadoEm?: string;
};

export const documentos: Documento[] = [
  { id: "curso", nome: "Curso de Cuidador de Idosos", status: "aprovado", enviadoEm: "12/03/2026" },
  { id: "coren", nome: "Diploma Técnico de Enfermagem", status: "aprovado", enviadoEm: "12/03/2026" },
  { id: "documento", nome: "Documento oficial com foto (CNH ou RG)", status: "em_analise", enviadoEm: "02/08/2026" },
  { id: "selfie", nome: "Selfie + documento com foto", status: "pendente" },
];

export type Vaga = {
  id: string;
  titulo: string;
  resumo: string;
  bairro: string;
  distanciaKm: number;
  periodo: "Diurno" | "Noturno" | "Final de semana";
  tipo: string;
  valor: number;
  unidade: string;
  publicadoEm: string;
};

export const vagas: Vaga[] = [
  {
    id: "v1",
    titulo: "Plantão 12h diurno",
    resumo: "Idosa 82 anos, necessita de auxílio para mobilidade e medicação.",
    bairro: "Centro",
    distanciaKm: 3.2,
    periodo: "Diurno",
    tipo: "Mobilidade reduzida",
    valor: 320,
    unidade: "plantão",
    publicadoEm: "hoje",
  },
  {
    id: "v2",
    titulo: "Acompanhamento noturno 5x/semana",
    resumo: "Senhor 76 anos com Alzheimer em estágio inicial, agitação noturna.",
    bairro: "Pinheiros",
    distanciaKm: 1.4,
    periodo: "Noturno",
    tipo: "Alzheimer",
    valor: 300,
    unidade: "plantão",
    publicadoEm: "há 2 dias",
  },
  {
    id: "v3",
    titulo: "Pós-operatório de quadril",
    resumo: "Paciente 68 anos, 15 dias de cuidados com troca de curativo.",
    bairro: "Perdizes",
    distanciaKm: 4.8,
    periodo: "Diurno",
    tipo: "Cuidados pós-operatórios",
    valor: 45,
    unidade: "hora",
    publicadoEm: "há 4 dias",
  },
  {
    id: "v4",
    titulo: "Plantão de fim de semana 24h",
    resumo: "Idosa acamada, sonda de alimentação e higiene completa.",
    bairro: "Vila Madalena",
    distanciaKm: 2.1,
    periodo: "Final de semana",
    tipo: "Aplicação de injeção/sondas",
    valor: 540,
    unidade: "plantão",
    publicadoEm: "hoje",
  },
];

export type Negociacao = {
  id: string;
  familia: string;
  assunto: string;
  ultimaMensagem: string;
  quando: string;
  status: "analise" | "convite" | "conversa";
};

export const negociacoes: Negociacao[] = [
  {
    id: "n1",
    familia: "Família Duarte",
    assunto: "Plantão 12h diurno · Centro",
    ultimaMensagem: "Candidatura enviada com sua tarifa de R$ 320 por plantão.",
    quando: "há 3 h",
    status: "analise",
  },
  {
    id: "n2",
    familia: "Família Nakamura",
    assunto: "Acompanhamento noturno · Pinheiros",
    ultimaMensagem: "Vimos seu perfil verificado e gostaríamos de conversar.",
    quando: "há 1 dia",
    status: "convite",
  },
  {
    id: "n3",
    familia: "Família Alencar",
    assunto: "Pós-operatório · Perdizes",
    ultimaMensagem: "Podemos fechar 6h por dia começando na segunda?",
    quando: "há 20 min",
    status: "conversa",
  },
];

export type Compromisso = {
  id: string;
  data: string;
  horario: string;
  familia: string;
  endereco: string;
  emergencia: string;
  valor: number;
};

export const compromissos: Compromisso[] = [
  {
    id: "c1",
    data: "Seg, 17/08",
    horario: "07:00 – 19:00",
    familia: "Família Alencar",
    endereco: "Rua Cardoso de Almeida, 1120 — Perdizes",
    emergencia: "(11) 98888-1122",
    valor: 300,
  },
  {
    id: "c2",
    data: "Qua, 19/08",
    horario: "19:00 – 07:00",
    familia: "Família Nakamura",
    endereco: "Rua dos Pinheiros, 480 — Pinheiros",
    emergencia: "(11) 97777-4455",
    valor: 320,
  },
  {
    id: "c3",
    data: "Sáb, 22/08",
    horario: "08:00 – 08:00 (24h)",
    familia: "Família Duarte",
    endereco: "Av. São João, 90 — Centro",
    emergencia: "(11) 96666-7788",
    valor: 540,
  },
];

export const disponibilidadeInicial: Record<string, string[]> = {
  Seg: ["Manhã", "Tarde"],
  Ter: [],
  Qua: ["Noite"],
  Qui: ["Manhã"],
  Sex: ["Tarde", "Noite"],
  Sáb: ["Manhã", "Tarde", "Noite"],
  Dom: [],
};

export const turnos = ["Manhã", "Tarde", "Noite"] as const;
export const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

export const ganhos = {
  mes: 3840,
  aReceber: 1160,
  plantoesMes: 13,
  extrato: [
    { id: "e1", descricao: "Plantão 12h · Família Alencar", data: "10/08/2026", valor: 300, status: "pago" },
    { id: "e2", descricao: "Diária · Família Nakamura", data: "08/08/2026", valor: 240, status: "pago" },
    { id: "e3", descricao: "Plantão 24h · Família Duarte", data: "03/08/2026", valor: 540, status: "pago" },
    { id: "e4", descricao: "Plantão 12h · Família Nakamura", data: "15/08/2026", valor: 320, status: "a_receber" },
  ] as { id: string; descricao: string; data: string; valor: number; status: "pago" | "a_receber" }[],
};

export const depoimentos = [
  {
    id: "d1",
    familia: "Família Alencar",
    nota: 5,
    texto: "Pontual, cuidadosa e enviou relatório diário. Minha mãe se sentiu muito segura.",
    data: "Agosto de 2026",
  },
  {
    id: "d2",
    familia: "Família Nakamura",
    nota: 5,
    texto: "Excelente manejo do quadro de Alzheimer, especialmente à noite.",
    data: "Julho de 2026",
  },
  {
    id: "d3",
    familia: "Família Duarte",
    nota: 4,
    texto: "Muito atenciosa com a medicação. Recomendo para plantões longos.",
    data: "Julho de 2026",
  },
];
