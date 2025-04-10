import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { ServiceDetails } from './pages/ServiceDetails';
import { ServiceRatings } from './pages/ServiceRatings';
import { Profile } from './pages/Profile';
import { Auth } from './pages/Auth';
import { Admin } from './pages/Admin';
import { NotAuthorized } from './pages/NotAuthorized';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { useEffect, useState } from 'react';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

function PrivateRoute({ children, requireAdmin = false }: PrivateRouteProps) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setCheckingAdmin(false);
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
      } finally {
        setCheckingAdmin(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth${requireAdmin ? '?admin=true' : ''}`} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/nao-autorizado" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <main className="flex-1 container py-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/servicos/:id" element={<ServiceDetails />} />
                <Route path="/servicos/:id/avaliacoes" element={<ServiceRatings />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/nao-autorizado" element={<NotAuthorized />} />
                <Route
                  path="/perfil"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute requireAdmin>
                      <Admin />
                    </PrivateRoute>
                  }
                />
                {/* Redirect any unknown routes to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <footer className="py-4 border-t border-border">
              <div className="container flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Desenvolvido por{' '}
                  <a
                    href="https://emasoftware.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-museomoderno font-medium bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent hover:to-primary transition-all duration-300"
                  >
                    ema-software
                  </a>
                </p>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;