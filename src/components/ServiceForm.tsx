import { useState, useEffect, useRef } from 'react';
import { X, Upload, Star, Trash2, ChevronRight, Search, ChevronDown, Link as LinkIcon } from 'lucide-react';
import InputMask from 'react-input-mask';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  service?: {
    id: string;
    title: string;
    description: string;
    price: number | null;
    category_id: string;
  } | null;
}

interface MainCategory {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  main_category_id: string;
}

interface SearchableSelectProps {
  options: MainCategory[] | SubCategory[];
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

export function ServiceForm({ isOpen, onClose, onSuccess, service }: ServiceFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [price, setPrice] = useState('');
  const [isBudget, setIsBudget] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [existingImages, setExistingImages] = useState<{ id: string; url: string; is_featured: boolean }[]>([]);
  const [portfolioSites, setPortfolioSites] = useState<string[]>(['']);
  const [existingPortfolioSites, setExistingPortfolioSites] = useState<{ id: string; url: string }[]>([]);

  useEffect(() => {
    loadMainCategories();
    
    if (service) {
      loadServiceData();
    }
  }, [service]);

  useEffect(() => {
    if (selectedMainCategory) {
      loadSubCategories(selectedMainCategory);
    } else {
      setSubCategories([]);
      setSelectedSubCategory('');
    }
  }, [selectedMainCategory]);

  useEffect(() => {
    if (isBudget) {
      setPrice('');
    }
  }, [isBudget]);

  async function loadServiceData() {
    if (!service) return;

    try {
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select(`
          *,
          sub_category:sub_categories!inner(
            *,
            main_category:main_categories!inner(*)
          ),
          service_images(*),
          portfolio_sites(*)
        `)
        .eq('id', service.id)
        .single();

      if (serviceError) throw serviceError;

      if (serviceData) {
        setTitle(serviceData.title);
        setDescription(serviceData.description);
        setPrice(serviceData.price ? serviceData.price.toString() : '');
        setIsBudget(!serviceData.price);
        
        if (serviceData.sub_category) {
          setSelectedMainCategory(serviceData.sub_category.main_category.id);
          setSelectedSubCategory(serviceData.sub_category.id);
        }

        if (serviceData.service_images) {
          setExistingImages(serviceData.service_images);
        }

        if (serviceData.portfolio_sites) {
          setExistingPortfolioSites(serviceData.portfolio_sites);
          setPortfolioSites(serviceData.portfolio_sites.map((site: { url: string }) => site.url));
        }
      }
    } catch (error) {
      console.error('Error loading service data:', error);
      toast.error('Erro ao carregar dados do serviço');
    }
  }

  async function loadMainCategories() {
    const { data, error } = await supabase
      .from('main_categories')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Erro ao carregar categorias');
      return;
    }

    setMainCategories(data || []);
  }

  async function loadSubCategories(mainCategoryId: string) {
    const { data, error } = await supabase
      .from('sub_categories')
      .select('*')
      .eq('main_category_id', mainCategoryId)
      .order('name');

    if (error) {
      toast.error('Erro ao carregar subcategorias');
      return;
    }

    setSubCategories(data || []);
  }

  function handleMainCategoryChange(categoryId: string) {
    setSelectedMainCategory(categoryId);
    setSelectedSubCategory('');
  }

  function handleSubCategoryChange(categoryId: string) {
    setSelectedSubCategory(categoryId);
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = (Number(value) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    
    setPrice(value ? formattedValue : '');
  }

  function handleAddPortfolioSite() {
    if (portfolioSites.length < 5) {
      setPortfolioSites([...portfolioSites, '']);
    }
  }

  function handleRemovePortfolioSite(index: number) {
    const newSites = [...portfolioSites];
    newSites.splice(index, 1);
    setPortfolioSites(newSites);
  }

  function handlePortfolioSiteChange(index: number, value: string) {
    const newSites = [...portfolioSites];
    newSites[index] = value;
    setPortfolioSites(newSites);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para cadastrar um serviço');
      return;
    }

    if (images.length === 0 && existingImages.length === 0) {
      toast.error('Adicione pelo menos uma imagem');
      return;
    }

    if (!selectedMainCategory || !selectedSubCategory) {
      toast.error('Selecione uma categoria e subcategoria');
      return;
    }

    // Validar URLs do portfólio
    const validSites = portfolioSites.filter(site => site.trim() !== '');
    for (const site of validSites) {
      try {
        new URL(site);
      } catch {
        toast.error('Uma ou mais URLs do portfólio são inválidas');
        return;
      }
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

      const serviceData = {
        profile_id: profile.id,
        category_id: selectedSubCategory,
        title,
        description,
        price: isBudget ? null : Number(price.replace(/[^\d,]/g, '').replace(',', '.')),
        whatsapp: whatsapp.replace(/\D/g, ''),
        email,
        status: 'active'
      };

      let serviceId = service?.id;

      if (service) {
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id);

        if (updateError) throw updateError;
      } else {
        const { data: newService, error: createError } = await supabase
          .from('services')
          .insert(serviceData)
          .select()
          .single();

        if (createError) throw createError;
        serviceId = newService.id;
      }

      if (serviceId) {
        // Upload de imagens
        const imagePromises = images.map(async (image, index) => {
          const fileExt = image.file.name.split('.').pop();
          const fileName = `${serviceId}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('services')
            .upload(fileName, image.file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('services')
            .getPublicUrl(fileName);

          return supabase
            .from('service_images')
            .insert({
              service_id: serviceId,
              url: publicUrl,
              is_featured: index === featuredImageIndex && existingImages.length === 0
            });
        });

        await Promise.all(imagePromises);

        if (existingImages.length > 0) {
          const promises = existingImages.map((image, index) => 
            supabase
              .from('service_images')
              .update({ is_featured: index === featuredImageIndex })
              .eq('id', image.id)
          );

          await Promise.all(promises);
        }

        // Atualizar sites do portfólio
        if (service) {
          // Remover sites existentes
          await supabase
            .from('portfolio_sites')
            .delete()
            .eq('service_id', serviceId);
        }

        // Inserir novos sites
        const validSites = portfolioSites.filter(site => site.trim() !== '');
        if (validSites.length > 0) {
          const { error: portfolioError } = await supabase
            .from('portfolio_sites')
            .insert(
              validSites.map(url => ({
                service_id: serviceId,
                url: url.trim()
              }))
            );

          if (portfolioError) throw portfolioError;
        }
      }

      toast.success(service ? 'Serviço atualizado com sucesso!' : 'Serviço cadastrado com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error(service ? 'Erro ao atualizar serviço' : 'Erro ao cadastrar serviço');
    } finally {
      setLoading(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 6) {
      toast.error('Máximo de 6 imagens permitido');
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
  }

  function handleRemoveImage(index: number) {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      
      if (featuredImageIndex >= newImages.length) {
        setFeaturedImageIndex(0);
      }
      
      return newImages;
    });
  }

  async function handleRemoveExistingImage(imageId: string, index: number) {
    try {
      const { error } = await supabase
        .from('service_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setExistingImages(prev => {
        const newImages = [...prev];
        newImages.splice(index, 1);
        return newImages;
      });

      if (featuredImageIndex >= existingImages.length) {
        setFeaturedImageIndex(0);
      }
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Erro ao remover imagem');
    }
  }

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[600px] bg-background border-l border-border transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">{service ? 'Editar Serviço' : 'Novo Serviço'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="service-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Título do Serviço
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
                Imagens
              </label>
              <div className="grid grid-cols-3 gap-2">
                {existingImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFeaturedImageIndex(index)}
                        className={`p-1 rounded-full ${
                          featuredImageIndex === index
                            ? 'bg-yellow-500 text-yellow-950'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(image.id, index)}
                        className="p-1 rounded-full bg-white/20 text-white hover:bg-white/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {featuredImageIndex === index && (
                      <div className="absolute top-1 left-1">
                        <span className="bg-yellow-500 text-yellow-950 text-xs px-1.5 py-0.5 rounded-full">
                          Destaque
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFeaturedImageIndex(existingImages.length + index)}
                        className={`p-1 rounded-full ${
                          featuredImageIndex === (existingImages.length + index)
                            ? 'bg-yellow-500 text-yellow-950'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-1 rounded-full bg-white/20 text-white hover:bg-white/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {featuredImageIndex === (existingImages.length + index) && (
                      <div className="absolute top-1 left-1">
                        <span className="bg-yellow-500 text-yellow-950 text-xs px-1.5 py-0.5 rounded-full">
                          Destaque
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {images.length + existingImages.length < 6 && (
                  <label className="border-2 border-dashed border-input rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <div className="flex flex-col items-center p-4">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">
                        Adicionar
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Categoria Principal
                </label>
                <SearchableSelect
                  options={mainCategories}
                  value={selectedMainCategory}
                  onChange={handleMainCategoryChange}
                  placeholder="Selecione uma categoria"
                />
              </div>

              {selectedMainCategory && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Subcategoria
                  </label>
                  <SearchableSelect
                    options={subCategories}
                    value={selectedSubCategory}
                    onChange={handleSubCategoryChange}
                    placeholder="Selecione uma subcategoria"
                  />
                </div>
              )}

              {selectedMainCategory && selectedSubCategory && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {mainCategories.find(c => c.id === selectedMainCategory)?.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">
                    {subCategories.find(c => c.id === selectedSubCategory)?.name}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                WhatsApp
              </label>
              <InputMask
                mask="(99) 9 9999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Orçamento sob consulta
                </label>
                <button
                  type="button"
                  onClick={() => setIsBudget(!isBudget)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isBudget ? "bg-primary" : "bg-input"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                      isBudget ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Preço
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={handlePriceChange}
                  disabled={isBudget}
                  placeholder={isBudget ? "Orçamento sob consulta" : "R$ 0,00"}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Sites do Portfólio
                </label>
                {portfolioSites.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddPortfolioSite}
                    className="text-sm text-primary hover:underline"
                  >
                    Adicionar site
                  </button>
                )}
              </div>
              {portfolioSites.map((site, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="url"
                      value={site}
                      onChange={(e) => handlePortfolioSiteChange(index, e.target.value)}
                      placeholder="https://exemplo.com"
                      className="w-full pl-9 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {portfolioSites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePortfolioSite(index)}
                      className="p-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Adicione até 5 sites do seu portfólio
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Descrição do Serviço
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                required
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border">
          <button
            type="submit"
            form="service-form"
            disabled={loading || !selectedMainCategory || !selectedSubCategory}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disable
d:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : service ? 'Salvar Alterações' : 'Cadastrar Serviço'}
          </button>
        </div>
      </div>
    </div>
  );
}