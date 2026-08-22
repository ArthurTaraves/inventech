import { Accessibility, Type, Contrast, MonitorPause, Moon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useAccessibility } from '../context/AccessibilityContext';

const FONT_OPTIONS: { value: 'normal' | 'grande' | 'extra-grande'; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'grande', label: 'Grande' },
  { value: 'extra-grande', label: 'Extra grande' },
];

export function AccessibilityMenu() {
  const { fontScale, setFontScale, highContrast, setHighContrast, reduceMotion, setReduceMotion, darkMode, setDarkMode } = useAccessibility();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Abrir preferências de acessibilidade"
          title="Preferências de acessibilidade"
          className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105"
          style={{ background: '#1A56DB', boxShadow: '0 6px 18px rgba(26,86,219,0.45)' }}
        >
          <Accessibility className="w-6 h-6" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-5" sideOffset={12}>
        <h2 className="font-bold text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Preferências de acessibilidade
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Os ajustes ficam salvos neste navegador.</p>

        <div className="space-y-4">
          <div>
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <Type className="w-4 h-4" aria-hidden="true" /> Tamanho da fonte
            </span>
            <div className="flex gap-2" role="group" aria-label="Tamanho da fonte">
              {FONT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={fontScale === opt.value}
                  onClick={() => setFontScale(opt.value)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={
                    fontScale === opt.value
                      ? { background: 'rgba(26,86,219,0.12)', color: '#1A56DB', border: '2px solid #1A56DB' }
                      : { background: 'transparent', color: 'var(--muted-foreground)', border: '2px solid var(--border)' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="a11y-high-contrast" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
              <Contrast className="w-4 h-4" aria-hidden="true" /> Alto contraste
            </Label>
            <Switch id="a11y-high-contrast" checked={highContrast} onCheckedChange={setHighContrast} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="a11y-reduce-motion" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
              <MonitorPause className="w-4 h-4" aria-hidden="true" /> Reduzir animações
            </Label>
            <Switch id="a11y-reduce-motion" checked={reduceMotion} onCheckedChange={setReduceMotion} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="a11y-dark-mode" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
              <Moon className="w-4 h-4" aria-hidden="true" /> Modo escuro
            </Label>
            <Switch id="a11y-dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
