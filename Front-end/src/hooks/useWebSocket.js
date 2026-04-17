import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let sharedClient = null;
let subscriberCount = 0;

const DEFAULT_WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'https://catholic-souvenir-api.southeastasia.cloudapp.azure.com/ws';

export default function useWebSocket({ wsUrl = DEFAULT_WS_URL, jwtToken = '', onMessageReceived }) {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onMessageReceived);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    callbackRef.current = onMessageReceived;
  }, [onMessageReceived]);

  const disconnect = useCallback(() => {
    if (!sharedClient) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    subscriberCount = Math.max(0, subscriberCount - 1);

    if (subscriberCount === 0) {
      sharedClient.deactivate();
      sharedClient = null;
    }

    setIsConnected(false);
  }, []);

  const ensureConnected = useCallback(() => {
    if (!jwtToken) return;

    if (!sharedClient) {
      sharedClient = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
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

    if (sharedClient.connected && !subscriptionRef.current) {
      subscriptionRef.current = sharedClient.subscribe('/user/queue/messages', (frame) => {
        try {
          const payload = JSON.parse(frame.body || '{}');
          callbackRef.current?.(payload);
        } catch {
          callbackRef.current?.(null);
        }
      });
      setIsConnected(true);
    }

    if (!sharedClient.connected) {
      const connectWatcher = window.setInterval(() => {
        if (sharedClient?.connected && !subscriptionRef.current) {
          subscriptionRef.current = sharedClient.subscribe('/user/queue/messages', (frame) => {
            try {
              const payload = JSON.parse(frame.body || '{}');
              callbackRef.current?.(payload);
            } catch {
              callbackRef.current?.(null);
            }
          });
          setIsConnected(true);
          window.clearInterval(connectWatcher);
        }

        if (!sharedClient) {
          window.clearInterval(connectWatcher);
        }
      }, 300);
    }

    subscriberCount += 1;
  }, [jwtToken, wsUrl]);

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
    ensureConnected();

    return () => {
      disconnect();
    };
  }, [ensureConnected, disconnect]);

  return {
    isConnected,
    sendMessage,
    disconnect,
  };
}
