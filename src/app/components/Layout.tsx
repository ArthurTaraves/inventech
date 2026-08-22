import { useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { LayoutDashboard, Package, Wrench, ArrowLeftRight, Eye, HelpCircle, Database, ClipboardList, LayoutGrid } from 'lucide-react';
import { Toaster } from '../components/ui/sonner';
import { AccessibilityMenu } from './AccessibilityMenu';

const NAV_GROUPS = [
  {
    label: 'OPERAÇÕES',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/estoque', icon: Package, label: 'Estoque' },
      { path: '/movimentacao', icon: ArrowLeftRight, label: 'Movimentação' },
      { path: '/solicitacoes', icon: ClipboardList, label: 'Solicitações' },
      { path: '/portal-requisicoes', icon: LayoutGrid, label: 'Portal de Requisições' },
    ],
  },
  {
    label: 'MANUTENÇÃO',
    items: [
      { path: '/manutencao', icon: Wrench, label: 'Manutenção' },
      { path: '/manutencao-tecnica', icon: Eye, label: 'Manutenção Visual' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { path: '/banco-dados', icon: Database, label: 'Área Administrativa' },
      { path: '/suporte', icon: HelpCircle, label: 'Suporte' },
    ],
  },
];

export function Layout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  const isActive = (path: string) => location.pathname === path;

  // Move o foco para o conteúdo da nova tela a cada troca de rota (SPA),
  // sem roubar o foco no primeiro carregamento da página.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-background">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-lg focus:text-sm focus:font-semibold"
        style={{ background: '#1A56DB', color: 'white' }}
      >
        Pular para o conteúdo
      </a>
      <Toaster />
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col shrink-0"
        style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div>
            <div className="font-bold text-white text-base leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              InvenTech
            </div>
            <div className="text-xs leading-tight" style={{ color: 'var(--sidebar-foreground)', opacity: 0.7 }}>
              Industrial
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Navegação principal">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-3 mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--sidebar-foreground)', opacity: 0.7 }}>
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        aria-current={active ? 'page' : undefined}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm"
                        style={active ? {
                          background: 'var(--sidebar-primary)',
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                        } : {
                          color: 'var(--sidebar-foreground)',
                          background: 'transparent',
                        }}
                        onMouseEnter={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-accent)';
                            (e.currentTarget as HTMLElement).style.color = 'white';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-foreground)';
                          }
                        }}
                      >
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
            <span className="text-xs" style={{ color: 'var(--sidebar-foreground)', opacity: 0.75 }}>
              Sistema Operacional
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--sidebar-foreground)', opacity: 0.7 }}>
            © 2026 InvenTech Industrial
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main id="conteudo-principal" ref={mainRef} tabIndex={-1} className="flex-1 overflow-auto outline-none">
        <Outlet />
      </main>

      <AccessibilityMenu />
    </div>
  );
}
