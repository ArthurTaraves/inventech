import { useState } from 'react';
import { HelpCircle, MessageSquare, Phone, Mail, Send, CheckCircle2, AlertCircle, FileText, Clock, List, Tag, CircleDot } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

type TipoChamado = 'duvida' | 'erro' | 'sugestao';
type StatusChamado = 'Aberto' | 'Em análise' | 'Resolvido';

interface Chamado {
  id: string;
  nome: string;
  matricula: string;
  telefone: string;
  tipo: TipoChamado;
  assunto: string;
  mensagem: string;
  data: string;
  status: StatusChamado;
}

const TIPO_CONFIG: Record<TipoChamado, { label: string; emoji: string; color: string; bg: string }> = {
  duvida: { label: 'Dúvida', emoji: '❓', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  erro: { label: 'Erro', emoji: '🔴', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  sugestao: { label: 'Sugestão', emoji: '💡', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
};

const STATUS_CONFIG: Record<StatusChamado, { color: string; iconName: 'circle' | 'clock' | 'check' }> = {
  'Aberto': { color: 'bg-blue-100 text-blue-800 border-blue-200', iconName: 'circle' },
  'Em análise': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', iconName: 'clock' },
  'Resolvido': { color: 'bg-green-100 text-green-800 border-green-200', iconName: 'check' },
};

const StatusIcon = ({ name }: { name: 'circle' | 'clock' | 'check' }) => {
  if (name === 'circle') return <CircleDot className="w-3 h-3" />;
  if (name === 'clock') return <Clock className="w-3 h-3" />;
  return <CheckCircle2 className="w-3 h-3" />;
};

export function Suporte() {
  const [formulario, setFormulario] = useState({
    nome: '',
    matricula: '',
    telefone: '',
    tipo: '' as TipoChamado | '',
    assunto: '',
    mensagem: '',
  });

  const [chamados, setChamados] = useState<Chamado[]>(() => {
    const saved = localStorage.getItem('chamados_suporte_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [filtroStatus, setFiltroStatus] = useState<StatusChamado | 'Todos'>('Todos');
  const [filtroTipo, setFiltroTipo] = useState<TipoChamado | 'Todos'>('Todos');

  const handleEnviarChamado = () => {
    if (!formulario.nome) { toast.error('Informe seu nome completo.'); return; }
    if (!formulario.matricula) { toast.error('Informe sua matrícula.'); return; }
    if (!formulario.tipo) { toast.error('Selecione o tipo do chamado.'); return; }
    if (!formulario.assunto) { toast.error('Informe o assunto do chamado.'); return; }
    if (!formulario.mensagem) { toast.error('Descreva sua dúvida, erro ou sugestão na mensagem.'); return; }

    const novoChamado: Chamado = {
      id: String(Date.now()),
      nome: formulario.nome,
      matricula: formulario.matricula,
      telefone: formulario.telefone,
      tipo: formulario.tipo as TipoChamado,
      assunto: formulario.assunto,
      mensagem: formulario.mensagem,
      data: new Date().toLocaleString('pt-BR'),
      status: 'Aberto',
    };

    const novos = [novoChamado, ...chamados];
    setChamados(novos);
    localStorage.setItem('chamados_suporte_v2', JSON.stringify(novos));
    toast.success(`Chamado #${novoChamado.id.slice(-6)} aberto com sucesso!`);
    setFormulario({ nome: '', matricula: '', telefone: '', tipo: '', assunto: '', mensagem: '' });
  };

  const chamadosFiltrados = chamados.filter(c => {
    if (filtroStatus !== 'Todos' && c.status !== filtroStatus) return false;
    if (filtroTipo !== 'Todos' && c.tipo !== filtroTipo) return false;
    return true;
  });

  const contadores = {
    Aberto: chamados.filter(c => c.status === 'Aberto').length,
    'Em análise': chamados.filter(c => c.status === 'Em análise').length,
    Resolvido: chamados.filter(c => c.status === 'Resolvido').length,
  };

  const faqs = [
    { pergunta: 'Como adiciono um novo produto ao estoque?', resposta: 'Primeiro, cadastre o produto na "Área Administrativa". Depois, vá até "Estoque" e clique em "Novo Produto" para informar a quantidade e localização.' },
    { pergunta: 'Como faço para registrar uma movimentação?', resposta: 'Acesse a aba "Movimentação", selecione o tipo (Entrada ou Saída), escolha o produto, informe a quantidade e clique em "Confirmar Movimentação".' },
    { pergunta: 'Como acompanho o status de um item em manutenção?', resposta: 'Na aba "Manutenção", clique em qualquer item para expandir a linha do tempo completa com todas as etapas e timestamps.' },
    { pergunta: 'O que são os semáforos 🟢🟡🔴?', resposta: 'Indicam o prazo da manutenção: Verde (≤7 dias), Amarelo (8-14 dias) e Vermelho (+14 dias). Aparecem no Dashboard e na Manutenção.' },
    { pergunta: 'Como envio um equipamento para manutenção?', resposta: 'Na aba "Manutenção", clique em "Enviar para Manutenção", selecione o produto e confirme. Acompanhe o processo pela mesma tela ou pela "Manutenção Visual".' },
    { pergunta: 'Os dados são salvos automaticamente?', resposta: 'Sim! Todas as alterações são salvas automaticamente no navegador (localStorage). Os dados permanecem disponíveis mesmo após fechar o sistema.' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Central de Suporte</h1>
        <p className="text-muted-foreground mt-1">Abra chamados, acompanhe o status e consulte respostas rápidas</p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-blue-900">Telefone</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">(24) 4002-8922</p>
            <p className="text-sm text-blue-600 mt-1">Seg a Sex, 8h às 18h</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              <CardTitle className="text-green-900">E-mail</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-green-700">suporte@almoxarifado.com</p>
            <p className="text-sm text-green-600 mt-1">Resposta em até 24h</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-purple-900">Horário</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-purple-700">Segunda a Sexta</p>
            <p className="text-sm text-purple-600 mt-1">08:00 — 18:00</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <CardTitle>Abrir Chamado de Suporte</CardTitle>
            </div>
            <CardDescription>Preencha o formulário e nossa equipe entrará em contato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sup-nome">Nome Completo *</Label>
                <Input id="sup-nome" value={formulario.nome} onChange={e => setFormulario({ ...formulario, nome: e.target.value })} placeholder="Seu nome completo" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sup-matricula">Matrícula *</Label>
                  <Input id="sup-matricula" value={formulario.matricula} onChange={e => setFormulario({ ...formulario, matricula: e.target.value })} placeholder="Ex: 123456" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sup-telefone">Telefone</Label>
                  <Input id="sup-telefone" value={formulario.telefone} onChange={e => setFormulario({ ...formulario, telefone: e.target.value })} placeholder="(24) 98765-4321" />
                </div>
              </div>

              {/* Tipo do chamado — NEW */}
              <div className="space-y-2">
                <Label id="sup-tipo-label">Tipo do Chamado *</Label>
                <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="sup-tipo-label">
                  {(Object.entries(TIPO_CONFIG) as [TipoChamado, typeof TIPO_CONFIG[TipoChamado]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormulario({ ...formulario, tipo: key })}
                      aria-pressed={formulario.tipo === key}
                      className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                        formulario.tipo === key
                          ? `${cfg.bg} border-current ${cfg.color} font-semibold`
                          : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="text-lg" aria-hidden="true">{cfg.emoji}</div>
                      <div className="text-xs mt-0.5">{cfg.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sup-assunto">Assunto *</Label>
                <Input id="sup-assunto" value={formulario.assunto} onChange={e => setFormulario({ ...formulario, assunto: e.target.value })} placeholder="Resumo do problema ou dúvida" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sup-mensagem">Mensagem *</Label>
                <Textarea
                  id="sup-mensagem"
                  value={formulario.mensagem}
                  onChange={e => setFormulario({ ...formulario, mensagem: e.target.value })}
                  placeholder="Descreva detalhadamente seu problema ou dúvida..."
                  rows={4}
                />
              </div>

              <Button onClick={handleEnviarChamado} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="w-4 h-4 mr-2" />Enviar Chamado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <CardTitle>Status do Sistema</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
                  <span className="font-medium text-green-900">Sistema Operacional</span>
                </div>
                <span className="text-xs text-green-700">Todos os serviços ativos</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Última atualização: 25/06/2026</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Versão: 3.0.0</p>
              </div>
            </CardContent>
          </Card>

          {/* Tipo legend */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <CardTitle>Tipos de Chamado</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(Object.entries(TIPO_CONFIG) as [TipoChamado, typeof TIPO_CONFIG[TipoChamado]][]).map(([key, cfg]) => (
                  <div key={key} className={`flex items-center gap-3 p-2.5 rounded-lg border ${cfg.bg}`}>
                    <span className="text-lg">{cfg.emoji}</span>
                    <div>
                      <p className={`font-medium text-sm ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-xs text-gray-600">
                        {key === 'duvida' ? 'Como usar o sistema, explicações' :
                         key === 'erro' ? 'Problema técnico ou comportamento incorreto' :
                         'Proposta de melhoria ou nova funcionalidade'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">💡 Dica Rápida</p>
                <p>Antes de abrir um chamado, verifique se sua dúvida não está nas Perguntas Frequentes abaixo!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chamados list */}
      <Card className="mt-8" id="meus-chamados">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-blue-600" />
              <CardTitle>Meus Chamados</CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1" style={{ color: 'var(--text-blue)' }}>
                <CircleDot className="w-4 h-4" />{contadores.Aberto} abertos
              </span>
              <span className="flex items-center gap-1" style={{ color: 'var(--text-amber)' }}>
                <Clock className="w-4 h-4" />{contadores['Em análise']} em análise
              </span>
              <span className="flex items-center gap-1" style={{ color: 'var(--text-green)' }}>
                <CheckCircle2 className="w-4 h-4" />{contadores.Resolvido} resolvidos
              </span>
            </div>
          </div>

          {/* Filters */}
          {chamados.length > 0 && (
            <div className="flex gap-3 mt-3">
              <Select value={filtroStatus} onValueChange={v => setFiltroStatus(v as StatusChamado | 'Todos')}>
                <SelectTrigger aria-label="Filtrar chamados por status" className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os status</SelectItem>
                  <SelectItem value="Aberto">Aberto</SelectItem>
                  <SelectItem value="Em análise">Em análise</SelectItem>
                  <SelectItem value="Resolvido">Resolvido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={v => setFiltroTipo(v as TipoChamado | 'Todos')}>
                <SelectTrigger aria-label="Filtrar chamados por tipo" className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os tipos</SelectItem>
                  <SelectItem value="duvida">❓ Dúvida</SelectItem>
                  <SelectItem value="erro">🔴 Erro</SelectItem>
                  <SelectItem value="sugestao">💡 Sugestão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {chamados.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum chamado registrado ainda</p>
              <p className="text-sm text-muted-foreground mt-1">Seus chamados aparecerão aqui após o envio</p>
            </div>
          ) : chamadosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Nenhum chamado com os filtros selecionados</div>
          ) : (
            <div className="space-y-4">
              {chamadosFiltrados.map(chamado => {
                const tipoConf = TIPO_CONFIG[chamado.tipo];
                const statusConf = STATUS_CONFIG[chamado.status];
                return (
                  <div key={chamado.id} className={`border-2 rounded-xl p-4 ${tipoConf?.bg || 'border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-800 text-sm">#{chamado.id.slice(-6)}</span>
                          {tipoConf && (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${tipoConf.bg} ${tipoConf.color}`}>
                              {tipoConf.emoji} {tipoConf.label}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusConf.color}`}>
                            <StatusIcon name={statusConf.iconName} />{chamado.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{chamado.data}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="font-medium text-gray-700">Nome:</span><span className="ml-2 text-gray-600">{chamado.nome}</span></div>
                        <div><span className="font-medium text-gray-700">Matrícula:</span><span className="ml-2 text-gray-600">{chamado.matricula}</span></div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Assunto:</span>
                        <span className="ml-2 text-gray-600">{chamado.assunto}</span>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 mt-1">{chamado.mensagem}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
          </div>
          <CardDescription>Respostas para as dúvidas mais comuns sobre o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left">{faq.pergunta}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.resposta}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
