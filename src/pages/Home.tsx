import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Copy, MessageSquare, Building2, Briefcase, FileText, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn, formatPhoneNumber } from '../lib/utils';
import { toast } from 'react-toastify';

type Service = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  is_budget: boolean;
  whatsapp: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  profile: {
    full_name: string;
    company_name: string | null;
  };
  category: {
    id: string;
    name: string;
    main_category: {
      id: string;
      name: string;
    };
  };
  service_images: {
    url: string;
    is_featured: boolean;
  }[];
};

type Job = {
  id: string;
  title: string;
  description: string;
  email: string;
  whatsapp: string | null;
  profile: {
    full_name: string;
    company_name: string | null;
  };
  department: {
    id: string;
    name: string;
  };
};

type MainCategory = {
  id: string;
  name: string;
};

type SubCategory = {
  id: string;
  name: string;
  main_category_id: string;
};

type Department = {
  id: string;
  name: string;
};

type ListingType = 'services' | 'jobs';

export function Home() {
  const [listingType, setListingType] = useState<ListingType>('services');
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [servicesResponse, jobsResponse, categoriesResponse, departmentsResponse] = await Promise.all([
        supabase
          .from('services')
          .select(`
            *,
            profile:profiles(full_name, company_name),
            category:sub_categories(
              id,
              name,
              main_category:main_categories(id, name)
            ),
            service_images(url, is_featured)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('job_listings')
          .select(`
            *,
            profile:profiles(full_name, company_name),
            department:company_departments(id, name)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('main_categories')
          .select('*')
          .order('name'),
        supabase
          .from('company_departments')
          .select('*')
          .order('name')
      ]);

      if (servicesResponse.error) throw servicesResponse.error;
      if (jobsResponse.error) throw jobsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;
      if (departmentsResponse.error) throw departmentsResponse.error;

      setServices(servicesResponse.data || []);
      setJobs(jobsResponse.data || []);
      setMainCategories(categoriesResponse.data || []);
      setDepartments(departmentsResponse.data || []);

      if (selectedMainCategory) {
        const { data: subCats } = await supabase
          .from('sub_categories')
          .select('*')
          .eq('main_category_id', selectedMainCategory)
          .order('name');

        setSubCategories(subCats || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedMainCategory) {
      loadSubCategories(selectedMainCategory);
    } else {
      setSubCategories([]);
      setSelectedSubCategory('');
    }
  }, [selectedMainCategory]);

  async function loadSubCategories(mainCategoryId: string) {
    const { data } = await supabase
      .from('sub_categories')
      .select('*')
      .eq('main_category_id', mainCategoryId)
      .order('name');

    setSubCategories(data || []);
  }

  async function handleWhatsAppClick(job: Job) {
    if (!job.whatsapp) return;

    try {
      await supabase
        .from('job_listings')
        .update({ whatsapp_clicks: (job.whatsapp_clicks || 0) + 1 })
        .eq('id', job.id);

      const message = `Olá! Vi sua vaga de ${job.title} no c:onnect e gostaria de enviar meu currículo.`;
      window.open(
        `https://wa.me/${job.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
        '_blank'
      );
    } catch (error) {
      console.error('Error updating whatsapp clicks:', error);
    }
  }

  function handleCopyEmail(email: string) {
    navigator.clipboard.writeText(email);
    toast.success('E-mail copiado para a área de transferência!');
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = searchTerm
      ? service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.profile.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesCategory = selectedMainCategory
      ? service.category.main_category.id === selectedMainCategory
      : true;

    const matchesSubCategory = selectedSubCategory
      ? service.category.id === selectedSubCategory
      : true;

    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm
      ? job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.profile.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesDepartment = selectedDepartment
      ? job.department.id === selectedDepartment
      : true;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div>
      <div className="flex flex-col gap-4 max-w-2xl mx-auto mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setListingType('services')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg border text-sm sm:text-base transition-colors",
              listingType === 'services'
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input hover:bg-accent"
            )}
          >
            Serviços
          </button>
          <button
            onClick={() => setListingType('jobs')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg border text-sm sm:text-base transition-colors",
              listingType === 'jobs'
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input hover:bg-accent"
            )}
          >
            Vagas de Emprego
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Buscar ${listingType === 'services' ? 'serviços' : 'vagas'}...`}
            className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-input bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors",
              showFilters ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {showFilters && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            {listingType === 'services' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Categoria Principal
                  </label>
                  <select
                    value={selectedMainCategory}
                    onChange={(e) => setSelectedMainCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                  >
                    <option value="">Todas as categorias</option>
                    {mainCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMainCategory && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Subcategoria
                    </label>
                    <select
                      value={selectedSubCategory}
                      onChange={(e) => setSelectedSubCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                    >
                      <option value="">Todas as subcategorias</option>
                      {subCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Setor
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md"
                >
                  <option value="">Todos os setores</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              Carregando {listingType === 'services' ? 'serviços' : 'vagas'}...
            </p>
          </div>
        ) : listingType === 'services' ? (
          services.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-lg text-muted-foreground mb-2">
                Nenhum serviço cadastrado ainda
              </p>
              <p className="text-sm text-muted-foreground">
                Seja o primeiro a oferecer seus serviços na plataforma!
              </p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-lg text-muted-foreground mb-2">
                Nenhum serviço encontrado
              </p>
              <p className="text-sm text-muted-foreground">
                Tente buscar com outros termos ou filtros
              </p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <Link
                key={service.id}
                to={`/servicos/${service.id}`}
                className="block bg-card rounded-lg border border-border p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="font-medium truncate">
                        {service.profile.company_name || service.profile.full_name}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold">{service.title}</h2>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Briefcase className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {service.category.main_category.name} &gt; {service.category.name}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="font-medium">Descrição do Serviço</span>
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleCopyEmail(service.email);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{service.email}</span>
                    </button>

                    {service.whatsapp && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(
                            `https://wa.me/${service.whatsapp.replace(/\D/g, '')}`,
                            '_blank'
                          );
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {formatPhoneNumber(service.whatsapp)}
                      </button>
                    )}
                  </div>

                  <div className="text-muted-foreground text-sm">
                    {service.is_budget ? 'Orçamento sob consulta' : service.price?.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </div>
                </div>
              </Link>
            ))
          )
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-lg text-muted-foreground mb-2">
              Nenhuma vaga cadastrada ainda
            </p>
            <p className="text-sm text-muted-foreground">
              Seja o primeiro a publicar uma vaga na plataforma!
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-lg text-muted-foreground mb-2">
              Nenhuma vaga encontrada
            </p>
            <p className="text-sm text-muted-foreground">
              Tente buscar com outros termos ou filtros
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="font-medium truncate">
                      {job.profile.company_name || job.profile.full_name}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold">{job.title}</h2>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <span>Setor: {job.department.name}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Descrição da Vaga</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{job.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleCopyEmail(job.email)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="truncate">{job.email}</span>
                  </button>

                  {job.whatsapp && (
                    <button
                      onClick={() => handleWhatsAppClick(job)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                    >
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}