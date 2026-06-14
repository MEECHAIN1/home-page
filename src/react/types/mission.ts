export interface Mission {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  phase: number;
  totalPhases: number;
  startTime: string | null;
  endTime: string | null;
  result: string | null;
  testCases?: TestCase[];
  created_at: string;
  updated_at: string;
}

export interface TestCase {
  id: string;
  missionId: string;
  name: string;
  status: 'passed' | 'failed' | 'pending' | 'running';
  duration: number | null;
  errorMessage: string | null;
  steps: TestStep[];
}

export interface TestStep {
  id: string;
  testCaseId: string;
  name: string;
  status: 'passed' | 'failed' | 'pending';
  timestamp: string;
}

export interface MissionStatus {
  currentPhase: number;
  totalPhases: number;
  progress: number;
  estimatedTimeRemaining: number | null;
  currentOperation: string;
}

export type MissionStatusUpdate = Partial<Mission> & {
  id: string;
  timestamp: string;
};
