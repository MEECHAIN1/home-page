import { useMissionStatus } from '../hooks/useMissionStatus';
import { MissionStatusBadge } from './MissionStatusBadge';

interface MissionDetailsProps {
  missionId: string;
  onClose?: () => void;
}

export function MissionDetails({ missionId, onClose }: MissionDetailsProps) {
  const { mission, loading, error } = useMissionStatus(missionId);

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-700 rounded w-3/4" />
          <div className="h-20 bg-gray-700 rounded" />
        </div>
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

  if (!mission) {
    return (
      <div className="text-gray-400 text-center py-8">Mission not found</div>
    );
  }

  const progress = mission.totalPhases > 0
    ? Math.round((mission.phase / mission.totalPhases) * 100)
    : 0;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl text-white font-semibold">{mission.title}</h2>
            <MissionStatusBadge status={mission.status} />
          </div>
          <p className="text-gray-400">{mission.description}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-gray-300">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                mission.status === 'completed' ? 'bg-green-500' :
                mission.status === 'failed' ? 'bg-red-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Phase</div>
            <div className="text-white text-lg font-medium">
              {mission.phase} / {mission.totalPhases}
            </div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Duration</div>
            <div className="text-white text-lg font-medium">
              {mission.startTime
                ? `${Math.round(
                    (mission.endTime
                      ? new Date(mission.endTime).getTime()
                      : Date.now()) -
                      new Date(mission.startTime).getTime()
                  ) / 1000}s`
                : '-'}
            </div>
          </div>
        </div>

        {mission.result && (
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Result</div>
            <pre className="text-gray-300 text-sm whitespace-pre-wrap">
              {mission.result}
            </pre>
          </div>
        )}

        <div className="text-xs text-gray-500 flex gap-4">
          <span>Created: {new Date(mission.created_at).toLocaleString()}</span>
          <span>Updated: {new Date(mission.updated_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
