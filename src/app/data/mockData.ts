export type Criticidade = 'Baixa' | 'Média' | 'Alta';
export type CriticidadeABC = 'A' | 'B' | 'C';
export type StatusManutencao = 'Envio' | 'Peritagem' | 'Aprovação' | 'Execução' | 'Retorno';
export type TipoMovimentacao = 'Entrada' | 'Saída';

export interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  localizacoes: string[]; // Suporte para múltiplas localizações
  criticidade: Criticidade;
  codigoProduto?: string; // ID do catálogo (opcional para compatibilidade)
}

export interface Movimentacao {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  data: string;
  responsavel?: string;
  matricula?: string;
  observacao?: string;
}

export interface ItemManutencao {
  id: string;
  produtoId: string;
  produtoNome: string;
  numeroSerie?: string; // Número de série específico (ex: ELE-001-01)
  status: StatusManutencao;
  dataEnvio: string;
  dataRetorno?: string;
  responsavel?: string;
  quantidadeEnviada?: number;
  observacao?: string;
  criticidadeABC: CriticidadeABC; // Curva ABC - A (Crítico), B (Médio), C (Baixo)
  ultimaAtualizacao?: string; // Timestamp da última atualização (para detectar inércia)
  // Timestamps para cada etapa do processo
  timestampEnvio?: string;
  timestampPeritagem?: string;
  timestampAprovacao?: string;
  timestampExecucao?: string;
  timestampRetorno?: string;
}

export const produtos: Produto[] = [
  { id: '1', nome: 'Detector de Gás', quantidade: 5, localizacoes: ['A-1'], criticidade: 'Alta', codigoProduto: 'ELE-001' },
  { id: '2', nome: 'Esmerilhadeira 4"', quantidade: 8, localizacoes: ['A-3', 'B-5'], criticidade: 'Alta', codigoProduto: 'ELE-002' },
  { id: '3', nome: 'Esmerilhadeira 7"', quantidade: 4, localizacoes: ['A-3'], criticidade: 'Alta', codigoProduto: 'ELE-003' },
  { id: '4', nome: 'Furadeira', quantidade: 15, localizacoes: ['B-1', 'B-2'], criticidade: 'Média', codigoProduto: 'ELE-005' },
  { id: '5', nome: 'Parafusadeira', quantidade: 12, localizacoes: ['B-1'], criticidade: 'Média', codigoProduto: 'ELE-008' },
  { id: '6', nome: 'Bomba Hidráulica', quantidade: 3, localizacoes: ['C-1'], criticidade: 'Alta', codigoProduto: 'HID-001' },
  { id: '7', nome: 'Macaco Hidráulico', quantidade: 6, localizacoes: ['C-1', 'C-2'], criticidade: 'Média', codigoProduto: 'HID-002' },
  { id: '8', nome: 'Máscara de Fuga', quantidade: 12, localizacoes: ['D-1'], criticidade: 'Alta', codigoProduto: 'SEG-001' },
  { id: '9', nome: 'Marreta', quantidade: 10, localizacoes: ['E-1'], criticidade: 'Baixa', codigoProduto: 'MAN-001' },
  { id: '10', nome: 'Chave Combinada', quantidade: 25, localizacoes: ['E-2', 'E-3'], criticidade: 'Média', codigoProduto: 'MAN-002' },
  { id: '11', nome: 'Chave Inglesa', quantidade: 15, localizacoes: ['E-2'], criticidade: 'Média', codigoProduto: 'MAN-004' },
  { id: '12', nome: 'Soquete', quantidade: 30, localizacoes: ['E-3', 'E-4'], criticidade: 'Baixa', codigoProduto: 'MAN-008' },
];

export const movimentacoes: Movimentacao[] = [
  { id: '1', produtoId: '1', produtoNome: 'Detector de Gás', tipo: 'Entrada', quantidade: 2, data: '2026-04-14T10:30:00', responsavel: 'João Silva', matricula: '12345' },
  { id: '2', produtoId: '2', produtoNome: 'Esmerilhadeira 4"', tipo: 'Saída', quantidade: 3, data: '2026-04-14T09:15:00', responsavel: 'Maria Santos', matricula: '54321' },
  { id: '3', produtoId: '6', produtoNome: 'Bomba Hidráulica', tipo: 'Saída', quantidade: 1, data: '2026-04-13T16:45:00', responsavel: 'Pedro Costa', matricula: '11111' },
  { id: '4', produtoId: '8', produtoNome: 'Máscara de Fuga', tipo: 'Entrada', quantidade: 5, data: '2026-04-13T14:20:00', responsavel: 'Ana Oliveira', matricula: '22222' },
  { id: '5', produtoId: '5', produtoNome: 'Parafusadeira', tipo: 'Saída', quantidade: 2, data: '2026-04-13T11:00:00', responsavel: 'Carlos Lima', matricula: '33333' },
  { id: '6', produtoId: '10', produtoNome: 'Chave Combinada', tipo: 'Entrada', quantidade: 10, data: '2026-04-12T15:30:00', responsavel: 'Julia Rocha', matricula: '44444' },
  { id: '7', produtoId: '7', produtoNome: 'Macaco Hidráulico', tipo: 'Saída', quantidade: 1, data: '2026-04-12T13:10:00', responsavel: 'Roberto Alves', matricula: '55555' },
  { id: '8', produtoId: '4', produtoNome: 'Furadeira', tipo: 'Entrada', quantidade: 8, data: '2026-04-12T10:45:00', responsavel: 'Fernanda Dias', matricula: '66666' },
];

export const itensManutencao: ItemManutencao[] = [
  {
    id: '1',
    produtoId: '2',
    produtoNome: 'Esmerilhadeira 4"',
    numeroSerie: 'ELE-002-01',
    status: 'Execução',
    dataEnvio: '2026-04-10',
    responsavel: 'Carlos Souza',
    quantidadeEnviada: 1,
    criticidadeABC: 'A',
    ultimaAtualizacao: '2026-04-12T14:00:00',
    timestampEnvio: '2026-04-10T08:00:00',
    timestampPeritagem: '2026-04-10T10:30:00',
    timestampAprovacao: '2026-04-11T09:00:00',
    timestampExecucao: '2026-04-12T14:00:00'
  },
  {
    id: '2',
    produtoId: '3',
    produtoNome: 'Esmerilhadeira 7"',
    numeroSerie: 'ELE-003-02',
    status: 'Peritagem',
    dataEnvio: '2026-04-12',
    responsavel: 'Marina Lopes',
    quantidadeEnviada: 1,
    criticidadeABC: 'A',
    ultimaAtualizacao: '2026-04-13T11:00:00',
    timestampEnvio: '2026-04-12T09:00:00',
    timestampPeritagem: '2026-04-13T11:00:00'
  },
  {
    id: '3',
    produtoId: '6',
    produtoNome: 'Bomba Hidráulica',
    numeroSerie: 'HID-001-01',
    status: 'Envio',
    dataEnvio: '2026-04-13',
    responsavel: 'Paulo Mendes',
    quantidadeEnviada: 1,
    criticidadeABC: 'B',
    ultimaAtualizacao: '2026-04-13T15:00:00',
    timestampEnvio: '2026-04-13T15:00:00'
  },
  {
    id: '4',
    produtoId: '4',
    produtoNome: 'Furadeira',
    numeroSerie: 'ELE-005-03',
    status: 'Retorno',
    dataEnvio: '2026-04-05',
    dataRetorno: '2026-04-13',
    responsavel: 'Lucia Castro',
    quantidadeEnviada: 1,
    criticidadeABC: 'C',
    ultimaAtualizacao: '2026-04-13T16:00:00',
    timestampEnvio: '2026-04-05T08:00:00',
    timestampPeritagem: '2026-04-05T14:00:00',
    timestampAprovacao: '2026-04-06T10:00:00',
    timestampExecucao: '2026-04-07T09:00:00',
    timestampRetorno: '2026-04-13T16:00:00'
  },
  {
    id: '5',
    produtoId: '5',
    produtoNome: 'Parafusadeira',
    numeroSerie: 'ELE-008-02',
    status: 'Retorno',
    dataEnvio: '2026-04-01',
    dataRetorno: '2026-04-10',
    responsavel: 'Ricardo Pires',
    quantidadeEnviada: 1,
    criticidadeABC: 'B',
    ultimaAtualizacao: '2026-04-10T15:00:00',
    timestampEnvio: '2026-04-01T07:30:00',
    timestampPeritagem: '2026-04-02T10:00:00',
    timestampAprovacao: '2026-04-03T11:00:00',
    timestampExecucao: '2026-04-04T08:00:00',
    timestampRetorno: '2026-04-10T15:00:00'
  },
];
