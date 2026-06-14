interface ApiStatusIndicatorProps {
  status: 'online' | 'offline' | 'degraded';
  lastCheck?: Date;
}

const statusConfig = {
  online: { color: 'bg-green-500', label: 'Online' },
  offline: { color: 'bg-red-500', label: 'Offline' },
  degraded: { color: 'bg-yellow-500', label: 'Degraded' },
};

export function ApiStatusIndicator({ status, lastCheck }: ApiStatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
      <span className="text-gray-400 text-sm">{config.label}</span>
      {lastCheck && (
        <span className="text-gray-500 text-xs">
          (checked {Math.round((Date.now() - lastCheck.getTime()) / 1000)}s ago)
        </span>
      )}
    </div>
  );
}
