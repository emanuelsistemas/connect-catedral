import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Network, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import InputMask from 'react-input-mask';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();

  const isAdminAuth = searchParams.get('admin') === 'true';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEmailNotConfirmed(false);

    if (!isLogin) {
      if (password !== confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }

      if (password.length < 6) {
        toast.error('A senha deve ter no mínimo 6 caracteres');
        return;
      }

      if (!fullName || !whatsapp || !email) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      handleSignUp();
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);

      if (isAdminAuth) {
        setShowAdminModal(true);
      } else {
        toast.success('Login realizado com sucesso!');
        navigate('/perfil');
      }
    } catch (err: any) {
      if (err.message?.includes('Email not confirmed')) {
        setError('Por favor, confirme seu e-mail antes de fazer login.');
        setEmailNotConfirmed(true);
      } else {
        toast.error('Erro ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        toast.error('Este e-mail já está cadastrado');
        setIsLogin(true);
        return;
      }

      const response = await signUp(email, password, {
        data: {
          full_name: fullName,
          company_name: companyName,
          phone: whatsapp.replace(/\D/g, ''),
        },
      });

      if (response?.error) throw response.error;

      toast.success('Conta criada com sucesso! Você já pode fazer login.');
      setIsLogin(true);
      resetForm();
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.message?.includes('User already registered')) {
        toast.error('Este e-mail já está cadastrado');
        setIsLogin(true);
      } else {
        toast.error('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminAccess() {
    if (adminPassword !== import.meta.env.VITE_ADMIN_PASSWORD) {
      toast.error('Senha de administrador incorreta');
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({ admin: 'S' })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .select()
        .single();

      if (error) throw error;

      if (profile) {
        toast.success('Acesso administrativo concedido!');
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error granting admin access:', error);
      toast.error('Erro ao conceder acesso administrativo');
    } finally {
      setShowAdminModal(false);
      setLoading(false);
    }
  }

  function resetForm() {
    setFullName('');
    setCompanyName('');
    setWhatsapp('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAdminPassword('');
    setShowAdminModal(false);
    setError('');
    setEmailNotConfirmed(false);
  }

  async function resendConfirmationEmail() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success('E-mail de confirmação reenviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao reenviar e-mail de confirmação.');
    } finally {
      setLoading(false);
    }
  }

  function handleToggleForm() {
    if (!isLogin) {
      setIsLogin(true);
      resetForm();
      return;
    }

    setShowAdminModal(true);
  }

  function handleConfirmAdminPassword() {
    if (adminPassword !== import.meta.env.VITE_ADMIN_PASSWORD) {
      toast.error('Senha de administrador incorreta');
      return;
    }

    setShowAdminModal(false);
    setIsLogin(false);
    setAdminPassword('');
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Network className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-2xl font-bold text-center">
            {isAdminAuth ? 'Acesso Administrativo' : isLogin ? 'Entrar no c:onnect' : 'Criar uma conta'}
          </h1>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive text-sm rounded">
              {error}
              {emailNotConfirmed && (
                <button
                  type="button"
                  onClick={resendConfirmationEmail}
                  className="text-primary hover:underline ml-2"
                  disabled={loading}
                >
                  Reenviar e-mail de confirmação
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="whatsapp"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    WhatsApp
                  </label>
                  <InputMask
                    mask="(99) 9 9999-9999"
                    type="tel"
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
            >
              {loading
                ? 'Carregando...'
                : isAdminAuth
                ? 'Acessar'
                : isLogin
                ? 'Entrar'
                : 'Criar conta'}
            </button>
          </form>

          {!isAdminAuth && (
            <div className="mt-6 text-center">
              <button
                onClick={handleToggleForm}
                className="text-primary hover:underline text-sm"
              >
                {isLogin
                  ? 'Não tem uma conta? Cadastre-se'
                  : 'Já tem uma conta? Entre'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Senha de Administrador</h2>
            <p className="text-muted-foreground mb-4">
              Para {isAdminAuth ? 'acessar a área administrativa' : 'criar uma nova conta'}, insira a senha de administrador.
            </p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                placeholder="Senha de administrador"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowAdminModal(false)}
                className="flex-1 py-2 px-4 border border-input rounded-lg hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={isAdminAuth ? handleAdminAccess : handleConfirmAdminPassword}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Carregando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}