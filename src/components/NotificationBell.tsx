import { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'react-toastify';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  user_id: string;
  data: string | {
    service_id?: string;
    type?: string;
    [key: string]: any;
  };
}

// Função auxiliar para processar o campo data
function parseNotificationData(data: any) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao parsear dados da notificação:', error);
      return {};
    }
  }
  return data || {};
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();

      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Nova notificação recebida via realtime:', payload.new);
            const newNotification = payload.new as Notification;
            const parsedData = parseNotificationData(newNotification.data);
            
            if (parsedData.type === 'whatsapp_click') {
              console.log('Notificação de clique no WhatsApp detectada!');
            }
            
            setNotifications(prev => [newNotification, ...prev]);
            toast.info(`Nova notificação: ${newNotification.title}`);
            toast.success('Alguém interagiu com seu serviço!');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      setIsRefreshing(true);
      console.log('Carregando notificações para o usuário:', user?.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erro ao carregar notificações:', error);
      } else if (data) {
        console.log('Notificações carregadas:', data);
        
        // Processar cada notificação para garantir que o campo data seja tratado corretamente
        const processedNotifications = data.map(notification => ({
          ...notification,
          parsedData: parseNotificationData(notification.data)
        }));
        
        // Logar notificações de WhatsApp especificamente
        const whatsappNotifications = processedNotifications.filter(n => n.parsedData && n.parsedData.type === 'whatsapp_click');
        console.log('Notificações de WhatsApp encontradas:', whatsappNotifications);
        
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  async function markAsRead(notificationId?: string) {
    try {
      if (notificationId) {
        // Mark single notification as read
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', user?.id);

        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      } else {
        // Mark all as read
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user?.id);

        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificação removida com sucesso!');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao remover notificação');
    }
  }

  async function deleteAllNotifications() {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id);

      setNotifications([]);
      toast.success('Todas as notificações foram removidas!');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast.error('Erro ao remover notificações');
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        
        <button
          onClick={(e) => {
            e.preventDefault();
            loadNotifications();
            toast.info('Verificando novas notificações...');
          }}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          disabled={isRefreshing}
          title="Atualizar notificações"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-sm text-primary hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => deleteAllNotifications()}
                  className="text-sm text-destructive hover:underline"
                >
                  Limpar todas
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer",
                    !notification.read && "bg-accent/20"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}