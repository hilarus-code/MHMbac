-- ============================================================================
-- MHM SOLUTIONS — Après Mon Bac
-- Migration Additive Idempotente : Schéma Temps Réel (Live Data & Extension Sync)
-- Créateur : Hilarus GBAGOULE
-- ============================================================================

-- 1. TABLE : live_programmes (Dernier état connu et consolidé de chaque filière)
CREATE TABLE IF NOT EXISTS public.live_programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id INTEGER NOT NULL UNIQUE,
    university_id INTEGER,
    university TEXT NOT NULL,
    school_id INTEGER,
    school TEXT NOT NULL,
    programme TEXT NOT NULL,
    domain TEXT DEFAULT 'Général',
    scholarships INTEGER NOT NULL DEFAULT 0,
    aid INTEGER NOT NULL DEFAULT 0,
    tb INTEGER NOT NULL DEFAULT 0,
    b INTEGER NOT NULL DEFAULT 0,
    ab INTEGER NOT NULL DEFAULT 0,
    passable INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    capacity INTEGER,
    applicants INTEGER,
    raw_gauge JSONB,
    score_version TEXT DEFAULT 'v1',
    score_opportunity INTEGER DEFAULT 50,
    score_scholarship INTEGER DEFAULT 0,
    score_admission INTEGER DEFAULT 50,
    score_confidence TEXT DEFAULT 'Moyen',
    factors JSONB DEFAULT '[]'::JSONB,
    source TEXT DEFAULT 'chrome_extension',
    observed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour requêtes performantes
CREATE INDEX IF NOT EXISTS idx_live_prog_programme_id ON public.live_programmes(programme_id);
CREATE INDEX IF NOT EXISTS idx_live_prog_university_id ON public.live_programmes(university_id);
CREATE INDEX IF NOT EXISTS idx_live_prog_school_id ON public.live_programmes(school_id);
CREATE INDEX IF NOT EXISTS idx_live_prog_score_opportunity ON public.live_programmes(score_opportunity DESC);
CREATE INDEX IF NOT EXISTS idx_live_prog_observed_at ON public.live_programmes(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_prog_updated_at ON public.live_programmes(updated_at DESC);

-- 2. TABLE : gauge_observations (Historique immuable des snapshots capturés)
CREATE TABLE IF NOT EXISTS public.gauge_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id INTEGER NOT NULL,
    batch_id TEXT NOT NULL,
    snapshot_hash TEXT NOT NULL,
    payload JSONB NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    source TEXT DEFAULT 'chrome_extension',
    extension_version TEXT,
    score_version TEXT DEFAULT 'v1',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_prog_snapshot UNIQUE(programme_id, snapshot_hash)
);

CREATE INDEX IF NOT EXISTS idx_observations_prog_id ON public.gauge_observations(programme_id);
CREATE INDEX IF NOT EXISTS idx_observations_batch_id ON public.gauge_observations(batch_id);
CREATE INDEX IF NOT EXISTS idx_observations_observed_at ON public.gauge_observations(observed_at DESC);

-- 3. TABLE : gauge_alerts (Journal des variations réelles de jauges et quotas)
CREATE TABLE IF NOT EXISTS public.gauge_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id INTEGER NOT NULL,
    university TEXT NOT NULL,
    school TEXT NOT NULL,
    programme TEXT NOT NULL,
    field_name TEXT NOT NULL, -- 'total', 'scholarships', 'aid', 'passable', 'applicants', 'rank', 'capacity'
    old_value NUMERIC,
    new_value NUMERIC,
    delta NUMERIC,
    batch_id TEXT,
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_prog_id ON public.gauge_alerts(programme_id);
CREATE INDEX IF NOT EXISTS idx_alerts_batch_id ON public.gauge_alerts(batch_id);
CREATE INDEX IF NOT EXISTS idx_alerts_observed_at ON public.gauge_alerts(observed_at DESC);

-- 4. TABLE : sync_batches (Audit et traçabilité de chaque lot reçu de l'extension)
CREATE TABLE IF NOT EXISTS public.sync_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'chrome_extension',
    extension_version TEXT,
    series TEXT,
    criteria JSONB,
    received_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    alert_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed', -- 'completed', 'partial', 'failed'
    error_message TEXT,
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_batches_observed_at ON public.sync_batches(observed_at DESC);

-- ============================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.live_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gauge_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gauge_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_batches ENABLE ROW LEVEL SECURITY;

-- Politiques SELECT publiques (Lecture anonyme et authentifiée autorisée pour exploration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'live_programmes' AND policyname = 'live_programmes_read_public') THEN
        CREATE POLICY "live_programmes_read_public" ON public.live_programmes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gauge_observations' AND policyname = 'gauge_observations_read_public') THEN
        CREATE POLICY "gauge_observations_read_public" ON public.gauge_observations FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gauge_alerts' AND policyname = 'gauge_alerts_read_public') THEN
        CREATE POLICY "gauge_alerts_read_public" ON public.gauge_alerts FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_batches' AND policyname = 'sync_batches_read_public') THEN
        CREATE POLICY "sync_batches_read_public" ON public.sync_batches FOR SELECT USING (true);
    END IF;
END $$;

-- Écritures : Strictement restreintes au Service Role / Backend Edge (pas de write public direct)

-- Trigger de mise à jour automatique de updated_at sur live_programmes
CREATE OR REPLACE FUNCTION public.handle_live_programmes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_live_programmes_updated ON public.live_programmes;
CREATE TRIGGER on_live_programmes_updated
    BEFORE UPDATE ON public.live_programmes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_live_programmes_updated_at();

-- Activer Realtime pour les tables de diffusion
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_programmes, public.gauge_alerts, public.sync_batches;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN undefined_object THEN NULL;
    END;
END $$;
