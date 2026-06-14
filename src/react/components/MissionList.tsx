import type { Mission } from '../types/mission';
import { MissionCard } from './MissionCard';

interface MissionListProps {
  missions: Mission[];
  loading: boolean;
  error: string | null;
  onSelectMission?: (mission: Mission) => void;
}

export function MissionList({ missions, loading, error, onSelectMission }: MissionListProps) {
  if (loading && missions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
        Error: {error}
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No missions found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {missions.map((mission) => (
        <MissionCard
          key={mission.id}
          mission={mission}
          onClick={() => onSelectMission?.(mission)}
        />
      ))}
    </div>
  );
}
