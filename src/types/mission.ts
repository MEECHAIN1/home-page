export type MissionPhase = 'Core' | 'Token' | 'NFT' | 'Badge'
export type MissionStatus = 'pending' | 'running' | 'passed' | 'failed'

export interface Mission {
  id: string
  phase: number
  phaseLabel: MissionPhase
  title: string
  description?: string
  status: MissionStatus
  updated_at: string
}
