import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, RefreshCw } from 'lucide-react';
import { useTypeSafeSupabase } from '@/hooks/useTypeSafeSupabase';
import { useAuth } from '@/contexts/auth';
import { Notification } from '@/types/notification';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { logDebug, isDebugModeEnabled } from '@/utils/debug';
import { cn } from '@/lib/utils';
import { isRealtimeConnected, isMock } from '@/lib/supabase';
import { mockDb } from '@/lib/mockData';

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [websocketStatus, setWebsocketStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const { user } = useAuth();
  const { toast } = useToast();
  const { safeSelect, safeUpdate, supabase } = useTypeSafeSupabase();
  const channelRef = useRef<any>(null);
  const subscriptionAttemptRef = useRef<number>(0);
  const debugModeEnabledRef = useRef<boolean>(isDebugModeEnabled());
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const fetchDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const websocketTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const componentMountedRef = useRef<boolean>(false);
  const setupInProgressRef = useRef<boolean>(false);
  const initialMockFetchDoneRef = useRef<boolean>(false);

  // Refs for callback functions
  const fetchNotificationsRef = useRef<() => void>(() => {});
  const setupRealtimeSubscriptionRef = useRef<() => void>(() => {});
  const cleanupWebSocketConnectionRef = useRef<() => void>(() => {});

  useEffect(() => {
    const checkDebugMode = () => {
      const current = isDebugModeEnabled();
      if (current !== debugModeEnabledRef.current) {
        debugModeEnabledRef.current = current;
      }
    };

    const intervalId = setInterval(checkDebugMode, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchNotifications = useCallback(async (force = false) => {
    if (isMock() && initialMockFetchDoneRef.current && !force) {
      logDebug('Skipping repeated notification fetch in mock mode.', null, 'info');
      if (loading) setLoading(false);
      return;
    }

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    if (isFetchingRef.current && !force) {
      return;
    }

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    const minFetchInterval = isRealtimeConnected() ? 15000 : 2000;

    if (timeSinceLastFetch < minFetchInterval && !force) {
      if (fetchDebounceTimeoutRef.current) {
        clearTimeout(fetchDebounceTimeoutRef.current);
      }

      fetchDebounceTimeoutRef.current = setTimeout(() => {
        fetchNotifications(true);
      }, minFetchInterval - timeSinceLastFetch);

      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    if (!loading) {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error } = await safeSelect(
        'notifications',
        '*',
        {
          column: 'user_id',
          value: user.id,
          order: {
            column: 'created_at',
            ascending: false
          },
          limit: 10
        }
      );

      if (error) {
        if (debugModeEnabledRef.current) {
          logDebug('Error fetching notifications:', error, 'error');
        }
        setError('Unable to load notifications. Please try again later.');

        const isNetworkError = error.message?.includes('fetch') || error.details?.includes('fetch');
        if (retryCount < 3 && isNetworkError) {
          const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 10000) + Math.random() * 1000;
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchNotifications(true);
          }, retryDelay);
        }
      } else {
        setNotifications(data || []);
        setError(null);
        if (retryCount > 0) {
          setRetryCount(0);
        }
        if (isMock() && !initialMockFetchDoneRef.current) {
          initialMockFetchDoneRef.current = true;
          logDebug('Initial notification fetch completed in mock mode.', null, 'info');
        }
      }
    } catch (err) {
      if (debugModeEnabledRef.current) {
        logDebug('Error fetching notifications:', err, 'error');
      }
      setError('Unable to load notifications. Please try again later.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, safeSelect, retryCount]);

  const cleanupWebSocketConnection = useCallback(() => {
    if (!channelRef.current || !componentMountedRef.current) {
      return;
    }

    logDebug('Attempting to cleanup WebSocket connection...', { channel: !!channelRef.current }, 'info');

    if (supabase) {
      try {
        supabase.removeChannel(channelRef.current);
        logDebug('Removed notification channel via supabase.removeChannel', null, 'info');
      } catch (error) {
        logDebug('Error removing notification channel:', error, 'error');
      }
    }
    channelRef.current = null;

    if (websocketTimeoutRef.current) {
      clearTimeout(websocketTimeoutRef.current);
      websocketTimeoutRef.current = null;
    }

    if (componentMountedRef.current && !setupInProgressRef.current) {
      setSubscribed(false);
      setWebsocketStatus('disconnected');
      setIsSubscribing(false);
    }
  }, [supabase]);

  const setupRealtimeSubscription = useCallback(() => {
    if (isMock()) {
      logDebug('Skipping setupRealtimeSubscription in mock mode.', null, 'info');
      return;
    }
    
    if (!componentMountedRef.current || !user || !supabase || subscribed || isSubscribing || setupInProgressRef.current) {
      logDebug('Skipping setupRealtimeSubscription', { mounted: componentMountedRef.current, user: !!user, supabase: !!supabase, subscribed, isSubscribing, setupInProgress: setupInProgressRef.current }, 'info');
      return;
    }

    setupInProgressRef.current = true;
    setIsSubscribing(true);
    setWebsocketStatus('connecting');
    logDebug('Starting setupRealtimeSubscription...', null, 'info');

    const now = Date.now();
    const minInterval = 5000;
    if (subscriptionAttemptRef.current > 0 && now - lastFetchTimeRef.current < minInterval) {
      logDebug(`Subscription attempt skipped due to cooldown (attempt ${subscriptionAttemptRef.current + 1})`, null, 'warn');
      setupInProgressRef.current = false;
      setIsSubscribing(false);
      setWebsocketStatus(prev => prev === 'connecting' ? 'disconnected' : prev);
      return;
    }

    if (channelRef.current) {
      cleanupWebSocketConnectionRef.current();
    }

    const currentAttempt = subscriptionAttemptRef.current + 1;
    subscriptionAttemptRef.current = currentAttempt;

    try {
      const channelName = `notifications-changes-${user.id}-${currentAttempt}-${Date.now()}`;
      logDebug(`Creating channel: ${channelName}`, null, 'info');

      if (websocketTimeoutRef.current) clearTimeout(websocketTimeoutRef.current);
      websocketTimeoutRef.current = setTimeout(() => {
        if (!componentMountedRef.current || subscriptionAttemptRef.current !== currentAttempt || websocketStatus !== 'connecting') return;

        setWebsocketStatus('error');
        setIsSubscribing(false);
        setupInProgressRef.current = false;
        logDebug(`WebSocket connection timeout (attempt ${currentAttempt})`, null, 'error');

        const retryDelay = Math.min(5000 * Math.pow(1.5, Math.min(subscriptionAttemptRef.current, 5)), 30000);
        setTimeout(() => {
          if (componentMountedRef.current && subscriptionAttemptRef.current === currentAttempt) {
            setupRealtimeSubscriptionRef.current();
          }
        }, 10000);
      }, 10000);

      const channel = supabase.channel(channelName);

      channel.on(
        {
          event: 'postgres_changes',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (!componentMountedRef.current || subscriptionAttemptRef.current !== currentAttempt) return;

          try {
            const newNotification = payload.new as Notification;
            if (!newNotification) {
              logDebug('Received notification payload without "new" property', payload, 'warn');
              return;
            }
            logDebug('Received new notification via WebSocket', newNotification, 'info');
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);

            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          } catch (error: any) {
            logDebug('Error processing notification update:', error, 'error');
          }
        }
      )
      .subscribe((status: any, err?: any) => {
        if (websocketTimeoutRef.current) {
          clearTimeout(websocketTimeoutRef.current);
          websocketTimeoutRef.current = null;
        }

        if (!componentMountedRef.current || subscriptionAttemptRef.current !== currentAttempt) return;

        const statusString = String(status);
        logDebug(`Subscription status update (attempt ${currentAttempt}): ${statusString}`, err || null, statusString.startsWith('CHANNEL_ERROR') || statusString === 'TIMED_OUT' ? 'error' : 'info');

        if (statusString === 'SUBSCRIBED') {
          setSubscribed(true);
          setIsSubscribing(false);
          setWebsocketStatus('connected');
          setupInProgressRef.current = false;
          logDebug(`Successfully subscribed to notifications (attempt ${currentAttempt})`, null, 'info');

          const timeSinceLastFetch: number = Date.now() - lastFetchTimeRef.current;
          if (!isMock() || timeSinceLastFetch > 30000) {
            fetchNotificationsRef.current();
          }
        } else if (statusString === 'CHANNEL_ERROR' || statusString === 'TIMED_OUT') {
          setSubscribed(false);
          setIsSubscribing(false);
          setWebsocketStatus('error');
          setupInProgressRef.current = false;

          const retryDelay: number = statusString === 'TIMED_OUT' ? 8000 : Math.min(5000 * Math.pow(1.5, Math.min(subscriptionAttemptRef.current, 5)), 30000);
          setTimeout(() => {
            if (componentMountedRef.current && subscriptionAttemptRef.current === currentAttempt) {
              setupRealtimeSubscriptionRef.current();
            }
          }, retryDelay);
        } else if (statusString === 'CLOSED') {
          setSubscribed(false);
          setIsSubscribing(false);
          setWebsocketStatus('disconnected');
          setupInProgressRef.current = false;
          logDebug(`Subscription closed (attempt ${currentAttempt})`, null, 'warn');
          setTimeout(() => {
            if (componentMountedRef.current && subscriptionAttemptRef.current === currentAttempt) {
              logDebug(`Attempting reconnect after CLOSED status (attempt ${currentAttempt})`, null, 'info');
              setupRealtimeSubscriptionRef.current();
            }
          }, 5000);
        }
      });

      channelRef.current = channel;
    } catch (error: any) {
      if (!componentMountedRef.current) return;
      logDebug(`Error setting up notification subscription (attempt ${currentAttempt}):`, error, 'error');
      setSubscribed(false);
      setIsSubscribing(false);
      setWebsocketStatus('error');
      setupInProgressRef.current = false;

      if (websocketTimeoutRef.current) {
        clearTimeout(websocketTimeoutRef.current);
        websocketTimeoutRef.current = null;
      }
    }
  }, [user, supabase, toast, subscribed, isSubscribing]);

  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    setupRealtimeSubscriptionRef.current = setupRealtimeSubscription;
  }, [setupRealtimeSubscription]);

  useEffect(() => {
    cleanupWebSocketConnectionRef.current = cleanupWebSocketConnection;
  }, [cleanupWebSocketConnection]);

  useEffect(() => {
    componentMountedRef.current = true;
    if (isMock()) {
      initialMockFetchDoneRef.current = false;
    }

    if (user && supabase) {
      logDebug('User/Supabase available, fetching notifications and setting up subscription.', null, 'info');
      fetchNotificationsRef.current();

      if (!subscribed && !isSubscribing) {
        const initialDelay = isMock() ? 1500 : 500;
        const timeoutId = setTimeout(() => {
          if (componentMountedRef.current) {
            setupRealtimeSubscriptionRef.current();
          }
        }, initialDelay);
        return () => clearTimeout(timeoutId);
      }
    } else {
      logDebug('User or Supabase not available, skipping initial fetch/subscription.', null, 'info');
      setLoading(false);
    }

    return () => {
      logDebug('Main useEffect cleanup running.', null, 'info');
      componentMountedRef.current = false;
      if (fetchDebounceTimeoutRef.current) {
        clearTimeout(fetchDebounceTimeoutRef.current);
        fetchDebounceTimeoutRef.current = null;
      }
      cleanupWebSocketConnectionRef.current();
      subscriptionAttemptRef.current = 0;
      setupInProgressRef.current = false;
    };
  }, [user, supabase, subscribed, isSubscribing]);

  useEffect(() => {
    if (retryCount > 0 && componentMountedRef.current) {
      logDebug(`Retry attempt ${retryCount} triggered.`, null, 'info');
      fetchNotificationsRef.current();

      if (user && supabase && !subscribed && !isSubscribing) {
        logDebug('Retrying WebSocket connection due to retry count change.', null, 'info');
        const retryDelay = 1000 + (retryCount * 500);
        const timeoutId = setTimeout(() => {
          if (componentMountedRef.current) {
            setupRealtimeSubscriptionRef.current();
          }
        }, retryDelay);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [retryCount]);

  useEffect(() => {
    const handleOnline = () => {
      if (!componentMountedRef.current) return;

      logDebug('Browser online event detected.', { subscribed, isSubscribing }, 'info');

      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (isMock() && timeSinceLastFetch < 10000) {
        logDebug('Ignoring online event due to recent activity (mock env)', null, 'info');
        return;
      }

      if (!subscribed && user && supabase && !isSubscribing) {
        logDebug('Network connection possibly restored, attempting WebSocket reconnect.', null, 'info');
        const reconnectDelay = 3000;
        const timeoutId = setTimeout(() => {
          if (componentMountedRef.current) {
            setupRealtimeSubscriptionRef.current();
          }
        }, reconnectDelay);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [subscribed, user, supabase, isSubscribing]);

  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await safeUpdate(
        'notifications',
        { read: true },
        { column: 'id', value: id }
      );

      if (error) {
        if (debugModeEnabledRef.current) {
          logDebug('Error marking notification as read:', error, 'error');
        }
        toast({
          title: "Error",
          description: "Failed to mark notification as read. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      if (debugModeEnabledRef.current) {
        logDebug('Error marking notification as read:', error, 'error');
      }
      toast({
        title: "Error",
        description: "Failed to mark notification as read. Please try again.",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const updatePromises = unreadIds.map(id =>
        safeUpdate('notifications', { read: true }, { column: 'id', value: id })
      );

      const results = await Promise.allSettled(updatePromises);
      const hasErrors = results.some(result =>
        result.status === 'rejected' ||
        (result.status === 'fulfilled' && result.value.error)
      );

      if (hasErrors) {
        toast({
          title: "Warning",
          description: "Some notifications could not be marked as read.",
          variant: "destructive"
        });
      } else {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );

        toast({
          title: "All notifications marked as read",
        });
      }
    } catch (error) {
      if (debugModeEnabledRef.current) {
        logDebug('Error marking all notifications as read:', error, 'error');
      }
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read. Please try again.",
        variant: "destructive"
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const isMobile = window.innerWidth < 768;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn("h-5 w-5", websocketStatus === 'error' && "text-red-500")} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("w-80", isMobile && "w-[calc(100vw-40px)] max-w-[350px]")}>
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                if (!loading && !isFetchingRef.current && !isSubscribing) {
                  logDebug('Manual refresh triggered.', null, 'info');
                  setRetryCount(prev => prev + 1);
                }
              }}
              title={
                isSubscribing ? "Connecting..." :
                  websocketStatus === 'connected' ? "Connected. Click to refresh" :
                    websocketStatus === 'error' ? "Connection error. Click to retry" :
                      websocketStatus === 'connecting' ? "Connecting..." :
                        "Click to refresh"
              }
              disabled={loading || isFetchingRef.current || isSubscribing}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                (loading || isFetchingRef.current || isSubscribing) && "animate-spin",
                websocketStatus === 'error' && "text-red-500",
                websocketStatus === 'connecting' && "text-amber-500"
              )} />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {websocketStatus === 'error' && (
          <div className="px-4 py-2 text-xs text-red-500 flex items-center gap-2 bg-red-50 dark:bg-red-950/20">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
            <span>
              Real-time updates unavailable.
              <Button variant="link" className="p-0 h-auto text-xs ml-1" onClick={() => setRetryCount(prev => prev + 1)} disabled={isSubscribing}>
                Retry connection
              </Button>
            </span>
          </div>
        )}

        <DropdownMenuGroup className={cn("overflow-y-auto", isMobile ? "max-h-[50vh]" : "max-h-[400px]")}>
          {loading && notifications.length === 0 ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setRetryCount(prev => prev + 1)}
                disabled={isSubscribing}
              >
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">You have no notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 ${notification.read ? 'opacity-70' : 'bg-muted/50'}`}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex w-full justify-between items-start">
                  <div className="font-medium text-sm">{notification.title}</div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      aria-label="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 whitespace-normal">{notification.message}</p>
                {notification.link ? (
                  <Link
                    to={notification.link}
                    className="text-xs text-primary mt-1 hover:underline"
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                    }}
                  >
                    View details
                  </Link>
                ) : null}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
