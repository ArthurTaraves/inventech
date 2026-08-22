import { useState } from 'react';
import { Settings, CheckCircle, AlertCircle, Clock, User, Calendar, Wrench, Search, Lock, Eye, EyeOff } from 'lucide-react';
import { type StatusManutencao, type ItemManutencao, type CriticidadeABC } from '../data/mockData';
import { useAlmoxarifado } from '../context/AlmoxarifadoContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
} from '../components/ui/dialog';
import { toast } from 'sonner';

const KANBAN_COLUMNS: {
  status: StatusManutencao;
  label: string;
  emoji: string;
  headerBg: string;
  headerText: string;
  accent: string;
  cardBorderActive: string;
}[] = [
  {
    status: 'Envio',
    label: 'Enviado',
    emoji: '📦',
    headerBg: 'rgba(26,86,219,0.12)',
    headerText: '#1A56DB',
    accent: '#1A56DB',
    cardBorderActive: 'rgba(26,86,219,0.4)',
  },
  {
    status: 'Peritagem',
    label: 'Em Peritagem',
    emoji: '🔍',
    headerBg: 'rgba(245,158,11,0.12)',
    headerText: '#92400E',
    accent: '#D97706',
    cardBorderActive: 'rgba(245,158,11,0.4)',
  },
  {
    status: 'Aprovação',
    label: 'Ag. Aprovação',
    emoji: '✅',
    headerBg: 'rgba(139,92,246,0.12)',
    headerText: '#7C3AED',
    accent: '#7C3AED',
    cardBorderActive: 'rgba(139,92,246,0.4)',
  },
  {
    status: 'Execução',
    label: 'Em Manutenção',
    emoji: '🔧',
    headerBg: 'rgba(249,115,22,0.12)',
    headerText: '#9A3412',
    accent: '#EA580C',
    cardBorderActive: 'rgba(249,115,22,0.4)',
  },
  {
    status: 'Retorno',
    label: 'Concluído',
    emoji: '🚚',
    headerBg: 'rgba(34,197,94,0.12)',
    headerText: '#15803D',
    accent: '#22C55E',
    cardBorderActive: 'rgba(34,197,94,0.4)',
  },
];

export function ManutencaoTecnica() {
  const { produtos, setProdutos, itensManutencao: itensData, setItensManutencao: setItensData } = useAlmoxarifado();

  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemSelecionado, setItemSelecionado] = useState<ItemManutencao | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);

  const handleLogin = () => {
    if (usuario === 'Admin' && senha === 'Admin') {
      setAutenticado(true);
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error('Usuário ou senha incorretos!');
    }
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
    if (c === 'A') return { background: 'rgba(239,68,68,0.12)', color: '#DC2626', border: '2px solid rgba(239,68,68,0.4)' };
    if (c === 'B') return { background: 'rgba(245,158,11,0.12)', color: '#92400E', border: '2px solid rgba(245,158,11,0.4)' };
    return { background: 'rgba(34,197,94,0.12)', color: '#15803D', border: '2px solid rgba(34,197,94,0.4)' };
  };

  const getCriticidadeLabel = (c: CriticidadeABC) => ({ A: 'Crítico', B: 'Médio', C: 'Baixo' }[c]);

  const getDaysElapsed = (dataEnvio: string) =>
    Math.floor((new Date().getTime() - new Date(dataEnvio).getTime()) / (1000 * 60 * 60 * 24));

  const verificarInercia = (item: ItemManutencao): boolean => {
    if (item.status === 'Retorno') return false;
    const ua = item.ultimaAtualizacao || item.timestampEnvio;
    if (!ua) return false;
    return (new Date().getTime() - new Date(ua).getTime()) / (1000 * 60 * 60) > 48;
  };

  const isAtrasado = (item: ItemManutencao) => {
    if (item.status === 'Retorno') return false;
    return getDaysElapsed(item.dataEnvio) > 14;
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

  const handleAtualizarStatus = (itemId: string, novoStatus: StatusManutencao) => {
    const item = itensData.find(i => i.id === itemId);
    if (!item) return;

    if (novoStatus === 'Retorno' && item.status !== 'Retorno') {
      const produto = produtos.find(p => p.id === item.produtoId);
      if (produto && item.quantidadeEnviada) {
        setProdutos(produtos.map(p =>
          p.id === item.produtoId ? { ...p, quantidade: p.quantidade + (item.quantidadeEnviada || 0) } : p
        ));
        toast.success(`${item.produtoNome} retornou! ${item.quantidadeEnviada} unidade(s) devolvida(s) ao estoque.`);
      }
    }

    const now = new Date().toISOString();
    setItensData(itensData.map(i => {
      if (i.id !== itemId) return i;
      const u = { ...i, status: novoStatus, ultimaAtualizacao: now };
      if (novoStatus === 'Envio' && !i.timestampEnvio) u.timestampEnvio = now;
      else if (novoStatus === 'Peritagem' && !i.timestampPeritagem) u.timestampPeritagem = now;
      else if (novoStatus === 'Aprovação' && !i.timestampAprovacao) u.timestampAprovacao = now;
      else if (novoStatus === 'Execução' && !i.timestampExecucao) u.timestampExecucao = now;
      else if (novoStatus === 'Retorno') {
        u.timestampRetorno = now;
        if (!i.dataRetorno) u.dataRetorno = new Date().toISOString().split('T')[0];
      }
      return u;
    }));

    const mensagens: Partial<Record<StatusManutencao, string>> = {
      Envio: 'Item marcado como enviado',
      Peritagem: 'Peritagem iniciada',
      'Aprovação': 'Aprovado para manutenção',
      'Execução': 'Reparo em andamento',
    };
    if (novoStatus !== 'Retorno') toast.success(mensagens[novoStatus] || 'Status atualizado');

    setIsDetalhesOpen(false);
    setItemSelecionado(null);
  };

  const formatarData = (data: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(data));

  // Dark industrial login screen
  if (!autenticado) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #060F1A 0%, #0B1826 45%, #0D2244 100%)' }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

        {/* Login card */}
        <div
          className="relative w-full max-w-md rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-2xl font-bold text-white mt-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.04em' }}>
              InvenTech
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(184,200,217,0.7)' }}>Manutenção Visual</p>
          </div>

          <div className="mb-2 text-center">
            <p className="text-sm font-medium" style={{ color: 'rgba(184,200,217,0.9)' }}>Acesso Restrito</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(184,200,217,0.5)' }}>Informe suas credenciais para continuar</p>
          </div>

          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <label htmlFor="mt-usuario" className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(184,200,217,0.6)' }}>Usuário</label>
              <input
                id="mt-usuario"
                type="text"
                autoFocus
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Digite seu usuário"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(37,99,235,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mt-senha" className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(184,200,217,0.6)' }}>Senha</label>
              <div className="relative">
                <input
                  id="mt-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Digite sua senha"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                  onFocus={e => { e.currentTarget.style.border = '1px solid rgba(37,99,235,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all mt-2"
              style={{
                background: 'linear-gradient(135deg, #1A56DB 0%, #2563EB 100%)',
                boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Lock className="w-4 h-4 inline-block mr-2 -mt-0.5" />
              Entrar no Sistema
            </button>
          </div>

          <div className="mt-6 p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs" style={{ color: 'rgba(184,200,217,0.45)' }}>Credenciais: <span style={{ color: 'rgba(184,200,217,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>Admin / Admin</span></p>
          </div>
        </div>
      </div>
    );
  }

  const itensFiltrados = itensData
    .filter(item =>
      item.produtoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.responsavel && item.responsavel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.numeroSerie && item.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => ({ A: 3, B: 2, C: 1 }[b.criticidadeABC] - { A: 3, B: 2, C: 1 }[a.criticidadeABC]));

  const itensPendentes = itensFiltrados.filter(i => i.status === 'Envio' || i.status === 'Peritagem');
  const itensEmAndamento = itensFiltrados.filter(i => i.status === 'Aprovação' || i.status === 'Execução');
  const itensConcluidos = itensFiltrados.filter(i => i.status === 'Retorno');
  const itensAtrasadosCount = itensFiltrados.filter(isAtrasado).length;

  const kpiCards = [
    { label: 'Pendentes', value: itensPendentes.length, accent: '#1A56DB', icon: <AlertCircle className="w-4 h-4" /> },
    { label: 'Em Andamento', value: itensEmAndamento.length, accent: '#EA580C', icon: <Wrench className="w-4 h-4" /> },
    { label: 'Concluídos', value: itensConcluidos.length, accent: '#22C55E', icon: <CheckCircle className="w-4 h-4" /> },
    { label: 'Atrasados', value: itensAtrasadosCount, accent: itensAtrasadosCount > 0 ? '#EF4444' : '#94A3B8', icon: <AlertCircle className="w-4 h-4" /> },
  ];

  const renderKanbanCard = (item: ItemManutencao) => {
    const produto = produtos.find(p => p.id === item.produtoId);
    const dias = getDaysElapsed(item.dataEnvio);
    const temInercia = verificarInercia(item);
    const atrasado = isAtrasado(item);
    const critStyle = getCriticidadeStyle(item.criticidadeABC);
    const semaforoColor = atrasado ? '#EF4444' : dias > 7 ? '#EAB308' : '#22C55E';

    const semaforoLabel = item.status === 'Retorno' ? null : atrasado ? 'Atrasado' : dias > 7 ? 'Atenção' : 'No prazo';

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => { setItemSelecionado(item); setIsDetalhesOpen(true); }}
        aria-label={`${item.produtoNome} — ${getCriticidadeLabel(item.criticidadeABC)}${semaforoLabel ? ` — ${semaforoLabel}` : ''} — abrir ordem de serviço`}
        className="w-full text-left p-3 bg-card rounded-xl cursor-pointer transition-all hover:shadow-md"
        style={{
          border: `1.5px solid ${temInercia ? '#EF4444' : atrasado ? 'rgba(239,68,68,0.35)' : 'rgba(11,24,38,0.1)'}`,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
              {temInercia && <span className="text-red-500 animate-pulse text-sm" aria-hidden="true">⚠️</span>}
              {produto?.codigoProduto && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 4, padding: '1px 5px' }}>
                  {produto.codigoProduto}
                </span>
              )}
            </div>
            <p className="font-semibold text-foreground text-sm leading-tight truncate">{item.produtoNome}</p>
            {item.numeroSerie && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#7C3AED', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 4, padding: '1px 5px', display: 'inline-block', marginTop: 2 }}>
                #{item.numeroSerie}
              </span>
            )}
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 whitespace-nowrap" style={critStyle}>
            {item.criticidadeABC} · {getCriticidadeLabel(item.criticidadeABC)}
          </span>
        </div>

        <div className="space-y-1">
          {item.responsavel && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" aria-hidden="true" />{item.responsavel}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />{formatarData(item.dataEnvio)}
            </p>
            {item.status !== 'Retorno' && (
              <span className="text-xs font-bold flex items-center gap-1" style={{ color: atrasado ? '#DC2626' : dias > 7 ? '#92400E' : '#15803D' }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: semaforoColor }} aria-hidden="true" />
                {dias}d · {semaforoLabel}
              </span>
            )}
          </div>
        </div>

        {temInercia && (
          <div className="mt-2 text-xs rounded-lg px-2 py-1" style={{ color: '#DC2626', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span aria-hidden="true">⚠️</span> +48h sem atualização
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Manutenção Visual</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kanban de ordens de serviço · Ordenado por Criticidade ABC</p>
        </div>
        <Button
          onClick={() => { setAutenticado(false); setUsuario(''); setSenha(''); toast.success('Logout realizado'); }}
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <Lock className="w-4 h-4 mr-2" />Sair
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpiCards.map(card => (
          <div
            key={card.label}
            className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
            style={{ borderLeft: `4px solid ${card.accent}` }}
          >
            <div className="px-4 pt-4 pb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <div style={{ color: card.accent }}>{card.icon}</div>
            </div>
            <div className="px-4 pb-4">
              <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Buscar ordens de serviço" placeholder="Buscar por produto, status ou responsável..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} className="pl-10 rounded-xl" />
        </div>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: `${KANBAN_COLUMNS.length * 280}px` }}>
          {KANBAN_COLUMNS.map(col => {
            const colItems = itensFiltrados.filter(i => i.status === col.status);
            return (
              <div key={col.status} className="flex-1" style={{ minWidth: '260px' }}>
                {/* Column header */}
                <div
                  className="rounded-xl mb-3 px-4 py-3"
                  style={{ background: col.headerBg, border: `1px solid ${col.cardBorderActive}` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{col.emoji}</span>
                      <h3 className="font-bold text-sm" style={{ color: col.headerText }}>{col.label}</h3>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${col.accent}20`, color: col.headerText, border: `1px solid ${col.cardBorderActive}` }}
                    >
                      {colItems.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-[200px]">
                  {colItems.map(renderKanbanCard)}
                  {colItems.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                      <p className="text-xs text-muted-foreground">Nenhum item</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={isDetalhesOpen} onOpenChange={setIsDetalhesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div style={{ background: 'linear-gradient(135deg, #0B1826 0%, #1E3A5F 100%)', margin: '-24px -24px 20px', padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ordem de Serviço</h2>
              <p className="text-blue-300 text-sm mt-0.5">Informações completas e atualização de status</p>
            </div>
            <DialogTitle className="sr-only">Detalhes da Ordem de Serviço</DialogTitle>
            <DialogDescription className="sr-only">Informações e atualização de status</DialogDescription>
          </DialogHeader>

          {itemSelecionado && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border" style={{ background: 'rgba(26,86,219,0.05)', borderColor: 'rgba(26,86,219,0.2)' }}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {produtos.find(p => p.id === itemSelecionado.produtoId)?.codigoProduto && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#1A56DB', background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.25)', borderRadius: 4, padding: '2px 7px' }}>
                      {produtos.find(p => p.id === itemSelecionado.produtoId)?.codigoProduto}
                    </span>
                  )}
                  <h3 className="font-semibold text-foreground">{itemSelecionado.produtoNome}</h3>
                </div>
                {itemSelecionado.numeroSerie && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#7C3AED', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginBottom: 8 }}>
                    #{itemSelecionado.numeroSerie}
                  </span>
                )}
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={getCriticidadeStyle(itemSelecionado.criticidadeABC)}>
                    {itemSelecionado.criticidadeABC} — {getCriticidadeLabel(itemSelecionado.criticidadeABC)}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusColor(itemSelecionado.status)}`}>
                    {itemSelecionado.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Solicitante</p>
                    <p className="font-medium text-foreground text-sm">{itemSelecionado.responsavel || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Envio</p>
                    <p className="font-medium text-foreground text-sm">{formatarData(itemSelecionado.dataEnvio)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tempo Decorrido</p>
                    <p className={`font-medium text-sm ${getDaysElapsed(itemSelecionado.dataEnvio) > 14 ? 'text-red-600' : 'text-foreground'}`}>
                      {getDaysElapsed(itemSelecionado.dataEnvio)} dias
                    </p>
                  </div>
                </div>
                {itemSelecionado.dataRetorno && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.25)' }}>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-green-600">Retornado em</p>
                      <p className="font-medium text-green-800 text-sm">{formatarData(itemSelecionado.dataRetorno)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p className="text-xs font-semibold text-amber-700 mb-2">Tempo em cada etapa:</p>
                <div className="space-y-1">
                  {[
                    { label: 'Envio', start: itemSelecionado.timestampEnvio, end: itemSelecionado.timestampPeritagem, active: itemSelecionado.status === 'Envio' },
                    { label: 'Peritagem', start: itemSelecionado.timestampPeritagem, end: itemSelecionado.timestampAprovacao, active: itemSelecionado.status === 'Peritagem' },
                    { label: 'Aprovação', start: itemSelecionado.timestampAprovacao, end: itemSelecionado.timestampExecucao, active: itemSelecionado.status === 'Aprovação' },
                    { label: 'Execução', start: itemSelecionado.timestampExecucao, end: itemSelecionado.timestampRetorno, active: itemSelecionado.status === 'Execução' },
                  ].filter(e => e.start).map(e => (
                    <div key={e.label} className={`text-xs flex items-center gap-2 ${e.active ? 'font-semibold text-blue-700' : 'text-amber-700'}`}>
                      <Clock className="w-3 h-3" />
                      <span>{e.label}:</span>
                      <span>{calcularTempoEtapa(e.start, e.end) || 'em andamento'}</span>
                      {e.active && <span className="text-blue-500 animate-pulse">●</span>}
                    </div>
                  ))}
                </div>
              </div>

              {itemSelecionado.observacao && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                  <p className="text-xs text-amber-700 font-medium mb-1">Observações</p>
                  <p className="text-sm text-amber-900">{itemSelecionado.observacao}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="mt-status" className="text-sm font-semibold text-foreground">Atualizar Status</label>
                {itemSelecionado.status !== 'Retorno' ? (
                  <Select
                    value={itemSelecionado.status}
                    onValueChange={v => handleAtualizarStatus(itemSelecionado.id, v as StatusManutencao)}
                  >
                    <SelectTrigger id="mt-status" autoFocus><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Envio">📦 Envio</SelectItem>
                      <SelectItem value="Peritagem">🔍 Peritagem</SelectItem>
                      <SelectItem value="Aprovação">✅ Aprovação</SelectItem>
                      <SelectItem value="Execução">🔧 Execução</SelectItem>
                      <SelectItem value="Retorno">🚚 Retorno ao estoque</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 text-green-700 rounded-lg px-4 py-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Processo Concluído</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetalhesOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
