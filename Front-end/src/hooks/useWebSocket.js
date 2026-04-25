import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let sharedClient = null;
let subscriberCount = 0;

const DEFAULT_WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'https://catholic-souvenir-api.southeastasia.cloudapp.azure.com/ws';

function normalizeWebSocketUrl(rawUrl) {
  if (!rawUrl || typeof window === 'undefined') {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl, window.location.origin);
    const isPageSecure = window.location.protocol === 'https:';

    if (isPageSecure && url.protocol === 'http:') {
      url.protocol = 'https:';
    }

    return url.toString();
  } catch {
    if (window.location.protocol === 'https:' && rawUrl.startsWith('http://')) {
      return rawUrl.replace(/^http:\/\//, 'https://');
    }

    return rawUrl;
  }
}

export default function useWebSocket({ wsUrl = DEFAULT_WS_URL, jwtToken = '', conversationId = '', onMessageReceived }) {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onMessageReceived);
  const subscriptionRef = useRef(null);
  const subscribedDestinationRef = useRef('');

  const safeWsUrl = useMemo(() => normalizeWebSocketUrl(wsUrl), [wsUrl]);

  useEffect(() => {
    callbackRef.current = onMessageReceived;
  }, [onMessageReceived]);

  const disconnect = useCallback(() => {
    if (!sharedClient) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      subscribedDestinationRef.current = '';
    }

    subscriberCount = Math.max(0, subscriberCount - 1);

    if (subscriberCount === 0) {
      sharedClient.deactivate();
      sharedClient = null;
    }

    setIsConnected(false);
  }, []);

  const ensureConnected = useCallback(() => {
    if (!jwtToken || typeof window === 'undefined') return;

    if (!sharedClient) {
      sharedClient = new Client({
        webSocketFactory: () => new SockJS(safeWsUrl),
        connectHeaders: {
          Authorization: `Bearer ${jwtToken}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      });

      sharedClient.onConnect = () => {
        setIsConnected(true);
      };

      sharedClient.onDisconnect = () => {
        setIsConnected(false);
      };

      sharedClient.onWebSocketClose = () => {
        setIsConnected(false);
      };

      sharedClient.onStompError = () => {
        setIsConnected(false);
      };

      sharedClient.activate();
    }

    const destination = conversationId ? `/topic/chat/${conversationId}` : '/user/queue/messages';

    const subscribeToDestination = () => {
      if (!sharedClient?.connected || subscriptionRef.current || subscribedDestinationRef.current === destination) return;

      subscriptionRef.current = sharedClient.subscribe(destination, (frame) => {
        try {
          const payload = JSON.parse(frame.body || '{}');
          callbackRef.current?.(payload);
        } catch {
          callbackRef.current?.(null);
        }
      });
      subscribedDestinationRef.current = destination;
      setIsConnected(true);
    };

    subscribeToDestination();

    if (!sharedClient.connected) {
      const connectWatcher = window.setInterval(() => {
        if (sharedClient?.connected) {
          subscribeToDestination();
          window.clearInterval(connectWatcher);
        }

        if (!sharedClient) {
          window.clearInterval(connectWatcher);
        }
      }, 300);
    }

    subscriberCount += 1;
  }, [conversationId, jwtToken, safeWsUrl]);

  const sendMessage = useCallback((payload) => {
    if (!sharedClient?.connected) {
      return false;
    }

    sharedClient.publish({
      destination: '/app/chat',
      body: JSON.stringify(payload),
    });

    return true;
  }, []);

  useEffect(() => {
    const connectTimer = window.setTimeout(() => {
      ensureConnected();
    }, 0);

    return () => {
      window.clearTimeout(connectTimer);
      disconnect();
    };
  }, [ensureConnected, disconnect]);

  return {
    isConnected,
    sendMessage,
    disconnect,
  };
}
