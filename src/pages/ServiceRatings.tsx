import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

type Rating = {
  id: string;
  rating: boolean;
  comment: string;
  reviewer_name: string | null;
  created_at: string;
  replies: {
    id: string;
    reply: string;
    created_at: string;
  }[];
};

type Service = {
  id: string;
  title: string;
  profile_id: string;
};

export function ServiceRatings() {
  const { id } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [service, setService] = useState<Service | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>(
    () => (searchParams.get('filter') as 'positive' | 'negative') || 'all'
  );
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [serviceResponse, ratingsResponse] = await Promise.all([
        supabase
          .from('services')
          .select('id, title, profile_id')
          .eq('id', id)
          .single(),
        supabase
          .from('service_ratings')
          .select(`
            id,
            rating,
            comment,
            reviewer_name,
            created_at,
            replies:service_rating_replies(*)
          `)
          .eq('service_id', id)
          .order('created_at', { ascending: false })
      ]);

      if (serviceResponse.error) throw serviceResponse.error;
      if (ratingsResponse.error) throw ratingsResponse.error;

      setService(serviceResponse.data);
      setRatings(ratingsResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReply(ratingId: string) {
    if (!user || !service || user.id !== service.profile_id) {
      toast.error('Apenas o prestador pode responder avaliações');
      return;
    }

    if (!replyText.trim()) {
      toast.error('Escreva uma resposta');
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
      console.error('Error submitting reply:', error);
      toast.error('Erro ao enviar resposta');
    }
  }

  const filteredRatings = ratings.filter(rating => {
    if (filter === 'all') return true;
    if (filter === 'positive') return rating.rating;
    return !rating.rating;
  });

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
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link
          to={`/servicos/${id}`}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para o serviço</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{service.title}</h1>
          <p className="text-muted-foreground">Avaliações do serviço</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              filter === 'all'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('positive')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              filter === 'positive'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Positivas
          </button>
          <button
            onClick={() => setFilter('negative')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              filter === 'negative'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Negativas
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRatings.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">
              Nenhuma avaliação encontrada
            </p>
          </div>
        ) : (
          filteredRatings.map((rating) => (
            <div key={rating.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
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

              <p className="text-sm mb-4">{rating.comment}</p>

              {rating.replies?.map((reply) => (
                <div key={reply.id} className="pl-4 border-l-2 border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Resposta do prestador</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(reply.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm">{reply.reply}</p>
                </div>
              ))}

              {user && user.id === service.profile_id && !rating.replies?.length && (
                <div className="mt-4">
                  {replyingTo === rating.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva sua resposta..."
                        className="w-full px-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitReply(rating.id)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity"
                        >
                          Enviar
                        </button>
                        <button
                          onClick={() => {
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
                      onClick={() => setReplyingTo(rating.id)}
                      className="text-sm text-primary hover:underline"
                    >
                      Responder
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}