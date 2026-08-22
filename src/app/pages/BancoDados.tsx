import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, AlertCircle, Lock, ChevronDown, ChevronRight, CheckCircle, Package, EyeOff, Eye, Database } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
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
import { bancoDadosStore, type ProdutoCatalogo } from '../data/bancoDadosStore';

const unidadesMedida = ['UN', 'KG', 'M', 'L', 'CX', 'PCT'];

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

const getStatusSerialStyle = (status: string) => {
  if (status === 'Disponível') return { bg: 'rgba(34,197,94,0.1)', color: 'var(--text-green)', border: 'rgba(34,197,94,0.3)', icon: '✅' };
  if (status === 'Em Uso') return { bg: 'rgba(26,86,219,0.1)', color: 'var(--text-blue)', border: 'rgba(26,86,219,0.3)', icon: '🔧' };
  if (status === 'Manutenção') return { bg: 'rgba(249,115,22,0.1)', color: 'var(--text-orange)', border: 'rgba(249,115,22,0.3)', icon: '⚠️' };
  if (status === 'Baixado') return { bg: 'rgba(239,68,68,0.1)', color: 'var(--text-red)', border: 'rgba(239,68,68,0.3)', icon: '🔴' };
  return { bg: 'rgba(100,116,139,0.1)', color: 'var(--muted-foreground)', border: 'rgba(100,116,139,0.3)', icon: '•' };
};

export function BancoDados() {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>(bancoDadosStore.getProdutos());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string | null>(null);
  const [produtoParaDeletar, setProdutoParaDeletar] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [produtosExpandidos, setProdutosExpandidos] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleLogin = () => {
    if (usuario === 'Admin' && senha === 'Admin') {
      setAutenticado(true);
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error('Usuário ou senha incorretos!');
      setSenha('');
    }
  };

  useEffect(() => {
    bancoDadosStore.setProdutos(produtos);
  }, [produtos]);

  const [formulario, setFormulario] = useState({
    codigoProduto: '',
    nome: '',
    categoria: '',
    unidadeMedida: 'UN',
    estoqueMinimo: '',
    estoqueMaximo: '',
  });

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (produto.codigoProduto && produto.codigoProduto.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const validarFormulario = () => {
    const novosErros: Record<string, string> = {};

    if (!formulario.codigoProduto.trim()) {
      novosErros.codigoProduto = 'Código do produto é obrigatório';
    } else if (formulario.codigoProduto.length < 3) {
      novosErros.codigoProduto = 'Código deve ter pelo menos 3 caracteres';
    }

    const codigoExistente = produtos.find(
      p => p.codigoProduto && p.codigoProduto.toLowerCase() === formulario.codigoProduto.trim().toLowerCase() &&
      p.id !== produtoSelecionado
    );
    if (codigoExistente) novosErros.codigoProduto = 'Já existe um produto com este código';

    if (!formulario.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    } else if (formulario.nome.length < 3) {
      novosErros.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formulario.categoria) novosErros.categoria = 'Categoria é obrigatória';

    const estoqueMin = parseInt(formulario.estoqueMinimo);
    const estoqueMax = parseInt(formulario.estoqueMaximo);

    if (!formulario.estoqueMinimo || isNaN(estoqueMin)) {
      novosErros.estoqueMinimo = 'Estoque mínimo é obrigatório';
    } else if (estoqueMin < 0) {
      novosErros.estoqueMinimo = 'Estoque mínimo não pode ser negativo';
    }

    if (!formulario.estoqueMaximo || isNaN(estoqueMax)) {
      novosErros.estoqueMaximo = 'Estoque máximo é obrigatório';
    } else if (estoqueMax < 0) {
      novosErros.estoqueMaximo = 'Estoque máximo não pode ser negativo';
    } else if (estoqueMax <= estoqueMin) {
      novosErros.estoqueMaximo = 'Estoque máximo deve ser maior que o mínimo';
    }

    const produtoExistente = produtos.find(
      p => p.nome.toLowerCase() === formulario.nome.trim().toLowerCase() && p.id !== produtoSelecionado
    );
    if (produtoExistente) novosErros.nome = 'Já existe um produto com este nome';

    setErros(novosErros);
    return novosErros;
  };

  const resetFormulario = () => {
    setFormulario({ codigoProduto: '', nome: '', categoria: '', unidadeMedida: 'UN', estoqueMinimo: '', estoqueMaximo: '' });
    setErros({});
    setIsEditMode(false);
    setProdutoSelecionado(null);
  };

  const abrirDialogNovo = () => {
    resetFormulario();
    setIsDialogOpen(true);
  };

  const abrirDialogEditar = (produto: ProdutoCatalogo) => {
    setFormulario({
      codigoProduto: produto.codigoProduto || '',
      nome: produto.nome,
      categoria: produto.categoria,
      unidadeMedida: produto.unidadeMedida,
      estoqueMinimo: String(produto.estoqueMinimo),
      estoqueMaximo: String(produto.estoqueMaximo),
    });
    setProdutoSelecionado(produto.id);
    setIsEditMode(true);
    setErros({});
    setIsDialogOpen(true);
  };

  const CAMPO_LABEL: Record<string, string> = {
    codigoProduto: 'Código do Produto',
    nome: 'Nome do Produto',
    categoria: 'Categoria',
    estoqueMinimo: 'Estoque Mínimo',
    estoqueMaximo: 'Estoque Máximo',
  };

  const handleSalvar = () => {
    const novosErros = validarFormulario();
    if (Object.keys(novosErros).length > 0) {
      const camposComErro = Object.keys(novosErros).map(k => CAMPO_LABEL[k] || k);
      toast.error(`Corrija o(s) campo(s): ${camposComErro.join(', ')}.`);
      return;
    }

    const novoProduto: ProdutoCatalogo = {
      id: isEditMode ? produtoSelecionado! : String(Date.now()),
      codigoProduto: formulario.codigoProduto.trim().toUpperCase(),
      nome: formulario.nome.trim(),
      categoria: formulario.categoria,
      unidadeMedida: formulario.unidadeMedida,
      estoqueMinimo: parseInt(formulario.estoqueMinimo),
      estoqueMaximo: parseInt(formulario.estoqueMaximo),
      ativo: true,
    };

    if (isEditMode) {
      setProdutos(produtos.map(p => p.id === produtoSelecionado ? novoProduto : p));
      toast.success('Produto atualizado com sucesso!');
    } else {
      setProdutos([...produtos, novoProduto]);
      toast.success('Produto cadastrado com sucesso!');
    }

    setIsDialogOpen(false);
    resetFormulario();
  };

  const handleToggleAtivo = (id: string) => {
    setProdutos(produtos.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p));
    const produto = produtos.find(p => p.id === id);
    if (produto) {
      toast.success(`Produto ${produto.ativo ? 'desativado' : 'ativado'} com sucesso!`);
    }
  };

  const handleDeletar = () => {
    if (!produtoParaDeletar) return;
    setProdutos(produtos.filter(p => p.id !== produtoParaDeletar));
    toast.success('Produto removido do catálogo');
    setProdutoParaDeletar(null);
  };

  const toggleProdutoExpandido = (codigoProduto: string) => {
    const novoSet = new Set(produtosExpandidos);
    if (novoSet.has(codigoProduto)) {
      novoSet.delete(codigoProduto);
    } else {
      novoSet.add(codigoProduto);
    }
    setProdutosExpandidos(novoSet);
  };

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
        <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />

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
            <p className="text-sm mt-1" style={{ color: 'rgba(184,200,217,0.7)' }}>Área Administrativa</p>
          </div>

          <div className="mb-2 text-center">
            <p className="text-sm font-medium" style={{ color: 'rgba(184,200,217,0.9)' }}>Acesso Restrito</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(184,200,217,0.5)' }}>Apenas administradores podem acessar esta área</p>
          </div>

          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <label htmlFor="bd-usuario" className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(184,200,217,0.6)' }}>Usuário</label>
              <input
                id="bd-usuario"
                type="text"
                autoFocus
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                placeholder="Digite seu usuário"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(37,99,235,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="bd-senha" className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(184,200,217,0.6)' }}>Senha</label>
              <div className="relative">
                <input
                  id="bd-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                  placeholder="Digite sua senha"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
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

            <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(26,86,219,0.12)', border: '1px solid rgba(26,86,219,0.2)' }}>
              <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#60A5FA' }} />
              <div className="text-xs" style={{ color: 'rgba(147,197,253,0.85)' }}>
                <p className="font-semibold mb-0.5">Área Restrita</p>
                <p>Apenas administradores podem acessar o Banco de Dados. Entre em contato com o suporte se precisar de acesso.</p>
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all"
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

          <div className="mt-5 p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs" style={{ color: 'rgba(184,200,217,0.45)' }}>Credenciais: <span style={{ color: 'rgba(184,200,217,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>Admin / Admin</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Banco de Dados de Produtos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Catálogo mestre de produtos válidos do almoxarifado</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={abrirDialogNovo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #1A56DB, #2563EB)', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,86,219,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,86,219,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
            <button
              onClick={() => { setAutenticado(false); setUsuario(''); setSenha(''); toast.success('Sessão encerrada com sucesso'); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              style={{ color: 'var(--text-red)', background: 'var(--card)' }}
            >
              <Lock className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(26,86,219,0.05)', border: '1px solid rgba(26,86,219,0.15)' }}>
          <Database className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--text-blue)' }} />
          <div className="text-sm" style={{ color: 'var(--text-blue)' }}>
            <p className="font-semibold mb-0.5">Catálogo de Produtos Válidos</p>
            <p>Este é o banco de dados mestre que define quais produtos podem ser adicionados ao estoque. Apenas produtos cadastrados aqui podem ser usados no sistema, garantindo a integridade dos dados.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="text"
            aria-label="Buscar produto no catálogo"
            placeholder="Buscar produto ou categoria..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th scope="col" style={thStyle}>Status</th>
                <th scope="col" style={thStyle}>Código ID</th>
                <th scope="col" style={thStyle}>Nome do Produto</th>
                <th scope="col" style={thStyle}>Categoria</th>
                <th scope="col" style={thStyle}>Unidade</th>
                <th scope="col" style={thStyle}>Estoque Mín/Máx</th>
                <th scope="col" style={thStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((produto, rowIdx) => {
                const produtosSerializados = bancoDadosStore.getProdutosSerializadosPorCodigo(produto.codigoProduto);
                const isExpandido = produtosExpandidos.has(produto.codigoProduto);
                const totalUnidades = produtosSerializados.length;
                const isHovered = hoveredRow === produto.id;
                const rowBg = isHovered ? 'rgba(26,86,219,0.03)' : rowIdx % 2 === 0 ? 'var(--card)' : 'var(--surface-alt)';

                return (
                  <>
                    <tr
                      key={produto.id}
                      onMouseEnter={() => setHoveredRow(produto.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        background: rowBg,
                        opacity: produto.ativo ? 1 : 0.55,
                        transition: 'background 0.15s',
                        borderBottom: '1px solid rgba(11,24,38,0.06)',
                      }}
                    >
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 9999,
                          padding: '2px 10px',
                          background: produto.ativo ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                          color: produto.ativo ? 'var(--text-green)' : 'var(--muted-foreground)',
                          border: `1px solid ${produto.ativo ? 'rgba(34,197,94,0.25)' : 'rgba(100,116,139,0.2)'}`,
                        }}>
                          <span aria-hidden="true">{produto.ativo ? '✅' : '⏸'}</span>
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => toggleProdutoExpandido(produto.codigoProduto)}
                          aria-expanded={isExpandido}
                          aria-label={`${isExpandido ? 'Recolher' : 'Expandir'} unidades serializadas de ${produto.nome}`}
                          className="flex items-center gap-2 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          {isExpandido
                            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: 'var(--text-blue)', background: 'rgba(26,86,219,0.08)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                            {produto.codigoProduto}
                          </span>
                          {totalUnidades > 0 && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {totalUnidades} un.
                            </span>
                          )}
                        </button>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div className="font-semibold text-foreground text-sm">{produto.nome}</div>
                      </td>
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{produto.categoria}</span>
                      </td>
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <span className="text-sm font-medium text-foreground">{produto.unidadeMedida}</span>
                      </td>
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <span className="text-sm text-foreground">{produto.estoqueMinimo} <span className="text-muted-foreground">/</span> {produto.estoqueMaximo}</span>
                      </td>
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => abrirDialogEditar(produto)}
                            aria-label={`Editar ${produto.nome}`}
                            className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Editar">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAtivo(produto.id)}
                            aria-label={`${produto.ativo ? 'Desativar' : 'Ativar'} ${produto.nome}`}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${produto.ativo ? 'hover:bg-orange-50 dark:hover:bg-orange-500/10' : 'hover:bg-green-50 dark:hover:bg-green-500/10'}`}
                            style={{ color: produto.ativo ? 'var(--text-orange)' : 'var(--text-green)' }}
                          >
                            {produto.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button onClick={() => setProdutoParaDeletar(produto.id)}
                            aria-label={`Excluir ${produto.nome} do catálogo`}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpandido && totalUnidades > 0 && (
                      <tr key={`${produto.id}-expanded`}>
                        <td colSpan={7} style={{ padding: 0, background: 'var(--surface-alt)', borderBottom: '1px solid rgba(11,24,38,0.06)' }}>
                          <div className="px-10 py-5" style={{ borderLeft: '3px solid rgba(26,86,219,0.3)', marginLeft: 20 }}>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                              Unidades Serializadas — {produto.codigoProduto}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {produtosSerializados.map((produtoSer) => {
                                const statusStyle = getStatusSerialStyle(produtoSer.status);
                                return (
                                  <div
                                    key={produtoSer.id}
                                    className="bg-card rounded-xl p-3 transition-all hover:shadow-sm"
                                    style={{ border: '1px solid rgba(11,24,38,0.1)' }}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: 'var(--text-violet)', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                                        #{produtoSer.numeroSerie}
                                      </span>
                                      <span style={{ fontSize: 10, fontWeight: 600, color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, borderRadius: 9999, padding: '2px 8px' }}>
                                        <span aria-hidden="true">{statusStyle.icon}</span> {produtoSer.status}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1 mt-2">
                                      <div className="flex items-center justify-between">
                                        <span>Localização:</span>
                                        <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded">{produtoSer.localizacao}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span>Aquisição:</span>
                                        <span className="font-medium text-foreground">
                                          {new Intl.DateTimeFormat('pt-BR').format(new Date(produtoSer.dataAquisicao))}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetFormulario();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div style={{ background: 'linear-gradient(135deg, #0B1826 0%, #1E3A5F 100%)', margin: '-24px -24px 20px', padding: '20px 24px', borderRadius: '12px 12px 0 0' }}>
              <div className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5" />
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {isEditMode ? 'Editar Produto' : 'Novo Produto no Catálogo'}
                </h2>
              </div>
              <p className="text-blue-300 text-sm mt-0.5">
                {isEditMode ? 'Atualize as informações do produto no catálogo.' : 'Cadastre um novo produto no catálogo do almoxarifado.'}
              </p>
            </div>
            <DialogTitle className="sr-only">{isEditMode ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription className="sr-only">Formulário de produto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bd-codigo">Código do Produto (ID) *</Label>
              <Input
                id="bd-codigo"
                autoFocus
                value={formulario.codigoProduto}
                onChange={(e) => setFormulario({ ...formulario, codigoProduto: e.target.value.toUpperCase() })}
                placeholder="Ex: FER-001, EQP-005"
                className={`rounded-xl ${erros.codigoProduto ? 'border-red-500' : ''}`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                maxLength={20}
                aria-invalid={!!erros.codigoProduto}
                aria-describedby={erros.codigoProduto ? 'bd-codigo-erro' : 'bd-codigo-hint'}
              />
              {erros.codigoProduto && <p id="bd-codigo-erro" className="text-xs" style={{ color: 'var(--text-red)' }}>{erros.codigoProduto}</p>}
              <p id="bd-codigo-hint" className="text-xs text-muted-foreground">Este código será exibido em todas as telas do sistema</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bd-nome">Nome do Produto *</Label>
              <Input
                id="bd-nome"
                value={formulario.nome}
                onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
                placeholder="Ex: Furadeira Elétrica"
                className={`rounded-xl ${erros.nome ? 'border-red-500' : ''}`}
                aria-invalid={!!erros.nome}
                aria-describedby={erros.nome ? 'bd-nome-erro' : undefined}
              />
              {erros.nome && <p id="bd-nome-erro" className="text-xs" style={{ color: 'var(--text-red)' }}>{erros.nome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bd-categoria">Categoria *</Label>
              <Input
                id="bd-categoria"
                value={formulario.categoria}
                onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
                placeholder="Ex: Ferramentas Elétricas"
                className={`rounded-xl ${erros.categoria ? 'border-red-500' : ''}`}
                aria-invalid={!!erros.categoria}
                aria-describedby={erros.categoria ? 'bd-categoria-erro' : undefined}
              />
              {erros.categoria && <p id="bd-categoria-erro" className="text-xs" style={{ color: 'var(--text-red)' }}>{erros.categoria}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bd-unidade">Unidade de Medida *</Label>
              <Select
                value={formulario.unidadeMedida}
                onValueChange={(value) => setFormulario({ ...formulario, unidadeMedida: value })}
              >
                <SelectTrigger id="bd-unidade" className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {unidadesMedida.map((un) => (
                    <SelectItem key={un} value={un}>{un}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bd-estoque-min">Estoque Mínimo *</Label>
                <Input
                  id="bd-estoque-min"
                  type="number"
                  min="0"
                  value={formulario.estoqueMinimo}
                  onChange={(e) => setFormulario({ ...formulario, estoqueMinimo: e.target.value })}
                  placeholder="0"
                  className={`rounded-xl ${erros.estoqueMinimo ? 'border-red-500' : ''}`}
                  aria-invalid={!!erros.estoqueMinimo}
                  aria-describedby={erros.estoqueMinimo ? 'bd-estoque-min-erro' : undefined}
                />
                {erros.estoqueMinimo && <p id="bd-estoque-min-erro" className="text-xs" style={{ color: 'var(--text-red)' }}>{erros.estoqueMinimo}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bd-estoque-max">Estoque Máximo *</Label>
                <Input
                  id="bd-estoque-max"
                  type="number"
                  min="0"
                  value={formulario.estoqueMaximo}
                  onChange={(e) => setFormulario({ ...formulario, estoqueMaximo: e.target.value })}
                  placeholder="0"
                  className={`rounded-xl ${erros.estoqueMaximo ? 'border-red-500' : ''}`}
                  aria-invalid={!!erros.estoqueMaximo}
                  aria-describedby={erros.estoqueMaximo ? 'bd-estoque-max-erro' : undefined}
                />
                {erros.estoqueMaximo && <p id="bd-estoque-max-erro" className="text-xs" style={{ color: 'var(--text-red)' }}>{erros.estoqueMaximo}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} style={{ background: '#1A56DB', color: 'white' }} className="hover:opacity-90">
              {isEditMode ? 'Salvar Alterações' : 'Adicionar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!produtoParaDeletar} onOpenChange={(open) => !open && setProdutoParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá permanentemente o produto do catálogo.
              Considere desativar o produto ao invés de removê-lo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletar} className="bg-red-600 hover:bg-red-700">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
