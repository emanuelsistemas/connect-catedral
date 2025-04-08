import { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import InputMask from 'react-input-mask';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Department {
  id: string;
  name: string;
}

interface JobFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  job?: {
    id: string;
    title: string;
    department_id: string;
    description: string;
    email: string;
    whatsapp: string | null;
  } | null;
}

interface SearchableSelectProps {
  options: Department[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

function SearchableSelect({ options, value, onChange, placeholder, className }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(option => option.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left flex items-center justify-between",
          className
        )}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-lg shadow-lg">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-left hover:bg-secondary transition-colors",
                    option.id === value && "bg-primary/10"
                  )}
                >
                  {option.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function JobForm({ isOpen, onClose, onSuccess, job }: JobFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [enableWhatsapp, setEnableWhatsapp] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
    
    if (job) {
      loadJobData();
    } else {
      resetForm();
    }
  }, [job, isOpen]);

  function resetForm() {
    setTitle('');
    setDepartmentId('');
    setDescription('');
    setEmail('');
    setWhatsapp('');
    setEnableWhatsapp(false);
  }

  async function loadDepartments() {
    const { data, error } = await supabase
      .from('company_departments')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Erro ao carregar setores');
      return;
    }

    setDepartments(data || []);
  }

  async function loadJobData() {
    if (!job) return;

    setTitle(job.title);
    setDepartmentId(job.department_id);
    setDescription(job.description);
    setEmail(job.email);
    
    if (job.whatsapp) {
      setWhatsapp(job.whatsapp);
      setEnableWhatsapp(true);
    }
  }

  function isFormValid() {
    const requiredFields = [
      title.trim(),
      departmentId,
      description.trim(),
      email.trim()
    ];

    if (enableWhatsapp) {
      const whatsappDigits = whatsapp.replace(/\D/g, '');
      if (whatsappDigits.length !== 11) {
        return false;
      }
    }

    return requiredFields.every(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para cadastrar uma vaga');
      return;
    }

    if (!isFormValid()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      let { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || '',
            phone: whatsapp.replace(/\D/g, ''),
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'S'
          })
          .select()
          .single();

        if (profileError) throw profileError;
        profile = newProfile;
      }

      const jobData = {
        profile_id: profile.id,
        title,
        department_id: departmentId,
        description,
        email,
        whatsapp: enableWhatsapp ? whatsapp.replace(/\D/g, '') : null,
        status: 'active'
      };

      if (job) {
        const { error: updateError } = await supabase
          .from('job_listings')
          .update(jobData)
          .eq('id', job.id);

        if (updateError) throw updateError;
        
        toast.success('Vaga atualizada com sucesso!');
      } else {
        const { error: createError } = await supabase
          .from('job_listings')
          .insert(jobData);

        if (createError) throw createError;
        
        toast.success('Vaga cadastrada com sucesso!');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error(job ? 'Erro ao atualizar vaga' : 'Erro ao cadastrar vaga');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[600px] bg-background border-l border-border transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">{job ? 'Editar Vaga' : 'Nova Vaga'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="job-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Nome da Vaga
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Setor
              </label>
              <SearchableSelect
                options={departments}
                value={departmentId}
                onChange={setDepartmentId}
                placeholder="Selecione um setor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Descrição da Vaga
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[200px]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                E-mail para currículo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Habilitar WhatsApp
                </label>
                <button
                  type="button"
                  onClick={() => setEnableWhatsapp(!enableWhatsapp)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    enableWhatsapp ? "bg-primary" : "bg-input"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                      enableWhatsapp ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {enableWhatsapp && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    WhatsApp
                  </label>
                  <InputMask
                    mask="(99) 9 9999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required={enableWhatsapp}
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border">
          <button
            type="submit"
            form="job-form"
            disabled={loading || !isFormValid()}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : job ? 'Salvar Alterações' : 'Cadastrar Vaga'}
          </button>
        </div>
      </div>
    </div>
  );
}