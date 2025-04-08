import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors",
        className
      )}
      aria-label="Alternar tema"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-5 w-5 text-yellow-500" />
          <span className="sm:hidden">Tema Claro</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5 text-gray-700" />
          <span className="sm:hidden">Tema Escuro</span>
        </>
      )}
    </button>
  );
}