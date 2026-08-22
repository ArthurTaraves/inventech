import { useState } from 'react';
import { Search, Plus, AlertCircle, Edit, Trash2, X, History, Eye, ArrowUpRight, ArrowDownRight, User, Package, MapPin } from 'lucide-react';
import { type Produto, type Criticidade } from '../data/mockData';
import { bancoDadosStore } from '../data/bancoDadosStore';
import { useAlmoxarifado } from '../context/AlmoxarifadoContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

const thStyle: React.CSSProperties = {
  padding: '10px 20px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted-foreground)',
  background: 'var(--muted)',
  borderBottom: '1px solid rgba(11,24,38,0.08)',
  whiteSpace: 'nowrap',
};

const CritBadge = ({ c }: { c: Criticidade }) => {
  const cfg: Record<Criticidade, { bg: string; color: string; border: string; label: string; icon: string }> = {
    Alta: { bg: 'rgba(239,68,68,0.1)', color: 'var(--text-red)', border: 'rgba(239,68,68,0.3)', label: 'Alta', icon: '🔴' },
    Média: { bg: 'rgba(245,158,11,0.1)', color: 'var(--text-amber)', border: 'rgba(245,158,11,0.3)', label: 'Média', icon: '🟡' },
    Baixa: { bg: 'rgba(34,197,94,0.1)', color: 'var(--text-green)', border: 'rgba(34,197,94,0.3)', label: 'Baixa', icon: '🟢' },
  };
  const s = cfg[c] || cfg['Baixa'];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span aria-hidden="true">{s.icon}</span>
      {s.label}
    </span>
  );
};

// Classificação de situação do estoque em relação ao mínimo cadastrado.
// "Atenção" = já está acima do mínimo, mas dentro de uma folga de 20% dele —
// um alerta antecipado antes de cruzar o limite.
const getSituacaoEstoque = (quantidade: number, minimo: number) => {
  if (quantidade < minimo) return { label: 'Reposição Necessária', color: 'var(--text-red)', icon: '🔴' };
  if (minimo > 0 && quantidade <= minimo * 1.2) return { label: 'Atenção', color: 'var(--text-amber)', icon: '🟡' };
  return { label: 'Normal', color: 'var(--text-green)', icon: '🟢' };
};

export function Estoque() {
  const { produtos: produtosData, setProdutos: setProdutosData, movimentacoes: movimentacoesData } = useAlmoxarifado();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<string | null>(null);
  const [produtoParaDeletar, setProdutoParaDeletar] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [produtoHistorico, setProdutoHistorico] = useState<Produto | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [produtoDetalhes, setProdutoDetalhes] = useState<Produto | null>(null);

  const [novoProduto, setNovoProduto] = useState({
    produtoId: '',
    quantidade: '',
    localizacoes: [] as string[],
    novaLocalizacao: '',
    criticidade: 'Média' as Criticidade,
  });

  const produtosCatalogo = bancoDadosStore.getProdutosAtivos();
  const produtosCatalogoProdutos = bancoDadosStore.getProdutos();

  const produtosFiltrados = produtosData.filter((produto) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    const cat = produtosCatalogoProdutos.find(p => p.nome === produto.nome)?.categoria || '';
    return (
      produto.nome.toLowerCase().includes(q) ||
      (produto.localizacoes && produto.localizacoes.some(loc => loc.toLowerCase().includes(q))) ||
      (produto.codigoProduto && produto.codigoProduto.toLowerCase().includes(q)) ||
      cat.toLowerCase().includes(q)
    );
  });

  const getCriticalityColor = (criticidade: Criticidade) => {
    switch (criticidade) {
      case 'Baixa': return 'bg-green-100 text-green-800 border-green-200';
      case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Alta': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const resetFormulario = () => {
    setNovoProduto({ produtoId: '', quantidade: '', localizacoes: [], novaLocalizacao: '', criticidade: 'Média' });
    setIsEditMode(false);
    setProdutoEditando(null);
  };

  const abrirDialogEditar = (produto: Produto) => {
    const produtoCatalogo = produtosCatalogo.find(p => p.nome === produto.nome);
    setNovoProduto({
      produtoId: produtoCatalogo?.id || '',
      quantidade: String(produto.quantidade),
      localizacoes: produto.localizacoes ? [...produto.localizacoes] : [],
      novaLocalizacao: '',
      criticidade: produto.criticidade,
    });
    setProdutoEditando(produto.id);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const abrirHistorico = (produto: Produto) => {
    setProdutoHistorico(produto);
    setIsHistoricoOpen(true);
  };

  const abrirDetalhes = (produto: Produto) => {
    setProdutoDetalhes(produto);
    setIsDetalhesOpen(true);
  };

  const handleAddProduto = () => {
    if (!novoProduto.produtoId) { toast.error('Selecione um produto do catálogo'); return; }
    if (!novoProduto.quantidade || parseInt(novoProduto.quantidade) <= 0) { toast.error('Quantidade deve ser maior que zero'); return; }
    if (novoProduto.localizacoes.length === 0) { toast.error('Adicione pelo menos uma localização'); return; }

    const produtoCatalogo = produtosCatalogo.find(p => p.id === novoProduto.produtoId);
    if (!produtoCatalogo) { toast.error('Produto não encontrado. Cadastre na Área Administrativa.'); return; }

    const produtoExistente = produtosData.find(p => p.nome === produtoCatalogo.nome && p.id !== produtoEditando);
    if (produtoExistente && !isEditMode) { toast.error('Este produto já existe no estoque.'); return; }

    const quantidade = parseInt(novoProduto.quantidade);
    if (quantidade < produtoCatalogo.estoqueMinimo) { toast.error(`Quantidade abaixo do mínimo permitido (mínimo: ${produtoCatalogo.estoqueMinimo}).`); return; }
    if (quantidade > produtoCatalogo.estoqueMaximo) { toast.error(`Quantidade acima do máximo permitido (máximo: ${produtoCatalogo.estoqueMaximo}).`); return; }

    if (isEditMode && produtoEditando) {
      setProdutosData(produtosData.map(p =>
        p.id === produtoEditando ? { ...p, quantidade, localizacoes: novoProduto.localizacoes, criticidade: novoProduto.criticidade } : p
      ));
      toast.success('Produto atualizado com sucesso!');
    } else {
      const produto: Produto = {
        id: String(Date.now()),
        nome: produtoCatalogo.nome,
        quantidade,
        localizacoes: novoProduto.localizacoes,
        criticidade: novoProduto.criticidade,
        codigoProduto: produtoCatalogo.codigoProduto,
      };
      setProdutosData([...produtosData, produto]);
      toast.success('Produto adicionado ao estoque com sucesso!');
    }
    resetFormulario();
    setIsDialogOpen(false);
  };

  const handleDeletar = () => {
    if (!produtoParaDeletar) return;
    setProdutosData(produtosData.filter(p => p.id !== produtoParaDeletar));
    toast.success('Produto removido do estoque');
    setProdutoParaDeletar(null);
  };

  const formatarData = (dataISO: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(dataISO));
  };

  const historicosProduto = produtoHistorico
    ? movimentacoesData
        .filter(m => m.produtoId === produtoHistorico.id)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    : [];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Estoque</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Consulta e gerenciamento · Movimentações na aba Movimentação</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetFormulario(); }}>
          <DialogTrigger asChild>
            <Button style={{ background: '#1A56DB', color: 'white' }} className="hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <div style={{ background: 'linear-gradient(135deg, #1A56DB 0%, #2563EB 100%)', margin: '-24px -24px 20px', padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
                <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {isEditMode ? 'Editar Produto no Estoque' : 'Adicionar Produto ao Estoque'}
                </h2>
                <p className="text-blue-200 text-sm mt-0.5">
                  {isEditMode ? 'Atualize a quantidade, localização e criticidade.' : 'Selecione um produto do catálogo e informe quantidade e localização.'}
                </p>
              </div>
              <DialogTitle className="sr-only">{isEditMode ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
              <DialogDescription className="sr-only">Formulário de produto</DialogDescription>
            </DialogHeader>

            {produtosCatalogo.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Nenhum produto disponível</p>
                  <p>Cadastre produtos na "Área Administrativa" antes de adicionar ao estoque.</p>
                </div>
              </div>
            )}

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="estoque-produto">Produto *</Label>
                <Select value={novoProduto.produtoId} onValueChange={(v) => setNovoProduto({ ...novoProduto, produtoId: v })} disabled={isEditMode}>
                  <SelectTrigger id="estoque-produto" autoFocus={!isEditMode}><SelectValue placeholder="Selecione um produto cadastrado" /></SelectTrigger>
                  <SelectContent>
                    {produtosCatalogo.map(prod => (
                      <SelectItem key={prod.id} value={prod.id}>
                        {prod.codigoProduto ? `[${prod.codigoProduto}] ` : ''}{prod.nome} ({prod.categoria})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {novoProduto.produtoId && (() => {
                  const cat = produtosCatalogo.find(p => p.id === novoProduto.produtoId);
                  return cat ? (
                    <p className="text-xs text-muted-foreground">Estoque permitido: {cat.estoqueMinimo} — {cat.estoqueMaximo} {cat.unidadeMedida}</p>
                  ) : null;
                })()}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque-quantidade">Quantidade *</Label>
                <Input id="estoque-quantidade" type="number" min="0" value={novoProduto.quantidade}
                  onChange={e => setNovoProduto({ ...novoProduto, quantidade: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque-localizacao">Localizações *</Label>
                <div className="flex gap-2">
                  <Input id="estoque-localizacao" value={novoProduto.novaLocalizacao}
                    onChange={e => setNovoProduto({ ...novoProduto, novaLocalizacao: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const loc = novoProduto.novaLocalizacao.trim();
                        if (loc && !novoProduto.localizacoes.includes(loc)) {
                          setNovoProduto({ ...novoProduto, localizacoes: [...novoProduto.localizacoes, loc], novaLocalizacao: '' });
                        }
                      }
                    }}
                    placeholder="Ex: A-3, B-5 (Enter para adicionar)" />
                  <Button type="button" variant="outline" aria-label="Adicionar localização" onClick={() => {
                    const loc = novoProduto.novaLocalizacao.trim();
                    if (loc && !novoProduto.localizacoes.includes(loc)) {
                      setNovoProduto({ ...novoProduto, localizacoes: [...novoProduto.localizacoes, loc], novaLocalizacao: '' });
                    }
                  }}><Plus className="w-4 h-4" /></Button>
                </div>
                {novoProduto.localizacoes.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg bg-muted/40">
                    {novoProduto.localizacoes.map((loc, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded border border-blue-200">
                        {loc}
                        <button type="button" aria-label={`Remover localização ${loc}`} onClick={() => setNovoProduto({ ...novoProduto, localizacoes: novoProduto.localizacoes.filter((_, i) => i !== idx) })} className="hover:bg-blue-200 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque-criticidade">Criticidade</Label>
                <Select value={novoProduto.criticidade} onValueChange={v => setNovoProduto({ ...novoProduto, criticidade: v as Criticidade })}>
                  <SelectTrigger id="estoque-criticidade"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">🟢 Baixa</SelectItem>
                    <SelectItem value="Média">🟡 Média</SelectItem>
                    <SelectItem value="Alta">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddProduto} style={{ background: '#1A56DB', color: 'white' }} className="hover:opacity-90">
                {isEditMode ? 'Salvar Alterações' : 'Adicionar ao Estoque'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info banner */}
      <div className="mb-6 rounded-xl border p-4 flex items-start gap-3" style={{ background: 'rgba(26,86,219,0.05)', borderColor: 'rgba(26,86,219,0.2)' }}>
        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--text-blue)' }} />
        <div className="text-sm" style={{ color: 'var(--text-blue)' }}>
          <p className="font-semibold mb-0.5">Produtos validados pela Área Administrativa</p>
          <p>Para registrar entradas ou saídas, acesse a aba <strong>Movimentação</strong>. Esta tela é para consulta e gerenciamento.</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input type="text" aria-label="Buscar produtos no estoque" placeholder="Buscar por código, nome, categoria ou localização..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th scope="col" style={thStyle}>Código ID</th>
                <th scope="col" style={thStyle}>Nome do Produto</th>
                <th scope="col" style={thStyle}>Categoria</th>
                <th scope="col" style={thStyle}>Quantidade</th>
                <th scope="col" style={thStyle}>Localizações</th>
                <th scope="col" style={thStyle}>Criticidade</th>
                <th scope="col" style={thStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((produto, rowIdx) => {
                const catInfo = produtosCatalogoProdutos.find(p => p.nome === produto.nome);
                const estoqueMinimoRow = catInfo?.estoqueMinimo ?? 0;
                const isHovered = hoveredRow === produto.id;
                const rowBg = isHovered ? 'rgba(26,86,219,0.04)' : rowIdx % 2 === 0 ? 'var(--card)' : 'var(--surface-alt)';
                return (
                  <tr
                    key={produto.id}
                    onMouseEnter={() => setHoveredRow(produto.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ background: rowBg, transition: 'background 0.15s', borderBottom: '1px solid rgba(11,24,38,0.06)' }}
                  >
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                      {produto.codigoProduto ? (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 12, color: 'var(--text-blue)', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 6, padding: '2px 8px', display: 'inline-block' }}>
                          {produto.codigoProduto}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div className="font-semibold text-foreground text-sm">{produto.nome}</div>
                    </td>
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {catInfo?.categoria || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                      <div className="font-bold text-sm" style={{ color: produto.quantidade < estoqueMinimoRow ? 'var(--text-red)' : 'var(--foreground)' }}>
                        {produto.quantidade}
                        {produto.quantidade < estoqueMinimoRow && (
                          <span className="ml-1.5 text-xs font-semibold">
                            <span aria-hidden="true">⚠️</span> Abaixo do mínimo
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div className="flex flex-wrap gap-1.5">
                        {produto.localizacoes && produto.localizacoes.length > 0 ? (
                          produto.localizacoes.map((loc, idx) => {
                            const parts = loc.split('-');
                            const corredor = parts[0] || loc;
                            const prateleira = parts[1] || null;
                            return (
                              <div key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="font-semibold text-slate-700">C{corredor}</span>
                                {prateleira && <span className="text-slate-500">P{prateleira}</span>}
                              </div>
                            );
                          })
                        ) : <span className="text-muted-foreground text-xs">Sem localização</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                      <CritBadge c={produto.criticidade} />
                    </td>
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirDetalhes(produto)}
                          aria-label={`Ver detalhes de ${produto.nome}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Detalhes">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => abrirHistorico(produto)}
                          aria-label={`Ver histórico de ${produto.nome}`}
                          className="p-1.5 rounded-lg text-purple-500 hover:text-purple-700 hover:bg-purple-50 transition-colors" title="Histórico">
                          <History className="w-4 h-4" />
                        </button>
                        <button onClick={() => abrirDialogEditar(produto)}
                          aria-label={`Editar ${produto.nome}`}
                          className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setProdutoParaDeletar(produto.id)}
                          aria-label={`Excluir ${produto.nome} do estoque`}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {produtosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Dialog Histórico */}
      <Dialog open={isHistoricoOpen} onOpenChange={open => { setIsHistoricoOpen(open); if (!open) setProdutoHistorico(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)', margin: '-24px -24px 20px', padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
              <div className="flex items-center gap-2 text-white">
                <History className="w-5 h-5" />
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Histórico de Movimentações</h2>
              </div>
              {produtoHistorico && (
                <div className="flex items-center gap-2 mt-1.5">
                  {produtoHistorico.codigoProduto && (
                    <span className="font-mono text-xs font-semibold text-purple-200 bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
                      {produtoHistorico.codigoProduto}
                    </span>
                  )}
                  <span className="text-purple-100 text-sm">{produtoHistorico.nome}</span>
                </div>
              )}
            </div>
            <DialogTitle className="sr-only">Histórico</DialogTitle>
            <DialogDescription className="sr-only">Histórico de movimentações do produto</DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {historicosProduto.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma movimentação registrada para este produto</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1" tabIndex={0} role="region" aria-label="Histórico de movimentações do produto">
                {historicosProduto.map(mov => (
                  <div key={mov.id} className="rounded-xl border-l-4 p-4" style={{
                    borderLeftColor: mov.tipo === 'Entrada' ? '#22C55E' : '#EF4444',
                    background: mov.tipo === 'Entrada' ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                    border: '1px solid',
                    borderColor: mov.tipo === 'Entrada' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    borderLeftWidth: 4,
                  }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${mov.tipo === 'Entrada' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {mov.tipo === 'Entrada'
                            ? <ArrowDownRight className="w-4 h-4 text-green-600" />
                            : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: mov.tipo === 'Entrada' ? 'var(--text-green)' : 'var(--text-red)' }}>
                            {mov.tipo}
                          </p>
                          <p className="text-lg font-bold text-foreground">{mov.quantidade} unidade(s)</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatarData(mov.data)}</p>
                    </div>
                    {(mov.responsavel || mov.matricula) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card px-3 py-2 rounded-lg border border-border">
                        <User className="w-3 h-3 text-muted-foreground/60" />
                        <span className="font-medium text-foreground">{mov.responsavel}</span>
                        {mov.matricula && <span className="text-muted-foreground">· Mat: {mov.matricula}</span>}
                      </div>
                    )}
                    {mov.observacao && (
                      <div className="mt-2 text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                        <span className="font-medium">Obs:</span> {mov.observacao}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoricoOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog open={isDetalhesOpen} onOpenChange={open => { setIsDetalhesOpen(open); if (!open) setProdutoDetalhes(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div style={{ background: 'linear-gradient(135deg, #0B1826 0%, #1E3A5F 100%)', margin: '-24px -24px 20px', padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
              <div className="flex items-center gap-2 text-white">
                <Eye className="w-5 h-5" />
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Detalhes do Produto</h2>
              </div>
            </div>
            <DialogTitle className="sr-only">Detalhes</DialogTitle>
            <DialogDescription className="sr-only">Informações detalhadas do produto</DialogDescription>
          </DialogHeader>
          {produtoDetalhes && (() => {
            const catInfo = produtosCatalogoProdutos.find(p => p.nome === produtoDetalhes.nome);
            const estoqueMinimoModal = catInfo?.estoqueMinimo ?? 0;
            const situacao = catInfo ? getSituacaoEstoque(produtoDetalhes.quantidade, estoqueMinimoModal) : null;
            const serializados = produtoDetalhes.codigoProduto
              ? bancoDadosStore.getProdutosSerializadosPorCodigo(produtoDetalhes.codigoProduto)
              : [];
            // Fonte única de verdade: localizações vêm das unidades serializadas
            // (bancoDadosStore), evitando divergência com o campo produto.localizacoes
            // salvo separadamente no localStorage. Cai no campo antigo só quando o
            // produto não tem unidades serializadas cadastradas (ex: item manual).
            const localizacoesDoCatalogo = produtoDetalhes.codigoProduto
              ? bancoDadosStore.getLocalizacoesUnicasPorCodigo(produtoDetalhes.codigoProduto)
              : [];
            const localizacoesParaExibir = localizacoesDoCatalogo.length > 0
              ? localizacoesDoCatalogo
              : (produtoDetalhes.localizacoes ?? []);
            return (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl border" style={{ background: 'rgba(26,86,219,0.05)', borderColor: 'rgba(26,86,219,0.15)' }}>
                  {produtoDetalhes.codigoProduto && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: 'var(--text-blue)', background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.25)', borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginBottom: 8 }}>
                      {produtoDetalhes.codigoProduto}
                    </div>
                  )}
                  <h3 className="font-bold text-foreground text-lg">{produtoDetalhes.nome}</h3>
                  {catInfo && <p className="text-sm text-muted-foreground mt-0.5">{catInfo.categoria}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Quantidade em estoque</p>
                    <p className="text-2xl font-bold" style={{ color: produtoDetalhes.quantidade < estoqueMinimoModal ? 'var(--text-red)' : 'var(--foreground)' }}>
                      {produtoDetalhes.quantidade}
                    </p>
                    {produtoDetalhes.quantidade < estoqueMinimoModal && (
                      <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-red)' }}>
                        <span aria-hidden="true">⚠️</span> Abaixo do mínimo
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1.5">Criticidade</p>
                    <CritBadge c={produtoDetalhes.criticidade} />
                  </div>
                </div>

                {catInfo && (
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Estoque atual x limites cadastrados</p>
                    <div className="flex gap-4 text-sm mb-3">
                      <div><span className="text-muted-foreground">Atual:</span> <span className="font-semibold text-foreground">{produtoDetalhes.quantidade}</span></div>
                      <div><span className="text-muted-foreground">Mínimo:</span> <span className="font-semibold text-foreground">{catInfo.estoqueMinimo}</span></div>
                      <div><span className="text-muted-foreground">Máximo:</span> <span className="font-semibold text-foreground">{catInfo.estoqueMaximo}</span></div>
                      <div><span className="text-muted-foreground">Unidade:</span> <span className="font-semibold text-foreground">{catInfo.unidadeMedida}</span></div>
                    </div>
                    {situacao && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">Situação:</span>
                        <span className="text-sm font-bold" style={{ color: situacao.color }}>
                          <span aria-hidden="true">{situacao.icon}</span> {situacao.label}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Localizações</p>
                  <div className="flex flex-wrap gap-2">
                    {localizacoesParaExibir.map((loc, i) => {
                      const parts = loc.split('-');
                      return (
                        <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <div>
                            <div className="font-semibold text-slate-700">Corredor {parts[0]}</div>
                            {parts[1] && <div className="text-slate-500">Prateleira {parts[1]}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {serializados.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Unidades serializadas ({serializados.length})</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {serializados.map(s => (
                        <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: 'var(--text-violet)' }}>#{s.numeroSerie}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{s.localizacao}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'Disponível' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetalhesOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!produtoParaDeletar} onOpenChange={open => !open && setProdutoParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá o produto do estoque e não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletar} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
