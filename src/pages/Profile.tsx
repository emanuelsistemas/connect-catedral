import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User } from '@supabase/supabase-js';
import { CreditCard, LogOut, Settings, User as UserIcon, Pencil, Trash2, Briefcase, Menu, X, Eye, EyeOff, ThumbsUp, ThumbsDown, Ban, CheckCircle, ArrowRight, MessageSquare } from 'lucide-react';
import InputMask from 'react-input-mask';
import { supabase } from '../lib/supabase';
import { ServiceForm } from '../components/ServiceForm';
import { JobForm } from '../components/JobForm';
import { DeleteModal } from '../components/DeleteModal';
import { Dashboard } from '../components/Dashboard';
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
  positive_ratings_count: number;
  negative_ratings_count: number;
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

type Rating = {
  id: string;
  service: {
    id: string;
    title: string;
  };
  rating: boolean;
  comment: string;
  reviewer_name: string | null;
  whatsapp: string | null;
  created_at: string;
  replies: {
    id: string;
    reply: string;
    created_at: string;
  }[];
};

type Section = 'dashboard' | 'services' | 'jobs' | 'profile' | 'password' | 'payments' | 'positive-ratings' | 'negative-ratings';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isActivating: boolean;
}

function StatusModal({ isOpen, onClose, onConfirm, isActivating }: StatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Atenção!</h3>
        {isActivating ? (
          <p className="text-muted-foreground mb-6">
            Ao ativar este serviço, ele voltará a aparecer para os visitantes do sistema.
          </p>
        ) : (
          <p className="text-muted-foreground mb-6">
            Ao inativar este serviço, ele não aparecerá mais para os visitantes do sistema até que seja ativado novamente.
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-input rounded-lg hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg hover:opacity-90 transition-opacity",
              isActivating
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            )}
          >
            {isActivating ? 'Ativar' : 'Inativar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState<Service[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'service' | 'job';
    id: string;
    title: string;
  } | null>(null);
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    serviceId: string;
    currentStatus: string;
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingReply, setEditingReply] = useState<{id: string, reply: string} | null>(null);

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

  useEffect(() => {
    // Set active section from navigation state if provided
    const state = location.state as { section?: Section };
    if (state?.section) {
      setActiveSection(state.section);
      // Clear the state to prevent persisting the section
      navigate(location.pathname, { replace: true });
    }
  }, [location]);

  async function loadData() {
    if (!user) return;

    try {
      // Get all services with ratings counts
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          price,
          category_id,
          status,
          views_count,
          whatsapp_clicks
        `)
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      // Get ratings counts for each service
      const servicesWithRatings = await Promise.all(servicesData.map(async (service) => {
        const { data: ratings } = await supabase
          .from('service_ratings')
          .select('rating')
          .eq('service_id', service.id);

        return {
          ...service,
          positive_ratings_count: ratings?.filter(r => r.rating === true).length || 0,
          negative_ratings_count: ratings?.filter(r => r.rating === false).length || 0
        };
      }));

      setServices(servicesWithRatings);

      const [jobsResponse, profileResponse] = await Promise.all([
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

      // Load ratings after services are loaded
      const { data: ratingsData } = await supabase
        .from('service_ratings')
        .select(`
          id,
          rating,
          comment,
          reviewer_name,
          whatsapp,
          created_at,
          service:services(id, title),
          replies:service_rating_replies(*)
        `)
        .in('service_id', servicesData.map(s => s.id))
        .order('created_at', { ascending: false });

      if (ratingsData) {
        setRatings(ratingsData);
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
      setSaving(true);

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

  async function handleReplyToRating(ratingId: string) {
    if (!replyText.trim()) {
      toast.error('Digite uma resposta');
      return;
    }

    try {
      const { error } = await supabase
        .from('service_rating_replies')
        .insert({
          rating_id: ratingId,
          reply: replyText.trim()
        });

      if (error) throw error;

      toast.success('Resposta enviada com sucesso!');
      setReplyText('');
      setReplyingTo(null);
      loadData();
    } catch (error) {
      console.error('Error replying to rating:', error);
      toast.error('Erro ao enviar resposta');
    }
  }

  async function handleUpdateReply() {
    if (!editingReply) return;

    try {
      const { error } = await supabase
        .from('service_rating_replies')
        .update({ reply: editingReply.reply })
        .eq('id', editingReply.id);

      if (error) throw error;

      toast.success('Resposta atualizada com sucesso!');
      setEditingReply(null);
      loadData();
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error('Erro ao atualizar resposta');
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

  async function handleToggleServiceStatus(serviceId: string, currentStatus: string) {
    setStatusModal({
      isOpen: true,
      serviceId,
      currentStatus
    });
  }

  async function handleConfirmStatusChange() {
    if (!statusModal) return;

    try {
      const newStatus = statusModal.currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('services')
        .update({ status: newStatus })
        .eq('id', statusModal.serviceId);

      if (error) throw error;

      setServices(services.map(service => {
        if (service.id === statusModal.serviceId) {
          return {
            ...service,
            status: newStatus
          };
        }
        return service;
      }));

      toast.success(`Serviço ${newStatus === 'active' ? 'ativado' : 'inativado'} com sucesso!`);
    } catch (error) {
      console.error('Error toggling service status:', error);
      toast.error('Erro ao alterar status do serviço');
    }
  }

  function handleEditService(service: Service) {
    setSelectedService(service);
    setIsServiceFormOpen(true);
  }

  function handleEditJob(job: Job) {
    setSelectedJob(job);
    setIsJobFormOpen(true);
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
                setActiveSection('dashboard');
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'dashboard'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <CreditCard className="h-4 w-4" />
              Dashboard
            </button>

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
                setActiveSection('positive-ratings');
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'positive-ratings'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <ThumbsUp className="h-4 w-4" />
              Avaliações Positivas
            </button>

            <button
              onClick={() => {
                setActiveSection('negative-ratings');
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'negative-ratings'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <ThumbsDown className="h-4 w-4" />
              Avaliações Negativas
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
        {activeSection === 'dashboard' && (
          <Dashboard />
        )}

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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="bg-background/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">Visualizações</span>
                      </div>
                      <p className="text-xl font-semibold">{service.views_count || 0}</p>
                    </div>

                    <div className="bg-background/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">Cliques WhatsApp</span>
                      </div>
                      <p className="text-xl font-semibold">{service.whatsapp_clicks || 0}</p>
                    </div>

                    <button
                      onClick={() => navigate(`/servicos/${service.id}/avaliacoes?filter=positive`)}
                      className="bg-background/50 p-3 rounded-lg hover:border-primary transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">Avaliações Positivas</span>
                      </div>
                      <p className="text-xl font-semibold">{service.positive_ratings_count || 0}</p>
                    </button>

                    <button
                      onClick={() => navigate(`/servicos/${service.id}/avaliacoes?filter=negative`)}
                      className="bg-background/50 p-3 rounded-lg hover:border-primary transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 text-destructive mb-1">
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-sm">Avaliações Negativas</span>
                      </div>
                      <p className="text-xl font-semibold">{service.negative_ratings_count || 0}</p>
                    </button>
                  </div>

                  <h2 className="text-lg font-semibold mb-2">{service.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <span>Status:</span>
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs",
                      service.status === 'active'
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    )}>
                      {service.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleToggleServiceStatus(service.id, service.status)}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2",
                        service.status === 'active'
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                      )}
                    >
                      {service.status === 'active' ? (
                        <>
                          <Ban className="h-4 w-4" />
                          <span>Inativar</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Ativar</span>
                        </>
                      )}
                    </button>
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

        {(activeSection === 'positive-ratings' || activeSection === 'negative-ratings') && (
          <div>
            <h1 className="text-3xl font-bold mb-8">
              Avaliações {activeSection === 'positive-ratings' ? 'Positivas' : 'Negativas'}
            </h1>

            <div className="space-y-4">
              {ratings
                .filter(rating => rating.rating === (activeSection === 'positive-ratings'))
                .map((rating) => (
                  <button
                    key={rating.id}
                    onClick={() => navigate(`/servicos/${rating.service.id}/avaliacoes`)}
                    className="w-full text-left bg-card rounded-lg border border-border p-4 hover:border-primary transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>Serviço:</span>
                      <span className="font-medium">{rating.service.title}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {rating.rating ? (
                          <ThumbsUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <ThumbsDown className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-medium">
                          {rating.reviewer_name || 'Usuário'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(rating.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <p className="text-sm mb-4">{rating.comment}</p>

                    {rating.replies?.map((reply) => (
                      <div key={reply.id} className="pl-4 border-l-2 border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Sua resposta</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(reply.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm">{reply.reply}</p>
                      </div>
                    ))}

                    {!rating.replies?.length && (
                      <div>
                        {replyingTo === rating.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Escreva sua resposta..."
                              className="w-full px-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReplyToRating(rating.id);
                                }}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity"
                              >
                                Enviar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyingTo(rating.id);
                            }}
                            className="text-sm text-primary hover:underline"
                          >
                            Responder
                          </button>
                        )}
                      </div>
                    )}
                  </button>
                ))}

              {ratings.filter(rating => rating.rating === (activeSection === 'positive-ratings')).length === 0 && (
                <div className="text-center py-8 bg-card rounded-lg border border-border">
                  <p className="text-muted-foreground">
                    Nenhuma avaliação {activeSection === 'positive-ratings' ? 'positiva' : 'negativa'} encontrada
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
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
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
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
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
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
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
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
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
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeSection === 'payments' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Pagamentos</h1>

            <div className="text-center py-8 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">
                Em breve você poderá gerenciar seus pagamentos aqui
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Service Form Modal */}
      {isServiceFormOpen && (
        <ServiceForm
          isOpen={isServiceFormOpen}
          service={selectedService}
          onClose={() => {
            setIsServiceFormOpen(false);
            setSelectedService(null);
          }}
          onSuccess={() => {
            setIsServiceFormOpen(false);
            setSelectedService(null);
            loadData();
          }}
        />
      )}

      {/* Job Form Modal */}
      {isJobFormOpen && (
        <JobForm
          isOpen={isJobFormOpen}
          job={selectedJob}
          onClose={() => {
            setIsJobFormOpen(false);
            setSelectedJob(null);
          }}
          onSuccess={() => {
            setIsJobFormOpen(false);
            setSelectedJob(null);
            loadData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteModal
          title={`Excluir ${deleteModal.type === 'service' ? 'Serviço' : 'Vaga'}`}
          description={`Tem certeza que deseja excluir ${deleteModal.type === 'service' ? 'o serviço' : 'a vaga'} "${deleteModal.title}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* Status Confirmation Modal */}
      {statusModal && (
        <StatusModal
          isOpen={true}
          onClose={() => setStatusModal(null)}
          onConfirm={handleConfirmStatusChange}
          isActivating={statusModal.currentStatus === 'inactive'}
        />
      )}
    </div>
  );
}

export { Profile }