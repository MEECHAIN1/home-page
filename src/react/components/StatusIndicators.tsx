export function ApiStatusIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="text-gray-400 text-sm">API Online</span>
    </div>
  );
}

export function WebSocketStatusIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span className="text-gray-400 text-sm">WebSocket Connected</span>
    </div>
  );
}
