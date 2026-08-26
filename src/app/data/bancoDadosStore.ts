export interface ProdutoCatalogo {
  id: string;
  codigoProduto: string; // ID manual visível em todas as telas
  nome: string;
  categoria: string;
  unidadeMedida: string;
  estoqueMinimo: number;
  estoqueMaximo: number;
  ativo: boolean;
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
  { id: '1', codigoProduto: 'ELE-001', nome: 'Detector de Gás', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 2, estoqueMaximo: 10, ativo: true },
  { id: '2', codigoProduto: 'ELE-002', nome: 'Esmerilhadeira 4"', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 3, estoqueMaximo: 15, ativo: true },
  { id: '3', codigoProduto: 'ELE-003', nome: 'Esmerilhadeira 7"', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 2, estoqueMaximo: 10, ativo: true },
  { id: '4', codigoProduto: 'ELE-004', nome: 'Inversora', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 2, estoqueMaximo: 8, ativo: true },
  { id: '5', codigoProduto: 'ELE-005', nome: 'Furadeira', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 20, ativo: true },
  { id: '6', codigoProduto: 'ELE-006', nome: 'Luminária', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 10, estoqueMaximo: 30, ativo: true },
  { id: '7', codigoProduto: 'ELE-007', nome: 'Furadeira de Mesa', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 1, estoqueMaximo: 5, ativo: true },
  { id: '8', codigoProduto: 'ELE-008', nome: 'Parafusadeira', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 20, ativo: true },
  { id: '9', codigoProduto: 'ELE-009', nome: 'Soprador', categoria: 'Ferramentas Elétricas', unidadeMedida: 'UN', estoqueMinimo: 3, estoqueMaximo: 12, ativo: true },

  // Equipamentos Hidráulicos
  { id: '10', codigoProduto: 'HID-001', nome: 'Bomba Hidráulica', categoria: 'Equipamentos Hidráulicos', unidadeMedida: 'UN', estoqueMinimo: 2, estoqueMaximo: 8, ativo: true },
  { id: '11', codigoProduto: 'HID-002', nome: 'Macaco Hidráulico', categoria: 'Equipamentos Hidráulicos', unidadeMedida: 'UN', estoqueMinimo: 3, estoqueMaximo: 12, ativo: true },
  { id: '12', codigoProduto: 'HID-003', nome: 'Manifold', categoria: 'Equipamentos Hidráulicos', unidadeMedida: 'UN', estoqueMinimo: 2, estoqueMaximo: 10, ativo: true },

  // Equipamentos de Segurança
  { id: '13', codigoProduto: 'SEG-001', nome: 'Máscara de Fuga', categoria: 'Equipamentos de Segurança', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 20, ativo: true },

  // Ferramentas Manuais
  { id: '14', codigoProduto: 'MAN-001', nome: 'Marreta', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 20, ativo: true },
  { id: '15', codigoProduto: 'MAN-002', nome: 'Chave Combinada', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 10, estoqueMaximo: 40, ativo: true },
  { id: '16', codigoProduto: 'MAN-003', nome: 'Chave Grifo', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 20, ativo: true },
  { id: '17', codigoProduto: 'MAN-004', nome: 'Chave Inglesa', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 8, estoqueMaximo: 25, ativo: true },
  { id: '18', codigoProduto: 'MAN-005', nome: 'Martelo Bola', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 5, estoqueMaximo: 15, ativo: true },
  { id: '19', codigoProduto: 'MAN-006', nome: 'Punção', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 10, estoqueMaximo: 30, ativo: true },
  { id: '20', codigoProduto: 'MAN-007', nome: 'Espina', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 10, estoqueMaximo: 30, ativo: true },
  { id: '21', codigoProduto: 'MAN-008', nome: 'Soquete', categoria: 'Ferramentas Manuais', unidadeMedida: 'UN', estoqueMinimo: 15, estoqueMaximo: 50, ativo: true },
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

// Store simples em memória
let produtosCatalogo = [...produtosCatalogoInicial];
let produtosSerializados = gerarProdutosSerializados();

export const bancoDadosStore = {
  getProdutos: () => produtosCatalogo,

  getProdutosAtivos: () => produtosCatalogo.filter(p => p.ativo),

  setProdutos: (produtos: ProdutoCatalogo[]) => {
    produtosCatalogo = produtos;
  },

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
