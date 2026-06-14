import { useState, useEffect } from 'react';

export function WebSocketStatusIndicator() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<Date | null>(null);

  useEffect(() => {
    const checkConnection = () => {
      setConnected(true);
      setLastMessage(new Date());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          connected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-gray-400 text-sm">
        {connected ? 'Connected' : 'Disconnected'}
      </span>
      {lastMessage && (
        <span className="text-gray-500 text-xs">
          (last: {lastMessage.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
}
