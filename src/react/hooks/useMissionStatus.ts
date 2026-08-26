import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Mission } from '../types/mission';

export function useMissionStatus(missionId: string | null) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMission = useCallback(async () => {
    if (!missionId) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMission(data as Mission);
    }

    setLoading(false);
  }, [missionId]);

  useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  useEffect(() => {
    if (!missionId) return;

    const channel = supabase
      .channel(`mission:${missionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'missions',
          filter: `id=eq.${missionId}`,
        },
        (payload) => {
          const update = payload.new as Mission;
          setMission((prev) => (prev ? { ...prev, ...update } : update));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [missionId]);

  return { mission, loading, error, refetch: fetchMission };
}

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMissions(data as Mission[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  useEffect(() => {
    const channel = supabase
      .channel('missions:list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'missions',
        },
        (payload) => {
          const newMission = payload.new as Mission;
          setMissions((prev) => [newMission, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { missions, loading, error, refetch: fetchMissions };
}
