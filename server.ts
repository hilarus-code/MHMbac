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
  liveProgrammes: Map<number, any>;
  gaugeObservations: any[];
  gaugeAlerts: any[];
  syncBatches: any[];
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
  liveProgrammes: new Map([
    [1001, {
      id: 'live-1001',
      programme_id: 1001,
      university_id: 1,
      university: "Université d'Abomey-Calavi (UAC)",
      school_id: 101,
      school: "IFRI (Institut de Formation et de Recherche en Informatique)",
      programme: "Génie Logiciel & Systèmes d'Information (GL/SI)",
      domain: "Informatique & Intelligence Artificielle",
      scholarships: 30,
      aid: 15,
      tb: 6,
      b: 18,
      ab: 16,
      passable: 5,
      total: 45,
      rank: 14,
      capacity: 45,
      applicants: 135,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D, E" },
      score_version: "v1",
      score_opportunity: 94,
      score_scholarship: 83,
      score_admission: 88,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [1002, {
      id: 'live-1002',
      programme_id: 1002,
      university_id: 1,
      university: "Université d'Abomey-Calavi (UAC)",
      school_id: 101,
      school: "IFRI (Institut de Formation et de Recherche en Informatique)",
      programme: "Sécurité Informatique & Réseaux (SIR)",
      domain: "Informatique & Intelligence Artificielle",
      scholarships: 22,
      aid: 13,
      tb: 4,
      b: 14,
      ab: 14,
      passable: 3,
      total: 35,
      rank: 19,
      capacity: 35,
      applicants: 98,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D, E" },
      score_version: "v1",
      score_opportunity: 89,
      score_scholarship: 81,
      score_admission: 85,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [1003, {
      id: 'live-1003',
      programme_id: 1003,
      university_id: 1,
      university: "Université d'Abomey-Calavi (UAC)",
      school_id: 101,
      school: "IFRI (Institut de Formation et de Recherche en Informatique)",
      programme: "Intelligence Artificielle & Science des Données",
      domain: "Informatique & Intelligence Artificielle",
      scholarships: 18,
      aid: 7,
      tb: 7,
      b: 12,
      ab: 6,
      passable: 0,
      total: 25,
      rank: 8,
      capacity: 25,
      applicants: 92,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D, E" },
      score_version: "v1",
      score_opportunity: 92,
      score_scholarship: 86,
      score_admission: 90,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [1004, {
      id: 'live-1004',
      programme_id: 1004,
      university_id: 1,
      university: "Université d'Abomey-Calavi (UAC)",
      school_id: 102,
      school: "EPAC (École Polytechnique d'Abomey-Calavi)",
      programme: "Génie Civil & Bâtiment",
      domain: "Génie Civil & BTP",
      scholarships: 28,
      aid: 12,
      tb: 4,
      b: 15,
      ab: 16,
      passable: 5,
      total: 40,
      rank: 22,
      capacity: 40,
      applicants: 110,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D, E" },
      score_version: "v1",
      score_opportunity: 88,
      score_scholarship: 85,
      score_admission: 82,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [1005, {
      id: 'live-1005',
      programme_id: 1005,
      university_id: 1,
      university: "Université d'Abomey-Calavi (UAC)",
      school_id: 102,
      school: "EPAC (École Polytechnique d'Abomey-Calavi)",
      programme: "Génie Électrique & Télécommunications",
      domain: "Ingénierie & Télécoms",
      scholarships: 24,
      aid: 11,
      tb: 3,
      b: 13,
      ab: 14,
      passable: 5,
      total: 35,
      rank: 25,
      capacity: 35,
      applicants: 85,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D, E" },
      score_version: "v1",
      score_opportunity: 84,
      score_scholarship: 84,
      score_admission: 80,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [1006, {
      id: 'live-1006',
      programme_id: 1006,
      university_id: 1,
      university: "Université d'Abomey-Calavi (UAC)",
      school_id: 103,
      school: "FSS (Faculté des Sciences de la Santé)",
      programme: "Médecine Générale & Sciences Biomédicales",
      domain: "Santé & Médecine",
      scholarships: 50,
      aid: 15,
      tb: 16,
      b: 32,
      ab: 17,
      passable: 0,
      total: 65,
      rank: 6,
      capacity: 65,
      applicants: 295,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D" },
      score_version: "v1",
      score_opportunity: 96,
      score_scholarship: 88,
      score_admission: 95,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [1007, {
      id: 'live-1007',
      programme_id: 1007,
      university_id: 1,
      university: "Université d'Abomey-Calavi (UAC)",
      school_id: 103,
      school: "FSS (Faculté des Sciences de la Santé)",
      programme: "Pharmacie & Chimie Thérapeutique",
      domain: "Santé & Médecine",
      scholarships: 22,
      aid: 8,
      tb: 6,
      b: 15,
      ab: 9,
      passable: 0,
      total: 30,
      rank: 10,
      capacity: 30,
      applicants: 145,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D" },
      score_version: "v1",
      score_opportunity: 91,
      score_scholarship: 87,
      score_admission: 92,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [1008, {
      id: 'live-1008',
      programme_id: 1008,
      university_id: 1,
      university: "Université d'Abomey-Calavi (UAC)",
      school_id: 104,
      school: "ENEAM (École Nationale d'Économie Appliquée et de Management)",
      programme: "Statistique & Informatique Décisionnelle (SID)",
      domain: "Finance & Statistique",
      scholarships: 28,
      aid: 12,
      tb: 4,
      b: 16,
      ab: 15,
      passable: 5,
      total: 40,
      rank: 18,
      capacity: 40,
      applicants: 110,
      raw_gauge: { source: "apresmonbac.bj", series: "B, C, D" },
      score_version: "v1",
      score_opportunity: 87,
      score_scholarship: 85,
      score_admission: 84,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [1009, {
      id: 'live-1009',
      programme_id: 1009,
      university_id: 1,
      university: "Université d'Abomey-Calavi (UAC)",
      school_id: 104,
      school: "ENEAM (École Nationale d'Économie Appliquée et de Management)",
      programme: "Banque, Finance & Assurance",
      domain: "Finance & Gestion",
      scholarships: 30,
      aid: 20,
      tb: 3,
      b: 17,
      ab: 22,
      passable: 8,
      total: 50,
      rank: 28,
      capacity: 50,
      applicants: 165,
      raw_gauge: { source: "apresmonbac.bj", series: "B, C, D, G2" },
      score_version: "v1",
      score_opportunity: 83,
      score_scholarship: 80,
      score_admission: 78,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [1010, {
      id: 'live-1010',
      programme_id: 1010,
      university_id: 1,
      university: "Université d'Abomey-Calavi (UAC)",
      school_id: 105,
      school: "INMES (Institut National Médico-Social)",
      programme: "Sciences Infirmières & Obstétricales",
      domain: "Santé & Médecine",
      scholarships: 30,
      aid: 15,
      tb: 2,
      b: 14,
      ab: 21,
      passable: 8,
      total: 45,
      rank: 16,
      capacity: 45,
      applicants: 132,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D" },
      score_version: "v1",
      score_opportunity: 86,
      score_scholarship: 83,
      score_admission: 82,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [2001, {
      id: 'live-2001',
      programme_id: 2001,
      university_id: 2,
      university: "Université Nationale d'Agriculture (UNA)",
      school_id: 201,
      school: "EAC (École d'Agrobusiness et de Commercialisation)",
      programme: "Agrobusiness & Économie Rurale",
      domain: "Agriculture & Agroalimentaire",
      scholarships: 32,
      aid: 18,
      tb: 1,
      b: 12,
      ab: 22,
      passable: 15,
      total: 50,
      rank: 18,
      capacity: 50,
      applicants: 78,
      raw_gauge: { source: "apresmonbac.bj", series: "A, B, C, D, E" },
      score_version: "v1",
      score_opportunity: 88,
      score_scholarship: 82,
      score_admission: 80,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [2002, {
      id: 'live-2002',
      programme_id: 2002,
      university_id: 2,
      university: "Université Nationale d'Agriculture (UNA)",
      school_id: 202,
      school: "ESA (École des Sciences Agronomiques)",
      programme: "Production Végétale & Protection des Cultures",
      domain: "Agriculture & Environnement",
      scholarships: 30,
      aid: 15,
      tb: 1,
      b: 10,
      ab: 20,
      passable: 14,
      total: 45,
      rank: 14,
      capacity: 45,
      applicants: 62,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D" },
      score_version: "v1",
      score_opportunity: 89,
      score_scholarship: 83,
      score_admission: 81,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [3001, {
      id: 'live-3001',
      programme_id: 3001,
      university_id: 3,
      university: "Université Nationale des Sciences (UNSTIM)",
      school_id: 301,
      school: "ENS-Natitingou",
      programme: "Sciences Physiques & Enseignement",
      domain: "Enseignement & Éducation",
      scholarships: 35,
      aid: 10,
      tb: 1,
      b: 8,
      ab: 22,
      passable: 14,
      total: 45,
      rank: 8,
      capacity: 45,
      applicants: 65,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D, E" },
      score_version: "v1",
      score_opportunity: 92,
      score_scholarship: 89,
      score_admission: 87,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [3002, {
      id: 'live-3002',
      programme_id: 3002,
      university_id: 3,
      university: "Université Nationale des Sciences (UNSTIM)",
      school_id: 302,
      school: "INSTI-Lokossa",
      programme: "Génie Industriel & Maintenance",
      domain: "Ingénierie & Industrie",
      scholarships: 28,
      aid: 12,
      tb: 2,
      b: 12,
      ab: 18,
      passable: 8,
      total: 40,
      rank: 15,
      capacity: 40,
      applicants: 74,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D, E, F" },
      score_version: "v1",
      score_opportunity: 87,
      score_scholarship: 85,
      score_admission: 82,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [4001, {
      id: 'live-4001',
      programme_id: 4001,
      university_id: 4,
      university: "Université de Parakou (UP)",
      school_id: 401,
      school: "IUT (Institut Universitaire de Technologie)",
      programme: "Gestion des Banques & Finances d'Entreprise",
      domain: "Finance & Gestion",
      scholarships: 25,
      aid: 15,
      tb: 2,
      b: 11,
      ab: 17,
      passable: 10,
      total: 40,
      rank: 20,
      capacity: 40,
      applicants: 98,
      raw_gauge: { source: "apresmonbac.bj", series: "B, C, D, G2" },
      score_version: "v1",
      score_opportunity: 84,
      score_scholarship: 81,
      score_admission: 79,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [4002, {
      id: 'live-4002',
      programme_id: 4002,
      university_id: 4,
      university: "Université de Parakou (UP)",
      school_id: 402,
      school: "FA (Faculté d'Agronomie)",
      programme: "Foresterie & Gestion des Ressources Naturelles",
      domain: "Environnement & Forêts",
      scholarships: 25,
      aid: 10,
      tb: 1,
      b: 8,
      ab: 16,
      passable: 10,
      total: 35,
      rank: 11,
      capacity: 35,
      applicants: 46,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D" },
      score_version: "v1",
      score_opportunity: 90,
      score_scholarship: 86,
      score_admission: 84,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
    [4003, {
      id: 'live-4003',
      programme_id: 4003,
      university_id: 4,
      university: "Université de Parakou (UP)",
      school_id: 403,
      school: "FM (Faculté de Médecine)",
      programme: "Médecine Générale & Chirurgie",
      domain: "Santé & Médecine",
      scholarships: 40,
      aid: 10,
      tb: 10,
      b: 24,
      ab: 16,
      passable: 0,
      total: 50,
      rank: 5,
      capacity: 50,
      applicants: 185,
      raw_gauge: { source: "apresmonbac.bj", series: "C, D" },
      score_version: "v1",
      score_opportunity: 95,
      score_scholarship: 90,
      score_admission: 94,
      score_confidence: "Élevé",
      source: "chrome_extension",
      observed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }],
  ]),
  gaugeObservations: [],
  gaugeAlerts: [],
  syncBatches: [],
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

    // 6. Table Live Programmes (Synchronisation temps réel observée)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.live_programmes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
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
        observed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_srv_live_prog_id ON public.live_programmes(programme_id);
      CREATE INDEX IF NOT EXISTS idx_srv_live_score ON public.live_programmes(score_opportunity DESC);
    `);

    // 7. Table Gauge Observations
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.gauge_observations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        programme_id INTEGER NOT NULL,
        batch_id TEXT NOT NULL,
        snapshot_hash TEXT NOT NULL,
        payload JSONB NOT NULL,
        observed_at TIMESTAMPTZ NOT NULL,
        source TEXT DEFAULT 'chrome_extension',
        extension_version TEXT,
        score_version TEXT DEFAULT 'v1',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_srv_snapshot UNIQUE(programme_id, snapshot_hash)
      );
      CREATE INDEX IF NOT EXISTS idx_srv_obs_prog_id ON public.gauge_observations(programme_id);
    `);

    // 8. Table Gauge Alerts
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.gauge_alerts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        programme_id INTEGER NOT NULL,
        university TEXT NOT NULL,
        school TEXT NOT NULL,
        programme TEXT NOT NULL,
        field_name TEXT NOT NULL,
        old_value NUMERIC,
        new_value NUMERIC,
        delta NUMERIC,
        batch_id TEXT,
        observed_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_srv_alerts_prog_id ON public.gauge_alerts(programme_id);
      CREATE INDEX IF NOT EXISTS idx_srv_alerts_observed ON public.gauge_alerts(observed_at DESC);
    `);

    // 9. Table Sync Batches
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.sync_batches (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        batch_id TEXT NOT NULL UNIQUE,
        source TEXT DEFAULT 'chrome_extension',
        extension_version TEXT,
        series TEXT,
        criteria JSONB,
        received_count INTEGER DEFAULT 0,
        updated_count INTEGER DEFAULT 0,
        alert_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'completed',
        error_message TEXT,
        observed_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
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

    // Insérer les filières réelles live si la table live_programmes est vide
    const liveCountRes = await client.query('SELECT COUNT(*) FROM public.live_programmes');
    if (parseInt(liveCountRes.rows[0].count, 10) === 0) {
      for (const [pId, lp] of memoryDb.liveProgrammes.entries()) {
        await client.query(
          `INSERT INTO public.live_programmes (
             id, programme_id, university_id, university, school_id, school,
             programme, domain, scholarships, aid, tb, b, ab, passable,
             total, rank, capacity, applicants, raw_gauge, score_opportunity,
             score_scholarship, score_admission, score_confidence, source, observed_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6,
             $7, $8, $9, $10, $11, $12, $13, $14,
             $15, $16, $17, $18, $19, $20,
             $21, $22, $23, $24, $25
           ) ON CONFLICT (programme_id) DO UPDATE SET
             university = EXCLUDED.university,
             school = EXCLUDED.school,
             programme = EXCLUDED.programme,
             scholarships = EXCLUDED.scholarships,
             aid = EXCLUDED.aid,
             tb = EXCLUDED.tb,
             b = EXCLUDED.b,
             ab = EXCLUDED.ab,
             passable = EXCLUDED.passable,
             total = EXCLUDED.total,
             rank = EXCLUDED.rank,
             capacity = EXCLUDED.capacity,
             applicants = EXCLUDED.applicants,
             raw_gauge = EXCLUDED.raw_gauge,
             score_opportunity = EXCLUDED.score_opportunity,
             score_scholarship = EXCLUDED.score_scholarship,
             score_admission = EXCLUDED.score_admission,
             score_confidence = EXCLUDED.score_confidence,
             observed_at = EXCLUDED.observed_at,
             updated_at = NOW()`,
          [
            lp.id,
            lp.programme_id,
            lp.university_id,
            lp.university,
            lp.school_id,
            lp.school,
            lp.programme,
            lp.domain,
            lp.scholarships,
            lp.aid,
            lp.tb,
            lp.b,
            lp.ab,
            lp.passable,
            lp.total,
            lp.rank,
            lp.capacity,
            lp.applicants,
            JSON.stringify(lp.raw_gauge || {}),
            lp.score_opportunity,
            lp.score_scholarship,
            lp.score_admission,
            lp.score_confidence,
            lp.source,
            lp.observed_at,
          ]
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
// 10. CONTRAT EDGE FUNCTION & SYNC EN TEMPS RÉEL (MHMBAC-SYNC)
// ============================================================================

async function handleMhmbacSync(req: express.Request, res: express.Response) {
  // 0. Vérification du jeton de sécurité MHM_SYNC_TOKEN
  const expectedToken = process.env.MHM_SYNC_TOKEN || process.env.MHMBAC_SYNC_API_KEY;
  const authHeader = (req.headers['authorization'] as string) || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  const customHeaderToken =
    (req.headers['x-mhm-token'] as string) ||
    (req.headers['x-api-key'] as string) ||
    '';
  const incomingToken = customHeaderToken || bearerToken;

  if (expectedToken) {
    if (!incomingToken || incomingToken !== expectedToken) {
      return res.status(401).json({
        error: 'Accès refusé : jeton MHM_SYNC_TOKEN invalide ou manquant.',
        details:
          'L\'extension Chrome doit configurer window.MHM_CONFIG.MHM_SYNC_TOKEN dans config.js avec le jeton secret correspondant.',
      });
    }
  }

  const payload = req.body;

  // 1. Validation du lot
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Corps de requête invalide.' });
  }

  const batchId = payload.batchId || `batch-${Date.now()}`;
  const items = payload.items;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Le champ items doit être un tableau.' });
  }

  if (items.length === 0) {
    return res.status(400).json({ error: 'Le lot d\'items ne peut pas être vide.' });
  }

  if (items.length > 500) {
    return res.status(413).json({ error: 'Taille maximale de 500 items par lot dépassée.' });
  }

  const observedAt = payload.observedAt || new Date().toISOString();
  const source = payload.source || 'chrome_extension';
  const extensionVersion = payload.extensionVersion || '0.3.0';

  // 2. Validation & Déduplication par programmeId
  const dedupedMap = new Map<number, any>();
  const validationErrors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const pId = Number(it.programmeId);
    if (!pId || isNaN(pId) || pId <= 0) {
      validationErrors.push(`Item index ${i}: programmeId invalide`);
      continue;
    }
    if (!it.university || !it.school || !it.programme) {
      validationErrors.push(`Item ${pId}: nom d'université, d'école ou de filière manquant`);
      continue;
    }

    const normItem = {
      universityId: it.universityId ? Number(it.universityId) : null,
      university: String(it.university).trim(),
      schoolId: it.schoolId ? Number(it.schoolId) : null,
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
      observedAt: it.observedAt || observedAt,
    };

    dedupedMap.set(pId, normItem);
  }

  if (dedupedMap.size === 0) {
    return res.status(400).json({ error: 'Aucun item valide dans le lot.', details: validationErrors });
  }

  const validItems = Array.from(dedupedMap.values());
  const alertsDetected: any[] = [];
  const observationsToStore: any[] = [];
  const upsertedList: any[] = [];

  try {
    if (pool && isDbConnected) {
      // 1. Lire les anciens états existants pour détecter les deltas
      const pIds = validItems.map((v) => v.programmeId);
      const existingRes = await pool.query(
        'SELECT * FROM public.live_programmes WHERE programme_id = ANY($1::int[])',
        [pIds]
      );
      const existingMap = new Map<number, any>();
      for (const row of existingRes.rows) {
        existingMap.set(row.programme_id, row);
      }

      for (const item of validItems) {
        const existing = existingMap.get(item.programmeId);

        // Détection des variations
        if (existing) {
          const fields = [
            { name: 'total', oldVal: Number(existing.total), newVal: item.total },
            { name: 'scholarships', oldVal: Number(existing.scholarships), newVal: item.scholarships },
            { name: 'aid', oldVal: Number(existing.aid), newVal: item.aid },
            { name: 'passable', oldVal: Number(existing.passable), newVal: item.passable },
            { name: 'applicants', oldVal: existing.applicants !== null ? Number(existing.applicants) : null, newVal: item.applicants },
            { name: 'rank', oldVal: existing.rank !== null ? Number(existing.rank) : null, newVal: item.rank },
          ];

          for (const f of fields) {
            if (f.oldVal !== null && f.newVal !== null && f.oldVal !== f.newVal) {
              const delta = f.newVal - f.oldVal;
              alertsDetected.push({
                programme_id: item.programmeId,
                university: item.university,
                school: item.school,
                programme: item.programme,
                field_name: f.name,
                old_value: f.oldVal,
                new_value: f.newVal,
                delta,
                batch_id: batchId,
                observed_at: observedAt,
              });
            }
          }
        }

        // Calcul du score v1
        const totalSlots = Math.max(1, item.total || (item.scholarships + item.aid));
        const scholarshipRatio = Math.min(1.0, (item.scholarships + item.aid * 0.5) / totalSlots);
        const scoreScholarship = Math.min(100, Math.round(scholarshipRatio * 100));

        let compIndex = 50;
        if (item.applicants && item.capacity && item.capacity > 0) {
          compIndex = Math.min(100, Math.round((item.applicants / item.capacity) * 30));
        }

        const scoreAdmission = 75;
        const scoreOpportunity = Math.min(100, Math.max(10, Math.round(scoreAdmission * 0.4 + scoreScholarship * 0.35 + (100 - compIndex) * 0.25)));

        // Upsert dans live_programmes
        const upsertQuery = `
          INSERT INTO public.live_programmes (
            programme_id, university_id, university, school_id, school, programme,
            domain, scholarships, aid, tb, b, ab, passable, total,
            rank, capacity, applicants, raw_gauge, score_version, score_opportunity,
            score_scholarship, score_admission, score_confidence, source, observed_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'v1', $19, $20, $21, $22, $23, $24, NOW())
          ON CONFLICT (programme_id) DO UPDATE SET
            university = EXCLUDED.university,
            school = EXCLUDED.school,
            programme = EXCLUDED.programme,
            scholarships = EXCLUDED.scholarships,
            aid = EXCLUDED.aid,
            tb = EXCLUDED.tb,
            b = EXCLUDED.b,
            ab = EXCLUDED.ab,
            passable = EXCLUDED.passable,
            total = EXCLUDED.total,
            rank = EXCLUDED.rank,
            capacity = EXCLUDED.capacity,
            applicants = EXCLUDED.applicants,
            raw_gauge = EXCLUDED.raw_gauge,
            score_opportunity = EXCLUDED.score_opportunity,
            score_scholarship = EXCLUDED.score_scholarship,
            score_admission = EXCLUDED.score_admission,
            score_confidence = EXCLUDED.score_confidence,
            source = EXCLUDED.source,
            observed_at = EXCLUDED.observed_at,
            updated_at = NOW()
          RETURNING *;
        `;

        const resProg = await pool.query(upsertQuery, [
          item.programmeId,
          item.universityId,
          item.university,
          item.schoolId,
          item.school,
          item.programme,
          'Général',
          item.scholarships,
          item.aid,
          item.tb,
          item.b,
          item.ab,
          item.passable,
          item.total,
          item.rank,
          item.capacity,
          item.applicants,
          JSON.stringify(item.rawGauge),
          scoreOpportunity,
          scoreScholarship,
          scoreAdmission,
          item.total > 0 ? 'Élevé' : 'Moyen',
          source,
          observedAt,
        ]);

        upsertedList.push(resProg.rows[0]);

        // Observation snapshot
        const rawHash = `${item.programmeId}_${item.total}_${item.scholarships}_${item.aid}_${item.passable}_${item.applicants ?? 'na'}_${item.rank ?? 'na'}`;
        await pool.query(
          `INSERT INTO public.gauge_observations (programme_id, batch_id, snapshot_hash, payload, observed_at, source, extension_version, score_version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'v1')
           ON CONFLICT (programme_id, snapshot_hash) DO NOTHING`,
          [item.programmeId, batchId, rawHash, JSON.stringify(item), observedAt, source, extensionVersion]
        );
      }

      // Insertion des alertes
      for (const alt of alertsDetected) {
        await pool.query(
          `INSERT INTO public.gauge_alerts (programme_id, university, school, programme, field_name, old_value, new_value, delta, batch_id, observed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [alt.programme_id, alt.university, alt.school, alt.programme, alt.field_name, alt.old_value, alt.new_value, alt.delta, alt.batch_id, alt.observed_at]
        );
      }

      // Enregistrement du batch
      await pool.query(
        `INSERT INTO public.sync_batches (batch_id, source, extension_version, series, criteria, received_count, updated_count, alert_count, status, observed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', $9)
         ON CONFLICT (batch_id) DO NOTHING`,
        [batchId, source, extensionVersion, payload.series || null, JSON.stringify(payload.criteria || {}), items.length, upsertedList.length, alertsDetected.length, observedAt]
      );
    } else {
      // In-Memory Mode Fallback
      for (const item of validItems) {
        const existing = memoryDb.liveProgrammes.get(item.programmeId);

        if (existing) {
          if (existing.total !== item.total) {
            alertsDetected.push({
              id: `alt-${Date.now()}-${Math.random()}`,
              programme_id: item.programmeId,
              university: item.university,
              school: item.school,
              programme: item.programme,
              field_name: 'total',
              old_value: existing.total,
              new_value: item.total,
              delta: item.total - existing.total,
              batch_id: batchId,
              observed_at: observedAt,
            });
          }
        }

        const totalSlots = Math.max(1, item.total || (item.scholarships + item.aid));
        const scholarshipRatio = Math.min(1.0, (item.scholarships + item.aid * 0.5) / totalSlots);
        const scoreScholarship = Math.min(100, Math.round(scholarshipRatio * 100));

        const storedProg = {
          id: `live-${item.programmeId}`,
          programme_id: item.programmeId,
          university_id: item.universityId,
          university: item.university,
          school_id: item.schoolId,
          school: item.school,
          programme: item.programme,
          domain: 'Général',
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
          score_version: 'v1',
          score_opportunity: Math.min(100, Math.max(20, Math.round(60 + scoreScholarship * 0.4))),
          score_scholarship: scoreScholarship,
          score_admission: 75,
          score_confidence: item.total > 0 ? 'Élevé' : 'Moyen',
          source,
          observed_at: observedAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        memoryDb.liveProgrammes.set(item.programmeId, storedProg);
        upsertedList.push(storedProg);
      }

      memoryDb.gaugeAlerts.push(...alertsDetected);
      memoryDb.syncBatches.push({
        id: `sb-${Date.now()}`,
        batch_id: batchId,
        source,
        extension_version: extensionVersion,
        series: payload.series,
        received_count: items.length,
        updated_count: upsertedList.length,
        alert_count: alertsDetected.length,
        status: 'completed',
        observed_at: observedAt,
      });
    }

    res.status(200).json({
      ok: true,
      batchId,
      received: items.length,
      updated: upsertedList.length,
      alerts: alertsDetected.length,
      scoreVersion: 'v1',
      observedAt,
      freshness: { minutes: 0 },
    });
  } catch (err: any) {
    console.error('❌ Erreur sync mhmbac:', err);
    res.status(500).json({ error: err.message });
  }
}

// Routes de synchronisation
app.post('/functions/v1/mhmbac-sync', handleMhmbacSync);
app.post('/api/functions/v1/mhmbac-sync', handleMhmbacSync);
app.post('/api/mhmbac-sync', handleMhmbacSync);

// 11. Lecture des données Live observées
app.get('/api/live-programmes', async (req, res) => {
  try {
    if (pool && isDbConnected) {
      const result = await pool.query(`
        SELECT * FROM public.live_programmes 
        ORDER BY score_opportunity DESC, total DESC, observed_at DESC
      `);
      return res.json({
        data: result.rows,
        count: result.rows.length,
        source: 'PostgreSQL Live Observé',
      });
    }

    const liveList = Array.from(memoryDb.liveProgrammes.values()).sort(
      (a, b) => (b.score_opportunity || 0) - (a.score_opportunity || 0)
    );

    res.json({
      data: liveList,
      count: liveList.length,
      source: 'In-Memory Live Observé',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Lecture des alertes de variation de jauges
app.get('/api/gauge-alerts', async (req, res) => {
  try {
    if (pool && isDbConnected) {
      const result = await pool.query(`
        SELECT * FROM public.gauge_alerts 
        ORDER BY observed_at DESC 
        LIMIT 50
      `);
      return res.json({ data: result.rows });
    }

    res.json({ data: memoryDb.gaugeAlerts.slice(-50).reverse() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Lecture des lots synchronisés
app.get('/api/sync-batches', async (req, res) => {
  try {
    if (pool && isDbConnected) {
      const result = await pool.query(`
        SELECT * FROM public.sync_batches 
        ORDER BY observed_at DESC 
        LIMIT 20
      `);
      return res.json({ data: result.rows });
    }

    res.json({ data: memoryDb.syncBatches.slice(-20).reverse() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Statistiques globales de synchronisation
app.get('/api/live-stats', async (req, res) => {
  try {
    if (pool && isDbConnected) {
      const progCountRes = await pool.query('SELECT COUNT(*) FROM public.live_programmes');
      const univCountRes = await pool.query('SELECT COUNT(DISTINCT university) FROM public.live_programmes');
      const schoolCountRes = await pool.query('SELECT COUNT(DISTINCT school) FROM public.live_programmes');
      const lastObsRes = await pool.query('SELECT MAX(observed_at) as last_seen FROM public.live_programmes');
      const alertCountRes = await pool.query('SELECT COUNT(*) FROM public.gauge_alerts');

      const totalProgrammes = parseInt(progCountRes.rows[0].count, 10);
      const totalUniversities = parseInt(univCountRes.rows[0].count, 10);
      const totalSchools = parseInt(schoolCountRes.rows[0].count, 10);
      const lastObservedAt = lastObsRes.rows[0]?.last_seen || null;
      const totalAlerts = parseInt(alertCountRes.rows[0].count, 10);

      const diffMinutes = lastObservedAt
        ? Math.max(1, Math.floor((Date.now() - new Date(lastObservedAt).getTime()) / 60000))
        : null;

      return res.json({
        totalProgrammes,
        totalUniversities,
        totalSchools,
        totalAlerts,
        lastObservedAt,
        diffMinutes,
        source: 'PostgreSQL Direct',
      });
    }

    const liveList = Array.from(memoryDb.liveProgrammes.values());
    const univs = new Set(liveList.map((p) => p.university));
    const schools = new Set(liveList.map((p) => p.school));
    const latestObs = liveList.length > 0
      ? liveList.reduce((max, p) => (new Date(p.observed_at) > new Date(max) ? p.observed_at : max), liveList[0].observed_at)
      : null;

    res.json({
      totalProgrammes: liveList.length,
      totalUniversities: univs.size,
      totalSchools: schools.size,
      totalAlerts: memoryDb.gaugeAlerts.length,
      lastObservedAt: latestObs,
      diffMinutes: latestObs ? Math.max(1, Math.floor((Date.now() - new Date(latestObs).getTime()) / 60000)) : null,
      source: 'In-Memory Store',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Seed de données live représentatives pour premier démarrage
app.post('/api/seed-live-demo', async (req, res) => {
  const sampleBatch = {
    schemaVersion: 'mhm-extension.v1',
    batchId: `seed-demo-${Date.now()}`,
    source: 'chrome_extension',
    extensionVersion: '0.3.0',
    scoreVersion: 'v1',
    series: 'D',
    criteria: {
      mention: 'Bien',
      goal: 'explorer',
      careerKeywords: 'Informatique, Santé, Agronomie, Gestion',
    },
    observedAt: new Date().toISOString(),
    items: [
      {
        universityId: 1,
        university: "Université d'Abomey-Calavi (UAC)",
        schoolId: 101,
        school: "IFRI (Institut de Formation et de Recherche en Informatique)",
        programmeId: 1001,
        programme: "Génie Logiciel & Systèmes d'Information",
        scholarships: 28,
        aid: 12,
        tb: 4,
        b: 16,
        ab: 15,
        passable: 5,
        total: 40,
        rank: 14,
        capacity: 40,
        applicants: 112,
        rawGauge: { source: "apresmonbac.bj" }
      },
      {
        universityId: 1,
        university: "Université d'Abomey-Calavi (UAC)",
        schoolId: 102,
        school: "EPAC (École Polytechnique d'Abomey-Calavi)",
        programmeId: 1002,
        programme: "Génie Civil & Bâtiment",
        scholarships: 20,
        aid: 10,
        tb: 2,
        b: 10,
        ab: 12,
        passable: 6,
        total: 30,
        rank: 22,
        capacity: 30,
        applicants: 78,
        rawGauge: { source: "apresmonbac.bj" }
      },
      {
        universityId: 1,
        university: "Université d'Abomey-Calavi (UAC)",
        schoolId: 103,
        school: "FSS (Faculté des Sciences de la Santé)",
        programmeId: 1003,
        programme: "Médecine Générale & Sciences Biomédicales",
        scholarships: 45,
        aid: 15,
        tb: 12,
        b: 28,
        ab: 18,
        passable: 2,
        total: 60,
        rank: 8,
        capacity: 60,
        applicants: 240,
        rawGauge: { source: "apresmonbac.bj" }
      },
      {
        universityId: 2,
        university: "Université Nationale d'Agriculture (UNA)",
        schoolId: 201,
        school: "EAC (École d'Agrobusiness et de Commercialisation)",
        programmeId: 2001,
        programme: "Agrobusiness & Économie Rurale",
        scholarships: 32,
        aid: 18,
        tb: 1,
        b: 8,
        ab: 20,
        passable: 21,
        total: 50,
        rank: 18,
        capacity: 50,
        applicants: 65,
        rawGauge: { source: "apresmonbac.bj" }
      },
      {
        universityId: 2,
        university: "Université Nationale d'Agriculture (UNA)",
        schoolId: 202,
        school: "ESA (École des Sciences Agronomiques)",
        programmeId: 2002,
        programme: "Production Végétale & Protection des Cultures",
        scholarships: 25,
        aid: 15,
        tb: 0,
        b: 6,
        ab: 18,
        passable: 16,
        total: 40,
        rank: 12,
        capacity: 40,
        applicants: 48,
        rawGauge: { source: "apresmonbac.bj" }
      },
      {
        universityId: 3,
        university: "Université Nationale des Sciences (UNSTIM)",
        schoolId: 301,
        school: "ENS-Natitingou",
        programmeId: 3001,
        programme: "Sciences Physiques & Enseignement",
        scholarships: 35,
        aid: 10,
        tb: 0,
        b: 4,
        ab: 16,
        passable: 25,
        total: 45,
        rank: 5,
        capacity: 45,
        applicants: 52,
        rawGauge: { source: "apresmonbac.bj" }
      },
      {
        universityId: 4,
        university: "Université de Parakou (UP)",
        schoolId: 401,
        school: "IUT (Institut Universitaire de Technologie)",
        programmeId: 4001,
        programme: "Gestion des Banques & Finances d'Entreprise",
        scholarships: 22,
        aid: 13,
        tb: 1,
        b: 7,
        ab: 15,
        passable: 12,
        total: 35,
        rank: 15,
        capacity: 35,
        applicants: 85,
        rawGauge: { source: "apresmonbac.bj" }
      },
      {
        universityId: 4,
        university: "Université de Parakou (UP)",
        schoolId: 402,
        school: "FA (Faculté d'Agronomie)",
        programmeId: 4002,
        programme: "Foresterie & Gestion des Ressources Naturelles",
        scholarships: 20,
        aid: 10,
        tb: 0,
        b: 3,
        ab: 11,
        passable: 16,
        total: 30,
        rank: 9,
        capacity: 30,
        applicants: 38,
        rawGauge: { source: "apresmonbac.bj" }
      },
      {
        universityId: 1,
        university: "Université d'Abomey-Calavi (UAC)",
        schoolId: 104,
        school: "FASEG",
        programmeId: 1004,
        programme: "Sciences Économiques et Gestion Commerciale",
        scholarships: 40,
        aid: 20,
        tb: 2,
        b: 14,
        ab: 30,
        passable: 34,
        total: 80,
        rank: 35,
        capacity: 80,
        applicants: 190,
        rawGauge: { source: "apresmonbac.bj" }
      },
      {
        universityId: 1,
        university: "Université d'Abomey-Calavi (UAC)",
        schoolId: 105,
        school: "FADESP",
        programmeId: 1005,
        programme: "Droit et Administration Publique",
        scholarships: 30,
        aid: 25,
        tb: 3,
        b: 18,
        ab: 42,
        passable: 57,
        total: 120,
        rank: 48,
        capacity: 120,
        applicants: 310,
        rawGauge: { source: "apresmonbac.bj" }
      }
    ]
  };

  req.body = sampleBatch;
  return handleMhmbacSync(req, res);
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
