/**
 * MHM SOLUTIONS — Après Mon Bac
 * Supabase Edge Function: mhmbac-sync
 * Créateur : Hilarus GBAGOULE
 * 
 * Synchronisation sécurisée et idempotente des jauges publiques observées
 * par l'extension Chrome sur apresmonbac.bj.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-mhm-token, x-api-key",
};

interface SyncItem {
  universityId?: number;
  university: string;
  schoolId?: number;
  school: string;
  programmeId: number;
  programme: string;
  scholarships: number;
  aid: number;
  tb: number;
  b: number;
  ab: number;
  passable: number;
  total: number;
  rank?: number | null;
  capacity?: number | null;
  applicants?: number | null;
  rawGauge?: Record<string, unknown> | null;
  observedAt?: string;
}

interface SyncPayload {
  schemaVersion?: string;
  batchId: string;
  source: string;
  extensionVersion?: string;
  scoreVersion?: string;
  series?: string;
  criteria?: {
    mention?: string;
    goal?: string;
    careerKeywords?: string;
  };
  observedAt: string;
  items: SyncItem[];
}

async function computeHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

serve(async (req: Request) => {
  // 1. Gestion OPTIONS CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée. Seul POST est accepté." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Vérification sécurisée du jeton MHM_SYNC_TOKEN
  const expectedSyncToken = Deno.env.get("MHM_SYNC_TOKEN") || Deno.env.get("MHMBAC_SYNC_API_KEY");
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const customHeaderToken = req.headers.get("x-mhm-token") || req.headers.get("x-api-key") || "";
  const incomingToken = customHeaderToken || bearerToken;

  if (expectedSyncToken) {
    if (!incomingToken || incomingToken !== expectedSyncToken) {
      return new Response(
        JSON.stringify({
          error: "Accès refusé : jeton MHM_SYNC_TOKEN invalide ou manquant.",
          details: "L'extension Chrome doit configurer window.MHM_CONFIG.MHM_SYNC_TOKEN dans config.js avec le jeton secret correspondant.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  try {
    const rawBody = await req.text();
    let payload: SyncPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Corps de requête JSON invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Validation du payload
    if (!payload.batchId || typeof payload.batchId !== "string") {
      return new Response(JSON.stringify({ error: "batchId obligatoire et doit être une chaîne" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(payload.items)) {
      return new Response(JSON.stringify({ error: "items obligatoire et doit être un tableau" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.items.length === 0) {
      return new Response(JSON.stringify({ error: "Le lot d'items ne peut pas être vide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.items.length > 500) {
      return new Response(JSON.stringify({ error: "Taille de lot maximale dépassée (500 items max)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Validation des items et Déduplication par programmeId
    const dedupedMap = new Map<number, SyncItem>();
    const validationErrors: string[] = [];

    for (let i = 0; i < payload.items.length; i++) {
      const it = payload.items[i];
      if (!it || typeof it !== "object") {
        validationErrors.push(`Item à l'index ${i} invalide`);
        continue;
      }

      const pId = Number(it.programmeId);
      if (!pId || isNaN(pId) || pId <= 0) {
        validationErrors.push(`Item à l'index ${i} : programmeId manquant ou invalide`);
        continue;
      }

      if (!it.university || typeof it.university !== "string") {
        validationErrors.push(`Item ${pId} : université manquante`);
        continue;
      }
      if (!it.school || typeof it.school !== "string") {
        validationErrors.push(`Item ${pId} : établissement manquant`);
        continue;
      }
      if (!it.programme || typeof it.programme !== "string") {
        validationErrors.push(`Item ${pId} : filière manquante`);
        continue;
      }

      // Normalisation des jauges entières >= 0
      const normalized: SyncItem = {
        universityId: it.universityId ? Number(it.universityId) : undefined,
        university: String(it.university).trim(),
        schoolId: it.schoolId ? Number(it.schoolId) : undefined,
        school: String(it.school).trim(),
        programmeId: pId,
        programme: String(it.programme).trim(),
        scholarships: Math.max(0, Math.floor(Number(it.scholarships) || 0)),
        aid: Math.max(0, Math.floor(Number(it.aid) || 0)),
        tb: Math.max(0, Math.floor(Number(it.tb) || 0)),
        b: Math.max(0, Math.floor(Number(it.b) || 0)),
        ab: Math.max(0, Math.floor(Number(it.ab) || 0)),
        passable: Math.max(0, Math.floor(Number(it.passable) || 0)),
        total: Math.max(0, Math.floor(Number(it.total) || 0)),
        rank: it.rank !== null && it.rank !== undefined ? Math.max(1, Math.floor(Number(it.rank))) : null,
        capacity: it.capacity !== null && it.capacity !== undefined ? Math.max(1, Math.floor(Number(it.capacity))) : null,
        applicants: it.applicants !== null && it.applicants !== undefined ? Math.max(0, Math.floor(Number(it.applicants))) : null,
        rawGauge: it.rawGauge || null,
        observedAt: it.observedAt || payload.observedAt || new Date().toISOString(),
      };

      dedupedMap.set(pId, normalized);
    }

    if (validationErrors.length > 0 && dedupedMap.size === 0) {
      return new Response(JSON.stringify({ error: "Aucun item valide dans le lot", details: validationErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validItems = Array.from(dedupedMap.values());
    const observedAt = payload.observedAt || new Date().toISOString();

    // 4. Initialisation du client Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Récupération des anciens enregistrements existants pour détecter les variations
    const programmeIds = validItems.map((v) => v.programmeId);
    const { data: existingProgrammes } = await supabase
      .from("live_programmes")
      .select("*")
      .in("programme_id", programmeIds);

    const existingMap = new Map<number, Record<string, unknown>>();
    if (existingProgrammes) {
      for (const ep of existingProgrammes) {
        existingMap.set(ep.programme_id, ep);
      }
    }

    const alertsToInsert: Record<string, unknown>[] = [];
    const observationsToInsert: Record<string, unknown>[] = [];
    const upsertsToRun: Record<string, unknown>[] = [];

    for (const item of validItems) {
      const existing = existingMap.get(item.programmeId);

      // Calcul des alertes de variation
      if (existing) {
        const fieldsToCheck = [
          { name: "total", oldVal: Number(existing.total), newVal: item.total },
          { name: "scholarships", oldVal: Number(existing.scholarships), newVal: item.scholarships },
          { name: "aid", oldVal: Number(existing.aid), newVal: item.aid },
          { name: "passable", oldVal: Number(existing.passable), newVal: item.passable },
          { name: "applicants", oldVal: existing.applicants !== null ? Number(existing.applicants) : null, newVal: item.applicants },
          { name: "rank", oldVal: existing.rank !== null ? Number(existing.rank) : null, newVal: item.rank },
        ];

        for (const f of fieldsToCheck) {
          if (f.oldVal !== null && f.newVal !== null && f.oldVal !== f.newVal) {
            alertsToInsert.push({
              programme_id: item.programmeId,
              university: item.university,
              school: item.school,
              programme: item.programme,
              field_name: f.name,
              old_value: f.oldVal,
              new_value: f.newVal,
              delta: f.newVal - f.oldVal,
              batch_id: payload.batchId,
              observed_at: observedAt,
            });
          }
        }
      }

      // Empreinte SHA-256 pour déduplication d'historique
      const rawSnapshotStr = `${item.programmeId}_${item.total}_${item.scholarships}_${item.aid}_${item.passable}_${item.applicants ?? "na"}_${item.rank ?? "na"}`;
      const snapshotHash = await computeHash(rawSnapshotStr);

      observationsToInsert.push({
        programme_id: item.programmeId,
        batch_id: payload.batchId,
        snapshot_hash: snapshotHash,
        payload: item,
        observed_at: observedAt,
        source: payload.source || "chrome_extension",
        extension_version: payload.extensionVersion || "0.3.0",
        score_version: "v1",
      });

      // Calcul du score déterministe serveur
      const totalSlots = Math.max(1, item.total || (item.scholarships + item.aid));
      const scholarshipRatio = Math.min(1.0, (item.scholarships + item.aid * 0.5) / totalSlots);
      const scoreScholarship = Math.min(100, Math.round(scholarshipRatio * 100));

      let competitionIndex = 50;
      if (item.applicants && item.capacity && item.capacity > 0) {
        competitionIndex = Math.min(100, Math.round((item.applicants / item.capacity) * 30));
      }

      const scoreAdmission = 75;
      const scoreOpportunity = Math.min(100, Math.max(10, Math.round(scoreAdmission * 0.4 + scoreScholarship * 0.35 + (100 - competitionIndex) * 0.25)));

      upsertsToRun.push({
        programme_id: item.programmeId,
        university_id: item.universityId || null,
        university: item.university,
        school_id: item.schoolId || null,
        school: item.school,
        programme: item.programme,
        domain: "Général",
        scholarships: item.scholarships,
        aid: item.aid,
        tb: item.tb,
        b: item.b,
        ab: item.ab,
        passable: item.passable,
        total: item.total,
        rank: item.rank,
        capacity: item.capacity,
        applicants: item.applicants,
        raw_gauge: item.rawGauge,
        score_version: "v1",
        score_opportunity: scoreOpportunity,
        score_scholarship: scoreScholarship,
        score_admission: scoreAdmission,
        score_confidence: item.total > 0 ? "Élevé" : "Moyen",
        source: payload.source || "chrome_extension",
        observed_at: observedAt,
      });
    }

    // 6. Exécution des écritures
    // A. Upsert dans live_programmes
    const { error: upsertErr } = await supabase
      .from("live_programmes")
      .upsert(upsertsToRun, { onConflict: "programme_id" });

    if (upsertErr) {
      console.error("Erreur upsert live_programmes:", upsertErr);
    }

    // B. Insert des observations (on conflict ignore)
    if (observationsToInsert.length > 0) {
      await supabase
        .from("gauge_observations")
        .upsert(observationsToInsert, { onConflict: "programme_id,snapshot_hash", ignoreDuplicates: true });
    }

    // C. Insert des alertes s'il y a des deltas
    if (alertsToInsert.length > 0) {
      await supabase.from("gauge_alerts").insert(alertsToInsert);
    }

    // D. Enregistrement du batch
    await supabase.from("sync_batches").upsert({
      batch_id: payload.batchId,
      source: payload.source || "chrome_extension",
      extension_version: payload.extensionVersion || "0.3.0",
      series: payload.series || null,
      criteria: payload.criteria || null,
      received_count: payload.items.length,
      updated_count: upsertsToRun.length,
      alert_count: alertsToInsert.length,
      status: "completed",
      observed_at: observedAt,
    }, { onConflict: "batch_id" });

    return new Response(
      JSON.stringify({
        ok: true,
        batchId: payload.batchId,
        received: payload.items.length,
        updated: upsertsToRun.length,
        alerts: alertsToInsert.length,
        scoreVersion: "v1",
        observedAt,
        freshness: { minutes: 0 },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur interne de synchronisation";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
