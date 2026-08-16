export type Caregiver = {
  id: string;
  nome: string;
  cidade: string;
  uf: string;
  especialidades: string[];
  diaria: number;
  hora: number;
  nota: number;
  avaliacoes: number;
  experiencia: number;
  verificado: boolean;
  destaque: boolean;
  bio: string;
};

export const especialidades = [
  "Idosos",
  "Alzheimer e demências",
  "Pós-operatório",
  "Acompanhante hospitalar",
  "Cuidados paliativos",
  "Pessoa com deficiência",
  "Crianças",
] as const;

export const caregivers: Caregiver[] = [
  {
    id: "ana-paula",
    nome: "Ana Paula Ribeiro",
    cidade: "São Paulo",
    uf: "SP",
    especialidades: ["Idosos", "Alzheimer e demências"],
    diaria: 240,
    hora: 38,
    nota: 4.9,
    avaliacoes: 87,
    experiencia: 11,
    verificado: true,
    destaque: true,
    bio: "Técnica em enfermagem com foco em rotinas de memória, medicação e mobilidade assistida.",
  },
  {
    id: "marcia-souza",
    nome: "Márcia Souza",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    especialidades: ["Acompanhante hospitalar", "Pós-operatório"],
    diaria: 260,
    hora: 42,
    nota: 4.8,
    avaliacoes: 64,
    experiencia: 8,
    verificado: true,
    destaque: false,
    bio: "Plantões de 12h em hospital e domicílio, com relatório diário para a família.",
  },
  {
    id: "joana-lima",
    nome: "Joana Lima",
    cidade: "Belo Horizonte",
    uf: "MG",
    especialidades: ["Idosos", "Cuidados paliativos"],
    diaria: 220,
    hora: 35,
    nota: 5.0,
    avaliacoes: 41,
    experiencia: 14,
    verificado: true,
    destaque: true,
    bio: "Experiência em conforto, higiene e apoio emocional em cuidados de fim de vida.",
  },
  {
    id: "rafael-mendes",
    nome: "Rafael Mendes",
    cidade: "Curitiba",
    uf: "PR",
    especialidades: ["Pessoa com deficiência", "Idosos"],
    diaria: 250,
    hora: 40,
    nota: 4.7,
    avaliacoes: 33,
    experiencia: 6,
    verificado: true,
    destaque: false,
    bio: "Transferências seguras, fisioterapia assistida e apoio em rotinas de autonomia.",
  },
  {
    id: "cleide-barros",
    nome: "Cleide Barros",
    cidade: "Salvador",
    uf: "BA",
    especialidades: ["Idosos", "Crianças"],
    diaria: 190,
    hora: 30,
    nota: 4.6,
    avaliacoes: 58,
    experiencia: 9,
    verificado: false,
    destaque: false,
    bio: "Cuidados diurnos, preparo de refeições e acompanhamento em consultas.",
  },
  {
    id: "sonia-tavares",
    nome: "Sônia Tavares",
    cidade: "Porto Alegre",
    uf: "RS",
    especialidades: ["Alzheimer e demências", "Idosos"],
    diaria: 275,
    hora: 45,
    nota: 4.9,
    avaliacoes: 72,
    experiencia: 17,
    verificado: true,
    destaque: true,
    bio: "Especialista em quadros avançados de demência e manejo de agitação noturna.",
  },
];
