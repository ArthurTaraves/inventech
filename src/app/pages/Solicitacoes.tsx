import { useState, useEffect } from 'react';
import {
  Plus, Search, Eye, CheckCircle, XCircle, Package, AlertTriangle, ChevronDown,
  ClipboardList, Building2, Calendar, User, Hash, MessageSquare, Layers, Truck,
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAlmoxarifado } from '../context/AlmoxarifadoContext';
import { bancoDadosStore } from '../data/bancoDadosStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusSolicitacao =
  | 'Solicitada'
  | 'Em análise'
  | 'Aprovada'
  | 'Em separação'
  | 'Pronta para retirada'
  | 'Entregue'
  | 'Cancelada';

type PrioridadeSolicitacao = 'Baixa' | 'Média' | 'Alta';

interface ItemSolicitacao {
  produtoId: string;
  produtoNome: string;
  codigoProduto?: string;
  quantidade: number;
}

interface Solicitacao {
  id: string;
  numero: string;
  solicitante: string;
  matricula: string;
  setor: string;
  dataPrevista: string;
  prioridade: PrioridadeSolicitacao;
  observacao?: string;
  itens: ItemSolicitacao[];
  status: StatusSolicitacao;
  dataCriacao: string;
  ultimaAtualizacao: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusSolicitacao, { color: string; bg: string; border: string; label: string }> = {
  'Solicitada':           { color: '#1A56DB', bg: 'rgba(26,86,219,0.1)',   border: 'rgba(26,86,219,0.25)',   label: 'Solicitada' },
  'Em análise':           { color: '#D97706', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.25)',   label: 'Em análise' },
  'Aprovada':             { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  label: 'Aprovada' },
  'Em separação':         { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.25)', label: 'Em separação' },
  'Pronta para retirada': { color: '#EA580C', bg: 'rgba(234,88,12,0.1)',  border: 'rgba(234,88,12,0.25)',  label: 'Pronta para retirada' },
  'Entregue':             { color: '#15803D', bg: 'rgba(21,128,61,0.1)',   border: 'rgba(21,128,61,0.25)',   label: 'Entregue' },
  'Cancelada':            { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.25)',   label: 'Cancelada' },
};

const PRIORIDADE_CONFIG: Record<PrioridadeSolicitacao, { color: string; bg: string; border: string }> = {
  'Baixa':  { color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' },
  'Média':  { color: '#D97706', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.2)' },
  'Alta':   { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.2)' },
};

const FLUXO: Record<StatusSolicitacao, { label: string; novoStatus: StatusSolicitacao; color: string } | null> = {
  'Solicitada':           { label: 'Iniciar Análise',    novoStatus: 'Em análise',           color: '#D97706' },
  'Em análise':           { label: 'Aprovar',            novoStatus: 'Aprovada',             color: '#10B981' },
  'Aprovada':             { label: 'Iniciar Separação',  novoStatus: 'Em separação',         color: '#7C3AED' },
  'Em separação':         { label: 'Marcar como Pronto', novoStatus: 'Pronta para retirada', color: '#EA580C' },
  'Pronta para retirada': { label: 'Confirmar Entrega',  novoStatus: 'Entregue',             color: '#15803D' },
  'Entregue':             null,
  'Cancelada':            null,
};

const STATUS_TODOS: StatusSolicitacao[] = [
  'Solicitada', 'Em análise', 'Aprovada', 'Em separação', 'Pronta para retirada', 'Entregue', 'Cancelada',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B',
  background: '#F1F5FB', borderBottom: '1px solid rgba(11,24,38,0.08)', whiteSpace: 'nowrap',
};

const StatusBadge = ({ status }: { status: StatusSolicitacao }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, borderRadius: 9999,
      padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
};

const PrioridadeBadge = ({ prioridade }: { prioridade: PrioridadeSolicitacao }) => {
  const cfg = PRIORIDADE_CONFIG[prioridade];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, borderRadius: 6,
      padding: '2px 8px', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {prioridade}
    </span>
  );
};

const gerarNumero = (existentes: Solicitacao[]) => {
  const max = existentes.reduce((acc, s) => {
    const n = parseInt(s.numero.replace('SOL-', ''));
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `SOL-${String(max + 1).padStart(3, '0')}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Solicitacoes() {
  const { produtos } = useAlmoxarifado();
  const catalogoProdutos = bancoDadosStore.getProdutos();

  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(() => {
    const saved = localStorage.getItem('almoxarifado_solicitacoes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('almoxarifado_solicitacoes', JSON.stringify(solicitacoes));
  }, [solicitacoes]);

  const [activeTab, setActiveTab] = useState<'solicitante' | 'central'>('solicitante');

  // ── Nova Solicitação modal ──
  const [isNovaOpen, setIsNovaOpen] = useState(false);
  const [form, setForm] = useState({ solicitante: '', matricula: '', setor: '', dataPrevista: '', prioridade: 'Média' as PrioridadeSolicitacao, observacao: '' });
  const [itensForm, setItensForm] = useState<ItemSolicitacao[]>([]);
  const [novoItemProdutoId, setNovoItemProdutoId] = useState('');
  const [novoItemQtd, setNovoItemQtd] = useState(1);
  const [formErros, setFormErros] = useState<Record<string, string>>({});

  // ── Detail modal ──
  const [detalhe, setDetalhe] = useState<Solicitacao | null>(null);

  // ── Filters (central) ──
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [buscaCentral, setBuscaCentral] = useState('');

  // ── Search (solicitante) ──
  const [buscaSolicitante, setBuscaSolicitante] = useState('');

  // ── Actions ──
  const avancarStatus = (sol: Solicitacao, novoStatus: StatusSolicitacao) => {
    const updated = { ...sol, status: novoStatus, ultimaAtualizacao: new Date().toISOString() };
    setSolicitacoes(prev => prev.map(s => s.id === sol.id ? updated : s));
    if (detalhe?.id === sol.id) setDetalhe(updated);
    toast.success(`Status atualizado para "${novoStatus}"`);
  };

  const cancelarSolicitacao = (sol: Solicitacao) => {
    const updated = { ...sol, status: 'Cancelada' as StatusSolicitacao, ultimaAtualizacao: new Date().toISOString() };
    setSolicitacoes(prev => prev.map(s => s.id === sol.id ? updated : s));
    if (detalhe?.id === sol.id) setDetalhe(updated);
    toast.success('Solicitação cancelada');
  };

  const validarForm = () => {
    const erros: Record<string, string> = {};
    if (!form.solicitante.trim()) erros.solicitante = 'Campo obrigatório';
    if (!form.matricula.trim()) erros.matricula = 'Campo obrigatório';
    if (!form.setor.trim()) erros.setor = 'Campo obrigatório';
    if (!form.dataPrevista) erros.dataPrevista = 'Campo obrigatório';
    if (itensForm.length === 0) erros.itens = 'Adicione pelo menos um item';
    setFormErros(erros);
    return Object.keys(erros).length === 0;
  };

  const enviarSolicitacao = () => {
    if (!validarForm()) { toast.error('Preencha todos os campos obrigatórios'); return; }
    const nova: Solicitacao = {
      id: String(Date.now()),
      numero: gerarNumero(solicitacoes),
      ...form,
      itens: itensForm,
      status: 'Solicitada',
      dataCriacao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
    };
    setSolicitacoes(prev => [nova, ...prev]);
    setIsNovaOpen(false);
    setForm({ solicitante: '', matricula: '', setor: '', dataPrevista: '', prioridade: 'Média', observacao: '' });
    setItensForm([]);
    setFormErros({});
    toast.success(`Solicitação ${nova.numero} enviada com sucesso!`);
  };

  const adicionarItem = () => {
    if (!novoItemProdutoId) { toast.error('Selecione um produto'); return; }
    if (novoItemQtd < 1) { toast.error('Quantidade inválida'); return; }
    const produto = produtos.find(p => p.id === novoItemProdutoId);
    if (!produto) return;
    if (itensForm.find(i => i.produtoId === novoItemProdutoId)) {
      toast.error('Produto já adicionado. Edite a quantidade.');
      return;
    }
    setItensForm(prev => [...prev, {
      produtoId: produto.id,
      produtoNome: produto.nome,
      codigoProduto: produto.codigoProduto,
      quantidade: novoItemQtd,
    }]);
    setNovoItemProdutoId('');
    setNovoItemQtd(1);
  };

  const removerItem = (produtoId: string) => {
    setItensForm(prev => prev.filter(i => i.produtoId !== produtoId));
  };

  // ── Stock availability for detail modal ──
  const getDisponibilidade = (item: ItemSolicitacao) => {
    const produtoEstoque = produtos.find(p => p.id === item.produtoId || p.nome === item.produtoNome);
    const catalogoItem = catalogoProdutos.find(c => c.codigoProduto === item.codigoProduto || c.nome === item.produtoNome);
    const disponivel = produtoEstoque?.quantidade ?? 0;
    const minimo = catalogoItem?.estoqueMinimo ?? 0;
    const saldo = disponivel - item.quantidade;
    const criticidade = produtoEstoque?.criticidade;
    return { disponivel, minimo, saldo, criticidade };
  };

  // ── Filtered lists ──
  const solicitacoesFiltradas = solicitacoes.filter(s => {
    if (buscaSolicitante && !s.numero.toLowerCase().includes(buscaSolicitante.toLowerCase()) &&
        !s.solicitante.toLowerCase().includes(buscaSolicitante.toLowerCase())) return false;
    return true;
  });

  const setoresUnicos = [...new Set(solicitacoes.map(s => s.setor).filter(Boolean))];

  const centralFiltradas = solicitacoes.filter(s => {
    if (filtroStatus && s.status !== filtroStatus) return false;
    if (filtroSetor && s.setor !== filtroSetor) return false;
    if (filtroPrioridade && s.prioridade !== filtroPrioridade) return false;
    if (buscaCentral && !s.numero.toLowerCase().includes(buscaCentral.toLowerCase()) &&
        !s.solicitante.toLowerCase().includes(buscaCentral.toLowerCase()) &&
        !s.setor.toLowerCase().includes(buscaCentral.toLowerCase())) return false;
    return true;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try { return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr)); } catch { return dateStr; }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Solicitações de Materiais
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Planejamento e solicitação antecipada de materiais e equipamentos.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1 w-fit">
        {[
          { key: 'solicitante', label: 'Solicitações', icon: ClipboardList },
          { key: 'central', label: 'Central de Solicitações', icon: Layers },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'solicitante' | 'central')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={active ? {
                background: '#1A56DB', color: 'white',
                boxShadow: '0 2px 8px rgba(26,86,219,0.3)',
              } : { color: '#64748B' }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══ SOLICITANTE TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'solicitante' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="relative w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou solicitante..."
                value={buscaSolicitante}
                onChange={e => setBuscaSolicitante(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <button
              onClick={() => setIsNovaOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #1A56DB, #2563EB)', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,86,219,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,86,219,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </button>
          </div>

          {solicitacoesFiltradas.length === 0 ? (
            <div className="bg-card rounded-xl border border-border flex flex-col items-center justify-center py-20 shadow-sm">
              <ClipboardList className="w-14 h-14 text-muted-foreground/25 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhuma solicitação encontrada</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Crie sua primeira solicitação clicando em "Nova Solicitação"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {solicitacoesFiltradas.map(sol => {
                const cfg = STATUS_CONFIG[sol.status];
                const priCfg = PRIORIDADE_CONFIG[sol.prioridade];
                return (
                  <div
                    key={sol.id}
                    className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    style={{ borderTop: `3px solid ${cfg.color}` }}
                    onClick={() => setDetalhe(sol)}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                          {sol.numero}
                        </span>
                        <PrioridadeBadge prioridade={sol.prioridade} />
                      </div>

                      <p className="font-semibold text-foreground text-sm mb-0.5">{sol.solicitante}</p>
                      <p className="text-xs text-muted-foreground mb-3">{sol.setor}</p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {sol.itens.length} {sol.itens.length === 1 ? 'item' : 'itens'}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(sol.dataPrevista)}</span>
                      </div>

                      <StatusBadge status={sol.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ CENTRAL TAB ══════════════════════════════════════════════════════════ */}
      {activeTab === 'central' && (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Central de Solicitações</h2>
            <p className="text-sm text-muted-foreground">Acompanhamento e preparação de materiais solicitados.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={buscaCentral} onChange={e => setBuscaCentral(e.target.value)} className="pl-9 rounded-xl w-52" />
            </div>
            <Select value={filtroStatus || '__all__'} onValueChange={v => setFiltroStatus(v === '__all__' ? '' : v)}>
              <SelectTrigger className="rounded-xl w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os status</SelectItem>
                {STATUS_TODOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroSetor || '__all__'} onValueChange={v => setFiltroSetor(v === '__all__' ? '' : v)}>
              <SelectTrigger className="rounded-xl w-44"><SelectValue placeholder="Setor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os setores</SelectItem>
                {setoresUnicos.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroPrioridade || '__all__'} onValueChange={v => setFiltroPrioridade(v === '__all__' ? '' : v)}>
              <SelectTrigger className="rounded-xl w-40"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            {(filtroStatus || filtroSetor || filtroPrioridade || buscaCentral) && (
              <button onClick={() => { setFiltroStatus(''); setFiltroSetor(''); setFiltroPrioridade(''); setBuscaCentral(''); }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Limpar filtros
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th style={thStyle}>Número</th>
                    <th style={thStyle}>Solicitante</th>
                    <th style={thStyle}>Setor</th>
                    <th style={thStyle}>Itens</th>
                    <th style={thStyle}>Data Prevista</th>
                    <th style={thStyle}>Prioridade</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {centralFiltradas.map((sol, idx) => {
                    const fluxo = FLUXO[sol.status];
                    const podeAvancar = !!fluxo;
                    const podeCancelar = sol.status !== 'Entregue' && sol.status !== 'Cancelada';
                    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFD';
                    return (
                      <tr key={sol.id} style={{ background: rowBg, borderBottom: '1px solid rgba(11,24,38,0.06)' }}>
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                            {sol.numero}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <p className="font-semibold text-sm text-foreground">{sol.solicitante}</p>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{sol.matricula}</p>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{sol.setor}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className="text-sm font-medium text-foreground">{sol.itens.length} {sol.itens.length === 1 ? 'item' : 'itens'}</span>
                        </td>
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                          <span className="text-sm text-foreground">{formatDate(sol.dataPrevista)}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <PrioridadeBadge prioridade={sol.prioridade} />
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <StatusBadge status={sol.status} />
                        </td>
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setDetalhe(sol)}
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {podeAvancar && (
                              <button
                                onClick={() => avancarStatus(sol, fluxo!.novoStatus)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                style={{ color: fluxo!.color, background: `${fluxo!.color}15` }}
                                title={fluxo!.label}
                              >
                                {fluxo!.label}
                              </button>
                            )}
                            {podeCancelar && (
                              <button
                                onClick={() => cancelarSolicitacao(sol)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Cancelar solicitação"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {centralFiltradas.length === 0 && (
              <div className="text-center py-16">
                <Layers className="w-12 h-12 text-muted-foreground/25 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma solicitação encontrada</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ NOVA SOLICITAÇÃO MODAL ════════════════════════════════════════════════ */}
      <Dialog open={isNovaOpen} onOpenChange={open => { setIsNovaOpen(open); if (!open) { setForm({ solicitante: '', matricula: '', setor: '', dataPrevista: '', prioridade: 'Média', observacao: '' }); setItensForm([]); setFormErros({}); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div style={{ background: 'linear-gradient(135deg, #0B1826 0%, #1E3A5F 100%)', margin: '-24px -24px 20px', padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
              <div className="flex items-center gap-2 text-white">
                <ClipboardList className="w-5 h-5" />
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Nova Solicitação</h2>
              </div>
              <p className="text-blue-300 text-sm mt-0.5">Preencha os dados para solicitar materiais ao almoxarifado.</p>
            </div>
            <DialogTitle className="sr-only">Nova Solicitação</DialogTitle>
            <DialogDescription className="sr-only">Formulário de solicitação de materiais</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* Dados do solicitante */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Dados do Solicitante</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Solicitante *</Label>
                  <Input value={form.solicitante} onChange={e => setForm({ ...form, solicitante: e.target.value })} placeholder="Nome completo" className={`rounded-xl ${formErros.solicitante ? 'border-red-500' : ''}`} />
                  {formErros.solicitante && <p className="text-xs text-red-600">{formErros.solicitante}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Matrícula *</Label>
                  <Input value={form.matricula} onChange={e => setForm({ ...form, matricula: e.target.value })} placeholder="Nº matrícula" className={`rounded-xl ${formErros.matricula ? 'border-red-500' : ''}`} style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                  {formErros.matricula && <p className="text-xs text-red-600">{formErros.matricula}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Setor *</Label>
                  <Input value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} placeholder="Ex: Manutenção, Produção..." className={`rounded-xl ${formErros.setor ? 'border-red-500' : ''}`} />
                  {formErros.setor && <p className="text-xs text-red-600">{formErros.setor}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Data Prevista de Retirada *</Label>
                  <Input type="date" value={form.dataPrevista} onChange={e => setForm({ ...form, dataPrevista: e.target.value })} className={`rounded-xl ${formErros.dataPrevista ? 'border-red-500' : ''}`} />
                  {formErros.dataPrevista && <p className="text-xs text-red-600">{formErros.dataPrevista}</p>}
                </div>
              </div>
            </div>

            {/* Prioridade */}
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <div className="flex gap-2">
                {(['Baixa', 'Média', 'Alta'] as PrioridadeSolicitacao[]).map(p => {
                  const cfg = PRIORIDADE_CONFIG[p];
                  const selected = form.prioridade === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setForm({ ...form, prioridade: p })}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={selected ? { background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.color}` } : { background: 'transparent', color: '#64748B', border: '2px solid rgba(11,24,38,0.1)' }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Observação */}
            <div className="space-y-1.5">
              <Label>Observação</Label>
              <textarea
                value={form.observacao}
                onChange={e => setForm({ ...form, observacao: e.target.value })}
                placeholder="Informações adicionais sobre a solicitação..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-border bg-input-background resize-none outline-none focus:ring-2 focus:ring-ring/30 transition"
              />
            </div>

            {/* Itens */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Itens Solicitados</p>
              {formErros.itens && <p className="text-xs text-red-600 mb-2">{formErros.itens}</p>}

              {/* Add item row */}
              <div className="flex gap-2 mb-3">
                <Select value={novoItemProdutoId} onValueChange={setNovoItemProdutoId}>
                  <SelectTrigger className="rounded-xl flex-1"><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
                  <SelectContent>
                    {produtos.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1A56DB', marginRight: 8 }}>{p.codigoProduto || ''}</span>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={novoItemQtd}
                  onChange={e => setNovoItemQtd(parseInt(e.target.value) || 1)}
                  className="w-20 rounded-xl"
                  placeholder="Qtd"
                />
                <button
                  onClick={adicionarItem}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(26,86,219,0.08)', color: '#1A56DB', border: '1px solid rgba(26,86,219,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,86,219,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(26,86,219,0.08)'; }}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>

              {/* Items list */}
              {itensForm.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl py-6 text-center text-muted-foreground text-sm">
                  <Package className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                  Nenhum item adicionado
                </div>
              ) : (
                <div className="space-y-2">
                  {itensForm.map(item => (
                    <div key={item.produtoId} className="flex items-center justify-between bg-muted rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {item.codigoProduto && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 6, padding: '1px 7px' }}>
                            {item.codigoProduto}
                          </span>
                        )}
                        <span className="text-sm font-medium text-foreground">{item.produtoNome}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">{item.quantidade} un.</span>
                        <button onClick={() => removerItem(item.produtoId)} className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsNovaOpen(false)}>Cancelar</Button>
            <button
              onClick={enviarSolicitacao}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #1A56DB, #2563EB)', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}
            >
              <CheckCircle className="w-4 h-4" />
              Enviar Solicitação
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ DETALHE MODAL ═════════════════════════════════════════════════════════ */}
      <Dialog open={!!detalhe} onOpenChange={open => { if (!open) setDetalhe(null); }}>
        {detalhe && (
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div style={{ background: 'linear-gradient(135deg, #0B1826 0%, #1E3A5F 100%)', margin: '-24px -24px 20px', padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Eye className="w-5 h-5" />
                    <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{detalhe.numero}</h2>
                  </div>
                  <StatusBadge status={detalhe.status} />
                </div>
                <p className="text-blue-300 text-sm mt-1">Detalhe da solicitação</p>
              </div>
              <DialogTitle className="sr-only">Detalhes da Solicitação</DialogTitle>
              <DialogDescription className="sr-only">Informações completas da solicitação</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Solicitante info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: User, label: 'Solicitante', value: detalhe.solicitante },
                  { icon: Hash, label: 'Matrícula', value: `#${detalhe.matricula}`, mono: true },
                  { icon: Building2, label: 'Setor', value: detalhe.setor },
                  { icon: Calendar, label: 'Data Prevista', value: formatDate(detalhe.dataPrevista) },
                ].map(row => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="bg-muted rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold uppercase tracking-wider">{row.label}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground" style={row.mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}>
                        {row.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-muted rounded-xl p-3 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Prioridade</p>
                  <PrioridadeBadge prioridade={detalhe.prioridade} />
                </div>
                <div className="bg-muted rounded-xl p-3 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Criado em</p>
                  <p className="text-sm font-semibold text-foreground">{formatDate(detalhe.dataCriacao)}</p>
                </div>
              </div>

              {detalhe.observacao && (
                <div className="bg-muted rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Observação</span>
                  </div>
                  <p className="text-sm text-foreground">{detalhe.observacao}</p>
                </div>
              )}

              {/* Stock availability */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Disponibilidade em Estoque</p>
                <div className="space-y-2">
                  {detalhe.itens.map(item => {
                    const { disponivel, minimo, saldo, criticidade } = getDisponibilidade(item);
                    const abaixoMinimo = saldo < minimo;
                    const isCritico = criticidade === 'Alta';
                    return (
                      <div
                        key={item.produtoId}
                        className="rounded-xl p-4"
                        style={{ border: '1px solid rgba(11,24,38,0.08)', background: '#FAFBFD' }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {item.codigoProduto && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 6, padding: '1px 7px' }}>
                                {item.codigoProduto}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-foreground">{item.produtoNome}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[
                            { label: 'Solicitado', value: item.quantidade, color: '#1A56DB' },
                            { label: 'Disponível', value: disponivel, color: '#10B981' },
                            { label: 'Saldo após separação', value: saldo, color: saldo >= 0 ? '#64748B' : '#DC2626' },
                          ].map(col => (
                            <div key={col.label} className="bg-card rounded-lg p-2.5 text-center border border-border">
                              <p className="text-xs text-muted-foreground mb-0.5">{col.label}</p>
                              <p className="text-lg font-bold" style={{ color: col.color }}>{col.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1.5">
                          {abaixoMinimo && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}>
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#CA8A04' }} />
                              <p className="text-xs font-semibold" style={{ color: '#CA8A04' }}>Estoque ficará abaixo do mínimo recomendado ({minimo} un.)</p>
                            </div>
                          )}
                          {isCritico && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)' }}>
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#DC2626' }} />
                              <p className="text-xs font-semibold" style={{ color: '#DC2626' }}>Item de alta criticidade</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions in detail modal (for central tab users) */}
              {(() => {
                const fluxo = FLUXO[detalhe.status];
                const podeAvancar = !!fluxo;
                const podeCancelar = detalhe.status !== 'Entregue' && detalhe.status !== 'Cancelada';
                if (!podeAvancar && !podeCancelar) return null;
                return (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    {podeAvancar && (
                      <button
                        onClick={() => avancarStatus(detalhe, fluxo!.novoStatus)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-1 justify-center transition-all"
                        style={{ background: `linear-gradient(135deg, ${fluxo!.color}, ${fluxo!.color}cc)`, boxShadow: `0 4px 12px ${fluxo!.color}40` }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {fluxo!.label}
                      </button>
                    )}
                    {podeCancelar && (
                      <button
                        onClick={() => cancelarSolicitacao(detalhe)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
