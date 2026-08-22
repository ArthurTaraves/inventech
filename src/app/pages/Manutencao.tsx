import { useState, useRef, useEffect } from 'react';
import { Wrench, Plus, CheckCircle, AlertCircle, Info, Calendar, ArrowRight, User, Clock, Search, ChevronDown, ChevronUp, Package, Truck, Tag, X } from 'lucide-react';
import { type StatusManutencao, type ItemManutencao, type CriticidadeABC } from '../data/mockData';
import { bancoDadosStore } from '../data/bancoDadosStore';
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
                {isDone ? '✅' : step.emoji}
              </div>
              <div className="mt-2 text-center px-1">
                <p className="text-xs font-semibold" style={{ color: isCurrent ? '#1A56DB' : isDone ? '#16A34A' : '#94A3B8' }}>
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

export function Manutencao() {
  const { produtos, setProdutos, itensManutencao: itensData, setItensManutencao: setItensData } = useAlmoxarifado();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [observacao, setObservacao] = useState('');
  const [criticidadeABC, setCriticidadeABC] = useState<CriticidadeABC>('B');
  const [numeroSerieSelecionado, setNumeroSerieSelecionado] = useState<string>('');
  const [filtro, setFiltro] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    if (c === 'A') return { background: 'rgba(239,68,68,0.12)', color: '#DC2626', border: '2px solid rgba(239,68,68,0.35)' };
    if (c === 'B') return { background: 'rgba(245,158,11,0.12)', color: '#D97706', border: '2px solid rgba(245,158,11,0.35)' };
    return { background: 'rgba(34,197,94,0.12)', color: '#16A34A', border: '2px solid rgba(34,197,94,0.35)' };
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

  const handleEnviarManutencao = () => {
    if (!produtoId || !quantidade || !responsavel) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    const qtd = parseInt(quantidade);
    if (produto.quantidade < qtd) {
      toast.error(`Estoque insuficiente! Disponível: ${produto.quantidade} unidades`);
      return;
    }
    setProdutos(produtos.map(p => p.id === produtoId ? { ...p, quantidade: p.quantidade - qtd } : p));
    const now = new Date().toISOString();
    const novoItem: ItemManutencao = {
      id: String(Date.now()),
      produtoId,
      produtoNome: produto.nome,
      numeroSerie: numeroSerieSelecionado || undefined,
      status: 'Envio',
      dataEnvio: new Date().toISOString().split('T')[0],
      responsavel,
      quantidadeEnviada: qtd,
      observacao: observacao || undefined,
      criticidadeABC,
      ultimaAtualizacao: now,
      timestampEnvio: now,
    };
    setItensData([novoItem, ...itensData]);
    setProdutoId(''); setQuantidade(''); setResponsavel(''); setObservacao('');
    setCriticidadeABC('B'); setNumeroSerieSelecionado('');
    limparSelecaoProduto();
    setIsDialogOpen(false);
    toast.success(`${qtd} unidade(s) de ${produto.nome} enviada(s) para manutenção.`);
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
      return ord[b.criticidadeABC] - ord[a.criticidadeABC];
    });

  const semaforoColors = { red: '#EF4444', yellow: '#EAB308', green: '#22C55E' };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Manutenção</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Rastreabilidade completa · Ordered by criticidade ABC</p>
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
                <Label>Produto *</Label>
                <div ref={searchRef} className="relative">
                  <div className={`flex items-center gap-2 border-2 rounded-xl px-3 py-2.5 transition-all ${produtoSelecionadoInfo ? 'border-blue-500 bg-blue-50/50' : 'border-border bg-card'} focus-within:border-blue-500`}>
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => handleSearchChange(e.target.value)}
                      onFocus={() => { if (sugestoes.length > 0) setShowSugestoes(true); }}
                      placeholder="Nome, código ou ID serializado..."
                      className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                    />
                    {(searchQuery || produtoSelecionadoInfo) && (
                      <button type="button" onClick={limparSelecaoProduto} className="text-muted-foreground hover:text-foreground">
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
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 4, padding: '1px 6px' }}>
                                  {s.codigoProduto}
                                </span>
                              )}
                              {s.numeroSerie && (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7C3AED', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 4, padding: '1px 6px' }}>
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
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.25)', borderRadius: 4, padding: '1px 6px' }}>
                              {produto.codigoProduto}
                            </span>
                          )}
                          {catInfo && <span className="text-xs text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border">{catInfo.categoria}</span>}
                        </div>
                        <p className="font-semibold text-foreground">{produto.nome}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Disponível</p>
                        <p className={`text-lg font-bold ${produto.quantidade < 5 ? 'text-red-600' : 'text-foreground'}`}>{produto.quantidade} un.</p>
                      </div>
                    </div>
                    {serializados.length > 0 && !produtoSelecionadoInfo?.numeroSerie && (
                      <div className="pt-2 mt-2 border-t border-blue-200">
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Unidade Serializada (opcional)</Label>
                        <Select value={numeroSerieSelecionado} onValueChange={setNumeroSerieSelecionado}>
                          <SelectTrigger className="bg-card text-sm"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Não especificar</SelectItem>
                            {serializados.map(ps => (
                              <SelectItem key={ps.id} value={ps.numeroSerie}>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#7C3AED' }}>#{ps.numeroSerie}</span>
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
                        <p className="text-xs" style={{ color: '#7C3AED' }}>Unidade: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>#{numeroSerieSelecionado}</span></p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="Qtd" min="1" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Responsável *</Label>
                  <Input value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Nome completo" className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Grau de Criticidade *</Label>
                <Select value={criticidadeABC} onValueChange={v => setCriticidadeABC(v as CriticidadeABC)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">🔴 A — Crítico</SelectItem>
                    <SelectItem value="B">🟡 B — Médio</SelectItem>
                    <SelectItem value="C">🟢 C — Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observação (opcional)</Label>
                <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Descreva o problema..." rows={3} className="rounded-xl" />
              </div>

              <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(26,86,219,0.06)', border: '1px solid rgba(26,86,219,0.15)' }}>
                <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#1A56DB' }} />
                <p className="text-xs" style={{ color: '#1A56DB' }}>
                  Ao enviar, o item sai do estoque. Ao marcar como "Retorno" na Manutenção Visual, as unidades retornam automaticamente.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleEnviarManutencao} style={{ background: '#1A56DB', color: 'white' }} className="hover:opacity-90">
                <Wrench className="w-4 h-4 mr-2" />Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
        <p className="text-xs text-muted-foreground/70 mt-2">O status é atualizado pela equipe técnica na aba "Manutenção Visual".</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto, número de série, responsável ou status..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="pl-10 rounded-xl"
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
          const critStyle = getCriticidadeStyle(item.criticidadeABC);
          const cardBorderColor = temInercia ? '#EF4444' : semaforo === 'red' ? 'rgba(239,68,68,0.4)' : semaforo === 'yellow' ? 'rgba(234,179,8,0.4)' : 'rgba(11,24,38,0.1)';

          return (
            <div
              key={item.id}
              className="bg-card rounded-xl overflow-hidden shadow-sm"
              style={{ border: `1.5px solid ${cardBorderColor}` }}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-muted/40"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    background: semaforoColors[semaforo],
                    boxShadow: semaforo === 'red' ? `0 0 8px ${semaforoColors.red}` : 'none',
                    animation: semaforo === 'red' ? 'pulse 2s infinite' : 'none',
                  }}
                />

                <div className="shrink-0">
                  {produto?.codigoProduto && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 4, padding: '2px 6px', display: 'block', marginBottom: 3 }}>
                      {produto.codigoProduto}
                    </span>
                  )}
                  {item.numeroSerie && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7C3AED', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 4, padding: '2px 6px', display: 'block' }}>
                      #{item.numeroSerie}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {temInercia && <span className="text-red-500 animate-pulse">⚠️</span>}
                    <p className="font-semibold text-foreground">{item.produtoNome}</p>
                  </div>
                  {item.responsavel && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" />{item.responsavel}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={critStyle}>
                    {item.criticidadeABC}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.status !== 'Retorno' ? `${dias}d` : '✓'}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

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
                          <p className="font-semibold text-sm" style={{ color: '#1A56DB' }}>{formatarData(dataPrevista.toISOString())}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">prazo de {prazoLimiteDias} dias</p>
                        </div>
                        <div className="rounded-lg border p-3" style={{ background: atrasado ? 'rgba(239,68,68,0.05)' : dias > 7 ? 'rgba(234,179,8,0.05)' : 'white', borderColor: atrasado ? 'rgba(239,68,68,0.3)' : 'rgba(11,24,38,0.1)' }}>
                          <p className="text-xs text-muted-foreground mb-1">Dias Decorridos</p>
                          <p className="font-semibold text-sm" style={{ color: atrasado ? '#DC2626' : dias > 7 ? '#D97706' : '#0B1826' }}>
                            {dias}d {atrasado ? '🔴' : dias > 7 ? '🟡' : '🟢'}
                          </p>
                        </div>
                        {item.status !== 'Retorno' ? (
                          <div className="rounded-lg border p-3" style={{ background: atrasado ? 'rgba(239,68,68,0.05)' : 'white', borderColor: atrasado ? 'rgba(239,68,68,0.3)' : 'rgba(11,24,38,0.1)' }}>
                            <p className="text-xs text-muted-foreground mb-1">Dias Restantes</p>
                            {atrasado ? (
                              <p className="font-semibold text-sm text-red-700">🔴 {Math.abs(diasRestantes!)} dias atrasado</p>
                            ) : (
                              <p className="font-semibold text-sm" style={{ color: diasRestantes! <= 3 ? '#D97706' : '#0B1826' }}>
                                {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg border p-3" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.25)' }}>
                            <p className="text-xs mb-1 flex items-center gap-1" style={{ color: '#16A34A' }}><CheckCircle className="w-3 h-3" />Retornado em</p>
                            <p className="font-semibold text-sm text-green-800">{item.dataRetorno ? formatarData(item.dataRetorno) : '—'}</p>
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
                        { key: 'Retorno', ts: item.timestampRetorno, label: 'Item retornado ao estoque', by: null },
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
                        <p className="text-xs font-semibold text-amber-700 mb-2">Tempo em cada etapa:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {item.timestampEnvio && (
                            <div className="text-xs text-amber-800">
                              <span className="font-medium">Envio:</span>{' '}
                              {calcularTempoEtapa(item.timestampEnvio, item.timestampPeritagem) || 'em andamento'}
                            </div>
                          )}
                          {item.timestampPeritagem && (
                            <div className="text-xs text-amber-800">
                              <span className="font-medium">Peritagem:</span>{' '}
                              {calcularTempoEtapa(item.timestampPeritagem, item.timestampAprovacao) || 'em andamento'}
                            </div>
                          )}
                          {item.timestampAprovacao && (
                            <div className="text-xs text-amber-800">
                              <span className="font-medium">Aprovação:</span>{' '}
                              {calcularTempoEtapa(item.timestampAprovacao, item.timestampExecucao) || 'em andamento'}
                            </div>
                          )}
                          {item.timestampExecucao && (
                            <div className="text-xs text-amber-800">
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
                      <p className="text-xs font-semibold text-amber-700 mb-1">Observações</p>
                      <p className="text-sm text-amber-900">{item.observacao}</p>
                    </div>
                  )}

                  {temInercia && (
                    <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-sm text-red-800 font-medium">Sem atualização há mais de 48 horas — requer atenção imediata.</p>
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
