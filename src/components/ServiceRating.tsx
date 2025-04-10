import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import InputMask from 'react-input-mask';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Rating {
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
}

interface ServiceRatingProps {
  serviceId: string;
  ownerId: string;
  onRatingAdded: () => void;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({ isOpen, onClose, onConfirm }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Atenção!</h3>
        <p className="text-muted-foreground mb-6">
          Para prosseguir com uma avaliação negativa, será necessário fornecer um número de WhatsApp para que o prestador possa entrar em contato e resolver sua insatisfação. O número não será exibido publicamente.
        </p>
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
            className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ServiceRating({ serviceId, ownerId, onRatingAdded }: ServiceRatingProps) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedRating, setSelectedRating] = useState<boolean | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    loadRatings();
  }, []);

  async function loadRatings() {
    try {
      const { data, error } = await supabase
        .from('service_ratings')
        .select(`
          *,
          replies:service_rating_replies(*)
        `)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false })
        .limit(3); // Mostrar apenas as 3 avaliações mais recentes na página do serviço

      if (error) throw error;

      if (data) {
        setRatings(data);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }

  function handleRatingClick(rating: boolean) {
    if (!rating) {
      setShowConfirmDialog(true);
    } else {
      setSelectedRating(true);
    }
  }

  function handleConfirmNegativeRating() {
    setSelectedRating(false);
  }

  async function handleSubmitRating() {
    if (!user && !reviewerName.trim()) {
      toast.error('Digite seu nome para avaliar');
      return;
    }

    if (selectedRating === null) {
      toast.error('Selecione uma avaliação');
      return;
    }

    if (!comment.trim()) {
      toast.error('Escreva um comentário');
      return;
    }

    if (!selectedRating && !whatsapp.trim()) {
      toast.error('Digite seu WhatsApp para avaliações negativas');
      return;
    }

    try {
      // Get client IP address
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();

      const { error } = await supabase
        .from('service_ratings')
        .insert({
          service_id: serviceId,
          user_id: user?.id || null,
          reviewer_name: user ? null : reviewerName.trim(),
          rating: selectedRating,
          comment: comment.trim(),
          ip_address: ip,
          whatsapp: !selectedRating ? whatsapp.replace(/\D/g, '') : null
        });

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso!');
      setComment('');
      setReviewerName('');
      setWhatsapp('');
      setSelectedRating(null);
      onRatingAdded();
      loadRatings();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Erro ao enviar avaliação');
    }
  }

  async function handleSubmitReply(ratingId: string) {
    if (!user || user.id !== ownerId) {
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
      loadRatings();
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('Erro ao enviar resposta');
    }
  }

  return (
    <div className="space-y-6">
      {user?.id !== ownerId && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <h3 className="text-lg font-semibold">Avaliar Serviço</h3>
          
          {!user && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Seu Nome
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => handleRatingClick(true)}
              className={cn(
                "flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-colors",
                selectedRating === true
                  ? "bg-green-500 text-white border-green-500"
                  : "border-input hover:bg-accent"
              )}
            >
              <ThumbsUp className="h-5 w-5" />
              <span>Bom</span>
            </button>

            <button
              onClick={() => handleRatingClick(false)}
              className={cn(
                "flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-colors",
                selectedRating === false
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "border-input hover:bg-accent"
              )}
            >
              <ThumbsDown className="h-5 w-5" />
              <span>Ruim</span>
            </button>
          </div>

          {selectedRating === false && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Seu WhatsApp
              </label>
              <InputMask
                mask="(99) 9 9999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                * Seu número não será exibido publicamente
              </p>
            </div>
          )}

          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Descreva sua experiência..."
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            />
          </div>

          <button
            onClick={handleSubmitRating}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Enviar Avaliação
          </button>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Avaliações Recentes</h3>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando avaliações...
          </div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma avaliação ainda
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
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
                    <p className="text-sm">{rating.comment}</p>
                  </div>
                </div>

                {rating.replies && rating.replies.map((reply) => (
                  <div key={reply.id} className="mt-4 pl-4 border-l-2 border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Resposta do prestador</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(reply.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm">{reply.reply}</p>
                  </div>
                ))}

                {user && user.id === ownerId && !rating.replies?.length && (
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
            ))}
          </div>
        )}

        {ratings.length > 0 && (
          <div className="text-center">
            <Link
              to={`/servicos/${serviceId}/avaliacoes`}
              className="text-primary hover:underline text-sm"
            >
              Ver todas as avaliações
            </Link>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmNegativeRating}
      />
    </div>
  );
}