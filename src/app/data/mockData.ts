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
  numeroOS?: string; // Número da Ordem de Serviço (ex: OS-2026-0001) - identifica o processo, independente do número de série do equipamento
  empresaReparo?: string; // Empresa terceirizada que executa o reparo externo
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
  // Retorno em duas etapas: a empresa de reparo marca o reparo como concluído
  // (status vira 'Retorno' + aguardandoRecebimento: true, sem mexer no estoque);
  // só quando o almoxarifado confirma o recebimento é que o estoque é somado.
  // undefined = já recebido (itens antigos, sem migração necessária).
  aguardandoRecebimento?: boolean;
  recebimentoConfirmadoEm?: string;
  recebimentoConfirmadoPor?: string;
}

export const empresasReparo = [
  'Oficina Alfa Eletromecânica',
  'Hidráulica Beta Serviços',
  'Gama Eletrotécnica',
];

// ─── Datas relativas ao momento em que o app carrega ───────────────────────────
// Os dados de demonstração nunca devem "envelhecer": em vez de datas fixas no
// código, cada data é calculada a partir de "agora" (congelado na carga deste
// módulo), no mesmo formato que o restante do app já usa — ISO local sem "Z"
// ('YYYY-MM-DDTHH:mm:ss') para timestamps, e 'YYYY-MM-DD' para datas simples.
const agora = new Date();

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatarDataHora(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Timestamp ISO local deslocado `dias` dias no passado a partir de agora,
// opcionalmente fixado num horário 'HH:mm' (segundos zerados).
export function haDias(dias: number, horaFixa?: string): string {
  const d = new Date(agora);
  d.setDate(d.getDate() - dias);
  if (horaFixa) {
    const [h, m] = horaFixa.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  }
  return formatarDataHora(d);
}

// Timestamp ISO local deslocado `horas` horas no passado a partir de agora —
// para timestamps recentes (ex.: "atualizado há 3 horas").
export function haHoras(horas: number): string {
  return formatarDataHora(new Date(agora.getTime() - horas * 60 * 60 * 1000));
}

// Só a data (sem horário), deslocada `dias` dias no passado — usada em
// dataEnvio/dataRetorno, que não guardam horário.
export function dataHaDias(dias: number): string {
  const d = new Date(agora);
  d.setDate(d.getDate() - dias);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Só a data, deslocada `dias` dias no futuro — usada em dataPrevista.
export function dataEmDias(dias: number): string {
  return dataHaDias(-dias);
}

export const produtos: Produto[] = [
  { id: '1', nome: 'Detector de Gás', quantidade: 5, localizacoes: ['A-1'], criticidade: 'Alta', codigoProduto: 'ELE-001' },
  { id: '2', nome: 'Esmerilhadeira 4"', quantidade: 8, localizacoes: ['A-3', 'A-4'], criticidade: 'Alta', codigoProduto: 'ELE-002' },
  { id: '3', nome: 'Esmerilhadeira 7"', quantidade: 1, localizacoes: ['A-3'], criticidade: 'Alta', codigoProduto: 'ELE-003' },
  { id: '4', nome: 'Furadeira', quantidade: 15, localizacoes: ['B-1', 'B-2'], criticidade: 'Média', codigoProduto: 'ELE-005' },
  { id: '5', nome: 'Parafusadeira', quantidade: 12, localizacoes: ['B-1'], criticidade: 'Média', codigoProduto: 'ELE-008' },
  { id: '6', nome: 'Bomba Hidráulica', quantidade: 3, localizacoes: ['C-1'], criticidade: 'Alta', codigoProduto: 'HID-001' },
  { id: '7', nome: 'Macaco Hidráulico', quantidade: 6, localizacoes: ['C-1', 'C-2'], criticidade: 'Média', codigoProduto: 'HID-002' },
  { id: '8', nome: 'Máscara de Fuga', quantidade: 12, localizacoes: ['D-1'], criticidade: 'Alta', codigoProduto: 'SEG-001' },
  { id: '9', nome: 'Marreta', quantidade: 0, localizacoes: ['E-1'], criticidade: 'Baixa', codigoProduto: 'MAN-001' },
  { id: '10', nome: 'Chave Combinada', quantidade: 11, localizacoes: ['E-2', 'E-3'], criticidade: 'Média', codigoProduto: 'MAN-002' },
  { id: '11', nome: 'Chave Inglesa', quantidade: 7, localizacoes: ['E-2'], criticidade: 'Média', codigoProduto: 'MAN-004' },
  { id: '12', nome: 'Soquete', quantidade: 18, localizacoes: ['E-3', 'E-4'], criticidade: 'Baixa', codigoProduto: 'MAN-008' },
];

export const movimentacoes: Movimentacao[] = [
  { id: '1', produtoId: '1', produtoNome: 'Detector de Gás', tipo: 'Entrada', quantidade: 2, data: haDias(0, '10:30'), responsavel: 'João Silva', matricula: '12345' },
  { id: '2', produtoId: '2', produtoNome: 'Esmerilhadeira 4"', tipo: 'Saída', quantidade: 3, data: haDias(0, '09:15'), responsavel: 'Maria Santos', matricula: '54321' },
  { id: '3', produtoId: '6', produtoNome: 'Bomba Hidráulica', tipo: 'Saída', quantidade: 1, data: haDias(1, '16:45'), responsavel: 'Pedro Costa', matricula: '11111' },
  { id: '4', produtoId: '8', produtoNome: 'Máscara de Fuga', tipo: 'Entrada', quantidade: 5, data: haDias(1, '14:20'), responsavel: 'Ana Oliveira', matricula: '22222' },
  { id: '5', produtoId: '5', produtoNome: 'Parafusadeira', tipo: 'Saída', quantidade: 2, data: haDias(2, '11:00'), responsavel: 'Carlos Lima', matricula: '33333' },
  { id: '6', produtoId: '10', produtoNome: 'Chave Combinada', tipo: 'Entrada', quantidade: 10, data: haDias(3, '15:30'), responsavel: 'Julia Rocha', matricula: '44444' },
  { id: '7', produtoId: '7', produtoNome: 'Macaco Hidráulico', tipo: 'Saída', quantidade: 1, data: haDias(4, '13:10'), responsavel: 'Roberto Alves', matricula: '55555' },
  { id: '8', produtoId: '4', produtoNome: 'Furadeira', tipo: 'Entrada', quantidade: 8, data: haDias(5, '10:45'), responsavel: 'Fernanda Dias', matricula: '66666' },
];

// 8 ordens de manutenção cobrindo as 5 etapas do processo (Envio, Peritagem,
// Aprovação, Execução, Retorno — com um item em Retorno ainda aguardando
// confirmação do almoxarifado e dois já recebidos), distribuídas pelas 3
// empresas de reparo. Os ids e números de OS 1–5 são preservados; 6, 7 e 8
// foram acrescentados para representar Aprovação e o retorno em duas etapas.
export const itensManutencao: ItemManutencao[] = [
  {
    id: '1',
    produtoId: '2',
    produtoNome: 'Esmerilhadeira 4"',
    numeroSerie: 'ELE-002-01',
    numeroOS: 'OS-2026-0001',
    empresaReparo: 'Oficina Alfa Eletromecânica',
    status: 'Execução',
    dataEnvio: dataHaDias(16),
    responsavel: 'Carlos Souza',
    quantidadeEnviada: 1,
    criticidadeABC: 'A',
    ultimaAtualizacao: haDias(3, '14:00'),
    timestampEnvio: haDias(16, '08:00'),
    timestampPeritagem: haDias(15, '10:30'),
    timestampAprovacao: haDias(9, '09:00'),
    timestampExecucao: haDias(3, '14:00'),
  },
  {
    id: '2',
    produtoId: '3',
    produtoNome: 'Esmerilhadeira 7"',
    numeroSerie: 'ELE-003-01',
    numeroOS: 'OS-2026-0004',
    empresaReparo: 'Oficina Alfa Eletromecânica',
    status: 'Peritagem',
    dataEnvio: dataHaDias(4),
    responsavel: 'Marina Lopes',
    quantidadeEnviada: 1,
    criticidadeABC: 'A',
    ultimaAtualizacao: haDias(1, '11:00'),
    timestampEnvio: haDias(4, '09:00'),
    timestampPeritagem: haDias(1, '11:00'),
  },
  {
    id: '3',
    produtoId: '6',
    produtoNome: 'Bomba Hidráulica',
    numeroSerie: 'HID-001-01',
    numeroOS: 'OS-2026-0005',
    empresaReparo: 'Hidráulica Beta Serviços',
    status: 'Envio',
    dataEnvio: dataHaDias(1),
    responsavel: 'Paulo Mendes',
    quantidadeEnviada: 1,
    criticidadeABC: 'A',
    ultimaAtualizacao: haHoras(3),
    timestampEnvio: haDias(1, '15:00'),
  },
  {
    id: '4',
    produtoId: '4',
    produtoNome: 'Furadeira',
    numeroSerie: 'ELE-005-03',
    numeroOS: 'OS-2026-0002',
    empresaReparo: 'Gama Eletrotécnica',
    status: 'Retorno',
    dataEnvio: dataHaDias(11),
    dataRetorno: dataHaDias(5),
    responsavel: 'Lucia Castro',
    quantidadeEnviada: 1,
    criticidadeABC: 'B',
    ultimaAtualizacao: haDias(5, '15:00'),
    timestampEnvio: haDias(11, '08:00'),
    timestampPeritagem: haDias(10, '14:00'),
    timestampAprovacao: haDias(9, '10:00'),
    timestampExecucao: haDias(7, '09:00'),
    timestampRetorno: haDias(5, '15:00'),
    aguardandoRecebimento: false,
    recebimentoConfirmadoEm: haDias(4, '10:00'),
    recebimentoConfirmadoPor: 'Almoxarifado',
  },
  {
    id: '5',
    produtoId: '5',
    produtoNome: 'Parafusadeira',
    numeroSerie: 'ELE-008-02',
    numeroOS: 'OS-2026-0003',
    empresaReparo: 'Gama Eletrotécnica',
    status: 'Retorno',
    dataEnvio: dataHaDias(9),
    dataRetorno: dataHaDias(3),
    responsavel: 'Ricardo Pires',
    quantidadeEnviada: 1,
    criticidadeABC: 'B',
    ultimaAtualizacao: haDias(3, '15:00'),
    timestampEnvio: haDias(9, '07:30'),
    timestampPeritagem: haDias(8, '10:00'),
    timestampAprovacao: haDias(7, '11:00'),
    timestampExecucao: haDias(5, '08:00'),
    timestampRetorno: haDias(3, '15:00'),
    aguardandoRecebimento: false,
    recebimentoConfirmadoEm: haDias(2, '09:00'),
    recebimentoConfirmadoPor: 'Almoxarifado',
  },
  {
    id: '6',
    produtoId: '1',
    produtoNome: 'Detector de Gás',
    numeroSerie: 'ELE-001-01',
    numeroOS: 'OS-2026-0006',
    empresaReparo: 'Oficina Alfa Eletromecânica',
    status: 'Aprovação',
    dataEnvio: dataHaDias(9),
    responsavel: 'Fernanda Dias',
    quantidadeEnviada: 1,
    criticidadeABC: 'A',
    ultimaAtualizacao: haDias(1, '09:00'),
    timestampEnvio: haDias(9, '08:00'),
    timestampPeritagem: haDias(7, '10:00'),
    timestampAprovacao: haDias(2, '09:00'),
  },
  {
    id: '7',
    produtoId: '7',
    produtoNome: 'Macaco Hidráulico',
    numeroSerie: 'HID-002-01',
    numeroOS: 'OS-2026-0006',
    empresaReparo: 'Oficina Alfa Eletromecânica',
    status: 'Aprovação',
    dataEnvio: dataHaDias(9),
    responsavel: 'Fernanda Dias',
    quantidadeEnviada: 1,
    criticidadeABC: 'B',
    ultimaAtualizacao: haDias(1, '09:00'),
    timestampEnvio: haDias(9, '08:00'),
    timestampPeritagem: haDias(7, '10:00'),
    timestampAprovacao: haDias(2, '09:00'),
  },
  {
    id: '8',
    produtoId: '4',
    produtoNome: 'Furadeira',
    numeroSerie: 'ELE-005-04',
    numeroOS: 'OS-2026-0007',
    empresaReparo: 'Gama Eletrotécnica',
    status: 'Retorno',
    dataEnvio: dataHaDias(8),
    dataRetorno: dataHaDias(1),
    responsavel: 'Bruno Teixeira',
    quantidadeEnviada: 1,
    criticidadeABC: 'B',
    ultimaAtualizacao: haDias(1, '16:00'),
    timestampEnvio: haDias(8, '08:00'),
    timestampPeritagem: haDias(7, '10:00'),
    timestampAprovacao: haDias(6, '09:00'),
    timestampExecucao: haDias(4, '08:00'),
    timestampRetorno: haDias(1, '16:00'),
    aguardandoRecebimento: true,
  },
];
