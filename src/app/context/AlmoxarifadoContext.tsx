import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  produtos as produtosIniciais,
  movimentacoes as movimentacoesIniciais,
  itensManutencao as itensManutencaoIniciais,
  type Produto,
  type Movimentacao,
  type ItemManutencao
} from '../data/mockData';
import { bancoDadosStore } from '../data/bancoDadosStore';

// bancoDadosStore (unidades serializadas) é a fonte única de verdade para
// localização. Usado só na migração abaixo — não sobrescreve edições manuais
// de localização feitas pelo usuário após a migração já ter rodado.
function sincronizarLocalizacoes(produto: Produto): Produto {
  if (!produto.codigoProduto) return produto;
  const locaisDoCatalogo = bancoDadosStore.getLocalizacoesUnicasPorCodigo(produto.codigoProduto);
  return locaisDoCatalogo.length > 0
    ? { ...produto, localizacoes: locaisDoCatalogo }
    : produto;
}

// Migração de localização é aplicada uma única vez por navegador: limpa
// dados de localização antigos/divergentes salvos em sessões anteriores,
// sem apagar edições manuais feitas pelo usuário depois disso.
const LOCALIZACOES_MIGRADAS_KEY = 'almoxarifado_localizacoes_migradas_v1';

interface AlmoxarifadoContextType {
  produtos: Produto[];
  setProdutos: (produtos: Produto[]) => void;
  adicionarProduto: (produto: Produto) => void;
  atualizarProduto: (id: string, produto: Produto) => void;
  removerProduto: (id: string) => void;

  movimentacoes: Movimentacao[];
  setMovimentacoes: (movimentacoes: Movimentacao[]) => void;
  adicionarMovimentacao: (movimentacao: Movimentacao) => void;

  itensManutencao: ItemManutencao[];
  setItensManutencao: (itens: ItemManutencao[]) => void;
  adicionarItemManutencao: (item: ItemManutencao) => void;
  atualizarItemManutencao: (id: string, item: ItemManutencao) => void;
}

const AlmoxarifadoContext = createContext<AlmoxarifadoContextType | undefined>(undefined);

// Hook customizado para usar o contexto
export function useAlmoxarifado() {
  const context = useContext(AlmoxarifadoContext);
  if (!context) {
    throw new Error('useAlmoxarifado deve ser usado dentro de AlmoxarifadoProvider');
  }
  return context;
}

// Provider
export function AlmoxarifadoProvider({ children }: { children: ReactNode }) {
  // Carregar dados do localStorage ou usar dados iniciais
  const [produtos, setProdutosState] = useState<Produto[]>(() => {
    const saved = localStorage.getItem('almoxarifado_produtos');
    if (saved) {
      const parsedData = JSON.parse(saved);
      // Migração automática: converter produtos antigos para novo formato
      let produtosCarregados: Produto[] = parsedData.map((produto: any) => ({
        ...produto,
        // Se tiver localizacao (singular), converter para localizacoes (array)
        localizacoes: produto.localizacoes
          ? produto.localizacoes
          : (produto.localizacao ? [produto.localizacao] : []),
        // Garantir que codigoProduto existe
        codigoProduto: produto.codigoProduto || undefined,
      }));

      // Limpeza pontual (uma vez só): corrige localizações salvas antes da
      // correção do mock, sem sobrescrever edições manuais futuras.
      if (localStorage.getItem(LOCALIZACOES_MIGRADAS_KEY) !== '1') {
        produtosCarregados = produtosCarregados.map(sincronizarLocalizacoes);
        localStorage.setItem(LOCALIZACOES_MIGRADAS_KEY, '1');
      }

      return produtosCarregados;
    }
    localStorage.setItem(LOCALIZACOES_MIGRADAS_KEY, '1');
    return produtosIniciais.map(sincronizarLocalizacoes);
  });

  const [movimentacoes, setMovimentacoesState] = useState<Movimentacao[]>(() => {
    const saved = localStorage.getItem('almoxarifado_movimentacoes');
    return saved ? JSON.parse(saved) : movimentacoesIniciais;
  });

  const [itensManutencao, setItensManutencaoState] = useState<ItemManutencao[]>(() => {
    const saved = localStorage.getItem('almoxarifado_manutencao');
    if (saved) {
      const parsedData = JSON.parse(saved);
      // Migração automática: converter status antigos e adicionar criticidadeABC
      return parsedData.map((item: any) => {
        const migratedItem = { ...item };

        // Mapear status antigos para novos
        const statusMap: Record<string, string> = {
          'Enviado': 'Envio',
          'Em análise': 'Peritagem',
          'Em manutenção': 'Execução',
          'Finalizado': 'Execução',
          'Retornado': 'Retorno'
        };

        if (migratedItem.status && statusMap[migratedItem.status]) {
          migratedItem.status = statusMap[migratedItem.status];
        }

        // Adicionar criticidadeABC se não existir (padrão B)
        if (!migratedItem.criticidadeABC) {
          migratedItem.criticidadeABC = 'B';
        }

        // Migrar timestamps antigos para novos nomes
        if (migratedItem.timestampEnviado && !migratedItem.timestampEnvio) {
          migratedItem.timestampEnvio = migratedItem.timestampEnviado;
          delete migratedItem.timestampEnviado;
        }

        if (migratedItem.timestampEmAnalise && !migratedItem.timestampPeritagem) {
          migratedItem.timestampPeritagem = migratedItem.timestampEmAnalise;
          delete migratedItem.timestampEmAnalise;
        }

        if (migratedItem.timestampFinalizado && !migratedItem.timestampAprovacao) {
          migratedItem.timestampAprovacao = migratedItem.timestampFinalizado;
          delete migratedItem.timestampFinalizado;
        }

        if (migratedItem.timestampEmManutencao && !migratedItem.timestampExecucao) {
          migratedItem.timestampExecucao = migratedItem.timestampEmManutencao;
          delete migratedItem.timestampEmManutencao;
        }

        if (migratedItem.timestampRetornado && !migratedItem.timestampRetorno) {
          migratedItem.timestampRetorno = migratedItem.timestampRetornado;
          delete migratedItem.timestampRetornado;
        }

        // Se não tem timestamp de envio, adicionar baseado na data de envio
        if (!migratedItem.timestampEnvio && migratedItem.dataEnvio) {
          migratedItem.timestampEnvio = new Date(migratedItem.dataEnvio).toISOString();
        }

        // Adicionar ultimaAtualizacao se não existir
        if (!migratedItem.ultimaAtualizacao) {
          // Usar o timestamp mais recente disponível
          migratedItem.ultimaAtualizacao = migratedItem.timestampRetorno ||
            migratedItem.timestampExecucao ||
            migratedItem.timestampAprovacao ||
            migratedItem.timestampPeritagem ||
            migratedItem.timestampEnvio ||
            new Date(migratedItem.dataEnvio).toISOString();
        }

        return migratedItem;
      });
    }
    return itensManutencaoIniciais;
  });

  // Salvar no localStorage sempre que os dados mudarem
  useEffect(() => {
    localStorage.setItem('almoxarifado_produtos', JSON.stringify(produtos));
  }, [produtos]);

  useEffect(() => {
    localStorage.setItem('almoxarifado_movimentacoes', JSON.stringify(movimentacoes));
  }, [movimentacoes]);

  useEffect(() => {
    localStorage.setItem('almoxarifado_manutencao', JSON.stringify(itensManutencao));
  }, [itensManutencao]);

  // Funções auxiliares
  const setProdutos = (novosProdutos: Produto[]) => {
    setProdutosState(novosProdutos);
  };

  const adicionarProduto = (produto: Produto) => {
    setProdutosState([...produtos, produto]);
  };

  const atualizarProduto = (id: string, produtoAtualizado: Produto) => {
    setProdutosState(produtos.map(p => p.id === id ? produtoAtualizado : p));
  };

  const removerProduto = (id: string) => {
    setProdutosState(produtos.filter(p => p.id !== id));
  };

  const setMovimentacoes = (novasMovimentacoes: Movimentacao[]) => {
    setMovimentacoesState(novasMovimentacoes);
  };

  const adicionarMovimentacao = (movimentacao: Movimentacao) => {
    setMovimentacoesState([movimentacao, ...movimentacoes]);
  };

  const setItensManutencao = (novosItens: ItemManutencao[]) => {
    setItensManutencaoState(novosItens);
  };

  const adicionarItemManutencao = (item: ItemManutencao) => {
    setItensManutencaoState([item, ...itensManutencao]);
  };

  const atualizarItemManutencao = (id: string, itemAtualizado: ItemManutencao) => {
    setItensManutencaoState(itensManutencao.map(i => i.id === id ? itemAtualizado : i));
  };

  const value = {
    produtos,
    setProdutos,
    adicionarProduto,
    atualizarProduto,
    removerProduto,

    movimentacoes,
    setMovimentacoes,
    adicionarMovimentacao,

    itensManutencao,
    setItensManutencao,
    adicionarItemManutencao,
    atualizarItemManutencao,
  };

  return (
    <AlmoxarifadoContext.Provider value={value}>
      {children}
    </AlmoxarifadoContext.Provider>
  );
}
