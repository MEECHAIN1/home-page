import { useState } from 'react';
import { useMissions } from './hooks/useMissionStatus';
import { MissionList, MissionDetails, ApiStatusIndicator, WebSocketStatusIndicator } from './components';
import type { Mission } from './types/mission';

function App() {
  const { missions, loading, error, refetch } = useMissions();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSelectMission = (mission: Mission) => {
    setSelectedMission(mission);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedMission(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <style>{`
        @import "tailwindcss";
      `}</style>
      <header className="bg-gray-800/50 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">MeeChain Mission Dashboard</h1>
            <p className="text-gray-400 text-sm">QA Test Monitoring System</p>
          </div>
          <div className="flex items-center gap-6">
            <ApiStatusIndicator status="online" />
            <WebSocketStatusIndicator />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Active Missions</h2>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            Refresh
          </button>
        </div>

        {showDetails && selectedMission ? (
          <div>
            <button
              onClick={handleCloseDetails}
              className="mb-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to list
            </button>
            <MissionDetails missionId={selectedMission.id} onClose={handleCloseDetails} />
          </div>
        ) : (
          <MissionList
            missions={missions}
            loading={loading}
            error={error}
            onSelectMission={handleSelectMission}
          />
        )}
      </main>

      <footer className="bg-gray-800/50 border-t border-gray-700 px-6 py-4 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          MeeChain QA Mission Dashboard - Real-time Test Monitoring
        </div>
      </footer>
    </div>
  );
}

export default App;
