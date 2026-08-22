import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Estoque } from './pages/Estoque';
import { Movimentacao } from './pages/Movimentacao';
import { Solicitacoes } from './pages/Solicitacoes';
import { PortalRequisicoes } from './pages/PortalRequisicoes';
import { Manutencao } from './pages/Manutencao';
import { ManutencaoTecnica } from './pages/ManutencaoTecnica';
import { BancoDados } from './pages/BancoDados';
import { Suporte } from './pages/Suporte';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'estoque', Component: Estoque },
      { path: 'movimentacao', Component: Movimentacao },
      { path: 'solicitacoes', Component: Solicitacoes },
      { path: 'portal-requisicoes', Component: PortalRequisicoes },
      { path: 'manutencao', Component: Manutencao },
      { path: 'manutencao-tecnica', Component: ManutencaoTecnica },
      { path: 'banco-dados', Component: BancoDados },
      { path: 'suporte', Component: Suporte },
    ],
  },
]);
