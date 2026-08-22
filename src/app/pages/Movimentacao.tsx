import { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, CheckCircle, User, Search, X, Package, Tag } from 'lucide-react';
import { type TipoMovimentacao, type Movimentacao } from '../data/mockData';
import { bancoDadosStore } from '../data/bancoDadosStore';
import { useAlmoxarifado } from '../context/AlmoxarifadoContext';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

interface SugestaoItem {
  produtoId: string;
  produtoNome: string;
  codigoProduto?: string;
  categoria: string;
  numeroSerie?: string;
  label: string;
}

export function Movimentacao() {
  const { produtos, setProdutos, movimentacoes: movimentacoesData, adicionarMovimentacao } = useAlmoxarifado();
  const catalogoProdutos = bancoDadosStore.getProdutos();

  const [tipo, setTipo] = useState<TipoMovimentacao | ''>('');
  const [produtoId, setProdutoId] = useState('');
  const [numeroSerieSelecionado, setNumeroSerieSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [matricula, setMatricula] = useState('');
  const [observacao, setObservacao] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sugestoes, setSugestoes] = useState<SugestaoItem[]>([]);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [produtoSelecionadoInfo, setProdutoSelecionadoInfo] = useState<SugestaoItem | null>(null);
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

  const gerarSugestoes = (query: string): SugestaoItem[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const resultados: SugestaoItem[] = [];
    const idsAdicionados = new Set<string>();

    const todasSerializadas = catalogoProdutos.flatMap(cat =>
      bancoDadosStore.getProdutosSerializadosPorCodigo(cat.codigoProduto)
    );

    todasSerializadas.forEach(s => {
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
    if (!value.trim()) {
      setSugestoes([]);
      setShowSugestoes(false);
      return;
    }
    const s = gerarSugestoes(value);
    setSugestoes(s);
    setShowSugestoes(s.length > 0);
  };

  const selecionarSugestao = (item: SugestaoItem) => {
    setProdutoSelecionadoInfo(item);
    setProdutoId(item.produtoId);
    setNumeroSerieSelecionado(item.numeroSerie || '');
    setSearchQuery(item.label);
    setShowSugestoes(false);
  };

  const limparSelecao = () => {
    setProdutoSelecionadoInfo(null);
    setProdutoId('');
    setNumeroSerieSelecionado('');
    setSearchQuery('');
    setSugestoes([]);
  };

  const produtoAtual = produtoId ? produtos.find(p => p.id === produtoId) : null;
  const serializadosProduto = produtoAtual?.codigoProduto
    ? bancoDadosStore.getProdutosSerializadosPorCodigo(produtoAtual.codigoProduto)
    : [];

  const handleConfirmar = () => {
    if (!tipo) { toast.error('Selecione o tipo de movimentação (Entrada ou Saída).'); return; }
    if (!produtoId) { toast.error('Selecione um produto para movimentar.'); return; }
    if (!quantidade) { toast.error('Informe a quantidade a movimentar.'); return; }
    if (!responsavel) { toast.error('Informe o nome do responsável.'); return; }
    if (!matricula) { toast.error('Informe a matrícula do responsável.'); return; }

    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    const qtd = parseInt(quantidade);

    if (tipo === 'Saída' && produto.quantidade < qtd) {
      toast.error(`Estoque insuficiente! Disponível: ${produto.quantidade} unidades de ${produto.nome}`);
      return;
    }

    const novaQuantidade = tipo === 'Entrada' ? produto.quantidade + qtd : produto.quantidade - qtd;
    setProdutos(produtos.map(p => p.id === produtoId ? { ...p, quantidade: novaQuantidade } : p));

    const novaMovimentacao: Movimentacao = {
      id: String(Date.now()),
      produtoId,
      produtoNome: produto.nome,
      tipo,
      quantidade: qtd,
      data: new Date().toISOString(),
      responsavel,
      matricula,
      observacao: observacao || undefined,
    };
    adicionarMovimentacao(novaMovimentacao);

    toast.success(`${tipo} registrada! ${produto.nome} · Novo estoque: ${novaQuantidade} unidades`, { duration: 4000 });

    setTipo('');
    limparSelecao();
    setQuantidade('');
    setResponsavel('');
    setMatricula('');
    setObservacao('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const formatarData = (dataISO: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(dataISO));
  };

  const movimentacoesRecentes = [...movimentacoesData]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Movimentação</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Central de entradas, saídas e transferências de produtos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border" style={{ background: 'linear-gradient(135deg, #0B1826 0%, #1E3A5F 100%)' }}>
            <h2 className="text-white font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Nova Movimentação</h2>
            <p className="text-blue-300 text-xs mt-0.5">Registre entradas e saídas do almoxarifado</p>
          </div>
          <div className="p-6">
            <div className="space-y-5">

              {/* Smart search */}
              <div className="space-y-2">
                <Label htmlFor="mov-busca" className="text-sm font-semibold text-foreground">Busca Inteligente de Produto *</Label>
                <div ref={searchRef} className="relative">
                  <div className={`flex items-center gap-2 border-2 rounded-xl px-3 py-2.5 transition-all ${
                    produtoSelecionadoInfo ? 'border-blue-500 bg-blue-50/50' : 'border-border bg-card'
                  } focus-within:border-blue-500`}>
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <input
                      id="mov-busca"
                      type="text"
                      value={searchQuery}
                      onChange={e => handleSearchChange(e.target.value)}
                      onFocus={() => { if (sugestoes.length > 0) setShowSugestoes(true); }}
                      placeholder="Digite o nome, código (ELE-001) ou ID serializado..."
                      className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                    />
                    {(searchQuery || produtoSelecionadoInfo) && (
                      <button type="button" onClick={limparSelecao} aria-label="Limpar produto selecionado" className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {showSugestoes && sugestoes.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {sugestoes.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selecionarSugestao(s)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border last:border-0"
                        >
                          <div className="mt-0.5 shrink-0">
                            {s.numeroSerie ? (
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Tag className="w-4 h-4 text-purple-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
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
                            <p className="text-sm font-medium text-foreground mt-0.5">{s.produtoNome}</p>
                            <p className="text-xs text-muted-foreground">{s.categoria}</p>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0 mt-1">
                            {s.numeroSerie ? 'Unidade' : 'Produto'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Ex: ELE-001 ou ID serializado ELE-001-02</p>

                {produtoAtual && (
                  <div className="p-3 rounded-xl border" style={{ background: 'rgba(26,86,219,0.05)', borderColor: 'rgba(26,86,219,0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      {produtoAtual.codigoProduto && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.25)', borderRadius: 4, padding: '1px 6px' }}>
                          {produtoAtual.codigoProduto}
                        </span>
                      )}
                      <p className="font-semibold text-foreground text-sm">{produtoAtual.nome}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Estoque atual: <strong className="text-foreground">{produtoAtual.quantidade}</strong> unidades</span>
                      {numeroSerieSelecionado && (
                        <span style={{ color: '#7C3AED', fontWeight: 600 }}>Unidade: #{numeroSerieSelecionado}</span>
                      )}
                    </div>

                    {serializadosProduto.length > 0 && !produtoSelecionadoInfo?.numeroSerie && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <Label htmlFor="mov-unidade" className="text-xs text-muted-foreground mb-1.5 block">Selecionar Unidade Específica (opcional)</Label>
                        <Select value={numeroSerieSelecionado} onValueChange={setNumeroSerieSelecionado}>
                          <SelectTrigger id="mov-unidade" className="bg-card text-sm h-8">
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Não especificar</SelectItem>
                            {serializadosProduto.map(s => (
                              <SelectItem key={s.id} value={s.numeroSerie}>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#7C3AED' }}>#{s.numeroSerie}</span>
                                <span className="text-xs text-muted-foreground ml-2">· {s.localizacao} · {s.status}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label id="mov-tipo-label" className="text-sm font-semibold text-foreground">Tipo de Movimentação *</Label>
                <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="mov-tipo-label">
                  <button
                    type="button"
                    onClick={() => setTipo('Entrada')}
                    aria-pressed={tipo === 'Entrada'}
                    className="flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 font-semibold text-sm transition-all"
                    style={tipo === 'Entrada' ? {
                      borderColor: '#22C55E',
                      background: 'rgba(34,197,94,0.08)',
                      color: '#166534',
                    } : {
                      borderColor: 'rgba(11,24,38,0.1)',
                      background: 'transparent',
                      color: '#64748B',
                    }}
                  >
                    <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('Saída')}
                    aria-pressed={tipo === 'Saída'}
                    className="flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 font-semibold text-sm transition-all"
                    style={tipo === 'Saída' ? {
                      borderColor: '#EF4444',
                      background: 'rgba(239,68,68,0.08)',
                      color: '#B91C1C',
                    } : {
                      borderColor: 'rgba(11,24,38,0.1)',
                      background: 'transparent',
                      color: '#64748B',
                    }}
                  >
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    Saída
                  </button>
                </div>
              </div>

              {/* Qty */}
              <div className="space-y-2">
                <Label htmlFor="mov-quantidade">Quantidade *</Label>
                <Input
                  id="mov-quantidade"
                  type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="0" min="1" className="rounded-xl"
                  aria-invalid={!!(produtoAtual && tipo === 'Saída' && quantidade && parseInt(quantidade) > produtoAtual.quantidade)}
                  aria-describedby={produtoAtual && tipo === 'Saída' && quantidade && parseInt(quantidade) > produtoAtual.quantidade ? 'mov-quantidade-erro' : undefined}
                />
                {produtoAtual && tipo === 'Saída' && quantidade && parseInt(quantidade) > produtoAtual.quantidade && (
                  <p id="mov-quantidade-erro" className="text-xs text-red-600 font-semibold"><span aria-hidden="true">⚠️</span> Quantidade maior que o estoque disponível ({produtoAtual.quantidade})</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mov-responsavel">Responsável *</Label>
                  <Input id="mov-responsavel" value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Nome completo" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mov-matricula">Matrícula *</Label>
                  <Input id="mov-matricula" value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="Ex: 123456" className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mov-observacao">Observação (opcional)</Label>
                <Textarea id="mov-observacao" value={observacao} onChange={e => setObservacao(e.target.value)}
                  placeholder="Informações adicionais..." rows={2} className="rounded-xl" />
              </div>

              <button
                onClick={handleConfirmar}
                disabled={!tipo || !produtoId || !quantidade || !responsavel || !matricula}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #1A56DB 0%, #2563EB 100%)',
                  color: 'white',
                  boxShadow: (!tipo || !produtoId || !quantidade || !responsavel || !matricula) ? 'none' : '0 4px 12px rgba(26,86,219,0.3)',
                }}
              >
                Confirmar Movimentação
              </button>

              {showSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl border text-green-800" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)' }}>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold">Movimentação registrada com sucesso!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Histórico de Movimentações</h2>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{movimentacoesRecentes.length} registros</span>
          </div>
          <div className="p-4">
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1" tabIndex={0} role="region" aria-label="Histórico de movimentações">
              {movimentacoesRecentes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma movimentação registrada ainda</p>
                </div>
              )}
              {movimentacoesRecentes.map((mov) => {
                const produto = produtos.find(p => p.id === mov.produtoId);
                const isEntrada = mov.tipo === 'Entrada';
                return (
                  <div key={mov.id} className="rounded-xl p-3.5" style={{
                    borderLeft: `4px solid ${isEntrada ? '#22C55E' : '#EF4444'}`,
                    background: isEntrada ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                    border: `1px solid ${isEntrada ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                    borderLeftWidth: 4,
                  }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isEntrada ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isEntrada
                            ? <ArrowDownRight className="w-4 h-4 text-green-600" />
                            : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            {produto?.codigoProduto && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 4, padding: '1px 5px' }}>
                                {produto.codigoProduto}
                              </span>
                            )}
                            <p className="font-semibold text-foreground text-sm">{mov.produtoNome}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{mov.tipo} · {mov.quantidade} unidade(s)</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">{formatarData(mov.data)}</p>
                    </div>
                    {(mov.responsavel || mov.matricula) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card px-2.5 py-1.5 rounded-lg border border-border">
                        <User className="w-3 h-3 text-muted-foreground/50" />
                        <span className="font-medium text-foreground">{mov.responsavel}</span>
                        {mov.matricula && <span className="text-muted-foreground">· Mat: {mov.matricula}</span>}
                      </div>
                    )}
                    {mov.observacao && (
                      <div className="mt-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                        <span className="font-medium">Obs:</span> {mov.observacao}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
