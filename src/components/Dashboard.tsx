import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { cn } from '../lib/utils';

interface DashboardData {
  totalViews: number;
  totalClicks: number;
  totalRatings: number;
  positiveRatings: number;
  negativeRatings: number;
  viewsData: {
    date: string;
    views: number;
  }[];
  clicksData: {
    date: string;
    clicks: number;
  }[];
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadDashboardData();
  }, [user, timeRange]);

  async function loadDashboardData() {
    if (!user) return;

    try {
      // Get date range
      const now = new Date();
      let startDate = new Date();
      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get all services for this user
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('profile_id', user.id);

      if (!services?.length) {
        setData({
          totalViews: 0,
          totalClicks: 0,
          totalRatings: 0,
          positiveRatings: 0,
          negativeRatings: 0,
          viewsData: [],
          clicksData: []
        });
        return;
      }
      
      // Get views data for the selected time period
      const { data: views } = await supabase
        .from('service_views')
        .select('viewed_at')
        .in('service_id', services.map(s => s.id))
        .gte('viewed_at', startDate.toISOString());

      // Get whatsapp clicks data for the selected time period
      const { data: clicks } = await supabase
        .from('whatsapp_clicks')
        .select('clicked_at')
        .in('service_id', services.map(s => s.id))
        .gte('clicked_at', startDate.toISOString());

      // Get ratings for the selected time period
      const { data: ratings } = await supabase
        .from('service_ratings')
        .select('rating, created_at')
        .in('service_id', services.map(s => s.id))
        .gte('created_at', startDate.toISOString());

      // Calculate totals for the selected period
      const totalViews = views?.length || 0;
      const totalClicks = clicks?.length || 0;
      const totalRatings = ratings?.length || 0;
      const positiveRatings = ratings?.filter(r => r.rating === true).length || 0;
      const negativeRatings = ratings?.filter(r => r.rating === false).length || 0;

      // Process views data for chart
      const viewsByDate = new Map<string, number>();
      views?.forEach(view => {
        const date = new Date(view.viewed_at).toLocaleDateString('pt-BR');
        viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1);
      });

      // Process clicks data for chart
      const clicksByDate = new Map<string, number>();
      clicks?.forEach(click => {
        const date = new Date(click.clicked_at).toLocaleDateString('pt-BR');
        clicksByDate.set(date, (clicksByDate.get(date) || 0) + 1);
      });
      
      // Adicionar datas faltantes com valor zero para melhorar a visualização do gráfico
      const fillMissingDates = (dateMap: Map<string, number>, startDate: Date, endDate: Date = new Date()) => {
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = currentDate.toLocaleDateString('pt-BR');
          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, 0);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return new Map([...dateMap.entries()].sort((a, b) => {
          const dateA = a[0].split('/').reverse().join('-');
          const dateB = b[0].split('/').reverse().join('-');
          return dateA.localeCompare(dateB);
        }));
      };
      
      // Preencher datas faltantes e ordenar
      const filledViewsByDate = fillMissingDates(viewsByDate, startDate);
      const filledClicksByDate = fillMissingDates(clicksByDate, startDate);

      const viewsData = Array.from(filledViewsByDate.entries()).map(([date, views]) => ({
        date,
        views
      }));

      const clicksData = Array.from(filledClicksByDate.entries()).map(([date, clicks]) => ({
        date,
        clicks
      }));

      setData({
        totalViews,
        totalClicks,
        totalRatings,
        positiveRatings,
        negativeRatings,
        viewsData,
        clicksData
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Usuário não autenticado
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Erro ao carregar dados
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('week')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              timeRange === 'week'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            7 dias
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              timeRange === 'month'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            30 dias
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              timeRange === 'year'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            12 meses
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Eye className="h-4 w-4" />
            <span>Visualizações</span>
          </div>
          <p className="text-2xl font-bold">{data.totalViews}</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MessageSquare className="h-4 w-4" />
            <span>Cliques WhatsApp</span>
          </div>
          <p className="text-2xl font-bold">{data.totalClicks}</p>
        </div>

        <button
          onClick={() => navigate('/perfil', { state: { section: 'positive-ratings' } })}
          className="bg-card rounded-lg border border-border p-4 hover:border-primary transition-colors text-left"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ThumbsUp className="h-4 w-4" />
            <span>Avaliações Positivas</span>
          </div>
          <p className="text-2xl font-bold">{data.positiveRatings}</p>
        </button>

        <button
          onClick={() => navigate('/perfil', { state: { section: 'negative-ratings' } })}
          className="bg-card rounded-lg border border-border p-4 hover:border-primary transition-colors text-left"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ThumbsDown className="h-4 w-4" />
            <span>Avaliações Negativas</span>
          </div>
          <p className="text-2xl font-bold">{data.negativeRatings}</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold mb-4">
            Visualizações por {timeRange === 'week' ? '7 dias' : timeRange === 'month' ? '30 dias' : '12 meses'}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.viewsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="hsl(var(--primary))" name="Visualizações" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold mb-4">
            Cliques WhatsApp por {timeRange === 'week' ? '7 dias' : timeRange === 'month' ? '30 dias' : '12 meses'}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.clicksData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="clicks" fill="#25D366" name="Cliques WhatsApp" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}