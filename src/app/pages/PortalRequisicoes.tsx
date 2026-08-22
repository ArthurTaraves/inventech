import { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Trash2, CheckCircle, XCircle, Eye, AlertTriangle, Package,
  MapPin, User, Hash, Building2, Calendar, ShoppingCart, Inbox, Layers,
  MessageSquare, ChevronRight, Flag, Truck, ClipboardCheck,
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAlmoxarifado } from '../context/AlmoxarifadoContext';
import { bancoDadosStore } from '../data/bancoDadosStore';
import type { Produto } from '../data/mockData';

// ─── Types (mirrors Solicitacoes.tsx for shared localStorage) ─────────────────

type StatusSolicitacao =
  | 'Solicitada' | 'Em análise' | 'Aprovada' | 'Em separação'
  | 'Pronta para retirada' | 'Entregue' | 'Cancelada';

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

const STATUS_CONFIG: Record<StatusSolicitacao, { color: string; bg: string; border: string; portalLabel: string; icon: string }> = {
  'Solicitada':           { color: '#1A56DB', bg: 'rgba(26,86,219,0.1)',   border: 'rgba(26,86,219,0.25)',   portalLabel: 'Solicitada',           icon: '📋' },
  'Em análise':           { color: '#92400E', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.25)',   portalLabel: 'Em análise',           icon: '🔍' },
  'Aprovada':             { color: '#166534', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  portalLabel: 'Aprovada',             icon: '✅' },
  'Em separação':         { color: '#6D28D9', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.25)', portalLabel: 'Separando materiais',  icon: '⏳' },
  'Pronta para retirada': { color: '#9A3412', bg: 'rgba(234,88,12,0.1)',  border: 'rgba(234,88,12,0.25)',  portalLabel: 'Pronta para retirada', icon: '🟠' },
  'Entregue':             { color: '#166534', bg: 'rgba(21,128,61,0.1)',   border: 'rgba(21,128,61,0.25)',   portalLabel: 'Entregue',             icon: '✅' },
  'Cancelada':            { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.25)',   portalLabel: 'Cancelada',            icon: '🔴' },
};

const PRIORIDADE_CONFIG: Record<PrioridadeSolicitacao, { color: string; bg: string; border: string; icon: string }> = {
  'Baixa':  { color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', icon: '🟢' },
  'Média':  { color: '#92400E', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.2)', icon: '🟡'   },
  'Alta':   { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.2)', icon: '🔴'   },
};

const CRIT_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  'Alta':  { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.25)', icon: '🔴'   },
  'Média': { color: '#92400E', bg: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.25)', icon: '🟡'   },
  'Baixa': { color: '#166534', bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.25)', icon: '🟢'   },
};

const STATUS_TODOS: StatusSolicitacao[] = [
  'Solicitada', 'Em análise', 'Aprovada', 'Em separação', 'Pronta para retirada', 'Entregue', 'Cancelada',
];

const thStyle: React.CSSProperties = {
  padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4B5768',
  background: '#F1F5FB', borderBottom: '1px solid rgba(11,24,38,0.08)', whiteSpace: 'nowrap',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const gerarNumero = (existentes: Solicitacao[]) => {
  const max = existentes.reduce((acc, s) => {
    const n = parseInt(s.numero.replace('SOL-', ''));
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 0);
  return `SOL-${String(max + 1).padStart(3, '0')}`;
};

const formatDate = (d: string) => {
  if (!d) return '—';
  try { return new Intl.DateTimeFormat('pt-BR').format(new Date(d)); } catch { return d; }
};

const formatLoc = (loc: string) => {
  const m = loc.match(/^([A-Z]+)-(\d+)$/);
  return m ? `Corredor ${m[1]} · Prateleira ${m[2]}` : loc;
};

// ─── Small Components ─────────────────────────────────────────────────────────

const StatusBadge = ({ status, usePortalLabel = false }: { status: StatusSolicitacao; usePortalLabel?: boolean }) => {
  const cfg = STATUS_CONFIG[status];
  const label = usePortalLabel ? cfg.portalLabel : status;
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, borderRadius: 9999, padding: '4px 12px',
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <span aria-hidden="true">{cfg.icon}</span>
      {label}
    </span>
  );
};

const PrioridadeBadge = ({ prioridade }: { prioridade: PrioridadeSolicitacao }) => {
  const cfg = PRIORIDADE_CONFIG[prioridade];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 10px',
      display: 'inline-flex', alignItems: 'center', gap: 4,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <span aria-hidden="true">{cfg.icon}</span>
      {prioridade}
    </span>
  );
};

const CriticidadeBadge = ({ criticidade }: { criticidade?: string }) => {
  if (!criticidade) return <span className="text-xs text-muted-foreground">—</span>;
  const cfg = CRIT_CONFIG[criticidade] ?? CRIT_CONFIG['Baixa'];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 10px',
      display: 'inline-flex', alignItems: 'center', gap: 4,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <span aria-hidden="true">{cfg.icon}</span>
      {criticidade}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function PortalRequisicoes() {
  const { produtos } = useAlmoxarifado();
  const catalogo = bancoDadosStore.getProdutos();
  const catalogMap = new Map(catalogo.map(c => [c.codigoProduto ?? '', c]));

  // Maior criticidade entre os itens da solicitação (para exibição rápida na Central)
  const getCriticidadeSolicitacao = (sol: Solicitacao): string | undefined => {
    const ordem: Record<string, number> = { Alta: 3, Média: 2, Baixa: 1 };
    let maior: string | undefined;
    sol.itens.forEach(item => {
      const produtoEstoque = produtos.find(p => p.id === item.produtoId || p.nome === item.produtoNome);
      const c = produtoEstoque?.criticidade;
      if (c && (!maior || ordem[c] > ordem[maior])) maior = c;
    });
    return maior;
  };

  // Shared data with Solicitacoes.tsx
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(() => {
    try {
      const s = localStorage.getItem('almoxarifado_solicitacoes');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('almoxarifado_solicitacoes', JSON.stringify(solicitacoes));
  }, [solicitacoes]);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'nova' | 'minhas' | 'central'>('nova');

  // ── Product search ──
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sem texto digitado: lista o estoque inteiro (integração com o módulo Estoque).
  // Com texto: filtra por nome, código ou categoria em tempo real.
  const suggestions = searchQuery.trim().length >= 1
    ? produtos.filter(p => {
        const q = searchQuery.toLowerCase();
        const cat = catalogMap.get(p.codigoProduto ?? '')?.categoria ?? '';
        return (
          p.nome.toLowerCase().includes(q) ||
          (p.codigoProduto && p.codigoProduto.toLowerCase().includes(q)) ||
          cat.toLowerCase().includes(q)
        );
      })
    : produtos;

  const selectProduct = (p: Produto) => {
    setSelectedProduct(p);
    setSearchQuery(p.nome);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setItemQty(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        selectProduct(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  // ── Cart ──
  const [cart, setCart] = useState<ItemSolicitacao[]>([]);

  const adicionarAoCart = () => {
    if (!selectedProduct) { toast.error('Selecione um produto para adicionar'); return; }
    if (itemQty < 1) { toast.error('Quantidade deve ser pelo menos 1'); return; }
    if (itemQty > selectedProduct.quantidade) {
      toast.error(`Quantidade solicitada (${itemQty}) supera o disponível (${selectedProduct.quantidade})`);
      return;
    }
    if (cart.find(i => i.produtoId === selectedProduct.id)) {
      toast.error('Produto já está na solicitação. Edite a quantidade.');
      return;
    }
    setCart(prev => [...prev, {
      produtoId: selectedProduct.id,
      produtoNome: selectedProduct.nome,
      codigoProduto: selectedProduct.codigoProduto,
      quantidade: itemQty,
    }]);
    if (selectedProduct.criticidade === 'Alta') {
      toast.warning(`Atenção: "${selectedProduct.nome}" é um item de alta criticidade.`);
    }
    const catalogItem = catalogMap.get(selectedProduct.codigoProduto ?? '');
    if (catalogItem && selectedProduct.quantidade - itemQty < catalogItem.estoqueMinimo) {
      toast.warning(`Atenção: após esta retirada, o estoque ficará abaixo do mínimo recomendado (${catalogItem.estoqueMinimo} un.).`);
    }
    setSelectedProduct(null);
    setSearchQuery('');
    setItemQty(1);
    toast.success(`${selectedProduct.nome} adicionado`);
  };

  const removerDoCart = (produtoId: string) => {
    setCart(prev => prev.filter(i => i.produtoId !== produtoId));
  };

  // ── Request form ──
  const emptyForm = { solicitante: '', matricula: '', setor: '', dataPrevista: '', prioridade: 'Média' as PrioridadeSolicitacao, observacao: '' };
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const CAMPO_LABEL_PORTAL: Record<string, string> = {
    solicitante: 'Nome do Solicitante',
    matricula: 'Matrícula',
    setor: 'Setor',
    dataPrevista: 'Data Prevista de Retirada',
    cart: 'Itens da Solicitação',
  };

  const validarForm = () => {
    const erros: Record<string, string> = {};
    if (!form.solicitante.trim()) erros.solicitante = 'Informe o nome do solicitante.';
    if (!form.matricula.trim()) erros.matricula = 'Informe a matrícula.';
    if (!form.setor.trim()) erros.setor = 'Informe o setor.';
    if (!form.dataPrevista) erros.dataPrevista = 'Informe a data prevista de retirada.';
    if (cart.length === 0) erros.cart = 'Adicione pelo menos um item à solicitação.';
    setFormErrors(erros);
    return erros;
  };

  const enviarSolicitacao = () => {
    const erros = validarForm();
    if (Object.keys(erros).length > 0) {
      const campos = Object.keys(erros).map(k => CAMPO_LABEL_PORTAL[k] || k);
      toast.error(`Corrija o(s) campo(s): ${campos.join(', ')}.`);
      return;
    }
    const nova: Solicitacao = {
      id: String(Date.now()),
      numero: gerarNumero(solicitacoes),
      ...form,
      itens: cart,
      status: 'Solicitada',
      dataCriacao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
    };
    setSolicitacoes(prev => [nova, ...prev]);
    setCart([]);
    setForm(emptyForm);
    setFormErrors({});
    toast.success(`Solicitação ${nova.numero} enviada com sucesso! O almoxarifado foi notificado.`);
    setActiveTab('minhas');
  };

  // ── My requests ──
  const [searchMinhas, setSearchMinhas] = useState('');
  const minhasSolicitacoes = solicitacoes.filter(s =>
    !searchMinhas ||
    s.solicitante.toLowerCase().includes(searchMinhas.toLowerCase()) ||
    s.matricula.includes(searchMinhas) ||
    s.numero.toLowerCase().includes(searchMinhas.toLowerCase())
  );

  // ── Central filters & actions ──
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [buscaCentral, setBuscaCentral] = useState('');

  const setoresUnicos = [...new Set(solicitacoes.map(s => s.setor).filter(Boolean))];

  const centralFiltradas = solicitacoes.filter(s => {
    if (filtroStatus && s.status !== filtroStatus) return false;
    if (filtroSetor && s.setor !== filtroSetor) return false;
    if (filtroPrioridade && s.prioridade !== filtroPrioridade) return false;
    if (buscaCentral) {
      const q = buscaCentral.toLowerCase();
      if (!s.numero.toLowerCase().includes(q) && !s.solicitante.toLowerCase().includes(q) && !s.setor.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const avancarStatus = (sol: Solicitacao, novoStatus: StatusSolicitacao, msg?: string) => {
    const updated = { ...sol, status: novoStatus, ultimaAtualizacao: new Date().toISOString() };
    setSolicitacoes(prev => prev.map(s => s.id === sol.id ? updated : s));
    if (detalhe?.id === sol.id) setDetalhe(updated);
    toast.success(msg ?? `Status atualizado para "${STATUS_CONFIG[novoStatus].portalLabel}"`);
  };

  const rejeitarSolicitacao = (sol: Solicitacao) => {
    avancarStatus(sol, 'Cancelada', 'Solicitação rejeitada');
  };

  // ── Detail modal ──
  const [detalhe, setDetalhe] = useState<Solicitacao | null>(null);

  const getItemInfo = (item: ItemSolicitacao) => {
    const p = produtos.find(p => p.id === item.produtoId || p.nome === item.produtoNome);
    const cat = catalogMap.get(item.codigoProduto ?? '') ?? catalogMap.get(p?.codigoProduto ?? '');
    return {
      disponivel: p?.quantidade ?? 0,
      criticidade: p?.criticidade ?? 'Baixa',
      localizacoes: p?.localizacoes ?? [],
      estoqueMinimo: cat?.estoqueMinimo ?? 0,
      categoria: cat?.categoria ?? '',
      saldo: (p?.quantidade ?? 0) - item.quantidade,
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const tabDef = [
    { key: 'nova',    label: 'Nova Solicitação',       icon: Plus,           badge: cart.length > 0 ? cart.length : null },
    { key: 'minhas',  label: 'Minhas Solicitações',    icon: Inbox,          badge: null },
    { key: 'central', label: 'Central do Almoxarifado', icon: Layers,        badge: solicitacoes.filter(s => s.status === 'Solicitada').length || null },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Portal de Requisições
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Solicite materiais e equipamentos ao almoxarifado de forma rápida e rastreável.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-7 bg-muted rounded-xl p-1 w-fit">
        {tabDef.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'nova' | 'minhas' | 'central')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all relative"
              style={active ? {
                background: '#1A56DB', color: 'white', boxShadow: '0 2px 8px rgba(26,86,219,0.3)',
              } : { color: '#4B5768' }}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
              {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  background: active ? 'rgba(255,255,255,0.3)' : '#EF4444',
                  color: 'white', borderRadius: '50%', width: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══ NOVA SOLICITAÇÃO ═══════════════════════════════════════════════════ */}
      {activeTab === 'nova' && (
        <div className="max-w-3xl space-y-6">

          {/* Product search */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-visible">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <Search className="w-5 h-5" style={{ color: '#1A56DB' }} />
              <h2 className="font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pesquisar Produto</h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Search input with autocomplete */}
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="text"
                    role="combobox"
                    aria-expanded={showSuggestions && suggestions.length > 0}
                    aria-controls="portal-produto-listbox"
                    aria-autocomplete="list"
                    aria-activedescendant={activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex] ? `produto-option-${suggestions[activeSuggestionIndex].id}` : undefined}
                    aria-label="Selecionar produto do estoque"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); setSelectedProduct(null); setActiveSuggestionIndex(-1); }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Digite o nome, código ou categoria do produto..."
                    className="w-full pl-12 pr-4 py-4 text-base rounded-xl outline-none transition-all"
                    style={{
                      background: '#F1F5FB', border: '2px solid rgba(11,24,38,0.08)',
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onFocus={e => {
                      setShowSuggestions(true);
                      e.currentTarget.style.borderColor = '#1A56DB'; e.currentTarget.style.background = '#fff';
                    }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(11,24,38,0.08)'; e.currentTarget.style.background = '#F1F5FB'; }}
                  />
                  {searchQuery && (
                    <button type="button" aria-label="Limpar busca de produto" onClick={() => { setSearchQuery(''); setSelectedProduct(null); setShowSuggestions(false); setActiveSuggestionIndex(-1); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div id="portal-produto-listbox" role="listbox" aria-label="Produtos do estoque" className="absolute top-full left-0 right-0 z-50 mt-1 bg-card rounded-xl border border-border shadow-xl overflow-y-auto" style={{ maxHeight: 360 }}>
                    {suggestions.map((p, idx) => {
                      const cat = catalogMap.get(p.codigoProduto ?? '')?.categoria ?? '';
                      const critCfg = CRIT_CONFIG[p.criticidade] ?? CRIT_CONFIG['Baixa'];
                      const estoqueMinimoP = catalogMap.get(p.codigoProduto ?? '')?.estoqueMinimo ?? 0;
                      const estoqueBaixoP = p.quantidade > 0 && p.quantidade <= estoqueMinimoP;
                      const isActive = idx === activeSuggestionIndex;
                      return (
                        <button
                          key={p.id}
                          id={`produto-option-${p.id}`}
                          role="option"
                          aria-selected={isActive}
                          type="button"
                          onClick={() => selectProduct(p)}
                          onMouseEnter={() => setActiveSuggestionIndex(idx)}
                          className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors border-b border-border last:border-0 ${isActive ? 'bg-muted' : 'hover:bg-muted'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div style={{
                              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.15)',
                            }}>
                              <Package className="w-4 h-4" style={{ color: '#1A56DB' }} aria-hidden="true" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{p.nome}</p>
                              <p className="text-xs text-muted-foreground">{cat}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {p.codigoProduto && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                                {p.codigoProduto}
                              </span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 600, color: critCfg.color, background: critCfg.bg, border: `1px solid ${critCfg.border}`, borderRadius: 6, padding: '2px 8px' }}>
                              <span aria-hidden="true">{critCfg.icon}</span> {p.criticidade}
                            </span>
                            <span
                              className="text-xs font-semibold"
                              style={{ color: p.quantidade === 0 ? '#DC2626' : estoqueBaixoP ? '#92400E' : 'var(--muted-foreground)' }}
                            >
                              {p.quantidade} un.{estoqueBaixoP && <span aria-hidden="true"> ⚠</span>}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {showSuggestions && searchQuery.trim().length >= 1 && suggestions.length === 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card rounded-xl border border-border shadow-xl p-6 text-center">
                    <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum produto encontrado para "{searchQuery}"</p>
                  </div>
                )}
              </div>

              {/* Selected product card */}
              {selectedProduct && (() => {
                const cat = catalogMap.get(selectedProduct.codigoProduto ?? '');
                const critCfg = CRIT_CONFIG[selectedProduct.criticidade] ?? CRIT_CONFIG['Baixa'];
                const disponivel = selectedProduct.quantidade;
                const estoqueMinimo = cat?.estoqueMinimo ?? 0;
                const availColor = disponivel === 0 ? '#DC2626' : disponivel < estoqueMinimo ? '#92400E' : '#166534';
                return (
                  <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(26,86,219,0.2)', background: 'rgba(26,86,219,0.02)' }}>
                    {/* Product header */}
                    <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #0B1826 0%, #1E3A5F 100%)' }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{selectedProduct.nome}</p>
                          <p className="text-blue-300 text-sm mt-0.5">{cat?.categoria ?? ''}</p>
                        </div>
                        {selectedProduct.codigoProduto && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#60A5FA', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '4px 10px' }}>
                            {selectedProduct.codigoProduto}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product info */}
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 rounded-xl bg-card border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Disponível</p>
                          <p className="text-2xl font-bold" style={{ color: availColor }}>{disponivel}</p>
                          <p className="text-xs text-muted-foreground">unidades</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-card border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Estoque mín.</p>
                          <p className="text-2xl font-bold text-foreground">{estoqueMinimo}</p>
                          <p className="text-xs text-muted-foreground">unidades</p>
                        </div>
                        <div className="text-center p-3 rounded-xl border" style={{ background: critCfg.bg, borderColor: critCfg.border }}>
                          <p className="text-xs mb-1" style={{ color: critCfg.color, opacity: 0.8 }}>Criticidade</p>
                          <p className="text-lg font-bold" style={{ color: critCfg.color }}><span aria-hidden="true">{critCfg.icon}</span> {selectedProduct.criticidade}</p>
                        </div>
                      </div>

                      {/* Localizações */}
                      {selectedProduct.localizacoes.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Localização</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.localizacoes.map(loc => (
                              <span key={loc} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                                style={{ background: 'rgba(26,86,219,0.07)', color: '#1A56DB', border: '1px solid rgba(26,86,219,0.2)' }}>
                                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                                {formatLoc(loc)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Alerts */}
                      {selectedProduct.criticidade === 'Alta' && (
                        <div className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg"
                          style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)' }}>
                          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#DC2626' }} aria-hidden="true" />
                          <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>Item de alta criticidade — manuseio com atenção</p>
                        </div>
                      )}
                      {disponivel > 0 && disponivel <= estoqueMinimo && (
                        <div className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg"
                          style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)' }}>
                          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#92400E' }} aria-hidden="true" />
                          <p className="text-sm font-semibold" style={{ color: '#92400E' }}>Estoque próximo do mínimo.</p>
                        </div>
                      )}
                      {disponivel === 0 && (
                        <div className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg"
                          style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)' }}>
                          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#DC2626' }} aria-hidden="true" />
                          <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>Sem estoque disponível no momento</p>
                        </div>
                      )}

                      {/* Add to cart */}
                      <div className="flex items-center gap-3 pt-2 border-t border-border">
                        <div>
                          <label htmlFor="portal-quantidade" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Quantidade</label>
                          <input
                            id="portal-quantidade"
                            type="number" min={1} max={disponivel}
                            value={itemQty}
                            onChange={e => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 px-3 py-2.5 rounded-xl text-center font-bold text-lg outline-none transition-all"
                            style={{ background: '#F1F5FB', border: '2px solid rgba(11,24,38,0.1)' }}
                          />
                        </div>
                        <div className="flex-1">
                          {itemQty > disponivel && (
                            <p className="text-xs text-red-600 font-semibold mb-1">⚠ Quantidade maior que o disponível</p>
                          )}
                          <button
                            onClick={adicionarAoCart}
                            disabled={disponivel === 0 || itemQty > disponivel}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #1A56DB, #2563EB)', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}
                            onMouseEnter={e => { if (disponivel > 0) e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,86,219,0.45)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,86,219,0.3)'; }}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Adicionar à Solicitação
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" style={{ color: '#1A56DB' }} />
                <h2 className="font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Itens da Solicitação</h2>
                {cart.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#1A56DB' }}>
                    {cart.length}
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              {formErrors.cart && <p className="text-sm text-red-600 font-semibold mb-3">{formErrors.cart}</p>}
              {cart.length === 0 ? (
                <div className="py-10 text-center">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/25 mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum item adicionado</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Pesquise um produto acima para adicionar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, i) => {
                    const p = produtos.find(p => p.id === item.produtoId);
                    const critCfg = CRIT_CONFIG[p?.criticidade ?? 'Baixa'];
                    return (
                      <div key={item.produtoId} className="flex items-center justify-between rounded-xl px-4 py-3.5"
                        style={{ background: i % 2 === 0 ? '#F8FAFD' : '#FFFFFF', border: '1px solid rgba(11,24,38,0.07)' }}>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#1A56DB' }}>{i + 1}</span>
                          {item.codigoProduto && (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 6, padding: '2px 7px' }}>
                              {item.codigoProduto}
                            </span>
                          )}
                          <span className="font-semibold text-foreground text-sm">{item.produtoNome}</span>
                          {p?.criticidade && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: critCfg.color, background: critCfg.bg, border: `1px solid ${critCfg.border}`, borderRadius: 6, padding: '1px 6px' }}>
                              <span aria-hidden="true">{critCfg.icon}</span> {p.criticidade}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">{item.quantidade} un.</span>
                          <button onClick={() => removerDoCart(item.produtoId)}
                            aria-label={`Remover ${item.produtoNome} da solicitação`}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Request form */}
          <div className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <User className="w-5 h-5" style={{ color: '#1A56DB' }} />
              <h2 className="font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Dados do Solicitante</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="portal-solicitante" className="text-sm font-semibold">Nome do Solicitante *</Label>
                  <Input
                    id="portal-solicitante"
                    autoFocus
                    value={form.solicitante}
                    onChange={e => setForm({ ...form, solicitante: e.target.value })}
                    placeholder="Seu nome completo"
                    className={`rounded-xl h-12 text-base ${formErrors.solicitante ? 'border-red-500' : ''}`}
                    aria-invalid={!!formErrors.solicitante}
                    aria-describedby={formErrors.solicitante ? 'portal-solicitante-erro' : undefined}
                  />
                  {formErrors.solicitante && <p id="portal-solicitante-erro" className="text-xs text-red-600 font-semibold">{formErrors.solicitante}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="portal-matricula" className="text-sm font-semibold">Matrícula *</Label>
                  <Input
                    id="portal-matricula"
                    value={form.matricula}
                    onChange={e => setForm({ ...form, matricula: e.target.value })}
                    placeholder="Número de matrícula"
                    className={`rounded-xl h-12 text-base ${formErrors.matricula ? 'border-red-500' : ''}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    aria-invalid={!!formErrors.matricula}
                    aria-describedby={formErrors.matricula ? 'portal-matricula-erro' : undefined}
                  />
                  {formErrors.matricula && <p id="portal-matricula-erro" className="text-xs text-red-600 font-semibold">{formErrors.matricula}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="portal-setor" className="text-sm font-semibold">Setor *</Label>
                  <Input
                    id="portal-setor"
                    value={form.setor}
                    onChange={e => setForm({ ...form, setor: e.target.value })}
                    placeholder="Ex: Manutenção, Produção..."
                    className={`rounded-xl h-12 text-base ${formErrors.setor ? 'border-red-500' : ''}`}
                    aria-invalid={!!formErrors.setor}
                    aria-describedby={formErrors.setor ? 'portal-setor-erro' : undefined}
                  />
                  {formErrors.setor && <p id="portal-setor-erro" className="text-xs text-red-600 font-semibold">{formErrors.setor}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="portal-data">Data Prevista de Retirada *</Label>
                  <Input
                    id="portal-data"
                    type="date"
                    value={form.dataPrevista}
                    onChange={e => setForm({ ...form, dataPrevista: e.target.value })}
                    className={`rounded-xl h-12 text-base ${formErrors.dataPrevista ? 'border-red-500' : ''}`}
                    aria-invalid={!!formErrors.dataPrevista}
                    aria-describedby={formErrors.dataPrevista ? 'portal-data-erro' : undefined}
                  />
                  {formErrors.dataPrevista && <p id="portal-data-erro" className="text-xs text-red-600 font-semibold">{formErrors.dataPrevista}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label id="portal-prioridade-label" className="text-sm font-semibold">Prioridade</Label>
                <div className="flex gap-3" role="group" aria-labelledby="portal-prioridade-label">
                  {(['Baixa', 'Média', 'Alta'] as PrioridadeSolicitacao[]).map(p => {
                    const cfg = PRIORIDADE_CONFIG[p];
                    const selected = form.prioridade === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setForm({ ...form, prioridade: p })}
                        aria-pressed={selected}
                        className="flex-1 py-3 rounded-xl text-base font-bold transition-all"
                        style={selected
                          ? { background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.color}` }
                          : { background: 'transparent', color: '#4B5768', border: '2px solid rgba(11,24,38,0.1)' }}
                      >
                        <span aria-hidden="true">{cfg.icon}</span> {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="portal-observacao" className="text-sm font-semibold">Observações</Label>
                <textarea
                  id="portal-observacao"
                  value={form.observacao}
                  onChange={e => setForm({ ...form, observacao: e.target.value })}
                  placeholder="Informações adicionais, urgência, contexto da solicitação..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm border border-border bg-input-background resize-none outline-none focus:ring-2 focus:ring-ring/30 transition"
                />
              </div>

              <button
                onClick={enviarSolicitacao}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #1A56DB, #2563EB)', boxShadow: '0 4px 16px rgba(26,86,219,0.35)', fontSize: 16 }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,86,219,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,86,219,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <ClipboardCheck className="w-5 h-5" />
                Enviar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MINHAS SOLICITAÇÕES ════════════════════════════════════════════════ */}
      {activeTab === 'minhas' && (
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Buscar minhas solicitações"
                placeholder="Buscar por nome, matrícula ou número..."
                value={searchMinhas}
                onChange={e => setSearchMinhas(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          {minhasSolicitacoes.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border flex flex-col items-center justify-center py-20 shadow-sm">
              <Inbox className="w-14 h-14 text-muted-foreground/25 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhuma solicitação encontrada</p>
              <button onClick={() => setActiveTab('nova')} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">
                Criar nova solicitação →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {minhasSolicitacoes.map(sol => {
                const cfg = STATUS_CONFIG[sol.status];
                const criticidadeSol = getCriticidadeSolicitacao(sol);
                return (
                  <button
                    key={sol.id}
                    type="button"
                    onClick={() => setDetalhe(sol)}
                    aria-label={`Ver detalhes da solicitação ${sol.numero}`}
                    className="w-full text-left bg-card rounded-2xl border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                    style={{ borderLeft: `4px solid ${cfg.color}` }}
                  >
                    <div className="px-6 py-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                              {sol.numero}
                            </span>
                            <PrioridadeBadge prioridade={sol.prioridade} />
                            {criticidadeSol && <CriticidadeBadge criticidade={criticidadeSol} />}
                          </div>
                          <p className="font-semibold text-foreground">{sol.solicitante}</p>
                          <p className="text-sm text-muted-foreground">{sol.setor} · Matrícula {sol.matricula}</p>
                        </div>
                        <StatusBadge status={sol.status} usePortalLabel />
                      </div>
                      <div className="flex items-center gap-5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Package className="w-4 h-4" aria-hidden="true" />
                          {sol.itens.length} {sol.itens.length === 1 ? 'item' : 'itens'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" aria-hidden="true" />
                          Retirada: {formatDate(sol.dataPrevista)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                          Criado em {formatDate(sol.dataCriacao)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ CENTRAL DO ALMOXARIFADO ════════════════════════════════════════════ */}
      {activeTab === 'central' && (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Central de Solicitações</h2>
            <p className="text-sm text-muted-foreground">Acompanhamento e preparação de materiais solicitados pelos setores.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input aria-label="Buscar na central de solicitações" placeholder="Buscar..." value={buscaCentral} onChange={e => setBuscaCentral(e.target.value)} className="pl-9 rounded-xl w-52" />
            </div>
            <Select value={filtroStatus || '__all__'} onValueChange={v => setFiltroStatus(v === '__all__' ? '' : v)}>
              <SelectTrigger aria-label="Filtrar por status" className="rounded-xl w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os status</SelectItem>
                {STATUS_TODOS.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].portalLabel}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroSetor || '__all__'} onValueChange={v => setFiltroSetor(v === '__all__' ? '' : v)}>
              <SelectTrigger aria-label="Filtrar por setor" className="rounded-xl w-44"><SelectValue placeholder="Setor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os setores</SelectItem>
                {setoresUnicos.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroPrioridade || '__all__'} onValueChange={v => setFiltroPrioridade(v === '__all__' ? '' : v)}>
              <SelectTrigger aria-label="Filtrar por prioridade" className="rounded-xl w-40"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                <SelectItem value="Alta">🔴 Alta</SelectItem>
                <SelectItem value="Média">🟡 Média</SelectItem>
                <SelectItem value="Baixa">🟢 Baixa</SelectItem>
              </SelectContent>
            </Select>
            {(filtroStatus || filtroSetor || filtroPrioridade || buscaCentral) && (
              <button onClick={() => { setFiltroStatus(''); setFiltroSetor(''); setFiltroPrioridade(''); setBuscaCentral(''); }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Limpar filtros
              </button>
            )}
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Aguardando', count: solicitacoes.filter(s => s.status === 'Solicitada').length, color: '#1A56DB' },
              { label: 'Em análise', count: solicitacoes.filter(s => s.status === 'Em análise').length, color: '#92400E' },
              { label: 'Em separação', count: solicitacoes.filter(s => s.status === 'Em separação').length, color: '#7C3AED' },
              { label: 'Prontas', count: solicitacoes.filter(s => s.status === 'Pronta para retirada').length, color: '#9A3412' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-card rounded-xl px-4 py-3 border border-border shadow-sm" style={{ borderTop: `3px solid ${kpi.color}` }}>
                <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.count}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th scope="col" style={thStyle}>Número</th>
                    <th scope="col" style={thStyle}>Solicitante</th>
                    <th scope="col" style={thStyle}>Setor</th>
                    <th scope="col" style={thStyle}>Itens</th>
                    <th scope="col" style={thStyle}>Data Prevista</th>
                    <th scope="col" style={thStyle}>Prioridade</th>
                    <th scope="col" style={thStyle}>Criticidade</th>
                    <th scope="col" style={thStyle}>Status</th>
                    <th scope="col" style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {centralFiltradas.map((sol, idx) => {
                    const isFinal = sol.status === 'Entregue' || sol.status === 'Cancelada';
                    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFD';
                    const criticidadeSol = getCriticidadeSolicitacao(sol);
                    return (
                      <tr key={sol.id} style={{ background: rowBg, borderBottom: '1px solid rgba(11,24,38,0.06)' }}>
                        <td style={{ padding: '14px 20px' }}>
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
                        <td style={{ padding: '14px 20px' }}>
                          <span className="text-sm text-foreground">{formatDate(sol.dataPrevista)}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <PrioridadeBadge prioridade={sol.prioridade} />
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <CriticidadeBadge criticidade={criticidadeSol} />
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <StatusBadge status={sol.status} usePortalLabel />
                        </td>
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                          <div className="flex items-center gap-1 flex-wrap">
                            <button onClick={() => setDetalhe(sol)}
                              aria-label={`Visualizar solicitação ${sol.numero}`}
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Visualizar">
                              <Eye className="w-4 h-4" />
                            </button>
                            {sol.status === 'Solicitada' && (
                              <button onClick={() => avancarStatus(sol, 'Em análise', 'Análise iniciada')}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                style={{ color: '#92400E', background: 'rgba(217,119,6,0.1)' }}>
                                Analisar
                              </button>
                            )}
                            {sol.status === 'Em análise' && (
                              <>
                                <button onClick={() => avancarStatus(sol, 'Aprovada', 'Solicitação aprovada')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                  style={{ color: '#166534', background: 'rgba(16,185,129,0.1)' }}>
                                  Aprovar
                                </button>
                                <button onClick={() => rejeitarSolicitacao(sol)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                  style={{ color: '#DC2626', background: 'rgba(220,38,38,0.1)' }}>
                                  Rejeitar
                                </button>
                              </>
                            )}
                            {sol.status === 'Aprovada' && (
                              <button onClick={() => avancarStatus(sol, 'Em separação', 'Separação iniciada')}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                style={{ color: '#7C3AED', background: 'rgba(124,58,237,0.1)' }}>
                                Iniciar Separação
                              </button>
                            )}
                            {sol.status === 'Em separação' && (
                              <button onClick={() => avancarStatus(sol, 'Pronta para retirada', 'Marcado como pronto')}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                style={{ color: '#9A3412', background: 'rgba(234,88,12,0.1)' }}>
                                Marcar Pronto
                              </button>
                            )}
                            {sol.status === 'Pronta para retirada' && (
                              <button onClick={() => avancarStatus(sol, 'Entregue', 'Entrega confirmada')}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                                style={{ color: '#166534', background: 'rgba(21,128,61,0.1)' }}>
                                Confirmar Entrega
                              </button>
                            )}
                            {!isFinal && (
                              <button onClick={() => avancarStatus(sol, 'Cancelada', 'Solicitação cancelada')}
                                aria-label={`Cancelar solicitação ${sol.numero}`}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Cancelar">
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

      {/* ══ DETALHE MODAL ═════════════════════════════════════════════════════ */}
      <Dialog open={!!detalhe} onOpenChange={open => { if (!open) setDetalhe(null); }}>
        {detalhe && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div style={{ background: 'linear-gradient(135deg, #0B1826 0%, #1E3A5F 100%)', margin: '-24px -24px 20px', padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-white">
                    <Eye className="w-5 h-5" />
                    <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{detalhe.numero}</h2>
                  </div>
                  <StatusBadge status={detalhe.status} usePortalLabel />
                </div>
                <p className="text-blue-300 text-sm">Detalhe completo da solicitação</p>
              </div>
              <DialogTitle className="sr-only">Detalhes da Solicitação {detalhe.numero}</DialogTitle>
              <DialogDescription className="sr-only">Informações completas</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Requester info */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { icon: User,      label: 'Solicitante', value: detalhe.solicitante,              mono: false },
                  { icon: Hash,      label: 'Matrícula',   value: `#${detalhe.matricula}`,          mono: true  },
                  { icon: Building2, label: 'Setor',       value: detalhe.setor,                   mono: false },
                  { icon: Calendar,  label: 'Data Prevista', value: formatDate(detalhe.dataPrevista), mono: false },
                ] as const).map(row => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="bg-muted rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="text-xs font-semibold uppercase tracking-wider">{row.label}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground" style={row.mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}>
                        {row.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <div className="flex-1 bg-muted rounded-xl p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Prioridade</p>
                  <PrioridadeBadge prioridade={detalhe.prioridade} />
                </div>
                <div className="flex-1 bg-muted rounded-xl p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Criticidade</p>
                  <CriticidadeBadge criticidade={getCriticidadeSolicitacao(detalhe)} />
                </div>
                <div className="flex-1 bg-muted rounded-xl p-3">
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

              {/* Items with stock info */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Materiais Solicitados</p>
                <div className="space-y-3">
                  {detalhe.itens.map(item => {
                    const info = getItemInfo(item);
                    const critCfg = CRIT_CONFIG[info.criticidade] ?? CRIT_CONFIG['Baixa'];
                    const abaixoMin = info.saldo < info.estoqueMinimo;
                    return (
                      <div key={item.produtoId} className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(11,24,38,0.08)' }}>
                        {/* Item header */}
                        <div className="flex items-center justify-between px-4 py-3" style={{ background: '#F8FAFD', borderBottom: '1px solid rgba(11,24,38,0.06)' }}>
                          <div className="flex items-center gap-2">
                            {item.codigoProduto && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                                {item.codigoProduto}
                              </span>
                            )}
                            <span className="font-semibold text-foreground text-sm">{item.produtoNome}</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: critCfg.color, background: critCfg.bg, border: `1px solid ${critCfg.border}`, borderRadius: 6, padding: '2px 8px' }}>
                            {info.criticidade}
                          </span>
                        </div>

                        {/* Stock grid */}
                        <div className="p-4">
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {[
                              { label: 'Solicitado', value: item.quantidade, color: '#1A56DB' },
                              { label: 'Disponível',  value: info.disponivel,  color: info.disponivel > 0 ? '#166534' : '#DC2626' },
                              { label: 'Saldo',       value: info.saldo,       color: info.saldo >= 0 ? '#64748B' : '#DC2626' },
                            ].map(col => (
                              <div key={col.label} className="bg-card rounded-lg px-3 py-2.5 text-center border border-border">
                                <p className="text-xs text-muted-foreground mb-1">{col.label}</p>
                                <p className="text-xl font-bold" style={{ color: col.color }}>{col.value}</p>
                                <p className="text-xs text-muted-foreground">un.</p>
                              </div>
                            ))}
                          </div>

                          {/* Localização */}
                          {info.localizacoes.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Localização Física</p>
                              <div className="flex flex-wrap gap-2">
                                {info.localizacoes.map(loc => (
                                  <span key={loc} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                    style={{ background: 'rgba(26,86,219,0.07)', color: '#1A56DB', border: '1px solid rgba(26,86,219,0.2)' }}>
                                    <MapPin className="w-3 h-3" />
                                    {formatLoc(loc)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Alerts */}
                          <div className="space-y-1.5">
                            {abaixoMin && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}>
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#92400E' }} aria-hidden="true" />
                                <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
                                  Estoque ficará abaixo do mínimo recomendado ({info.estoqueMinimo} un.)
                                </p>
                              </div>
                            )}
                            {info.criticidade === 'Alta' && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)' }}>
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#DC2626' }} aria-hidden="true" />
                                <p className="text-xs font-semibold" style={{ color: '#DC2626' }}>Item de alta criticidade</p>
                              </div>
                            )}
                            {info.saldo < 0 && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)' }}>
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#DC2626' }} aria-hidden="true" />
                                <p className="text-xs font-semibold" style={{ color: '#DC2626' }}>Quantidade solicitada supera o estoque disponível</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              {(() => {
                const s = detalhe.status;
                const isFinal = s === 'Entregue' || s === 'Cancelada';
                if (isFinal) return null;
                return (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                    {s === 'Solicitada' && (
                      <button onClick={() => avancarStatus(detalhe, 'Em análise', 'Análise iniciada')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: '#92400E', boxShadow: '0 4px 12px rgba(217,119,6,0.3)' }}>
                        <Eye className="w-4 h-4" aria-hidden="true" /> Analisar
                      </button>
                    )}
                    {s === 'Em análise' && (<>
                      <button onClick={() => avancarStatus(detalhe, 'Aprovada', 'Solicitação aprovada')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: '#166534', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                        <CheckCircle className="w-4 h-4" aria-hidden="true" /> Aprovar
                      </button>
                      <button onClick={() => rejeitarSolicitacao(detalhe)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                        <XCircle className="w-4 h-4" aria-hidden="true" /> Rejeitar
                      </button>
                    </>)}
                    {s === 'Aprovada' && (
                      <button onClick={() => avancarStatus(detalhe, 'Em separação', 'Separação iniciada')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                        <Package className="w-4 h-4" aria-hidden="true" /> Iniciar Separação
                      </button>
                    )}
                    {s === 'Em separação' && (
                      <button onClick={() => avancarStatus(detalhe, 'Pronta para retirada', 'Marcado como pronto')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: '#9A3412', boxShadow: '0 4px 12px rgba(234,88,12,0.3)' }}>
                        <CheckCircle className="w-4 h-4" aria-hidden="true" /> Marcar como Pronto
                      </button>
                    )}
                    {s === 'Pronta para retirada' && (
                      <button onClick={() => avancarStatus(detalhe, 'Entregue', 'Entrega confirmada')}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: '#166534', boxShadow: '0 4px 12px rgba(21,128,61,0.3)' }}>
                        <Truck className="w-4 h-4" aria-hidden="true" /> Confirmar Entrega
                      </button>
                    )}
                    <button onClick={() => avancarStatus(detalhe, 'Cancelada', 'Solicitação cancelada')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors ml-auto">
                      <XCircle className="w-4 h-4" aria-hidden="true" /> Cancelar Solicitação
                    </button>
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
