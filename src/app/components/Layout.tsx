import { Outlet, Link, useLocation } from 'react-router';
import { LayoutDashboard, Package, Wrench, ArrowLeftRight, Eye, HelpCircle, Database, ClipboardList, LayoutGrid } from 'lucide-react';
import { Toaster } from '../components/ui/sonner';

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-background">
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
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-3 mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--sidebar-foreground)', opacity: 0.45 }}>
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
                        <Icon className="w-4 h-4 shrink-0" />
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
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs" style={{ color: 'var(--sidebar-foreground)', opacity: 0.6 }}>
              Sistema Operacional
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--sidebar-foreground)', opacity: 0.35 }}>
            © 2026 InvenTech Industrial
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
