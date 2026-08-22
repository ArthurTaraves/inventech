import { useState } from 'react';
import { Package, Wrench, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAlmoxarifado } from '../context/AlmoxarifadoContext';
import { bancoDadosStore } from '../data/bancoDadosStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

const SemaforoIndicator = ({ status, contexto = 'prazo' }: { status: 'green' | 'yellow' | 'red'; contexto?: 'prazo' | 'estoque' }) => {
  const colors = { green: '#22C55E', yellow: '#EAB308', red: '#EF4444' };
  const labelsPorContexto = {
    prazo: { green: 'No prazo', yellow: 'Atenção', red: 'Atrasado' },
    estoque: { green: 'Disponível', yellow: 'Atenção', red: 'Estoque baixo' },
  };
  const labels = labelsPorContexto[contexto];
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors[status], boxShadow: status === 'red' ? `0 0 6px ${colors.red}` : 'none' }} aria-hidden="true" />
      <span className="text-xs font-medium" style={{ color: status === 'yellow' ? '#92400E' : status === 'red' ? '#B91C1C' : '#166534' }}>{labels[status]}</span>
    </div>
  );
};

interface KpiCardProps {
  label: string;
  value: number | string;
  sub: string;
  accent: string;
  icon: React.ReactNode;
}

const KpiCard = ({ label, value, sub, accent, icon }: KpiCardProps) => (
  <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm" style={{ borderLeft: `4px solid ${accent}` }}>
    <div className="px-5 pt-4 pb-2 flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="p-2 rounded-lg" style={{ background: `${accent}18` }}>
        <div style={{ color: accent }}>{icon}</div>
      </div>
    </div>
    <div className="px-5 pb-4">
      <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  </div>
);

export function Dashboard() {
  const { produtos, movimentacoes, itensManutencao } = useAlmoxarifado();
  const produtosCatalogo = bancoDadosStore.getProdutos();
  const catalogMap = new Map(produtosCatalogo.map(c => [c.codigoProduto, c]));
  const [detalheEstoqueOpen, setDetalheEstoqueOpen] = useState(false);

  // Estoque mínimo é individual por produto (cadastrado na Área Administrativa) —
  // nunca um limite fixo. Mesma fonte de dados usada em Estoque, Portal de
  // Requisições e Solicitações.
  const getEstoqueMinimo = (produto: typeof produtos[number]) =>
    catalogMap.get(produto.codigoProduto ?? '')?.estoqueMinimo ?? 0;

  const totalItens = produtos.reduce((acc, p) => acc + p.quantidade, 0);
  const itensEmManutencao = itensManutencao.filter(item => item.status !== 'Retorno').length;
  const itensAltaCriticidade = produtos.filter(p => p.criticidade === 'Alta').length;

  // Reposição de estoque — sempre comparando com o estoqueMinimo individual do produto.
  const itensAbaixoDoMinimoTodos = produtos
    .filter(p => p.quantidade < getEstoqueMinimo(p))
    .sort((a, b) => (a.quantidade - getEstoqueMinimo(a)) - (b.quantidade - getEstoqueMinimo(b)));
  const itensEstoqueBaixo = itensAbaixoDoMinimoTodos.length;
  const itensCriticosAbaixoDoMinimoTodos = itensAbaixoDoMinimoTodos.filter(p => p.criticidade === 'Alta');

  // "Compras Emergenciais Evitadas" — construído em cima do estado atual, sem histórico/log inventado.
  // Risco identificado antecipadamente: já está abaixo do mínimo, mas ainda > 0 (dá tempo de agir).
  // Ruptura já ocorrida: quantidade zerada — já faltou, não conta como prevenção.
  const itensRiscoAntecipado = itensAbaixoDoMinimoTodos.filter(p => p.quantidade > 0);
  const itensCriticosRiscoAntecipado = itensRiscoAntecipado.filter(p => p.criticidade === 'Alta');
  const itensRupturaTotal = itensAbaixoDoMinimoTodos.filter(p => p.quantidade === 0);

  // "Situação" de cada produto: Normal / Atenção (dentro de 20% acima do mínimo) / Abaixo do mínimo.
  const getSituacaoEstoque = (quantidade: number, minimo: number) => {
    if (quantidade < minimo) return { key: 'abaixo', label: 'Abaixo do mínimo', color: '#B91C1C', icon: '🔴' } as const;
    if (minimo > 0 && quantidade <= minimo * 1.2) return { key: 'atencao', label: 'Atenção', color: '#92400E', icon: '🟡' } as const;
    return { key: 'normal', label: 'Normal', color: '#166534', icon: '🟢' } as const;
  };
  const situacaoBuckets = produtos.reduce(
    (acc, p) => {
      const s = getSituacaoEstoque(p.quantidade, getEstoqueMinimo(p)).key;
      acc[s]++;
      return acc;
    },
    { normal: 0, atencao: 0, abaixo: 0 } as Record<'normal' | 'atencao' | 'abaixo', number>
  );
  const totalSituacao = situacaoBuckets.normal + situacaoBuckets.atencao + situacaoBuckets.abaixo;

  const ultimasMovimentacoes = [...movimentacoes]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  const calcularMTTR = () => {
    const itensRetornados = itensManutencao.filter(item =>
      item.status === 'Retorno' && item.timestampEnvio && item.timestampRetorno
    );
    if (itensRetornados.length === 0) return { dias: 0, horas: 0, totalItens: 0 };
    const tempos = itensRetornados.map(item =>
      new Date(item.timestampRetorno!).getTime() - new Date(item.timestampEnvio!).getTime()
    );
    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    return {
      dias: Math.floor(media / (1000 * 60 * 60 * 24)),
      horas: Math.floor((media % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      totalItens: itensRetornados.length,
    };
  };
  const mttr = calcularMTTR();

  const calcularVolumeCategoria = () => {
    const categorias: Record<string, { total: number; atrasados: number; tempoTotal: number; count: number }> = {};
    itensManutencao.forEach(item => {
      const prod = produtosCatalogo.find(p => p.nome === item.produtoNome);
      const cat = prod?.categoria || 'Outros';
      if (!categorias[cat]) categorias[cat] = { total: 0, atrasados: 0, tempoTotal: 0, count: 0 };
      categorias[cat].total++;
      const dias = Math.floor((new Date().getTime() - new Date(item.dataEnvio).getTime()) / (1000 * 60 * 60 * 24));
      if (dias > 14 && item.status !== 'Retorno') categorias[cat].atrasados++;
      if (item.status === 'Retorno' && item.timestampEnvio && item.timestampRetorno) {
        const t = (new Date(item.timestampRetorno).getTime() - new Date(item.timestampEnvio).getTime()) / (1000 * 60 * 60 * 24);
        categorias[cat].tempoTotal += t;
        categorias[cat].count++;
      }
    });
    return Object.entries(categorias)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([cat, d]) => ({
        categoria: cat,
        quantidade: d.total,
        atrasados: d.atrasados,
        tempoMedio: d.count > 0 ? Math.round(d.tempoTotal / d.count) : null,
      }));
  };
  const volumeCategoria = calcularVolumeCategoria();
  const maxVolume = Math.max(...volumeCategoria.map(v => v.quantidade), 1);

  const itensCriticosEstoqueBaixo = [...itensCriticosAbaixoDoMinimoTodos]
    .sort((a, b) => a.quantidade - b.quantidade)
    .slice(0, 3);

  const verificarInercia = (item: typeof itensManutencao[0]) => {
    if (item.status === 'Retorno') return false;
    const ua = item.ultimaAtualizacao || item.timestampEnvio;
    if (!ua) return false;
    return (new Date().getTime() - new Date(ua).getTime()) / (1000 * 60 * 60) > 48;
  };

  const itensAtrasados = itensManutencao.filter(item => {
    if (item.status === 'Retorno') return false;
    const dias = Math.floor((new Date().getTime() - new Date(item.dataEnvio).getTime()) / (1000 * 60 * 60 * 24));
    return dias > 14;
  }).slice(0, 3);

  const itensComInercia = itensManutencao.filter(verificarInercia).slice(0, 3);

  const getSemaforoManutencao = (item: typeof itensManutencao[0]) => {
    if (item.status === 'Retorno') return 'green';
    const dias = Math.floor((new Date().getTime() - new Date(item.dataEnvio).getTime()) / (1000 * 60 * 60 * 24));
    if (dias > 14) return 'red';
    if (dias > 7) return 'yellow';
    return 'green';
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(data);
  };

  const labelCriticidadeABC = { A: 'Crítico', B: 'Médio', C: 'Baixo' } as const;

  const totalPrioridades = itensCriticosEstoqueBaixo.length + itensAtrasados.length + itensComInercia.length;
  const barColors = ['#1A56DB', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];

  const hoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral · Indicadores de performance operacional</p>
        </div>
        <span className="text-xs text-muted-foreground capitalize">{hoje}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiCard
          label="Total de Itens"
          value={totalItens}
          sub="unidades em estoque"
          accent="#1A56DB"
          icon={<Package className="w-4 h-4" />}
        />
        <KpiCard
          label="Em Manutenção"
          value={itensEmManutencao}
          sub="itens em processo"
          accent="#F59E0B"
          icon={<Wrench className="w-4 h-4" />}
        />
        <button
          type="button"
          onClick={() => setDetalheEstoqueOpen(true)}
          aria-haspopup="dialog"
          className="text-left bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full"
          style={{ borderLeft: '4px solid #EF4444' }}
        >
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Estoque Abaixo do Mínimo</span>
            <div className="p-2 rounded-lg" style={{ background: '#EF444418' }}>
              <div style={{ color: '#EF4444' }}><AlertTriangle className="w-4 h-4" aria-hidden="true" /></div>
            </div>
          </div>
          <div className="px-5 pb-4">
            <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{itensEstoqueBaixo}</div>
            <p className="text-xs font-semibold mt-1" style={{ color: '#92400E' }}>
              <span aria-hidden="true">⚠</span> {itensEstoqueBaixo === 1 ? 'item abaixo do mínimo' : 'itens abaixo do mínimo'}
            </p>
            {itensCriticosAbaixoDoMinimoTodos.length > 0 && (
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#B91C1C' }}>
                <span aria-hidden="true">🔴</span> {itensCriticosAbaixoDoMinimoTodos.length} {itensCriticosAbaixoDoMinimoTodos.length === 1 ? 'crítico precisa' : 'críticos precisam'} de reposição
              </p>
            )}
          </div>
        </button>
        <KpiCard
          label="Alta Criticidade"
          value={itensAltaCriticidade}
          sub="produtos críticos"
          accent="#8B5CF6"
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* Alerta de risco operacional — item crítico sem estoque seguro */}
      {itensCriticosAbaixoDoMinimoTodos.length > 0 && (
        <div className="mb-8 rounded-xl border-2 px-5 py-4 flex items-start gap-3" style={{ borderColor: 'rgba(220,38,38,0.35)', background: 'rgba(220,38,38,0.06)' }}>
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" style={{ color: '#B91C1C' }} aria-hidden="true" />
          <div>
            <p className="font-bold text-sm" style={{ color: '#B91C1C' }}>
              <span aria-hidden="true">🔴</span> Item Crítico sem Estoque Seguro
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#B91C1C' }}>
              {itensCriticosAbaixoDoMinimoTodos.length} {itensCriticosAbaixoDoMinimoTodos.length === 1 ? 'produto de criticidade Alta está' : 'produtos de criticidade Alta estão'} abaixo do estoque mínimo — <span aria-hidden="true">⚠</span> risco de compra emergencial.{' '}
              <button type="button" onClick={() => setDetalheEstoqueOpen(true)} className="underline font-semibold">Ver detalhes</button>
            </p>
          </div>
        </div>
      )}

      {/* Reposições recomendadas */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-8">
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Reposições Recomendadas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Produtos com quantidade atual abaixo do estoque mínimo cadastrado</p>
          </div>
          <div className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <Package className="w-4 h-4" style={{ color: '#EF4444' }} aria-hidden="true" />
          </div>
        </div>
        <div className="p-6">
          {itensAbaixoDoMinimoTodos.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" aria-hidden="true" />
              <p className="text-muted-foreground text-sm">Nenhuma reposição necessária no momento</p>
            </div>
          ) : (
            <div className="space-y-2">
              {itensAbaixoDoMinimoTodos.slice(0, 6).map(p => {
                const minimo = getEstoqueMinimo(p);
                const necessidade = minimo - p.quantidade;
                const critico = p.criticidade === 'Alta';
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border flex-wrap" style={{
                    background: critico ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)',
                    borderColor: critico ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                  }}>
                    <div className="flex items-center gap-2 min-w-0">
                      {p.codigoProduto && (
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">{p.codigoProduto}</span>
                      )}
                      <span className="text-sm font-medium text-foreground truncate">{p.nome}</span>
                      {critico && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0" style={{ color: '#B91C1C', background: 'rgba(220,38,38,0.1)' }}>
                          <span aria-hidden="true">🔴</span> Crítico
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs shrink-0">
                      <span className="text-muted-foreground">Atual: <strong className="text-foreground">{p.quantidade}</strong></span>
                      <span className="text-muted-foreground">Mínimo: <strong className="text-foreground">{minimo}</strong></span>
                      <span className="font-bold" style={{ color: '#B91C1C' }}>Necessidade: +{necessidade}</span>
                    </div>
                  </div>
                );
              })}
              {itensAbaixoDoMinimoTodos.length > 6 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{itensAbaixoDoMinimoTodos.length - 6} {itensAbaixoDoMinimoTodos.length - 6 === 1 ? 'outro item' : 'outros itens'} —{' '}
                  <button type="button" onClick={() => setDetalheEstoqueOpen(true)} className="underline font-semibold">ver todos</button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico: itens por situação de estoque */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-8">
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Itens por Situação de Estoque</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Comparado ao estoque mínimo cadastrado de cada produto</p>
        </div>
        <div className="p-6">
          {totalSituacao > 0 && (
            <div
              className="w-full h-3 rounded-full overflow-hidden flex mb-5"
              role="img"
              aria-label={`${situacaoBuckets.normal} normais, ${situacaoBuckets.atencao} em atenção, ${situacaoBuckets.abaixo} abaixo do mínimo`}
            >
              <div style={{ width: `${(situacaoBuckets.normal / totalSituacao) * 100}%`, background: '#22C55E' }} />
              <div style={{ width: `${(situacaoBuckets.atencao / totalSituacao) * 100}%`, background: '#EAB308' }} />
              <div style={{ width: `${(situacaoBuckets.abaixo / totalSituacao) * 100}%`, background: '#EF4444' }} />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1"><span aria-hidden="true">🟢</span> Normal</p>
              <p className="text-2xl font-bold" style={{ color: '#166534' }}>{situacaoBuckets.normal}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1"><span aria-hidden="true">🟡</span> Atenção</p>
              <p className="text-2xl font-bold" style={{ color: '#92400E' }}>{situacaoBuckets.atencao}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1"><span aria-hidden="true">🔴</span> Abaixo do mínimo</p>
              <p className="text-2xl font-bold" style={{ color: '#B91C1C' }}>{situacaoBuckets.abaixo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compras Emergenciais Evitadas — KPI baseado no estado atual, sem historico inventado */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-8">
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Compras Emergenciais Evitadas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Com base no estoque atual — sem contador acumulado ou histórico inventado</p>
          </div>
          <div className="p-2 rounded-lg" style={{ background: 'rgba(26,86,219,0.1)' }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: '#1A56DB' }} aria-hidden="true" />
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg border" style={{ background: 'rgba(217,119,6,0.05)', borderColor: 'rgba(217,119,6,0.2)' }}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#92400E' }} aria-hidden="true" />
            <div>
              <p className="text-sm font-bold" style={{ color: '#92400E' }}>
                {itensRiscoAntecipado.length} {itensRiscoAntecipado.length === 1 ? 'item identificado' : 'itens identificados'} em risco antes da falta
                {itensCriticosRiscoAntecipado.length > 0 && ` — ${itensCriticosRiscoAntecipado.length} ${itensCriticosRiscoAntecipado.length === 1 ? 'é crítico' : 'são críticos'}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quantidade atual abaixo do mínimo cadastrado, mas ainda maior que zero — o sistema sinalizou a tempo de repor antes de faltar.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg border" style={{
            background: itensRupturaTotal.length > 0 ? 'rgba(220,38,38,0.05)' : 'rgba(34,197,94,0.05)',
            borderColor: itensRupturaTotal.length > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(34,197,94,0.2)',
          }}>
            {itensRupturaTotal.length > 0 ? (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#B91C1C' }} aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#166534' }} aria-hidden="true" />
            )}
            <div>
              <p className="text-sm font-bold" style={{ color: itensRupturaTotal.length > 0 ? '#B91C1C' : '#166534' }}>
                {itensRupturaTotal.length} {itensRupturaTotal.length === 1 ? 'item já em ruptura' : 'itens já em ruptura'} (quantidade zerada)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {itensRupturaTotal.length > 0
                  ? 'Esses já chegaram a faltar — não contam como prevenção, precisam de reposição imediata.'
                  : 'Nenhum item chegou a zerar o estoque no momento.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority panel */}
      <div className="mb-8">
        <div className="rounded-xl border-2 overflow-hidden" style={{
          borderColor: totalPrioridades > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
        }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{
            background: totalPrioridades > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
          }}>
            <div className="flex items-center gap-3">
              {totalPrioridades > 0
                ? <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                : <CheckCircle2 className="w-5 h-5 text-green-500" aria-hidden="true" />}
              <div>
                <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Painel de Prioridades</h2>
                <p className="text-xs text-muted-foreground">Itens que exigem atenção imediata</p>
              </div>
            </div>
            {totalPrioridades > 0 && (
              <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: '#DC2626' }}>
                {totalPrioridades} alerta{totalPrioridades > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {totalPrioridades === 0 ? (
            <div className="px-6 py-10 text-center bg-card">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-semibold">Tudo sob controle!</p>
              <p className="text-xs text-muted-foreground mt-1">Nenhum alerta crítico no momento</p>
            </div>
          ) : (
            <div className="bg-card divide-y divide-border">
              {itensCriticosEstoqueBaixo.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5 text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />
                    Estoque Crítico Baixo
                  </p>
                  <div className="space-y-2">
                    {itensCriticosEstoqueBaixo.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)' }}>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-medium text-foreground">{p.nome}</span>
                          {p.codigoProduto && (
                            <span className="font-mono text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{p.codigoProduto}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <SemaforoIndicator status="red" contexto="estoque" />
                          <span className="text-sm font-bold text-red-600">{p.quantidade} un.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {itensAtrasados.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5 text-red-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse" />
                    Manutenções Atrasadas (+14 dias)
                  </p>
                  <div className="space-y-2">
                    {itensAtrasados.map(item => {
                      const dias = Math.floor((new Date().getTime() - new Date(item.dataEnvio).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)' }}>
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium text-foreground">{item.produtoNome}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                              item.criticidadeABC === 'A' ? 'bg-red-100 text-red-700' :
                              item.criticidadeABC === 'B' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {item.criticidadeABC} · {labelCriticidadeABC[item.criticidadeABC]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <SemaforoIndicator status="red" />
                            <span className="text-sm font-bold text-red-600">{dias} dias</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {itensComInercia.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5 text-amber-700">
                    <span className="w-2 h-2 bg-amber-500 rounded-full inline-block" />
                    Sem Atualização +48h
                  </p>
                  <div className="space-y-2">
                    {itensComInercia.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-medium text-foreground">{item.produtoNome}</span>
                        </div>
                        <SemaforoIndicator status="yellow" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Indicadores row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* MTTR */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-2 flex items-center justify-between border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>MTTR — Tempo Médio de Reparo</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Mean Time To Repair · Média entre Envio e Retorno</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="px-6 py-5">
            {mttr.totalItens > 0 ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-bold" style={{ color: '#1A56DB', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{mttr.dias}</div>
                  <div className="text-xl font-semibold text-muted-foreground">dias</div>
                  {mttr.horas > 0 && (
                    <>
                      <div className="text-2xl font-bold ml-2" style={{ color: '#1A56DB' }}>{mttr.horas}</div>
                      <div className="text-lg font-semibold text-muted-foreground">h</div>
                    </>
                  )}
                  <div className="ml-auto">
                    <SemaforoIndicator status={mttr.dias > 14 ? 'red' : mttr.dias > 7 ? 'yellow' : 'green'} />
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Baseado em <span className="font-semibold text-foreground">{mttr.totalItens}</span> {mttr.totalItens === 1 ? 'reparo concluído' : 'reparos concluídos'}
                  </p>
                </div>
                {mttr.dias > 7 && (
                  <div className="p-3 rounded-lg border" style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.25)' }}>
                    <p className="text-xs text-amber-700">⚠️ MTTR acima de 7 dias — considere revisar o processo</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum reparo concluído ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottleneck ranking */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-2 flex items-center justify-between border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ranking de Gargalos</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Categorias com maior demanda de manutenção</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <BarChart3 className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div className="px-6 py-5">
            {volumeCategoria.length > 0 ? (
              <div className="space-y-4">
                {volumeCategoria.slice(0, 5).map((item, idx) => {
                  const percentage = (item.quantidade / maxVolume) * 100;
                  const semaforoStatus = item.atrasados > 2 ? 'red' : item.atrasados > 0 ? 'yellow' : 'green';
                  return (
                    <div key={item.categoria} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.categoria}</span>
                          {item.atrasados > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-700">
                              {item.atrasados} atrasado{item.atrasados > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <SemaforoIndicator status={semaforoStatus} />
                          <span className="font-semibold text-foreground">{item.quantidade}</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percentage}%`, background: barColors[idx % barColors.length] }}
                        />
                      </div>
                      {item.tempoMedio !== null && (
                        <p className="text-xs text-muted-foreground">Tempo médio de reparo: {item.tempoMedio} dias</p>
                      )}
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">Total de manutenções: {itensManutencao.length}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma manutenção registrada</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active maintenance semaphore grid */}
      {itensManutencao.filter(i => i.status !== 'Retorno').length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-6">
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Status das Manutenções Ativas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Semáforo de prazo: Verde ≤7 dias · Amarelo 8-14 dias · Vermelho +14 dias</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {itensManutencao
                .filter(i => i.status !== 'Retorno')
                .sort((a, b) => ({ A: 3, B: 2, C: 1 }[b.criticidadeABC] - { A: 3, B: 2, C: 1 }[a.criticidadeABC]))
                .slice(0, 9)
                .map(item => {
                  const dias = Math.floor((new Date().getTime() - new Date(item.dataEnvio).getTime()) / (1000 * 60 * 60 * 24));
                  const s = getSemaforoManutencao(item);
                  const borderColors = { red: '#EF4444', yellow: '#EAB308', green: '#22C55E' };
                  const bgColors = { red: 'rgba(239,68,68,0.05)', yellow: 'rgba(234,179,8,0.05)', green: 'rgba(34,197,94,0.05)' };
                  return (
                    <div key={item.id} className="p-3 rounded-lg border" style={{ background: bgColors[s], borderColor: `${borderColors[s]}40` }}>
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground truncate flex-1">{item.produtoNome}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ml-2 whitespace-nowrap ${
                          item.criticidadeABC === 'A' ? 'bg-red-100 text-red-800' :
                          item.criticidadeABC === 'B' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.criticidadeABC} · {labelCriticidadeABC[item.criticidadeABC]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{item.status} · {dias} dias</span>
                        <SemaforoIndicator status={s} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Last movements */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Últimas Movimentações</h3>
        </div>
        <div className="divide-y divide-border">
          {ultimasMovimentacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">Nenhuma movimentação registrada</p>
          ) : ultimasMovimentacoes.map((mov) => (
            <div key={mov.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${mov.tipo === 'Entrada' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {mov.tipo === 'Entrada'
                    ? <ArrowDownRight className="w-4 h-4 text-green-600" />
                    : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {produtos.find(p => p.id === mov.produtoId)?.codigoProduto && (
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {produtos.find(p => p.id === mov.produtoId)?.codigoProduto}
                      </span>
                    )}
                    <p className="font-medium text-foreground text-sm">{mov.produtoNome}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{mov.tipo} · {mov.quantidade} unidade(s)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{formatarData(mov.data)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalhe: Estoque Abaixo do Mínimo */}
      <Dialog open={detalheEstoqueOpen} onOpenChange={setDetalheEstoqueOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estoque Abaixo do Mínimo</DialogTitle>
            <DialogDescription>Produtos com quantidade atual abaixo do estoque mínimo individual cadastrado na Área Administrativa</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {itensAbaixoDoMinimoTodos.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" aria-hidden="true" />
                <p className="text-muted-foreground text-sm">Nenhum item abaixo do mínimo no momento</p>
              </div>
            ) : itensAbaixoDoMinimoTodos.map(p => {
              const minimo = getEstoqueMinimo(p);
              const necessidade = minimo - p.quantidade;
              const critico = p.criticidade === 'Alta';
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border flex-wrap" style={{
                  background: critico ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)',
                  borderColor: critico ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                }}>
                  <div className="flex items-center gap-2 min-w-0">
                    {p.codigoProduto && (
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">{p.codigoProduto}</span>
                    )}
                    <span className="text-sm font-medium text-foreground truncate">{p.nome}</span>
                    {critico && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0" style={{ color: '#B91C1C', background: 'rgba(220,38,38,0.1)' }}>
                        <span aria-hidden="true">🔴</span> Crítico
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-muted-foreground">Atual: <strong className="text-foreground">{p.quantidade}</strong></span>
                    <span className="text-muted-foreground">Mínimo: <strong className="text-foreground">{minimo}</strong></span>
                    <span className="font-bold" style={{ color: '#B91C1C' }}>Necessidade: +{necessidade}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
