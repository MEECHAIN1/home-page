import { useState, useEffect, useCallback } from 'react'
import { supabase, type DbMission } from '../lib/supabase'
import type { Mission, MissionPhase } from '../types/mission'

const PHASE_LABELS: Record<number, MissionPhase> = { 1: 'Core', 2: 'Token', 3: 'NFT', 4: 'Badge' }

function toMission(row: DbMission): Mission {
  return {
    id: row.id,
    phase: row.phase,
    phaseLabel: PHASE_LABELS[row.phase] ?? 'Core',
    title: row.name,
    description: row.description ?? undefined,
    status: row.status,
    updated_at: row.updated_at,
  }
}

export function useMissionStatus() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('missions').select('*').order('phase').order('name')
    if (data) setMissions((data as DbMission[]).map(toMission))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('mission-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const runMission = useCallback(async (id: string) => {
    await supabase.from('missions').update({ status: 'running', updated_at: new Date().toISOString() }).eq('id', id)
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500))
    const passed = Math.random() > 0.2
    await supabase.from('missions').update({
      status: passed ? 'passed' : 'failed',
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    load()
  }, [load])

  const resetAll = useCallback(async () => {
    const { data } = await supabase.from('missions').select('id')
    if (!data) return
    await Promise.all(
      (data as { id: string }[]).map(({ id }) =>
        supabase.from('missions').update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', id)
      )
    )
    load()
  }, [load])

  return { missions, loading, runMission, resetAll }
}
