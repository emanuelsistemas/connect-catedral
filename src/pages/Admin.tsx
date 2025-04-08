import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Users, 
  CreditCard, 
  FolderTree, 
  BarChart3, 
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Ban,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn, formatPhoneNumber } from '../lib/utils';

type Section = 'users' | 'payments' | 'categories' | 'subcategories' | 'analytics';

type User = {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  phone: string;
  status: string;
  created_at: string;
};

type Payment = {
  id: string;
  user_id: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed';
  created_at: string;
  user: {
    profile: {
      full_name: string;
    };
  };
};

type MainCategory = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  _count?: {
    sub_categories: number;
  };
};

type SubCategory = {
  id: string;
  name: string;
  slug: string;
  main_category_id: string;
  created_at: string;
  _count?: {
    services: number;
  };
};

type CategoryFormData = {
  id?: string;
  name: string;
  slug: string;
  main_category_id?: string;
};

type DeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
};

function DeleteModal({ isOpen, onClose, onConfirm, title, message }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-input rounded-lg hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  mainCategories,
  isSubcategory = false
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => void;
  initialData?: CategoryFormData;
  mainCategories?: MainCategory[];
  isSubcategory?: boolean;
}) {
  const [formData, setFormData] = useState<CategoryFormData>(
    initialData || {
      name: '',
      slug: '',
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        slug: '',
      });
    }
  }, [initialData, isOpen]);

  function handleNameChange(name: string) {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }));
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-6">
          {initialData ? 'Editar' : 'Nova'} {isSubcategory ? 'Subcategoria' : 'Categoria'}
        </h2>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }} className="space-y-4">
          {isSubcategory && mainCategories && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Categoria Principal
              </label>
              <select
                value={formData.main_category_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, main_category_id: e.target.value }))}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Selecione uma categoria</option>
                {mainCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-input rounded-lg hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              {initialData ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Admin() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryForm, setCategoryForm] = useState<{
    isOpen: boolean;
    data?: CategoryFormData;
  }>({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'subcategory';
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    checkAdminAccess();
    loadData();
  }, [activeSection]);

  async function checkAdminAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('admin')
      .eq('id', session.user.id)
      .single();

    if (profile?.admin !== 'S') {
      navigate('/');
      toast.error('Acesso não autorizado');
    }
  }

  async function loadData() {
    setLoading(true);

    try {
      switch (activeSection) {
        case 'users':
          const { data: profiles } = await supabase
            .from('profiles')
            .select(`
              id,
              full_name,
              company_name,
              phone,
              status,
              created_at,
              email
            `)
            .order('created_at', { ascending: false });

          if (profiles) setUsers(profiles);
          break;

        case 'payments':
          const { data: payments } = await supabase
            .from('payments')
            .select(`
              *,
              user:users(
                profile:profiles(full_name)
              )
            `)
            .order('created_at', { ascending: false });

          if (payments) setPayments(payments);
          break;

        case 'categories':
        case 'subcategories':
          const [mainResponse, subResponse] = await Promise.all([
            supabase
              .from('main_categories')
              .select('*')
              .order('name'),
            supabase
              .from('sub_categories')
              .select('*')
              .order('name')
          ]);

          if (mainResponse.data) setMainCategories(mainResponse.data);
          if (subResponse.data) setSubCategories(subResponse.data);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleUserStatus(userId: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'S' ? 'N' : 'S';
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            status: newStatus
          };
        }
        return user;
      }));

      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Erro ao atualizar status');
    }
  }

  async function handleCreateCategory(data: CategoryFormData) {
    try {
      if (activeSection === 'subcategories' && !data.main_category_id) {
        toast.error('Selecione uma categoria principal');
        return;
      }

      const table = activeSection === 'categories' ? 'main_categories' : 'sub_categories';
      
      // Check if name already exists
      const { data: existing } = await supabase
        .from(table)
        .select('id')
        .ilike('name', data.name)
        .maybeSingle();

      if (existing) {
        toast.error(`Já existe uma ${activeSection === 'categories' ? 'categoria' : 'subcategoria'} com este nome`);
        return;
      }

      const { error } = await supabase
        .from(table)
        .insert({
          name: data.name,
          slug: data.slug,
          ...(activeSection === 'subcategories' && { main_category_id: data.main_category_id })
        });

      if (error) throw error;

      toast.success(`${activeSection === 'categories' ? 'Categoria' : 'Subcategoria'} criada com sucesso!`);
      setCategoryForm({ isOpen: false });
      loadData();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(`Erro ao criar ${activeSection === 'categories' ? 'categoria' : 'subcategoria'}`);
    }
  }

  async function handleUpdateCategory(data: CategoryFormData) {
    try {
      if (!data.id) return;

      if (activeSection === 'subcategories' && !data.main_category_id) {
        toast.error('Selecione uma categoria principal');
        return;
      }

      const table = activeSection === 'categories' ? 'main_categories' : 'sub_categories';
      
      // Check if name already exists (excluding current category)
      const { data: existing } = await supabase
        .from(table)
        .select('id')
        .ilike('name', data.name)
        .neq('id', data.id)
        .maybeSingle();

      if (existing) {
        toast.error(`Já existe uma ${activeSection === 'categories' ? 'categoria' : 'subcategoria'} com este nome`);
        return;
      }

      const { error } = await supabase
        .from(table)
        .update({
          name: data.name,
          slug: data.slug,
          ...(activeSection === 'subcategories' && { main_category_id: data.main_category_id })
        })
        .eq('id', data.id);

      if (error) throw error;

      toast.success(`${activeSection === 'categories' ? 'Categoria' : 'Subcategoria'} atualizada com sucesso!`);
      setCategoryForm({ isOpen: false });
      loadData();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(`Erro ao atualizar ${activeSection === 'categories' ? 'categoria' : 'subcategoria'}`);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;

    try {
      const table = deleteModal.type === 'category' ? 'main_categories' : 'sub_categories';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', deleteModal.id);

      if (error) throw error;

      toast.success(`${deleteModal.type === 'category' ? 'Categoria' : 'Subcategoria'} excluída com sucesso!`);
      setDeleteModal(null);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`Erro ao excluir ${deleteModal.type === 'category' ? 'categoria' : 'subcategoria'}`);
    }
  }

  const filteredUsers = searchTerm
    ? users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const filteredMainCategories = searchTerm
    ? mainCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : mainCategories;

  const filteredSubCategories = searchTerm
    ? subCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : subCategories;

  return (
    <div className="flex gap-6">
      <div className="w-64 shrink-0">
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="font-semibold">Painel Administrativo</h2>
          </div>

          <div className="p-2">
            <button
              onClick={() => setActiveSection('users')}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'users'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <Users className="h-4 w-4" />
              Usuários
            </button>

            <button
              onClick={() => setActiveSection('payments')}
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
              onClick={() => setActiveSection('categories')}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'categories'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <FolderTree className="h-4 w-4" />
              Categorias
            </button>

            <button
              onClick={() => setActiveSection('subcategories')}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors ml-4",
                activeSection === 'subcategories'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <FolderTree className="h-4 w-4" />
              Subcategorias
            </button>

            <button
              onClick={() => setActiveSection('analytics')}
              className={cn(
                "w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors",
                activeSection === 'analytics'
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            {activeSection === 'users' && 'Usuários'}
            {activeSection === 'payments' && 'Pagamentos'}
            {activeSection === 'categories' && 'Categorias'}
            {activeSection === 'subcategories' && 'Subcategorias'}
            {activeSection === 'analytics' && 'Analytics'}
          </h1>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {(activeSection === 'categories' || activeSection === 'subcategories') && (
              <button
                onClick={() => setCategoryForm({ isOpen: true })}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova {activeSection === 'categories' ? 'Categoria' : 'Subcategoria'}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <>
            {activeSection === 'users' && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4">Nome</th>
                      <th className="text-left p-4">E-mail</th>
                      <th className="text-left p-4">Telefone</th>
                      <th className="text-center p-4">Status</th>
                      <th className="text-right p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            {user.company_name && (
                              <p className="text-sm text-muted-foreground">
                                {user.company_name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">{user.email}</td>
                        <td className="p-4">
                          {user.phone && formatPhoneNumber(user.phone)}
                        </td>
                        <td className="text-center p-4">
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs",
                            user.status === 'S'
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          )}>
                            {user.status === 'S' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="text-right p-4">
                          <button
                            onClick={() => handleToggleUserStatus(
                              user.id,
                              user.status
                            )}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              user.status === 'S'
                                ? "text-destructive hover:bg-destructive/10"
                                : "text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                            )}
                            title={user.status === 'S' ? 'Inativar' : 'Ativar'}
                          >
                            {user.status === 'S' ? (
                              <Ban className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === 'payments' && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4">Usuário</th>
                      <th className="text-left p-4">Data</th>
                      <th className="text-right p-4">Valor</th>
                      <th className="text-center p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-border">
                        <td className="p-4">
                          {payment.user?.profile?.full_name}
                        </td>
                        <td className="p-4">
                          {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="text-right p-4">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(payment.amount)}
                        </td>
                        <td className="text-center p-4">
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs",
                            payment.status === 'succeeded'
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : payment.status === 'pending'
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          )}>
                            {payment.status === 'succeeded' && 'Pago'}
                            {payment.status === 'pending' && 'Pendente'}
                            {payment.status === 'failed' && 'Falhou'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === 'categories' && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4">Nome</th>
                      <th className="text-left p-4">Slug</th>
                      <th className="text-center p-4">Subcategorias</th>
                      <th className="text-right p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMainCategories.map((category) => (
                      <tr key={category.id} className="border-b border-border">
                        <td className="p-4">{category.name}</td>
                        <td className="p-4">{category.slug}</td>
                        <td className="text-center p-4">
                          {subCategories.filter(sub => sub.main_category_id === category.id).length}
                        </td>
                        <td className="text-right p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setCategoryForm({
                                isOpen: true,
                                data: {
                                  id: category.id,
                                  name: category.name,
                                  slug: category.slug
                                }
                              })}
                              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({
                                isOpen: true,
                                type: 'category',
                                id: category.id,
                                name: category.name
                              })}
                              className="p-2 text-destructive hover:text-destructive/80 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === 'subcategories' && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4">Nome</th>
                      <th className="text-left p-4">Categoria Principal</th>
                      <th className="text-left p-4">Slug</th>
                      <th className="text-right p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubCategories.map((category) => {
                      const mainCategory = mainCategories.find(
                        main => main.id === category.main_category_id
                      );
                      
                      return (
                        <tr key={category.id} className="border-b border-border">
                          <td className="p-4">{category.name}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">
                                {mainCategory?.name}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">{category.slug}</td>
                          <td className="text-right p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setCategoryForm({
                                  isOpen: true,
                                  data: {
                                    id: category.id,
                                    name: category.name,
                                    slug: category.slug,
                                    main_category_id: category.main_category_id
                                  }
                                })}
                                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteModal({
                                  isOpen: true,
                                  type: 'subcategory',
                                  id: category.id,
                                  name: category.name
                                })}
                                className="p-2 text-destructive hover:text-destructive/80 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold mb-4">Total de Usuários</h3>
                    <p className="text-3xl font-bold">{users.length}</p>
                  </div>

                  <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold mb-4">Usuários Ativos</h3>
                    <p className="text-3xl font-bold">
                      {users.filter(user => user.status === 'S').length}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold mb-4">Total de Serviços</h3>
                    <p className="text-3xl font-bold">0</p>
                  </div>

                  <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold mb-4">Visualizações</h3>
                    <p className="text-3xl font-bold">0</p>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Visualizações por Categoria</h3>
                  <p className="text-muted-foreground">
                    Em breve: Gráfico mostrando as visualizações por categoria
                  </p>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Novos Usuários</h3>
                  <p className="text-muted-foreground">
                    Em breve: Gráfico mostrando o crescimento de usuários
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CategoryForm
        isOpen={categoryForm.isOpen}
        onClose={() => setCategoryForm({ isOpen: false })}
        onSubmit={(data) => {
          if (data.id) {
            handleUpdateCategory(data);
          } else {
            handleCreateCategory(data);
          }
        }}
        initialData={categoryForm.data}
        mainCategories={mainCategories}
        isSubcategory={activeSection === 'subcategories'}
      />

      {deleteModal && (
        <DeleteModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir a ${deleteModal.type === 'category' ? 'categoria' : 'subcategoria'} "${deleteModal.name}"? Esta ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}