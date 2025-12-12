import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { getWebSocketService } from '@/services/websocket';
import { useCDPStore } from '@/store/cdpStore';
import { usePriceStore } from '@/store/priceStore';
import { useAlertStore } from '@/store/alertStore';

export function useWebSocket() {
  const { address, isConnected } = useAccount();
  const [isWsConnected, setIsWsConnected] = useState(false);
  const wsRef = useRef(getWebSocketService());

  const { updatePosition } = useCDPStore();
  const { updatePrice } = usePriceStore();
  const { addAlert } = useAlertStore();

  useEffect(() => {
    const ws = wsRef.current;

    if (!isConnected || !address) {
      ws.disconnect();
      return;
    }

    // Connect to WebSocket
    ws.connect();

    // Handle connection events
    const unsubOpen = ws.onOpen(() => {
      console.log('WebSocket connected, subscribing to updates...');
      setIsWsConnected(true);
      ws.subscribe(address);
    });

    const unsubClose = ws.onClose(() => {
      console.log('WebSocket disconnected');
      setIsWsConnected(false);
    });

    const unsubError = ws.onError((error) => {
      console.error('WebSocket error:', error);
      setIsWsConnected(false);
    });

    // Handle position updates
    const unsubPosition = ws.on('position_update', (data) => {
      console.log('Position update received:', data);
      if (data.positionId && data.updates) {
        updatePosition(data.positionId, data.updates);
      }
    });

    // Handle price updates
    const unsubPrice = ws.on('price_update', (data) => {
      console.log('Price update received:', data);
      if (data.token && data.price) {
        updatePrice(data.token, data.price, data.change24h ?? 0);
      }
    });

    // Handle health factor updates
    const unsubHealth = ws.on('health_factor_update', (data) => {
      console.log('Health factor update received:', data);
      if (data.positionId && data.healthFactor) {
        updatePosition(data.positionId, {
          healthFactor: data.healthFactor
        });
      }
    });

    // Handle alert notifications
    const unsubAlert = ws.on('alert', (data) => {
      console.log('Alert received:', data);
      if (data.configId && data.message) {
        addAlert({
          configId: data.configId,
          positionId: data.positionId,
          type: data.type,
          severity: data.severity,
          message: data.message,
          value: data.value,
          threshold: data.threshold,
        });
      }
    });

    // Cleanup on unmount
    return () => {
      unsubOpen();
      unsubClose();
      unsubError();
      unsubPosition();
      unsubPrice();
      unsubHealth();
      unsubAlert();
      ws.unsubscribe(address);
      ws.disconnect();
    };
  }, [address, isConnected, updatePosition, updatePrice, addAlert]);

  return {
    isConnected: isWsConnected,
    ws: wsRef.current,
  };
}
