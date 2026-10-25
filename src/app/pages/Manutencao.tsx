import { useState, useRef, useEffect } from 'react';
import { Wrench, Plus, CheckCircle, AlertCircle, Info, Calendar, ArrowRight, User, Clock, Search, ChevronDown, ChevronUp, Package, Truck, Tag, X, Building2 } from 'lucide-react';
import { type StatusManutencao, type ItemManutencao, type CriticidadeABC, empresasReparo } from '../data/mockData';
import { bancoDadosStore, getCriticidadeABCDoItem, criticidadeParaABC } from '../data/bancoDadosStore';
import { useAlmoxarifado } from '../context/AlmoxarifadoContext';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';

const STEPS: { key: StatusManutencao; label: string; emoji: string; desc: string }[] = [
  { key: 'Envio', label: 'Enviado', emoji: '📦', desc: 'Item saiu do estoque' },
  { key: 'Peritagem', label: 'Peritagem', emoji: '🔍', desc: 'Diagnóstico do problema' },
  { key: 'Aprovação', label: 'Aprovação', emoji: '✅', desc: 'Manutenção aprovada' },
  { key: 'Execução', label: 'Em Manutenção', emoji: '🔧', desc: 'Reparo em andamento' },
  { key: 'Retorno', label: 'Retorno', emoji: '🚚', desc: 'Item disponível' },
];

function MaintenanceTimeline({ item }: { item: ItemManutencao }) {
  const currentIdx = STEPS.findIndex(s => s.key === item.status);

  const getTimestamp = (key: StatusManutencao) => {
    const map: Record<StatusManutencao, string | undefined> = {
      'Envio': item.timestampEnvio,
      'Peritagem': item.timestampPeritagem,
      'Aprovação': item.timestampAprovacao,
      'Execução': item.timestampExecucao,
      'Retorno': item.timestampRetorno,
    };
    return map[key];
  };

  const formatTs = (ts?: string) => {
    if (!ts) return null;
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
  };

  const progressPct = Math.max(0, (currentIdx / (STEPS.length - 1)) * 100);

  return (
    <div className="relative">
      <div className="flex items-start justify-between relative">
        {/* Connecting track */}
        <div className="absolute top-6 left-6 right-6 h-1 rounded-full bg-gray-200" style={{ zIndex: 0 }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #1A56DB, #60A5FA)',
              boxShadow: progressPct > 0 ? '0 0 8px rgba(96,165,250,0.5)' : 'none',
            }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;
          const ts = getTimestamp(step.key);

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative" style={{ zIndex: 1 }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all"
                style={isCurrent ? {
                  borderColor: '#2563EB',
                  background: 'white',
                  boxShadow: '0 0 0 4px rgba(37,99,235,0.15), 0 4px 12px rgba(37,99,235,0.25)',
                  transform: 'scale(1.1)',
                } : isDone ? {
                  borderColor: '#22C55E',
                  background: 'rgba(34,197,94,0.08)',
                } : {
                  borderColor: 'rgba(11,24,38,0.12)',
                  background: 'white',
                }}
              >
                <span aria-hidden="true">{isDone ? '✅' : step.emoji}</span>
              </div>
              <div className="mt-2 text-center px-1">
                <p className="text-xs font-semibold" style={{ color: isCurrent ? 'var(--text-blue)' : isDone ? 'var(--text-green)' : '#94A3B8' }}>
                  {step.label}
                </p>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-xs mt-0.5" style={{ color: '#2563EB' }}>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    atual
                  </span>
                )}
                {ts && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{formatTs(ts)}</p>
                )}
                {isPending && (
                  <p className="text-xs mt-0.5" style={{ color: '#CBD5E1' }}>Pendente</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Uma linha da ordem sendo montada no formulário — vira um ItemManutencao
// próprio ao confirmar o envio, todos compartilhando o mesmo numeroOS.
interface LinhaOrdemManutencao {
  chave: string;
  produtoId: string;
  produtoNome: string;
  codigoProduto?: string;
  numeroSerie?: string;
  quantidade: number;
}

// Gera o próximo número de OS sequencial do ano corrente (ex: OS-2026-0001),
// reiniciando a numeração a cada ano. Independente do número de série do
// equipamento, já que o mesmo equipamento pode gerar várias OS ao longo do tempo.
const gerarNumeroOS = (itensExistentes: ItemManutencao[]) => {
  const ano = new Date().getFullYear();
  const prefixo = `OS-${ano}-`;
  const max = itensExistentes.reduce((acc, item) => {
    if (!item.numeroOS?.startsWith(prefixo)) return acc;
    const n = parseInt(item.numeroOS.slice(prefixo.length));
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `${prefixo}${String(max + 1).padStart(4, '0')}`;
};

export function Manutencao() {
  const { produtos, setProdutos, itensManutencao: itensData, setItensManutencao: setItensData } = useAlmoxarifado();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [empresaReparo, setEmpresaReparo] = useState('');
  const [observacao, setObservacao] = useState('');
  const [numeroSerieSelecionado, setNumeroSerieSelecionado] = useState<string>('');
  const [itensDaOrdem, setItensDaOrdem] = useState<LinhaOrdemManutencao[]>([]);
  const [filtro, setFiltro] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isConfirmacaoEnvioOpen, setIsConfirmacaoEnvioOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const envioEmAndamentoRef = useRef(false);
  const [itemParaConfirmarRecebimento, setItemParaConfirmarRecebimento] = useState<ItemManutencao | null>(null);
  const [confirmandoRecebimento, setConfirmandoRecebimento] = useState(false);
  const confirmandoRecebimentoRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sugestoes, setSugestoes] = useState<{ produtoId: string; produtoNome: string; codigoProduto?: string; categoria: string; numeroSerie?: string; label: string }[]>([]);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [produtoSelecionadoInfo, setProdutoSelecionadoInfo] = useState<{ produtoNome: string; codigoProduto?: string; categoria: string; numeroSerie?: string } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSugestoes(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const catalogoProdutos = bancoDadosStore.getProdutos();

  const gerarSugestoesManutencao = (query: string) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const resultados: typeof sugestoes = [];
    const idsAdicionados = new Set<string>();

    catalogoProdutos.forEach(cat => {
      bancoDadosStore.getProdutosSerializadosPorCodigo(cat.codigoProduto).forEach(s => {
        if (
          s.numeroSerie.toLowerCase().includes(q) ||
          s.nome.toLowerCase().includes(q) ||
          s.codigoProduto.toLowerCase().includes(q)
        ) {
          const produto = produtos.find(p => p.codigoProduto === s.codigoProduto);
          if (produto && !idsAdicionados.has(`${produto.id}-${s.numeroSerie}`)) {
            resultados.push({
              produtoId: produto.id,
              produtoNome: produto.nome,
              codigoProduto: produto.codigoProduto,
              categoria: s.categoria,
              numeroSerie: s.numeroSerie,
              label: `${s.numeroSerie} — ${produto.nome}`,
            });
            idsAdicionados.add(`${produto.id}-${s.numeroSerie}`);
          }
        }
      });
    });

    produtos.forEach(p => {
      const cat = catalogoProdutos.find(c => c.nome === p.nome)?.categoria || '';
      if (
        p.nome.toLowerCase().includes(q) ||
        (p.codigoProduto && p.codigoProduto.toLowerCase().includes(q)) ||
        cat.toLowerCase().includes(q)
      ) {
        if (!idsAdicionados.has(p.id)) {
          resultados.push({
            produtoId: p.id,
            produtoNome: p.nome,
            codigoProduto: p.codigoProduto,
            categoria: cat,
            label: p.codigoProduto ? `[${p.codigoProduto}] ${p.nome}` : p.nome,
          });
          idsAdicionados.add(p.id);
        }
      }
    });

    return resultados.slice(0, 8);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) { setSugestoes([]); setShowSugestoes(false); return; }
    const s = gerarSugestoesManutencao(value);
    setSugestoes(s);
    setShowSugestoes(s.length > 0);
  };

  const selecionarProdutoSugestao = (item: typeof sugestoes[0]) => {
    setProdutoId(item.produtoId);
    setNumeroSerieSelecionado(item.numeroSerie || '');
    // Unidade com número de série é sempre uma unidade física — quantidade 1.
    if (item.numeroSerie) setQuantidade('1');
    setSearchQuery(item.label);
    setProdutoSelecionadoInfo({ produtoNome: item.produtoNome, codigoProduto: item.codigoProduto, categoria: item.categoria, numeroSerie: item.numeroSerie });
    setShowSugestoes(false);
  };

  const limparSelecaoProduto = () => {
    setProdutoId('');
    setNumeroSerieSelecionado('');
    setSearchQuery('');
    setProdutoSelecionadoInfo(null);
    setSugestoes([]);
  };

  // Adiciona a linha sendo montada à lista da ordem. Nada é gravado no estoque
  // ainda — isso só acontece ao confirmar o envio da ordem inteira.
  const adicionarItemNaOrdem = () => {
    if (!produtoId) { toast.error('Selecione um produto.'); return; }
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    if (!quantidade || parseInt(quantidade) <= 0) { toast.error('Informe uma quantidade válida.'); return; }
    const qtd = parseInt(quantidade);
    if (numeroSerieSelecionado && qtd !== 1) {
      toast.error('Itens com número de série só podem ser adicionados com quantidade 1.');
      return;
    }
    if (numeroSerieSelecionado && itensDaOrdem.some(l => l.numeroSerie === numeroSerieSelecionado)) {
      toast.error('Esta unidade já foi adicionada a esta ordem.');
      return;
    }
    const jaReservado = itensDaOrdem
      .filter(l => l.produtoId === produtoId)
      .reduce((acc, l) => acc + l.quantidade, 0);
    if (jaReservado + qtd > produto.quantidade) {
      toast.error(`Estoque insuficiente para ${produto.nome}: disponível ${produto.quantidade}, já reservado ${jaReservado} nesta ordem.`);
      return;
    }
    const novaLinha: LinhaOrdemManutencao = {
      chave: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      produtoId,
      produtoNome: produto.nome,
      codigoProduto: produto.codigoProduto,
      numeroSerie: numeroSerieSelecionado || undefined,
      quantidade: qtd,
    };
    setItensDaOrdem([...itensDaOrdem, novaLinha]);
    limparSelecaoProduto();
    setQuantidade('');
  };

  const removerItemDaOrdem = (chave: string) => {
    setItensDaOrdem(itensDaOrdem.filter(l => l.chave !== chave));
  };

  const getStatusColor = (status: StatusManutencao) => {
    const map: Record<StatusManutencao, string> = {
      Envio: 'bg-blue-100 text-blue-800 border-blue-200',
      Peritagem: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Aprovação': 'bg-purple-100 text-purple-800 border-purple-200',
      'Execução': 'bg-orange-100 text-orange-800 border-orange-200',
      Retorno: 'bg-green-100 text-green-800 border-green-200',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const getCriticidadeStyle = (c: CriticidadeABC) => {
    if (c === 'A') return { background: 'rgba(239,68,68,0.12)', color: 'var(--text-red)', border: '2px solid rgba(239,68,68,0.35)' };
    if (c === 'B') return { background: 'rgba(245,158,11,0.12)', color: 'var(--text-amber)', border: '2px solid rgba(245,158,11,0.35)' };
    return { background: 'rgba(34,197,94,0.12)', color: 'var(--text-green)', border: '2px solid rgba(34,197,94,0.35)' };
  };

  const getCriticidadeLabel = (c: CriticidadeABC) => ({ A: 'Crítico', B: 'Médio', C: 'Baixo' }[c] || c);

  const calcularDiasDecorridos = (dataEnvio: string) =>
    Math.floor((new Date().getTime() - new Date(dataEnvio).getTime()) / (1000 * 60 * 60 * 24));

  const verificarInercia = (item: ItemManutencao) => {
    if (item.status === 'Retorno') return false;
    const ua = item.ultimaAtualizacao || item.timestampEnvio;
    if (!ua) return false;
    return (new Date().getTime() - new Date(ua).getTime()) / (1000 * 60 * 60) > 48;
  };

  const getSemaforoStatus = (item: ItemManutencao) => {
    if (item.status === 'Retorno') return 'green';
    const dias = calcularDiasDecorridos(item.dataEnvio);
    if (dias > 14) return 'red';
    if (dias > 7) return 'yellow';
    return 'green';
  };

  const calcularTempoEtapa = (inicio?: string, fim?: string) => {
    if (!inicio) return null;
    const ms = (fim ? new Date(fim) : new Date()).getTime() - new Date(inicio).getTime();
    const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
    const horas = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (dias === 0 && horas === 0) return `${Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))}min`;
    if (dias === 0) return `${horas}h`;
    if (horas === 0) return `${dias}d`;
    return `${dias}d ${horas}h`;
  };

  // Soma a quantidade reservada por produto em toda a ordem sendo montada.
  const calcularTotalPorProduto = (linhas: LinhaOrdemManutencao[]) => {
    const totais = new Map<string, number>();
    linhas.forEach(l => totais.set(l.produtoId, (totais.get(l.produtoId) || 0) + l.quantidade));
    return totais;
  };

  // Confere se a soma de cada produto na ordem ainda cabe no estoque atual.
  // Retorna null se está tudo certo, ou a mensagem de erro do primeiro problema.
  const validarEstoqueDaOrdem = (totais: Map<string, number>): string | null => {
    for (const [produtoId, qtd] of totais) {
      const p = produtos.find(p => p.id === produtoId);
      if (!p || p.quantidade < qtd) {
        return `Estoque insuficiente para ${p?.nome || 'produto'}: disponível ${p?.quantidade ?? 0}, solicitado ${qtd}.`;
      }
    }
    return null;
  };

  // Só valida e abre a confirmação — nada é gravado até o usuário confirmar.
  const handleEnviarManutencao = () => {
    if (produtoId) {
      const produtoPendente = produtos.find(p => p.id === produtoId);
      toast.error(`Você escolheu ${produtoPendente?.nome || 'um produto'} mas ainda não adicionou à ordem. Clique em "Adicionar à ordem" ou limpe a seleção.`);
      return;
    }
    if (itensDaOrdem.length === 0) { toast.error('Adicione pelo menos um item à ordem.'); return; }
    if (!responsavel) { toast.error('Informe o nome do responsável pelo envio.'); return; }
    if (!empresaReparo) { toast.error('Selecione a empresa de reparo.'); return; }
    const erroEstoque = validarEstoqueDaOrdem(calcularTotalPorProduto(itensDaOrdem));
    if (erroEstoque) { toast.error(erroEstoque); return; }
    setIsDialogOpen(false);
    setIsConfirmacaoEnvioOpen(true);
  };

  // Executa o envio de fato: UM número de OS, UMA atualização de estoque
  // (soma por produto, nunca sobrescrevendo uma linha com outra) e um
  // ItemManutencao por linha, todos com o mesmo numeroOS e ids únicos.
  // Protegido por ref (guarda síncrona) + estado (desabilita o botão) contra
  // duplo clique.
  const confirmarEnvioManutencao = () => {
    if (envioEmAndamentoRef.current) return;
    envioEmAndamentoRef.current = true;
    setEnviando(true);
    try {
      if (itensDaOrdem.length === 0) { setIsConfirmacaoEnvioOpen(false); return; }
      const totalPorProduto = calcularTotalPorProduto(itensDaOrdem);
      // Revalida contra o estoque mais atual antes de gravar qualquer coisa.
      const erroEstoque = validarEstoqueDaOrdem(totalPorProduto);
      if (erroEstoque) {
        toast.error(erroEstoque);
        setIsConfirmacaoEnvioOpen(false);
        return;
      }
      const numeroOS = gerarNumeroOS(itensData);
      const now = new Date().toISOString();
      const dataEnvio = new Date().toISOString().split('T')[0];
      const novosItens: ItemManutencao[] = itensDaOrdem.map((linha, idx) => {
        const produtoDaLinha = produtos.find(p => p.id === linha.produtoId)!;
        return {
          id: `${Date.now()}-${idx}`,
          produtoId: linha.produtoId,
          produtoNome: linha.produtoNome,
          numeroSerie: linha.numeroSerie,
          numeroOS,
          status: 'Envio',
          dataEnvio,
          responsavel,
          empresaReparo,
          quantidadeEnviada: linha.quantidade,
          observacao: observacao || undefined,
          // Criticidade vem do catálogo (Área Administrativa) — nunca escolhida aqui.
          criticidadeABC: criticidadeParaABC(produtoDaLinha.criticidade),
          ultimaAtualizacao: now,
          timestampEnvio: now,
        };
      });
      setProdutos(produtos.map(p =>
        totalPorProduto.has(p.id) ? { ...p, quantidade: p.quantidade - totalPorProduto.get(p.id)! } : p
      ));
      setItensData([...novosItens, ...itensData]);
      setItensDaOrdem([]);
      setQuantidade(''); setResponsavel(''); setEmpresaReparo(''); setObservacao('');
      limparSelecaoProduto();
      setIsConfirmacaoEnvioOpen(false);
      toast.success(`${novosItens.length} ${novosItens.length === 1 ? 'item enviado' : 'itens enviados'} para manutenção na OS ${numeroOS}.`);
    } finally {
      envioEmAndamentoRef.current = false;
      setEnviando(false);
    }
  };

  // Confirma que o item chegou fisicamente ao almoxarifado: só agora o estoque
  // é somado — uma única vez, protegido por ref + checagem do estado mais atual
  // (não do item capturado ao abrir o diálogo) contra duplo clique.
  const confirmarRecebimento = () => {
    if (confirmandoRecebimentoRef.current || !itemParaConfirmarRecebimento) return;
    confirmandoRecebimentoRef.current = true;
    setConfirmandoRecebimento(true);
    try {
      const itemAtual = itensData.find(i => i.id === itemParaConfirmarRecebimento.id);
      if (!itemAtual || !itemAtual.aguardandoRecebimento) {
        setItemParaConfirmarRecebimento(null);
        return;
      }
      const now = new Date().toISOString();
      setItensData(itensData.map(i =>
        i.id === itemAtual.id
          ? { ...i, aguardandoRecebimento: false, recebimentoConfirmadoEm: now, recebimentoConfirmadoPor: 'Almoxarifado' }
          : i
      ));
      setProdutos(produtos.map(p =>
        p.id === itemAtual.produtoId ? { ...p, quantidade: p.quantidade + (itemAtual.quantidadeEnviada || 0) } : p
      ));
      toast.success(`${itemAtual.quantidadeEnviada || 0} unidade(s) de ${itemAtual.produtoNome} voltaram ao estoque.`);
      setItemParaConfirmarRecebimento(null);
    } finally {
      confirmandoRecebimentoRef.current = false;
      setConfirmandoRecebimento(false);
    }
  };

  const formatarData = (data: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(data));

  const itensFiltrados = itensData
    .filter(item => {
      if (!filtro) return true;
      const q = filtro.toLowerCase();
      return item.produtoNome.toLowerCase().includes(q) ||
        (item.numeroSerie && item.numeroSerie.toLowerCase().includes(q)) ||
        (item.responsavel && item.responsavel.toLowerCase().includes(q)) ||
        item.status.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const ord: Record<CriticidadeABC, number> = { A: 3, B: 2, C: 1 };
      return ord[getCriticidadeABCDoItem(b, produtos)] - ord[getCriticidadeABCDoItem(a, produtos)];
    });

  const semaforoColors = { red: '#EF4444', yellow: '#EAB308', green: '#22C55E' };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Manutenção · Almoxarifado</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Envio de itens para reparo externo e controle do almoxarifado · Ordenado por criticidade ABC</p>
          <span
            className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full mt-2"
            style={{ color: 'var(--text-blue)', background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.2)' }}
          >
            Uso do almoxarifado
          </span>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) limparSelecaoProduto(); }}>
          <DialogTrigger asChild>
            <Button style={{ background: '#1A56DB', color: 'white' }} className="hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Enviar para Manutenção
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <div style={{ background: 'linear-gradient(135deg, #0B1826 0%, #1E3A5F 100%)', margin: '-24px -24px 20px', padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
                <div className="flex items-center gap-2 text-white">
                  <Wrench className="w-5 h-5" />
                  <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Enviar Item para Manutenção</h2>
                </div>
                <p className="text-blue-300 text-sm mt-0.5">A data de envio será registrada automaticamente</p>
              </div>
              <DialogTitle className="sr-only">Enviar para Manutenção</DialogTitle>
              <DialogDescription className="sr-only">Formulário de envio para manutenção</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="man-produto">Produto *</Label>
                <div ref={searchRef} className="relative">
                  <div className={`flex items-center gap-2 border-2 rounded-xl px-3 py-2.5 transition-all ${produtoSelecionadoInfo ? 'border-blue-500 bg-blue-50/50' : 'border-border bg-card'} focus-within:border-blue-500`}>
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <input
                      id="man-produto"
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={e => handleSearchChange(e.target.value)}
                      onFocus={() => { if (sugestoes.length > 0) setShowSugestoes(true); }}
                      placeholder="Nome, código ou ID serializado..."
                      className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                    />
                    {(searchQuery || produtoSelecionadoInfo) && (
                      <button type="button" onClick={limparSelecaoProduto} aria-label="Limpar produto selecionado" className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {showSugestoes && sugestoes.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {sugestoes.map((s, idx) => (
                        <button key={idx} type="button" onClick={() => selecionarProdutoSugestao(s)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border last:border-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.numeroSerie ? 'bg-purple-100' : 'bg-blue-100'}`}>
                            {s.numeroSerie ? <Tag className="w-4 h-4 text-purple-600" /> : <Package className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              {s.codigoProduto && (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: 'var(--text-blue)', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 4, padding: '1px 6px' }}>
                                  {s.codigoProduto}
                                </span>
                              )}
                              {s.numeroSerie && (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: 'var(--text-violet)', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 4, padding: '1px 6px' }}>
                                  #{s.numeroSerie}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground">{s.produtoNome}</p>
                            <p className="text-xs text-muted-foreground">{s.categoria}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {produtoId && (() => {
                const produto = produtos.find(p => p.id === produtoId);
                if (!produto) return null;
                const serializados = produto.codigoProduto
                  ? bancoDadosStore.getProdutosSerializadosPorCodigo(produto.codigoProduto)
                  : [];
                const catInfo = catalogoProdutos.find(c => c.nome === produto.nome);
                return (
                  <div className="p-3 rounded-xl border" style={{ background: 'rgba(26,86,219,0.05)', borderColor: 'rgba(26,86,219,0.2)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          {produto.codigoProduto && (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: 'var(--text-blue)', background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.25)', borderRadius: 4, padding: '1px 6px' }}>
                              {produto.codigoProduto}
                            </span>
                          )}
                          {catInfo && <span className="text-xs text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border">{catInfo.categoria}</span>}
                        </div>
                        <p className="font-semibold text-foreground">{produto.nome}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Disponível</p>
                        <p className="text-lg font-bold" style={{ color: produto.quantidade < 5 ? 'var(--text-red)' : 'var(--foreground)' }}>{produto.quantidade} un.</p>
                      </div>
                    </div>
                    {serializados.length > 0 && !produtoSelecionadoInfo?.numeroSerie && (
                      <div className="pt-2 mt-2 border-t border-blue-200">
                        <Label htmlFor="man-unidade" className="text-xs text-muted-foreground mb-1.5 block">Unidade Serializada (opcional)</Label>
                        <Select
                          value={numeroSerieSelecionado || '__nenhuma__'}
                          onValueChange={(v) => {
                            const valor = v === '__nenhuma__' ? '' : v;
                            setNumeroSerieSelecionado(valor);
                            if (valor) setQuantidade('1');
                          }}
                        >
                          <SelectTrigger id="man-unidade" className="bg-card text-sm"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__nenhuma__">Não especificar</SelectItem>
                            {serializados.map(ps => (
                              <SelectItem key={ps.id} value={ps.numeroSerie}>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text-violet)' }}>#{ps.numeroSerie}</span>
                                <span className="text-xs text-muted-foreground ml-2">· {ps.localizacao} · {ps.status}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {numeroSerieSelecionado && (
                      <div className="flex items-center gap-2 p-2 mt-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                        <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <p className="text-xs" style={{ color: 'var(--text-violet)' }}>Unidade: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>#{numeroSerieSelecionado}</span></p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-end gap-3">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="man-quantidade">Quantidade *</Label>
                  <Input
                    id="man-quantidade"
                    type="number"
                    value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                    placeholder="Qtd"
                    min="1"
                    className="rounded-xl"
                    disabled={!!numeroSerieSelecionado}
                    aria-describedby={numeroSerieSelecionado ? 'man-quantidade-hint' : undefined}
                  />
                  {numeroSerieSelecionado && (
                    <p id="man-quantidade-hint" className="text-xs text-muted-foreground">Unidade com número de série: quantidade fixa em 1.</p>
                  )}
                </div>
                <Button type="button" variant="outline" onClick={adicionarItemNaOrdem} disabled={!produtoId} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />Adicionar à ordem
                </Button>
              </div>

              {produtoId && (() => {
                const produtoSelecionado = produtos.find(p => p.id === produtoId);
                if (!produtoSelecionado) return null;
                const critABC = criticidadeParaABC(produtoSelecionado.criticidade);
                return (
                  <div className="space-y-2">
                    <Label>Criticidade</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={getCriticidadeStyle(critABC)}>
                        {critABC} · {getCriticidadeLabel(critABC)}
                      </span>
                      <p className="text-xs text-muted-foreground">Definida na Área Administrativa</p>
                    </div>
                  </div>
                );
              })()}

              {itensDaOrdem.length > 0 && (
                <div className="space-y-2" role="region" aria-label="Itens da ordem">
                  <p className="text-sm font-semibold text-foreground">Itens da ordem ({itensDaOrdem.length})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {itensDaOrdem.map(linha => {
                      const produtoLinha = produtos.find(p => p.id === linha.produtoId);
                      const critLinha = produtoLinha ? criticidadeParaABC(produtoLinha.criticidade) : null;
                      return (
                        <div key={linha.chave} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-muted/30">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              {linha.codigoProduto && (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: 'var(--text-blue)', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 4, padding: '1px 5px' }}>
                                  {linha.codigoProduto}
                                </span>
                              )}
                              {linha.numeroSerie && (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: 'var(--text-violet)', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 4, padding: '1px 5px' }}>
                                  #{linha.numeroSerie}
                                </span>
                              )}
                              {critLinha && (
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={getCriticidadeStyle(critLinha)}>{critLinha} · {getCriticidadeLabel(critLinha)}</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">
                              {linha.produtoNome} <span className="text-muted-foreground font-normal">× {linha.quantidade}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerItemDaOrdem(linha.chave)}
                            aria-label={`Remover ${linha.produtoNome}${linha.numeroSerie ? ` #${linha.numeroSerie}` : ''} da ordem`}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="man-responsavel">Responsável *</Label>
                <Input id="man-responsavel" value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Nome completo" className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="man-empresa-reparo">Empresa de reparo *</Label>
                <Select value={empresaReparo} onValueChange={setEmpresaReparo}>
                  <SelectTrigger id="man-empresa-reparo"><SelectValue placeholder="Selecione a empresa responsável" /></SelectTrigger>
                  <SelectContent>
                    {empresasReparo.map(empresa => (
                      <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="man-observacao">Observação (opcional)</Label>
                <Textarea id="man-observacao" value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Descreva o problema..." rows={3} className="rounded-xl" />
              </div>

              <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(26,86,219,0.06)', border: '1px solid rgba(26,86,219,0.15)' }}>
                <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--text-blue)' }} aria-hidden="true" />
                <p className="text-xs" style={{ color: 'var(--text-blue)' }}>
                  Ao enviar, os itens saem do estoque. As unidades voltam ao estoque quando o almoxarifado confirma o recebimento.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleEnviarManutencao}
                disabled={(itensDaOrdem.length === 0 && !produtoId) || !responsavel || !empresaReparo}
                style={{ background: '#1A56DB', color: 'white' }}
                className="hover:opacity-90"
              >
                <Wrench className="w-4 h-4 mr-2" />Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmação antes de enviar — nada é gravado até o usuário confirmar aqui */}
        <AlertDialog open={isConfirmacaoEnvioOpen} onOpenChange={setIsConfirmacaoEnvioOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar envio para manutenção</AlertDialogTitle>
              <AlertDialogDescription>Confira a empresa de reparo e os itens antes de confirmar.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)' }}>
                <span className="text-muted-foreground">Empresa de reparo</span>
                <span className="font-bold" style={{ color: 'var(--text-blue)' }}>{empresaReparo}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Responsável</span>
                <span className="font-semibold text-foreground">{responsavel}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Itens ({itensDaOrdem.length})</p>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {itensDaOrdem.map(linha => {
                    const produtoLinha = produtos.find(p => p.id === linha.produtoId);
                    const critLinha = produtoLinha ? criticidadeParaABC(produtoLinha.criticidade) : null;
                    return (
                      <div key={linha.chave} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            {linha.codigoProduto && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: 'var(--text-blue)', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 4, padding: '1px 5px' }}>
                                {linha.codigoProduto}
                              </span>
                            )}
                            {linha.numeroSerie && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: 'var(--text-violet)', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 4, padding: '1px 5px' }}>
                                #{linha.numeroSerie}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">
                            {linha.produtoNome} <span className="text-muted-foreground font-normal">× {linha.quantidade}</span>
                          </p>
                        </div>
                        {critLinha && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={getCriticidadeStyle(critLinha)}>
                            {critLinha} · {getCriticidadeLabel(critLinha)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDialogOpen(true)}>Voltar e corrigir</AlertDialogCancel>
              <AlertDialogAction onClick={confirmarEnvioManutencao} disabled={enviando}>Confirmar envio</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Confirmação de recebimento — só aqui o estoque é somado de volta */}
      <AlertDialog open={!!itemParaConfirmarRecebimento} onOpenChange={(open) => { if (!open) setItemParaConfirmarRecebimento(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar recebimento do item</AlertDialogTitle>
            <AlertDialogDescription>Confirme somente se o item está fisicamente no almoxarifado.</AlertDialogDescription>
          </AlertDialogHeader>
          {itemParaConfirmarRecebimento && (
            <div className="space-y-2 py-2 text-sm">
              {itemParaConfirmarRecebimento.numeroOS && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Nº da OS</span>
                  <span className="font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{itemParaConfirmarRecebimento.numeroOS}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Produto</span>
                <span className="font-semibold text-foreground text-right">{itemParaConfirmarRecebimento.produtoNome}</span>
              </div>
              {itemParaConfirmarRecebimento.numeroSerie && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Número de série</span>
                  <span className="font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{itemParaConfirmarRecebimento.numeroSerie}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Quantidade</span>
                <span className="font-semibold text-foreground">{itemParaConfirmarRecebimento.quantidadeEnviada ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)' }}>
                <span className="text-muted-foreground">Empresa de reparo</span>
                <span className="font-bold" style={{ color: 'var(--text-blue)' }}>{itemParaConfirmarRecebimento.empresaReparo || 'Empresa não informada'}</span>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarRecebimento} disabled={confirmandoRecebimento}>Confirmar recebimento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Process flow */}
      <div className="mb-6 bg-card border border-border rounded-xl p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Fluxo do Processo</p>
        <div className="flex items-center gap-2 flex-wrap">
          {STEPS.map((step, idx) => (
            <div key={step.key} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                <span>{step.emoji}</span>
                <span>{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/50" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">O status é atualizado pela empresa de reparo. O retorno ao estoque é confirmado pelo almoxarifado.</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Buscar ordens de manutenção"
            placeholder="Buscar por produto, número de série, responsável ou status..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="pl-10 rounded-xl border-[#4B5768] dark:border-input"
          />
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {itensFiltrados.length === 0 && (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum item encontrado</p>
          </div>
        )}

        {itensFiltrados.map(item => {
          const produto = produtos.find(p => p.id === item.produtoId);
          const dias = calcularDiasDecorridos(item.dataEnvio);
          const temInercia = verificarInercia(item);
          const semaforo = getSemaforoStatus(item);
          const isExpanded = expandedId === item.id;
          const critABC = getCriticidadeABCDoItem(item, produtos);
          const critStyle = getCriticidadeStyle(critABC);
          const cardBorderColor = temInercia ? '#EF4444' : semaforo === 'red' ? 'rgba(239,68,68,0.4)' : semaforo === 'yellow' ? 'rgba(234,179,8,0.4)' : 'rgba(11,24,38,0.1)';

          return (
            <div
              key={item.id}
              className="bg-card rounded-xl overflow-hidden shadow-sm"
              style={{ border: `1.5px solid ${cardBorderColor}` }}
            >
              {/* Header row */}
              <button
                type="button"
                className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-muted/40 text-left"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    aria-hidden="true"
                    style={{
                      background: semaforoColors[semaforo],
                      boxShadow: semaforo === 'red' ? `0 0 8px ${semaforoColors.red}` : 'none',
                      animation: semaforo === 'red' ? 'pulse 2s infinite' : 'none',
                    }}
                  />
                  <span className="text-xs font-semibold" style={{ color: semaforo === 'red' ? 'var(--text-red)' : semaforo === 'yellow' ? 'var(--text-amber)' : 'var(--text-green)' }}>
                    {semaforo === 'red' ? 'Atrasado' : semaforo === 'yellow' ? 'Atenção' : 'No prazo'}
                  </span>
                </div>

                <div className="shrink-0">
                  {produto?.codigoProduto && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: 'var(--text-blue)', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 4, padding: '2px 6px', display: 'block', marginBottom: 3 }}>
                      {produto.codigoProduto}
                    </span>
                  )}
                  {item.numeroSerie && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: 'var(--text-violet)', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 4, padding: '2px 6px', display: 'block' }}>
                      #{item.numeroSerie}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {item.numeroOS && (
                    <p className="text-xs font-semibold mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--muted-foreground)' }}>{item.numeroOS}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {temInercia && <span className="font-semibold text-xs" style={{ color: 'var(--text-red)' }}><span aria-hidden="true">⚠️</span> Sem atualização</span>}
                    <p className="font-semibold text-foreground">{item.produtoNome}</p>
                  </div>
                  {item.responsavel && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" />{item.responsavel}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3" />{item.empresaReparo || 'Empresa não informada'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={critStyle}>
                    {critABC} · {getCriticidadeLabel(critABC)}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="text-xs font-medium" style={{ color: item.aguardandoRecebimento ? 'var(--text-blue)' : 'var(--muted-foreground)' }}>
                    {item.status !== 'Retorno' ? `${dias}d` : item.aguardandoRecebimento ? 'Aguardando' : '✓'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />}
                </div>
              </button>

              {/* Expanded panel */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-5 bg-muted/30 space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Linha do Tempo</p>
                    <MaintenanceTimeline item={item} />
                  </div>

                  {(() => {
                    const prazoLimiteDias = 14;
                    const dataEnvio = new Date(item.dataEnvio);
                    const dataPrevista = new Date(dataEnvio.getTime() + prazoLimiteDias * 24 * 60 * 60 * 1000);
                    const diasRestantes = item.status !== 'Retorno'
                      ? Math.ceil((dataPrevista.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    const atrasado = diasRestantes !== null && diasRestantes < 0;
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-card rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />Data de Envio</p>
                          <p className="font-semibold text-foreground text-sm">{formatarData(item.dataEnvio)}</p>
                        </div>
                        <div className="bg-card rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Retorno Previsto</p>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-blue)' }}>{formatarData(dataPrevista.toISOString())}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">prazo de {prazoLimiteDias} dias</p>
                        </div>
                        <div className="rounded-lg border p-3" style={{ background: atrasado ? 'rgba(239,68,68,0.05)' : dias > 7 ? 'rgba(234,179,8,0.05)' : 'var(--card)', borderColor: atrasado ? 'rgba(239,68,68,0.3)' : 'rgba(11,24,38,0.1)' }}>
                          <p className="text-xs text-muted-foreground mb-1">Dias Decorridos</p>
                          <p className="font-semibold text-sm" style={{ color: atrasado ? 'var(--text-red)' : dias > 7 ? 'var(--text-amber)' : 'var(--foreground)' }}>
                            {dias}d <span aria-hidden="true">{atrasado ? '🔴' : dias > 7 ? '🟡' : '🟢'}</span>
                          </p>
                        </div>
                        {item.status !== 'Retorno' ? (
                          <div className="rounded-lg border p-3" style={{ background: atrasado ? 'rgba(239,68,68,0.05)' : 'var(--card)', borderColor: atrasado ? 'rgba(239,68,68,0.3)' : 'rgba(11,24,38,0.1)' }}>
                            <p className="text-xs text-muted-foreground mb-1">Dias Restantes</p>
                            {atrasado ? (
                              <p className="font-semibold text-sm" style={{ color: 'var(--text-red)' }}><span aria-hidden="true">🔴</span> {Math.abs(diasRestantes!)} dias atrasado</p>
                            ) : (
                              <p className="font-semibold text-sm" style={{ color: diasRestantes! <= 3 ? 'var(--text-amber)' : 'var(--foreground)' }}>
                                {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg border p-3" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.25)' }}>
                            <p className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--text-green)' }}><CheckCircle className="w-3 h-3" aria-hidden="true" />Retornado em</p>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-green)' }}>{item.dataRetorno ? formatarData(item.dataRetorno) : '—'}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Histórico Completo</p>
                    <div className="space-y-2">
                      {[
                        { key: 'Envio', ts: item.timestampEnvio, label: 'Item enviado para manutenção', by: item.responsavel },
                        { key: 'Peritagem', ts: item.timestampPeritagem, label: 'Peritagem iniciada', by: null },
                        { key: 'Aprovação', ts: item.timestampAprovacao, label: 'Manutenção aprovada', by: null },
                        { key: 'Execução', ts: item.timestampExecucao, label: 'Execução iniciada', by: null },
                        {
                          key: 'Retorno',
                          // Já recebido: mostra quando o almoxarifado confirmou (não quando a
                          // empresa marcou como concluído). Itens antigos, sem esse registro,
                          // continuam usando timestampRetorno.
                          ts: (item.aguardandoRecebimento === false && item.recebimentoConfirmadoEm)
                            ? item.recebimentoConfirmadoEm
                            : item.timestampRetorno,
                          label: item.aguardandoRecebimento ? 'Reparo concluído — aguardando confirmação do almoxarifado' : 'Item retornado ao estoque',
                          by: null,
                        },
                      ].filter(e => e.ts).map(event => (
                        <div key={event.key} className="flex items-start gap-3 p-2.5 bg-card rounded-lg border border-border">
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: '#1A56DB' }} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{event.label}</p>
                            {event.by && <p className="text-xs text-muted-foreground">por {event.by}</p>}
                          </div>
                          <p className="text-xs text-muted-foreground shrink-0">
                            {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(event.ts!))}
                          </p>
                        </div>
                      ))}

                      <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-amber)' }}>Tempo em cada etapa:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {item.timestampEnvio && (
                            <div className="text-xs" style={{ color: 'var(--text-amber)' }}>
                              <span className="font-medium">Envio:</span>{' '}
                              {calcularTempoEtapa(item.timestampEnvio, item.timestampPeritagem) || 'em andamento'}
                            </div>
                          )}
                          {item.timestampPeritagem && (
                            <div className="text-xs" style={{ color: 'var(--text-amber)' }}>
                              <span className="font-medium">Peritagem:</span>{' '}
                              {calcularTempoEtapa(item.timestampPeritagem, item.timestampAprovacao) || 'em andamento'}
                            </div>
                          )}
                          {item.timestampAprovacao && (
                            <div className="text-xs" style={{ color: 'var(--text-amber)' }}>
                              <span className="font-medium">Aprovação:</span>{' '}
                              {calcularTempoEtapa(item.timestampAprovacao, item.timestampExecucao) || 'em andamento'}
                            </div>
                          )}
                          {item.timestampExecucao && (
                            <div className="text-xs" style={{ color: 'var(--text-amber)' }}>
                              <span className="font-medium">Execução:</span>{' '}
                              {calcularTempoEtapa(item.timestampExecucao, item.timestampRetorno) || 'em andamento'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.observacao && (
                    <div className="p-3 bg-card border border-amber-200 rounded-lg">
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-amber)' }}>Observações</p>
                      <p className="text-sm" style={{ color: 'var(--text-amber)' }}>{item.observacao}</p>
                    </div>
                  )}

                  {temInercia && (
                    <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" aria-hidden="true" />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-red)' }}>Sem atualização há mais de 48 horas — requer atenção imediata.</p>
                    </div>
                  )}

                  {item.status === 'Retorno' && item.aguardandoRecebimento && (
                    <div className="p-3 rounded-lg flex items-center justify-between gap-3 flex-wrap" style={{ background: 'rgba(26,86,219,0.06)', border: '1px solid rgba(26,86,219,0.2)' }}>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 shrink-0" style={{ color: 'var(--text-blue)' }} aria-hidden="true" />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-blue)' }}>Aguardando confirmação do almoxarifado</p>
                      </div>
                      <Button onClick={() => setItemParaConfirmarRecebimento(item)} style={{ background: '#1A56DB', color: 'white' }} className="hover:opacity-90">
                        Confirmar recebimento
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
