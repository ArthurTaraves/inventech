import type { Criticidade, CriticidadeABC, Produto, ItemManutencao } from './mockData';

export interface ProdutoCatalogo {
  id: string;
  codigoProduto: string; // ID manual visível em todas as telas
  nome: string;
  categoria: string;
  unidadeMedida: string;
  estoqueMinimo: number;
  estoqueMaximo: number;
  ativo: boolean;
  criticidade: Criticidade; // Definida somente na Área Administrativa — fonte única para todas as telas
}

// Produto Individual Serializado (cada unidade física)
export interface ProdutoSerializadoDB {
  id: string; // ID único da unidade serializada
  produtoCatalogoId: string; // Referência ao produto do catálogo
  numeroSerie: string; // Ex: ELE-001-01, ELE-001-02
  codigoProduto: string; // Ex: ELE-001
  nome: string;
  categoria: string;
  localizacao: string;
  status: 'Disponível' | 'Em Uso' | 'Manutenção' | 'Baixado';
  dataAquisicao: string;
  observacoes?: string;
}

// Banco de dados inicial de produtos válidos
export const produtosCatalogoInicial: ProdutoCatalogo[] = [
  // Ferramentas Elétricas
  { id: '1', codigoProduto: 'ELE-001', nome: 'Detector de Gás', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 2, estoqueMaximo: 10, ativo: true, criticidade: 'Alta' },
  { id: '2', codigoProduto: 'ELE-002', nome: 'Esmerilhadeira 4"', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 3, estoqueMaximo: 15, ativo: true, criticidade: 'Alta' },
  { id: '3', codigoProduto: 'ELE-003', nome: 'Esmerilhadeira 7"', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 2, estoqueMaximo: 10, ativo: true, criticidade: 'Alta' },
  { id: '4', codigoProduto: 'ELE-004', nome: 'Inversora', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 2, estoqueMaximo: 8, ativo: true, criticidade: 'Média' },
  { id: '5', codigoProduto: 'ELE-005', nome: 'Furadeira', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 20, ativo: true, criticidade: 'Média' },
  { id: '6', codigoProduto: 'ELE-006', nome: 'Luminária', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 10, estoqueMaximo: 30, ativo: true, criticidade: 'Média' },
  { id: '7', codigoProduto: 'ELE-007', nome: 'Furadeira de Mesa', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 1, estoqueMaximo: 5, ativo: true, criticidade: 'Média' },
  { id: '8', codigoProduto: 'ELE-008', nome: 'Parafusadeira', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 20, ativo: true, criticidade: 'Média' },
  { id: '9', codigoProduto: 'ELE-009', nome: 'Soprador', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 3, estoqueMaximo: 12, ativo: true, criticidade: 'Média' },

  // Equipamentos Hidráulicos
  { id: '10', codigoProduto: 'HID-001', nome: 'Bomba Hidráulica', categoria: 'Equipamentos Hidráulicos', unidadeMedida: 'UN', estoqueMinimo: 2, estoqueMaximo: 8, ativo: true, criticidade: 'Alta' },
  { id: '11', codigoProduto: 'HID-002', nome: 'Macaco Hidráulico', categoria: 'Equipamentos Hidráulicos', unidadeMedida: 'UN', estoqueMinimo: 3, estoqueMaximo: 12, ativo: true, criticidade: 'Média' },
  { id: '12', codigoProduto: 'HID-003', nome: 'Manifold', categoria: 'Equipamentos Hidráulicos', unidadeMedida: 'UN', estoqueMinimo: 2, estoqueMaximo: 10, ativo: true, criticidade: 'Média' },

  // Equipamentos de Segurança
  { id: '13', codigoProduto: 'SEG-001', nome: 'Máscara de Fuga', categoria: 'Equipamentos de Segurança', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 20, ativo: true, criticidade: 'Alta' },

  // Ferramentas Manuais
  { id: '14', codigoProduto: 'MAN-001', nome: 'Marreta', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 20, ativo: true, criticidade: 'Baixa' },
  { id: '15', codigoProduto: 'MAN-002', nome: 'Chave Combinada', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 10, estoqueMaximo: 40, ativo: true, criticidade: 'Média' },
  { id: '16', codigoProduto: 'MAN-003', nome: 'Chave Grifo', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 20, ativo: true, criticidade: 'Média' },
  { id: '17', codigoProduto: 'MAN-004', nome: 'Chave Inglesa', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 8, estoqueMaximo: 25, ativo: true, criticidade: 'Média' },
  { id: '18', codigoProduto: 'MAN-005', nome: 'Martelo Bola', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 15, ativo: true, criticidade: 'Média' },
  { id: '19', codigoProduto: 'MAN-006', nome: 'Punção', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 10, estoqueMaximo: 30, ativo: true, criticidade: 'Média' },
  { id: '20', codigoProduto: 'MAN-007', nome: 'Espina', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 10, estoqueMaximo: 30, ativo: true, criticidade: 'Média' },
  { id: '21', codigoProduto: 'MAN-008', nome: 'Soquete', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 15, estoqueMaximo: 50, ativo: true, criticidade: 'Baixa' },
];

// Quantidades em estoque de cada produto - TODOS os produtos devem ter pelo menos estoqueMinimo unidades
const quantidadesEstoque: Record<string, number> = {
  'ELE-001': 5,  // Detector de Gás
  'ELE-002': 8,  // Esmerilhadeira 4"
  'ELE-003': 1,  // Esmerilhadeira 7" - abaixo do minimo (2) para demonstrar alertas
  'ELE-004': 2,  // Inversora - agora tem estoque mínimo
  'ELE-005': 15, // Furadeira
  'ELE-006': 10, // Luminária - agora tem estoque mínimo
  'ELE-007': 1,  // Furadeira de Mesa - agora tem estoque mínimo
  'ELE-008': 12, // Parafusadeira
  'ELE-009': 3,  // Soprador - agora tem estoque mínimo
  'HID-001': 3,  // Bomba Hidráulica
  'HID-002': 6,  // Macaco Hidráulico
  'HID-003': 2,  // Manifold - agora tem estoque mínimo
  'SEG-001': 12, // Máscara de Fuga
  'MAN-001': 10, // Marreta
  'MAN-002': 25, // Chave Combinada
  'MAN-003': 5,  // Chave Grifo - agora tem estoque mínimo
  'MAN-004': 15, // Chave Inglesa
  'MAN-005': 5,  // Martelo Bola - agora tem estoque mínimo
  'MAN-006': 10, // Punção - agora tem estoque mínimo
  'MAN-007': 10, // Espina - agora tem estoque mínimo
  'MAN-008': 30, // Soquete
};

// Localização física (corredor + prateleiras vizinhas) de cada produto — todas as
// unidades de um mesmo produto ficam no mesmo corredor, em prateleiras consecutivas.
const localizacoesPorProduto: Record<string, string[]> = {
  'ELE-001': ['A-1'],
  'ELE-002': ['A-3', 'A-4'],
  'ELE-003': ['A-3'],
  'ELE-004': ['A-5'],
  'ELE-005': ['B-1', 'B-2'],
  'ELE-006': ['A-6'],
  'ELE-007': ['A-7'],
  'ELE-008': ['B-1'],
  'ELE-009': ['A-8'],
  'HID-001': ['C-1'],
  'HID-002': ['C-1', 'C-2'],
  'HID-003': ['C-3'],
  'SEG-001': ['D-1'],
  'MAN-001': ['E-1'],
  'MAN-002': ['E-2', 'E-3'],
  'MAN-003': ['E-4'],
  'MAN-004': ['E-2'],
  'MAN-005': ['E-5'],
  'MAN-006': ['E-6'],
  'MAN-007': ['E-7'],
  'MAN-008': ['E-3', 'E-4'],
};

// Gerar produtos serializados automaticamente
const gerarProdutosSerializados = (): ProdutoSerializadoDB[] => {
  const serializados: ProdutoSerializadoDB[] = [];

  produtosCatalogoInicial.forEach((produto) => {
    const quantidade = quantidadesEstoque[produto.codigoProduto] || 0;
    const localizacoesProduto = localizacoesPorProduto[produto.codigoProduto] || ['A-1'];

    for (let i = 1; i <= quantidade; i++) {
      const numeroSerie = `${produto.codigoProduto}-${String(i).padStart(2, '0')}`;
      const localizacao = localizacoesProduto[(i - 1) % localizacoesProduto.length];

      serializados.push({
        id: `${produto.id}-${i}`,
        produtoCatalogoId: produto.id,
        numeroSerie,
        codigoProduto: produto.codigoProduto,
        nome: produto.nome,
        categoria: produto.categoria,
        localizacao,
        status: 'Disponível',
        dataAquisicao: '2026-01-15',
      });
    }
  });

  return serializados;
};

const CATALOGO_STORAGE_KEY = 'almoxarifado_catalogo_v1';
const CRITICIDADES_VALIDAS: Criticidade[] = ['Baixa', 'Média', 'Alta'];

function validarItemCatalogo(item: any): boolean {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.codigoProduto === 'string' &&
    typeof item.nome === 'string' &&
    typeof item.categoria === 'string' &&
    typeof item.unidadeMedida === 'string' &&
    typeof item.estoqueMinimo === 'number' &&
    typeof item.estoqueMaximo === 'number' &&
    typeof item.ativo === 'boolean'
  );
}

// Carrega o catálogo salvo pela Área Administrativa. Em caso de dado ausente
// ou corrompido, volta ao catálogo inicial em vez de quebrar a aplicação.
function carregarCatalogoPersistido(): ProdutoCatalogo[] {
  try {
    const salvo = localStorage.getItem(CATALOGO_STORAGE_KEY);
    if (!salvo) return [...produtosCatalogoInicial];

    const parsed = JSON.parse(salvo);
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(validarItemCatalogo)) {
      return [...produtosCatalogoInicial];
    }

    // Itens salvos por uma versão anterior ao campo criticidade recebem o
    // padrão 'Média' em vez de terem o restante dos dados descartado.
    return parsed.map((item: any): ProdutoCatalogo => ({
      ...item,
      criticidade: CRITICIDADES_VALIDAS.includes(item.criticidade) ? item.criticidade : 'Média',
    }));
  } catch {
    return [...produtosCatalogoInicial];
  }
}

function salvarCatalogoPersistido(produtos: ProdutoCatalogo[]) {
  try {
    localStorage.setItem(CATALOGO_STORAGE_KEY, JSON.stringify(produtos));
  } catch {
    // localStorage indisponível (modo privado, cota excedida etc.) — o
    // catálogo continua funcionando em memória nesta sessão, só não persiste.
  }
}

type ListenerCatalogo = () => void;
const listenersCatalogo = new Set<ListenerCatalogo>();
function notificarMudancaCatalogo() {
  listenersCatalogo.forEach(fn => fn());
}

// Store simples em memória
let produtosCatalogo = carregarCatalogoPersistido();
let produtosSerializados = gerarProdutosSerializados();

export const bancoDadosStore = {
  getProdutos: () => produtosCatalogo,

  getProdutosAtivos: () => produtosCatalogo.filter(p => p.ativo),

  setProdutos: (produtos: ProdutoCatalogo[]) => {
    produtosCatalogo = produtos;
    salvarCatalogoPersistido(produtosCatalogo);
    notificarMudancaCatalogo();
  },

  // Assina mudanças no catálogo (ex.: edição de criticidade na Área
  // Administrativa). Retorna a função de cancelamento da inscrição.
  subscribe: (listener: ListenerCatalogo) => {
    listenersCatalogo.add(listener);
    return () => listenersCatalogo.delete(listener);
  },

  getCriticidadePorCodigo: (codigoProduto: string): Criticidade | undefined =>
    produtosCatalogo.find(p => p.codigoProduto === codigoProduto)?.criticidade,

  getProdutoByNome: (nome: string) =>
    produtosCatalogo.find(p => p.nome.toLowerCase() === nome.toLowerCase()),

  isProdutoValido: (nome: string) => {
    const produto = bancoDadosStore.getProdutoByNome(nome);
    return produto && produto.ativo;
  },

  // Métodos para produtos serializados
  getProdutosSerializados: () => produtosSerializados,

  getProdutosSerializadosPorCodigo: (codigoProduto: string) =>
    produtosSerializados.filter(p => p.codigoProduto === codigoProduto),

  getProdutoSerializadoPorNumeroSerie: (numeroSerie: string) =>
    produtosSerializados.find(p => p.numeroSerie === numeroSerie),

  getProdutosSerializadosDisponiveis: () =>
    produtosSerializados.filter(p => p.status === 'Disponível'),

  atualizarStatusProdutoSerializado: (numeroSerie: string, novoStatus: ProdutoSerializadoDB['status']) => {
    produtosSerializados = produtosSerializados.map(p =>
      p.numeroSerie === numeroSerie ? { ...p, status: novoStatus } : p
    );
  },

  setProdutosSerializados: (produtos: ProdutoSerializadoDB[]) => {
    produtosSerializados = produtos;
  },

  // Adicionar nova unidade serializada
  adicionarUnidadeSerializada: (codigoProduto: string, localizacao: string = 'A-1') => {
    const produto = produtosCatalogo.find(p => p.codigoProduto === codigoProduto);
    if (!produto) return null;

    const unidadesExistentes = produtosSerializados.filter(p => p.codigoProduto === codigoProduto);
    const proximoNumero = unidadesExistentes.length + 1;
    const numeroSerie = `${codigoProduto}-${String(proximoNumero).padStart(2, '0')}`;

    const novaUnidade: ProdutoSerializadoDB = {
      id: `${produto.id}-${proximoNumero}`,
      produtoCatalogoId: produto.id,
      numeroSerie,
      codigoProduto,
      nome: produto.nome,
      categoria: produto.categoria,
      localizacao,
      status: 'Disponível',
      dataAquisicao: new Date().toISOString().split('T')[0],
    };

    produtosSerializados = [...produtosSerializados, novaUnidade];
    return novaUnidade;
  },

  // Remover unidade serializada
  removerUnidadeSerializada: (numeroSerie: string) => {
    produtosSerializados = produtosSerializados.filter(p => p.numeroSerie !== numeroSerie);
  },

  // Obter quantidade de unidades de um produto
  getQuantidadeUnidades: (codigoProduto: string) => {
    return produtosSerializados.filter(p => p.codigoProduto === codigoProduto).length;
  },

  // Localizações únicas de um produto, derivadas das unidades serializadas
  // (fonte única de verdade — evita divergência com o campo produto.localizacoes)
  getLocalizacoesUnicasPorCodigo: (codigoProduto: string): string[] => {
    const locais = produtosSerializados
      .filter(p => p.codigoProduto === codigoProduto)
      .map(p => p.localizacao);
    return Array.from(new Set(locais)).sort();
  },
};

// Conversão única da escala de 3 níveis (catálogo/estoque) para a escala ABC
// (ordens de manutenção) — único lugar do sistema que faz essa conversão.
export function criticidadeParaABC(criticidade: Criticidade): CriticidadeABC {
  if (criticidade === 'Alta') return 'A';
  if (criticidade === 'Média') return 'B';
  return 'C';
}

// Criticidade ABC de uma ordem de manutenção, derivada ao vivo da criticidade
// atual do produto (já sincronizada com o catálogo pelo AlmoxarifadoContext) —
// nunca uma cópia parada. Cai no valor salvo na própria ordem só quando o
// produto correspondente não existe mais (ex.: removido do catálogo), para
// não quebrar ordens antigas.
export function getCriticidadeABCDoItem(
  item: Pick<ItemManutencao, 'produtoId' | 'produtoNome' | 'criticidadeABC'>,
  produtos: Pick<Produto, 'id' | 'nome' | 'criticidade'>[]
): CriticidadeABC {
  const produto = produtos.find(p => p.id === item.produtoId || p.nome === item.produtoNome);
  return produto ? criticidadeParaABC(produto.criticidade) : item.criticidadeABC;
}
