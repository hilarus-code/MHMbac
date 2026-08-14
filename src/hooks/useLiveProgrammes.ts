/**
 * MHM SOLUTIONS — Après Mon Bac
 * Hook React pour la synchronisation temps réel des filières et jauges observées
 * Créateur : Hilarus GBAGOULE
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LiveProgramme, ScoredLiveProgramme, UserProfile, UserPreferences } from '../types/orientation';
import { rankLiveProgrammes } from '../lib/ranking';

export interface LiveStats {
  totalProgrammes: number;
  totalUniversities: number;
  totalSchools: number;
  totalAlerts: number;
  lastObservedAt: string | null;
  diffMinutes: number | null;
  source: string;
}

export interface GaugeAlertItem {
  id: string;
  programme_id: number;
  university: string;
  school: string;
  programme: string;
  field_name: string;
  old_value: number | null;
  new_value: number | null;
  delta: number | null;
  batch_id?: string;
  observed_at: string;
}

export function useLiveProgrammes(
  profile: Partial<UserProfile> | null = null,
  preferences: Partial<UserPreferences> | null = null
) {
  const [liveProgrammes, setLiveProgrammes] = useState<LiveProgramme[]>([]);
  const [alerts, setAlerts] = useState<GaugeAlertItem[]>([]);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Récupération des données via API ou Supabase
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // 1. Tenter via Supabase Client si configuré
      if (isSupabaseConfigured) {
        const { data: progData, error: progErr } = await supabase
          .from('live_programmes')
          .select('*')
          .order('score_opportunity', { ascending: false });

        if (!progErr && progData && progData.length > 0) {
          setLiveProgrammes(progData as LiveProgramme[]);

          // Alertes
          const { data: alertData } = await supabase
            .from('gauge_alerts')
            .select('*')
            .order('observed_at', { ascending: false })
            .limit(20);

          if (alertData) {
            setAlerts(alertData as GaugeAlertItem[]);
          }

          // Stats
          const univs = new Set(progData.map((p) => p.university));
          const schools = new Set(progData.map((p) => p.school));
          const latest = progData[0]?.observed_at || null;
          const diffMin = latest
            ? Math.max(1, Math.floor((Date.now() - new Date(latest).getTime()) / 60000))
            : null;

          setStats({
            totalProgrammes: progData.length,
            totalUniversities: univs.size,
            totalSchools: schools.size,
            totalAlerts: alertData?.length || 0,
            lastObservedAt: latest,
            diffMinutes: diffMin,
            source: 'Supabase Realtime Cloud',
          });

          setLastSyncTime(new Date());
          setLoading(false);
          return;
        }
      }

      // 2. Fallback via API Backend
      const res = await fetch('/api/live-programmes');
      if (res.ok) {
        const json = await res.json();
        const items = json.data || [];
        setLiveProgrammes(items);

        // Récupérer les stats
        try {
          const statsRes = await fetch('/api/live-stats');
          if (statsRes.ok) {
            const statsJson = await statsRes.json();
            setStats(statsJson);
          }
        } catch {
          // Ignorer
        }

        // Récupérer les alertes
        try {
          const alertsRes = await fetch('/api/gauge-alerts');
          if (alertsRes.ok) {
            const alertsJson = await alertsRes.json();
            setAlerts(alertsJson.data || []);
          }
        } catch {
          // Ignorer
        }

        // Si la liste est vide, on peut initialiser les données représentatives automatiquement
        if (items.length === 0) {
          const seedRes = await fetch('/api/seed-live-demo', { method: 'POST' });
          if (seedRes.ok) {
            const refreshRes = await fetch('/api/live-programmes');
            if (refreshRes.ok) {
              const refJson = await refreshRes.json();
              setLiveProgrammes(refJson.data || []);
            }
          }
        }
      } else {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement des jauges';
      console.warn('Impossible de charger les données live:', msg);
      setError(msg);
    } finally {
      setLoading(false);
      setLastSyncTime(new Date());
    }
  }, []);

  // Initialisation et abonnement Realtime
  useEffect(() => {
    fetchData();

    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel('live-programmes-realtime-feed')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'live_programmes' },
            (payload) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const updated = payload.new as LiveProgramme;
                setLiveProgrammes((prev) => {
                  const filtered = prev.filter((p) => p.programme_id !== updated.programme_id);
                  return [updated, ...filtered].sort(
                    (a, b) => (b.score_opportunity || 0) - (a.score_opportunity || 0)
                  );
                });
                setLastSyncTime(new Date());
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'gauge_alerts' },
            (payload) => {
              const newAlert = payload.new as GaugeAlertItem;
              setAlerts((prev) => [newAlert, ...prev.slice(0, 49)]);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsRealtimeActive(true);
            } else {
              setIsRealtimeActive(false);
            }
          });
      } catch (err) {
        console.warn('Erreur subscription Supabase Realtime:', err);
      }
    }

    // Polling de secours toutes les 30s
    const pollInterval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      clearInterval(pollInterval);
    };
  }, [fetchData]);

  // Calcul du classement dynamique pondéré pour l'utilisateur
  const scoredProgrammes: ScoredLiveProgramme[] = useMemo(() => {
    if (!liveProgrammes || liveProgrammes.length === 0) return [];
    return rankLiveProgrammes(liveProgrammes, profile, preferences);
  }, [liveProgrammes, profile, preferences]);

  // Déclencheur manuel de seed/sync
  const triggerSyncSeed = async () => {
    setLoading(true);
    try {
      await fetch('/api/seed-live-demo', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Erreur seed live:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    liveProgrammes,
    scoredProgrammes,
    alerts,
    stats,
    loading,
    isRealtimeActive,
    error,
    lastSyncTime,
    refresh: fetchData,
    triggerSyncSeed,
  };
}
