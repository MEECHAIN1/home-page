import type { Mission } from '../types/mission';

interface MissionStatusBadgeProps {
  status: Mission['status'];
}

const statusConfig: Record<Mission['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-500/20 text-gray-400' },
  running: { label: 'Running', className: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Completed', className: 'bg-green-500/20 text-green-400' },
  failed: { label: 'Failed', className: 'bg-red-500/20 text-red-400' },
};

export function MissionStatusBadge({ status }: MissionStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
