import { Link } from 'react-router-dom';
import { Network, Menu, X, Shield } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function Header() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('admin')
          .eq('id', user.id)
          .single();

        setIsAdmin(profile?.admin === 'S');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return (
    <header className="bg-card/50 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
      <div className="container h-16 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 group"
        >
          <span className="font-museomoderno text-xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent transition-all duration-300 group-hover:to-primary">
            c:onnect
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Link
                to="/perfil"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Área do Prestador
              </Link>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Entrar
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="sm:hidden bg-card border-t border-border">
          <div className="container py-4 flex flex-col gap-4">
            <ThemeToggle className="w-full justify-center" />
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <Link
                  to="/perfil"
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Área do Prestador
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}