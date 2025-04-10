import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User } from '@supabase/supabase-js';
import { CreditCard, LogOut, Settings, User as UserIcon, Pencil, Trash2, Briefcase, Menu, X, Eye, EyeOff } from 'lucide-react';
import InputMask from 'react-input-mask';
import { supabase } from '../lib/supabase';
import { ServiceForm } from '../components/ServiceForm';
import { JobForm } from '../components/JobForm';
import { DeleteModal } from '../components/DeleteModal';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

type Service = {
  id: string;
  title: string;
  views_count: number;
  whatsapp_clicks: number;
  status: 'active' | 'inactive' | 'pending';
  description: string;
  price: number | null;
  category_id: string;
};

type Job = {
  id: string;
  title: string;
  views_count: number;
  whatsapp_clicks: number;
  status: 'active' | 'inactive' | 'pending';
  department_id: string;
  description: string;
  email: string;
  whatsapp: string | null;
};

type Profile = {
  full_name: string;
  company_name: string | null;
  phone: string;
  email: string;
  bio: string | null;
};

type Section = 'services' | 'jobs' | 'profile' | 'password' | 'payments';

export function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'service' | 'job';
    id: string;
    title: string;
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Effect to show development notice when payments section is selected
  useEffect(() => {
    if (activeSection === 'payments') {
      toast.info('Área em desenvolvimento. Em breve você poderá gerenciar seus pagamentos aqui!');
    }
  }, [activeSection]);

  async function loadData() {
    if (!user) return;

    try {
      // Ensure session is valid before making requests
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        navigate('/auth');
        return;
      }

      const [servicesResponse, jobsResponse, profileResponse] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('job_listings')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
      ]);

      if (servicesResponse.data) {
        setServices(servicesResponse.data);
      }

      if (jobsResponse.data) {
        setJobs(jobsResponse.data);
      }

      if (profileResponse.data) {
        setProfile(profileResponse.data);
        setFullName(profileResponse.data.full_name);
        setCompanyName(profileResponse.data.company_name || '');
        setPhone(profileResponse.data.phone);
        setEmail(profileResponse.data.email);
        setBio(profileResponse.data.bio || '');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      // Ensure session is valid before making requests
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        navigate('/auth');
        return;
      }

      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          phone: phone.replace(/\D/g, ''),
          email,
          bio
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      // Ensure session is valid before making requests
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        navigate('/auth');
        return;
      }

      setSaving(true);

      // Primeiro, verificar a senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          toast.error('A senha atual está incorreta');
        } else {
          toast.error('Erro ao verificar senha atual');
        }
        return;
      }

      // Se a senha atual estiver correta, atualizar para a nova senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('A senha atual está incorreta');
      } else {
        toast.error('Erro ao atualizar senha');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;

    try {
      const { error } = await supabase
        .from(deleteModal.type === 'service' ? 'services' : 'job_listings')
        .delete()
        .eq('id', deleteModal.id);

      if (error) throw error;

      if (deleteModal.type === 'service') {
        setServices(services.filter(s => s.id !== deleteModal.id));
      } else {
        setJobs(jobs.filter(j => j.id !== deleteModal.id));
      }

      toast.success(`${deleteModal.type === 'service' ? 'Serviço' : 'Vaga'} excluído(a) com sucesso!`);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`Erro ao excluir ${deleteModal.type === 'service' ? 'serviço' : 'vaga'}`);
    } finally {
      setDeleteModal(null);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao sair');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Área do Prestador</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-2 flex-1 overflow-y-auto">
            <button
              onClick={() => {
                setActiveSection('services');
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'services'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <CreditCard className="h-4 w-4" />
              Meus Serviços
            </button>

            <button
              onClick={() => {
                setActiveSection('jobs');
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'jobs'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <Briefcase className="h-4 w-4" />
              Vagas de Emprego
            </button>

            <button
              onClick={() => {
                setActiveSection('profile');
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'profile'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <UserIcon className="h-4 w-4" />
              Dados Cadastrais
            </button>

            <button
              onClick={() => {
                setActiveSection('password');
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'password'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <Settings className="h-4 w-4" />
              Alterar Senha
            </button>

            <button
              onClick={() => {
                setActiveSection('payments');
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'payments'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <CreditCard className="h-4 w-4" />
              Pagamentos
            </button>

            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg"
      >
        {isSidebarOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-6">
        {activeSection === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">Meus Serviços</h1>
              
              <button 
                onClick={() => {
                  setSelectedService(null);
                  setIsServiceFormOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Novo Serviço
              </button>
            </div>
            
            <div className="grid gap-4">
              {services.map((service) => (
                <div key={service.id} className="bg-card rounded-lg border border-border p-4">
                  <h2 className="text-lg font-semibold mb-2">{service.title}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Visualizações:</span>
                      <span className="font-medium">{service.views_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Cliques WhatsApp:</span>
                      <span className="font-medium">{service.whatsapp_clicks || 0}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={() => handleEditService(service)}
                      className="flex-1 py-2 px-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteModal({
                        isOpen: true,
                        type: 'service',
                        id: service.id,
                        title: service.title
                      })}
                      className="flex-1 py-2 px-4 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              {services.length === 0 && (
                <div className="text-center py-8 bg-card rounded-lg border border-border">
                  <p className="text-muted-foreground">
                    Você ainda não tem serviços cadastrados
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'jobs' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">Vagas de Emprego</h1>
              
              <button 
                onClick={() => {
                  setSelectedJob(null);
                  setIsJobFormOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Nova Vaga
              </button>
            </div>
            
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-card rounded-lg border border-border p-4">
                  <h2 className="text-lg font-semibold mb-2">{job.title}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Visualizações:</span>
                      <span className="font-medium">{job.views_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Cliques WhatsApp:</span>
                      <span className="font-medium">{job.whatsapp_clicks || 0}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={() => handleEditJob(job)}
                      className="flex-1 py-2 px-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteModal({
                        isOpen: true,
                        type: 'job',
                        id: job.id,
                        title: job.title
                      })}
                      className="flex-1 py-2 px-4 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              {jobs.length === 0 && (
                <div className="text-center py-8 bg-card rounded-lg border border-border">
                  <p className="text-muted-foreground">
                    Você ainda não tem vagas cadastradas
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'profile' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Dados Cadastrais</h1>

            <div className="bg-card rounded-lg border border-border p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    WhatsApp
                  </label>
                  <InputMask
                    mask="(99) 9 9999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Biografia
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeSection === 'password' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Alterar Senha</h1>

            <div className="bg-card rounded-lg border border-border p-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeSection === 'payments' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Histórico de Pagamentos</h1>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4">Data</th>
                    <th className="text-left p-4">Valor</th>
                    <th className="text-center p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="text-center p-8 text-muted-foreground">
                      Nenhum pagamento encontrado
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ServiceForm 
        isOpen={isServiceFormOpen}
        onClose={() => {
          setIsServiceFormOpen(false);
          setSelectedService(null);
        }}
        onSuccess={loadData}
        service={selectedService}
      />

      <JobForm
        isOpen={isJobFormOpen}
        onClose={() => {
          setIsJobFormOpen(false);
          setSelectedJob(null);
        }}
        onSuccess={loadData}
        job={selectedJob}
      />

      {deleteModal && (
        <DeleteModal
          isOpen={true}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir ${deleteModal.type === 'service' ? 'o serviço' : 'a vaga'} "${deleteModal.title}"? Esta ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}