import type { Mission } from '../types/mission';
import { MissionStatusBadge } from './MissionStatusBadge';

interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
}

export function MissionCard({ mission, onClick }: MissionCardProps) {
  const progress = mission.totalPhases > 0
    ? Math.round((mission.phase / mission.totalPhases) * 100)
    : 0;

  return (
    <div
      className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-medium">{mission.title}</h3>
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{mission.description}</p>
        </div>
        <MissionStatusBadge status={mission.status} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-300">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Phase {mission.phase}/{mission.totalPhases}</span>
          {mission.startTime && (
            <span>
              {mission.status === 'completed'
                ? `Done ${new Date(mission.endTime || '').toLocaleTimeString()}`
                : `Started ${new Date(mission.startTime).toLocaleTimeString()}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
