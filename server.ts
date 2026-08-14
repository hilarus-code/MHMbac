/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Serveur Backend Express & Connexion Directe URI (PostgreSQL / Supabase / Neon / Cloud SQL)
 * Fondateur & Concepteur : Hilarus GBAGOULE
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { Pool, PoolConfig } from 'pg';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// GESTION DE LA CONNEXION DIRECTE PAR URI (POSTGRESQL / SUPABASE)
// ============================================================================

const databaseUri =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URI ||
  process.env.DIRECT_URL ||
  '';

let pool: Pool | null = null;
let isDbConnected = false;
let dbConnectionError: string | null = null;
let lastHealthCheck = new Date();

function maskUri(uri: string): string {
  if (!uri) return 'Non configurée (Mode In-Memory Actif)';
  try {
    const parsed = new URL(uri);
    const maskedPassword = parsed.password ? '••••••••' : '';
    const authPart = parsed.username
      ? `${parsed.username}${maskedPassword ? ':' + maskedPassword : ''}@`
      : '';
    return `${parsed.protocol}//${authPart}${parsed.host}${parsed.pathname}`;
  } catch {
    // If not a standard URL, mask password-like strings
    return uri.replace(/:([^@]+)@/, ':••••••••@');
  }
}

function createDbPool(uri: string): Pool | null {
  if (!uri) return null;
  try {
    const config: PoolConfig = {
      connectionString: uri,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    // Activer SSL si nécessaire (Supabase, Neon, Cloud SQL, Railway, etc.)
    if (!uri.includes('localhost') && !uri.includes('127.0.0.1')) {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }

    return new Pool(config);
  } catch (err: any) {
    console.error('❌ Erreur création pool PostgreSQL:', err.message);
    dbConnectionError = err.message;
    return null;
  }
}

// Initialisation du pool principal
if (databaseUri) {
  pool = createDbPool(databaseUri);
}

// ============================================================================
// MAGASIN DE SECOURS EN MÉMOIRE (FALLBACK LORSQUE L'URI N'EST PAS ENCORE FOURNIE)
// ============================================================================

interface MemoryDb {
  profiles: Map<string, any>;
  preferences: Map<string, any>;
  programmes: any[];
  shortlists: any[];
}

const memoryDb: MemoryDb = {
  profiles: new Map([
    [
      'usr-demo-001',
      {
        id: 'usr-demo-001',
        display_name: 'Stéphane Dossou',
        email: 'stephane.dossou@mhmsolutions.bj',
        series: 'D',
        mention: 'Bien',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  ]),
  preferences: new Map([
    [
      'usr-demo-001',
      {
        id: 'pref-demo-001',
        user_id: 'usr-demo-001',
        primary_goal: 'carriere',
        career_keywords: ['Informatique', 'Génie Logiciel', 'Intelligence Artificielle'],
        preferred_universities: ['Université d’Abomey-Calavi (UAC)'],
        scholarship_priority: 60,
        career_priority: 95,
        competition_priority: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  ]),
  programmes: [
    {
      id: 'prg-001',
      university: "Université d'Abomey-Calavi (UAC)",
      school: "IFRI (Institut de Formation et de Recherche en Informatique)",
      programme: "Génie Logiciel & Systèmes d'Information",
      domain: "Informatique & Numérique",
      admissible_series: ['C', 'D', 'E'],
      is_demo: true,
    },
    {
      id: 'prg-002',
      university: "Université d'Abomey-Calavi (UAC)",
      school: "EPAC (École Polytechnique d'Abomey-Calavi)",
      programme: "Génie Civil & Bâtiment",
      domain: "Génie Civil & BTP",
      admissible_series: ['C', 'D', 'E'],
      is_demo: true,
    },
    {
      id: 'prg-003',
      university: "Université d'Abomey-Calavi (UAC)",
      school: "FSS (Faculté des Sciences de la Santé)",
      programme: "Médecine Générale & Sciences Biomédicales",
      domain: "Santé & Médecine",
      admissible_series: ['C', 'D'],
      is_demo: true,
    },
    {
      id: 'prg-004',
      university: "Université Nationale d'Agriculture (UNA)",
      school: "EAC (École d'Agrobusiness et de Commercialisation)",
      programme: "Agrobusiness & Économie Rurale",
      domain: "Agriculture & Agroalimentaire",
      admissible_series: ['A', 'B', 'C', 'D', 'E'],
      is_demo: true,
    },
    {
      id: 'prg-005',
      university: "Université Nationale d'Agriculture (UNA)",
      school: "ESA (École des Sciences Agronomiques)",
      programme: "Production Végétale & Protection des Cultures",
      domain: "Agriculture & Environnement",
      admissible_series: ['C', 'D'],
      is_demo: true,
    },
    {
      id: 'prg-006',
      university: "Université Nationale des Sciences (UNSTIM)",
      school: "ENS-Natitingou",
      programme: "Sciences Physiques & Enseignement",
      domain: "Enseignement & Éducation",
      admissible_series: ['C', 'D', 'E'],
      is_demo: true,
    },
    {
      id: 'prg-007',
      university: "Université de Parakou (UP)",
      school: "IUT (Institut Universitaire de Technologie)",
      programme: "Gestion des Banques & Finances d'Entreprise",
      domain: "Finance & Gestion",
      admissible_series: ['B', 'C', 'D', 'G2'],
      is_demo: true,
    },
    {
      id: 'prg-008',
      university: "Université de Parakou (UP)",
      school: "FA (Faculté d'Agronomie)",
      programme: "Foresterie & Gestion des Ressources Naturelles",
      domain: "Environnement & Forêts",
      admissible_series: ['C', 'D'],
      is_demo: true,
    },
    {
      id: 'prg-009',
      university: "Université d'Abomey-Calavi (UAC)",
      school: "FASEG",
      programme: "Sciences Économiques et Gestion Commerciale",
      domain: "Commerce & Gestion",
      admissible_series: ['B', 'C', 'D'],
      is_demo: true,
    },
    {
      id: 'prg-010',
      university: "Université d'Abomey-Calavi (UAC)",
      school: "FADESP",
      programme: "Droit et Administration Publique",
      domain: "Administration & Droit",
      admissible_series: ['A', 'B', 'C', 'D'],
      is_demo: true,
    },
  ],
  shortlists: [],
};

// ============================================================================
// INITIALISATION DU SCHÉMA & MIGRATION AUTOMATIQUE SQL
// ============================================================================

async function initializeDatabaseSchema(activePool: Pool): Promise<{ success: boolean; message: string }> {
  const client = await activePool.connect();
  try {
    await client.query('BEGIN');

    // Extension UUID si supportée
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    } catch {
      // Ignorer si pas superutilisateur
    }

    // 1. Table Profiles
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        email TEXT,
        series TEXT,
        mention TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Table User Preferences
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_preferences (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id TEXT NOT NULL UNIQUE,
        primary_goal TEXT NOT NULL DEFAULT 'carriere',
        career_keywords TEXT[] DEFAULT '{}'::TEXT[],
        preferred_universities TEXT[] DEFAULT '{}'::TEXT[],
        scholarship_priority INTEGER DEFAULT 50,
        career_priority INTEGER DEFAULT 50,
        competition_priority INTEGER DEFAULT 50,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Table Demo Programmes
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.demo_programmes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        university TEXT NOT NULL,
        school TEXT NOT NULL,
        programme TEXT NOT NULL,
        domain TEXT NOT NULL,
        admissible_series TEXT[] DEFAULT '{}'::TEXT[],
        is_demo BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Table Shortlists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.future_user_shortlists (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id TEXT NOT NULL,
        programme_id TEXT NOT NULL,
        notes TEXT,
        order_rank INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Table System Config / Observation Gauges
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.future_gauge_observations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        programme_id TEXT,
        observation_source TEXT NOT NULL DEFAULT 'mhm_core',
        scholarship_ratio NUMERIC(5,2),
        competition_index NUMERIC(5,2),
        recorded_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Insérer les programmes de démonstration si la table est vide
    const countRes = await client.query('SELECT COUNT(*) FROM public.demo_programmes');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      for (const p of memoryDb.programmes) {
        await client.query(
          `INSERT INTO public.demo_programmes (id, university, school, programme, domain, is_demo)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [p.id, p.university, p.school, p.programme, p.domain, p.is_demo]
        );
      }
    }

    await client.query('COMMIT');
    return {
      success: true,
      message: 'Schéma PostgreSQL vérifié et initialisé avec succès.',
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur initialisation schéma SQL:', err);
    return {
      success: false,
      message: `Erreur initialisation schéma : ${err.message}`,
    };
  } finally {
    client.release();
  }
}

// Test de connexion initial
async function testInitialConnection() {
  if (!pool) {
    console.log('ℹ️ Aucune variable DATABASE_URL détectée. Le mode Direct In-Memory est actif.');
    isDbConnected = false;
    return;
  }

  try {
    const start = Date.now();
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as current_time, current_database() as db_name, version() as pg_version');
    client.release();
    const latency = Date.now() - start;

    isDbConnected = true;
    dbConnectionError = null;
    console.log(
      `✅ Connexion Directe URI PostgreSQL Réussie ! Base: ${res.rows[0].db_name} (${latency}ms)`
    );

    // Initialiser le schéma automatiquement
    await initializeDatabaseSchema(pool);
  } catch (err: any) {
    isDbConnected = false;
    dbConnectionError = err.message;
    console.warn(`⚠️ Connexion PostgreSQL URI non disponible (${err.message}). Utilisation du fallback In-Memory.`);
  }
}

testInitialConnection();

// ============================================================================
// GEMINI AI INTEGRATION (SERVEUR SÉCURISÉ)
// ============================================================================

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Santé du serveur & Diagnostic de connexion URI
app.get('/api/health', async (req, res) => {
  lastHealthCheck = new Date();
  let dbLatency = null;
  let dbInfo = null;

  if (pool && isDbConnected) {
    try {
      const start = Date.now();
      const dbRes = await pool.query('SELECT NOW() as time, current_database() as db, current_user as user');
      dbLatency = `${Date.now() - start}ms`;
      dbInfo = {
        database: dbRes.rows[0].db,
        user: dbRes.rows[0].user,
      };
    } catch {
      isDbConnected = false;
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MHM SOLUTIONS — Backend Direct URI Service',
    database: {
      connected: isDbConnected,
      mode: isDbConnected ? 'PostgreSQL Direct URI (Production)' : 'In-Memory / Local Cache Fallback',
      uriConfigured: Boolean(databaseUri),
      maskedUri: maskUri(databaseUri),
      latency: dbLatency,
      info: dbInfo,
      error: dbConnectionError,
    },
    ai_service: {
      configured: Boolean(process.env.GEMINI_API_KEY),
    },
  });
});

// 2. Statut détaillé & Statistiques des tables
app.get('/api/db/status', async (req, res) => {
  try {
    if (pool && isDbConnected) {
      const start = Date.now();
      const tablesRes = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const tables = tablesRes.rows.map((r: any) => r.table_name);
      const counts: Record<string, number> = {};

      for (const table of tables) {
        try {
          const c = await pool.query(`SELECT COUNT(*) FROM public."${table}"`);
          counts[table] = parseInt(c.rows[0].count, 10);
        } catch {
          counts[table] = 0;
        }
      }

      res.json({
        connected: true,
        mode: 'PostgreSQL Direct URI',
        maskedUri: maskUri(databaseUri),
        latencyMs: Date.now() - start,
        tables,
        counts,
        totalTables: tables.length,
        poolStats: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        },
      });
    } else {
      res.json({
        connected: false,
        mode: 'In-Memory Simulation Store',
        maskedUri: maskUri(databaseUri),
        error: dbConnectionError || 'DATABASE_URL non configurée ou inaccessible',
        counts: {
          profiles: memoryDb.profiles.size,
          preferences: memoryDb.preferences.size,
          programmes: memoryDb.programmes.length,
          shortlists: memoryDb.shortlists.length,
        },
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Test dynamique d'une URI de connexion
app.post('/api/db/test-connection', async (req, res) => {
  const { customUri } = req.body;
  const targetUri = customUri || databaseUri;

  if (!targetUri) {
    return res.status(400).json({
      success: false,
      error: 'Aucune URI fournie pour le test.',
    });
  }

  const testPool = createDbPool(targetUri);
  if (!testPool) {
    return res.status(400).json({
      success: false,
      error: "Format d'URI PostgreSQL invalide.",
    });
  }

  try {
    const start = Date.now();
    const client = await testPool.connect();
    const result = await client.query(`
      SELECT 
        NOW() as server_time,
        current_database() as database_name,
        current_user as database_user,
        version() as postgres_version
    `);
    client.release();
    await testPool.end();

    const latency = Date.now() - start;

    res.json({
      success: true,
      message: 'Connexion directe PostgreSQL établie avec succès !',
      database: result.rows[0].database_name,
      user: result.rows[0].database_user,
      version: result.rows[0].postgres_version.split(',')[0],
      latencyMs: latency,
      maskedUri: maskUri(targetUri),
    });
  } catch (err: any) {
    try {
      await testPool.end();
    } catch {
      // Ignorer
    }
    res.status(500).json({
      success: false,
      error: `Échec de connexion : ${err.message}`,
      maskedUri: maskUri(targetUri),
    });
  }
});

// 4. Initialisation du schéma SQL sur demande
app.post('/api/db/init-schema', async (req, res) => {
  if (!pool || !isDbConnected) {
    return res.status(400).json({
      success: false,
      error: 'Aucune base de données PostgreSQL connectée via URI pour exécuter le schéma.',
    });
  }

  try {
    const result = await initializeDatabaseSchema(pool);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Programmes d'Orientation (Lecture & Création)
app.get('/api/programmes', async (req, res) => {
  try {
    if (pool && isDbConnected) {
      const result = await pool.query('SELECT * FROM public.demo_programmes ORDER BY created_at ASC');
      return res.json({
        data: result.rows,
        source: 'PostgreSQL Direct URI',
      });
    }
    res.json({
      data: memoryDb.programmes,
      source: 'In-Memory Store',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, fallbackData: memoryDb.programmes });
  }
});

app.post('/api/programmes', async (req, res) => {
  const { university, school, programme, domain, admissible_series } = req.body;
  if (!university || !programme || !domain) {
    return res.status(400).json({ error: 'Champs obligatoires manquants (university, programme, domain).' });
  }

  const newProg = {
    id: `prg-${Date.now()}`,
    university,
    school: school || university,
    programme,
    domain,
    admissible_series: admissible_series || ['A', 'B', 'C', 'D', 'E'],
    is_demo: false,
    created_at: new Date().toISOString(),
  };

  try {
    if (pool && isDbConnected) {
      const query = `
        INSERT INTO public.demo_programmes (id, university, school, programme, domain, is_demo)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const result = await pool.query(query, [
        newProg.id,
        newProg.university,
        newProg.school,
        newProg.programme,
        newProg.domain,
        newProg.is_demo,
      ]);
      return res.status(201).json(result.rows[0]);
    }

    memoryDb.programmes.push(newProg);
    res.status(201).json(newProg);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Profil Utilisateur (CRUD direct)
app.get('/api/profile/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (pool && isDbConnected) {
      const result = await pool.query('SELECT * FROM public.profiles WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      }
    }
    const memProfile = memoryDb.profiles.get(id);
    if (memProfile) {
      return res.json(memProfile);
    }
    res.status(404).json({ error: 'Profil non trouvé.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile/:id', async (req, res) => {
  const { id } = req.params;
  const { display_name, email, series, mention } = req.body;

  const profileData = {
    id,
    display_name: display_name || 'Bachelier',
    email: email || '',
    series: series || null,
    mention: mention || null,
    updated_at: new Date().toISOString(),
  };

  try {
    if (pool && isDbConnected) {
      const query = `
        INSERT INTO public.profiles (id, display_name, email, series, mention, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          email = COALESCE(EXCLUDED.email, public.profiles.email),
          series = EXCLUDED.series,
          mention = EXCLUDED.mention,
          updated_at = NOW()
        RETURNING *;
      `;
      const result = await pool.query(query, [
        profileData.id,
        profileData.display_name,
        profileData.email,
        profileData.series,
        profileData.mention,
      ]);
      return res.json(result.rows[0]);
    }

    memoryDb.profiles.set(id, {
      ...memoryDb.profiles.get(id),
      ...profileData,
    });
    res.json(memoryDb.profiles.get(id));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Préférences Utilisateur (CRUD direct)
app.get('/api/preferences/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    if (pool && isDbConnected) {
      const result = await pool.query('SELECT * FROM public.user_preferences WHERE user_id = $1', [userId]);
      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      }
    }
    const memPref = memoryDb.preferences.get(userId);
    if (memPref) {
      return res.json(memPref);
    }
    res.status(404).json({ error: 'Préférences non trouvées.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/preferences/:userId', async (req, res) => {
  const { userId } = req.params;
  const {
    primary_goal,
    career_keywords,
    preferred_universities,
    scholarship_priority,
    career_priority,
    competition_priority,
  } = req.body;

  const prefData = {
    user_id: userId,
    primary_goal: primary_goal || 'carriere',
    career_keywords: Array.isArray(career_keywords) ? career_keywords : [],
    preferred_universities: Array.isArray(preferred_universities) ? preferred_universities : [],
    scholarship_priority: scholarship_priority ?? 50,
    career_priority: career_priority ?? 50,
    competition_priority: competition_priority ?? 50,
    updated_at: new Date().toISOString(),
  };

  try {
    if (pool && isDbConnected) {
      const query = `
        INSERT INTO public.user_preferences (
          user_id, primary_goal, career_keywords, preferred_universities, 
          scholarship_priority, career_priority, competition_priority, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          primary_goal = EXCLUDED.primary_goal,
          career_keywords = EXCLUDED.career_keywords,
          preferred_universities = EXCLUDED.preferred_universities,
          scholarship_priority = EXCLUDED.scholarship_priority,
          career_priority = EXCLUDED.career_priority,
          competition_priority = EXCLUDED.competition_priority,
          updated_at = NOW()
        RETURNING *;
      `;
      const result = await pool.query(query, [
        prefData.user_id,
        prefData.primary_goal,
        prefData.career_keywords,
        prefData.preferred_universities,
        prefData.scholarship_priority,
        prefData.career_priority,
        prefData.competition_priority,
      ]);
      return res.json(result.rows[0]);
    }

    memoryDb.preferences.set(userId, {
      ...memoryDb.preferences.get(userId),
      ...prefData,
    });
    res.json(memoryDb.preferences.get(userId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Shortlists & Favoris (CRUD direct)
app.get('/api/shortlists/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    if (pool && isDbConnected) {
      const query = `
        SELECT s.*, p.university, p.school, p.programme, p.domain
        FROM public.future_user_shortlists s
        LEFT JOIN public.demo_programmes p ON s.programme_id = p.id
        WHERE s.user_id = $1
        ORDER BY s.order_rank ASC, s.created_at DESC;
      `;
      const result = await pool.query(query, [userId]);
      return res.json(result.rows);
    }
    const userShortlists = memoryDb.shortlists.filter((s) => s.user_id === userId);
    res.json(userShortlists);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shortlists', async (req, res) => {
  const { user_id, programme_id, notes, order_rank } = req.body;
  if (!user_id || !programme_id) {
    return res.status(400).json({ error: 'user_id et programme_id requis.' });
  }

  const item = {
    id: `shl-${Date.now()}`,
    user_id,
    programme_id,
    notes: notes || '',
    order_rank: order_rank || 1,
    created_at: new Date().toISOString(),
  };

  try {
    if (pool && isDbConnected) {
      const query = `
        INSERT INTO public.future_user_shortlists (id, user_id, programme_id, notes, order_rank)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const result = await pool.query(query, [
        item.id,
        item.user_id,
        item.programme_id,
        item.notes,
        item.order_rank,
      ]);
      return res.status(201).json(result.rows[0]);
    }

    memoryDb.shortlists.push(item);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/shortlists/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (pool && isDbConnected) {
      await pool.query('DELETE FROM public.future_user_shortlists WHERE id = $1', [id]);
      return res.json({ success: true });
    }
    memoryDb.shortlists = memoryDb.shortlists.filter((s) => s.id !== id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Analyse d'Orientation IA Sécurisée Côté Serveur (Gemini API)
app.post('/api/ai/orientation-advice', async (req, res) => {
  const { profile, preferences, programmeTitle } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      advice: `Conseil MHM Solutions : D'après votre profil (Bac Série ${profile?.series || 'N/A'}, mention ${profile?.mention || 'N/A'}), nous vous recommandons de privilégier les filières alignées avec votre objectif principal (${preferences?.primary_goal === 'bourse' ? 'Maximisation des chances de bourse' : 'Adéquation carrière à fort débouché'}).`,
      isAiGenerated: false,
      note: 'Pour activer les conseils IA personnalisés approfondis en temps réel, configurez votre clé GEMINI_API_KEY.',
    });
  }

  try {
    const prompt = `
Tu es un expert d'orientation universitaire béninoise et ouest-africaine pour MHM SOLUTIONS (fondé par Hilarus GBAGOULE).
Analyse les choix du bachelier suivant et donne une analyse d'orientation concise, constructive et rigoureuse (max 150 mots) :
- Série Bac : ${profile?.series || 'Non spécifiée'}
- Mention : ${profile?.mention || 'Passable'}
- Objectif prioritaire : ${preferences?.primary_goal === 'bourse' ? 'Obtention d’une bourse/secours d’études' : 'Insertion professionnelle et métier de passion'}
- Domaines d'intérêt : ${(preferences?.career_keywords || []).join(', ') || 'Général'}
- Filière cible : ${programmeTitle || 'Ensemble des filières universitaires béninoises (UAC, UNA, UNSTIM, UP)'}

Fournis des conseils précis sur les matières clés à consolider et la stratégie de sélection de filières.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      advice: response.text,
      isAiGenerated: true,
    });
  } catch (err: any) {
    console.error('Erreur Gemini AI:', err);
    res.status(500).json({
      error: err.message,
      fallbackAdvice: 'Conseil MHM : Veillez à valider la compatibilité de votre série avec les prérequis de l’établissement choisi.',
    });
  }
});

// ============================================================================
// VITE MIDDLEWARE (DEV) & STATIC FILES (PRODUCTION)
// ============================================================================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur MHM SOLUTIONS démarré sur http://0.0.0.0:${PORT}`);
    console.log(`📡 Connexion Directe URI : ${databaseUri ? maskUri(databaseUri) : 'Non configurée (In-Memory Actif)'}`);
  });
}

start();
