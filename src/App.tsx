import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { ServiceDetails } from './pages/ServiceDetails';
import { ServiceRatings } from './pages/ServiceRatings';
import { Profile } from './pages/Profile';
import { Auth } from './pages/Auth';
import { Admin } from './pages/Admin';
import { NotAuthorized } from './pages/NotAuthorized';
import { RegistrationForm } from './components/RegistrationForm';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground flex flex-col pb-14">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cadastro" element={<RegistrationForm />} />
                <Route path="/servicos/:id" element={<ServiceDetails />} />
                <Route path="/servicos/:id/avaliacoes" element={<ServiceRatings />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/nao-autorizado" element={<NotAuthorized />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;