import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageSquare, ChevronLeft, ChevronRight, ArrowLeft, Building2, Search, Filter, LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPhoneNumber, cn } from '../lib/utils';
import { ServiceRating } from '../components/ServiceRating';

type Service = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  is_budget: boolean;
  whatsapp: string;
  email: string;
  whatsapp_clicks: number;
  profile: {
    id: string;
    full_name: string;
    company_name: string | null;
    phone: string;
  };
  category: {
    name: string;
    main_category: {
      name: string;
    };
  };
  service_images: {
    url: string;
    is_featured: boolean;
  }[];
  portfolio_sites: {
    id: string;
    url: string;
  }[];
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

export function ServiceDetails() {
  const { id } = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [serviceResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('services')
          .select(`
            *,
            profile:profiles(id, full_name, company_name, phone),
            category:sub_categories(
              name,
              main_category:main_categories(name)
            ),
            service_images(url, is_featured),
            portfolio_sites(id, url)
          `)
          .eq('id', id)
          .single(),
        supabase
          .from('main_categories')
          .select('*')
          .order('name')
      ]);

      if (serviceResponse.error) throw serviceResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      if (serviceResponse.data) {
        setService(serviceResponse.data);

        // Obter IP do cliente
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();

        // Verificar se já existe uma visualização recente deste IP
        const { data: recentView } = await supabase
          .from('service_views')
          .select('*')
          .eq('service_id', id)
          .eq('ip_address', ip)
          .gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
          .maybeSingle();

        if (!recentView) {
          // Registrar nova visualização
          await supabase.from('service_views').insert({
            service_id: id,
            ip_address: ip,
            user_agent: navigator.userAgent,
            viewed_at: new Date().toISOString()
          });

          // Incrementar contador de visualizações
          await supabase
            .from('services')
            .update({ views_count: (serviceResponse.data.views_count || 0) + 1 })
            .eq('id', id);
        }
      }

      setMainCategories(categoriesResponse.data || []);
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

  async function handleWhatsAppClick() {
    if (!service) return;

    try {
      // Obter IP do cliente
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Verificar se já existe um clique recente deste IP
      const { data: recentClick } = await supabase
        .from('whatsapp_clicks')
        .select('*')
        .eq('service_id', service.id)
        .eq('ip_address', ip)
        .gte('clicked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
        .maybeSingle();

      if (!recentClick) {
        // Registrar novo clique
        await supabase.from('whatsapp_clicks').insert({
          service_id: service.id,
          ip_address: ip,
          user_agent: navigator.userAgent,
          clicked_at: new Date().toISOString()
        });

        // Incrementar contador de cliques
        const { data: updatedService } = await supabase
          .from('services')
          .update({ whatsapp_clicks: (service.whatsapp_clicks || 0) + 1 })
          .eq('id', service.id)
          .select()
          .single();

        if (updatedService) {
          setService(updatedService);
        }
      }

      // Abrir WhatsApp
      const message = `Olá! Vi seu serviço de ${service.title} no c:onnect e gostaria de mais informações.`;
      window.open(
        `https://wa.me/${service.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
        '_blank'
      );
    } catch (error) {
      console.error('Error updating whatsapp clicks:', error);
    }
  }

  function handlePreviousImage() {
    setCurrentImageIndex((prev) => 
      prev === 0 ? service!.service_images.length - 1 : prev - 1
    );
  }

  function handleNextImage() {
    setCurrentImageIndex((prev) => 
      prev === service!.service_images.length - 1 ? 0 : prev + 1
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Serviço não encontrado</h1>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para Serviços</span>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar serviços..."
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
          <div className="bg-card rounded-lg p-4 border border-border space-y-4">
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
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {service.category && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{service.category?.main_category?.name}</span>
            <ChevronRight className="h-4 w-4" />
            <span>{service.category?.name}</span>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6">{service.title}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            {service.service_images.length > 0 && (
              <div className="relative">
                <img
                  src={service.service_images[currentImageIndex].url}
                  alt={`${service.title} - Imagem ${currentImageIndex + 1}`}
                  className="w-full aspect-video object-cover rounded-lg"
                />

                {service.service_images.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            )}

            {service.service_images.length > 1 && (
              <div className="grid grid-cols-6 gap-2 mt-2">
                {service.service_images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative rounded-lg overflow-hidden ${
                      index === currentImageIndex ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${service.title} - Miniatura ${index + 1}`}
                      className="w-full aspect-video object-cover"
                    />
                    {image.is_featured && (
                      <div className="absolute top-1 right-1">
                        <span className="bg-yellow-500 text-yellow-950 text-[10px] px-1 py-0.5 rounded-full">
                          Principal
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Building2 className="h-4 w-4 shrink-0" />
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {service.profile.company_name || service.profile.full_name}
                </h2>
              </div>

              <p className="text-muted-foreground text-sm">
                {formatPhoneNumber(service.profile.phone)}
              </p>

              {service.is_budget ? (
                <p className="text-xl font-bold mt-4">Orçamento sob consulta</p>
              ) : (
                <p className="text-xl font-bold mt-4">
                  {service.price?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </p>
              )}

              <button
                onClick={handleWhatsAppClick}
                className="w-full mt-4 bg-[#25D366] hover:bg-[#25D366]/90 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare className="h-4 w-4" />
                Conversar no WhatsApp
              </button>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <h2 className="text-lg font-semibold mb-3">Descrição</h2>
              <p className="text-muted-foreground text-sm whitespace-pre-line">
                {service.description}
              </p>
            </div>

            {service.portfolio_sites && service.portfolio_sites.length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-border">
                <h2 className="text-lg font-semibold mb-3">Portfólio</h2>
                <div className="space-y-2">
                  {service.portfolio_sites.map((site) => (
                    <a
                      key={site.id}
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span className="text-sm truncate">{site.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <ServiceRating 
            serviceId={service.id} 
            ownerId={service.profile.id}
            onRatingAdded={loadData}
          />
        </div>
      </div>
    </div>
  );
}