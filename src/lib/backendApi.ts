/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Client API Frontend pour le Backend & Connexion Directe URI (PostgreSQL)
 * Fondateur & Concepteur : Hilarus GBAGOULE
 */

import { UserPreferences, UserProfile } from '../types/orientation';

export interface BackendHealthResponse {
  status: string;
  timestamp: string;
  service: string;
  database: {
    connected: boolean;
    mode: string;
    uriConfigured: boolean;
    maskedUri: string;
    latency: string | null;
    info: {
      database?: string;
      user?: string;
    } | null;
    error: string | null;
  };
  ai_service: {
    configured: boolean;
  };
}

export interface DbStatusResponse {
  connected: boolean;
  mode: string;
  maskedUri: string;
  latencyMs?: number;
  tables?: string[];
  counts?: Record<string, number>;
  totalTables?: number;
  poolStats?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
  error?: string;
}

export interface DbTestResponse {
  success: boolean;
  message?: string;
  error?: string;
  database?: string;
  user?: string;
  version?: string;
  latencyMs?: number;
  maskedUri?: string;
}

export class BackendApi {
  /**
   * Vérifie la santé du backend et l'état de la connexion directe URI
   */
  static async getHealth(): Promise<BackendHealthResponse | null> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend API getHealth fallback:', err);
      return null;
    }
  }

  /**
   * Obtient le diagnostic complet et les statistiques des tables PostgreSQL
   */
  static async getDbStatus(): Promise<DbStatusResponse | null> {
    try {
      const res = await fetch('/api/db/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend API getDbStatus fallback:', err);
      return null;
    }
  }

  /**
   * Teste une connexion directe URI ou la connexion active
   */
  static async testConnection(customUri?: string): Promise<DbTestResponse> {
    try {
      const res = await fetch('/api/db/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customUri }),
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Impossible de contacter le serveur backend.',
      };
    }
  }

  /**
   * Déclenche la création et la migration des tables SQL via la connexion directe URI
   */
  static async initSchema(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/db/init-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Erreur lors de l’initialisation du schéma.',
      };
    }
  }

  /**
   * Récupère la liste des programmes depuis le backend
   */
  static async getProgrammes(): Promise<{ data: any[]; source: string }> {
    try {
      const res = await fetch('/api/programmes');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend API getProgrammes:', err);
      return { data: [], source: 'fallback' };
    }
  }

  /**
   * Récupère le profil depuis le backend
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(userId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Met à jour ou insère un profil dans le backend
   */
  static async saveProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile | null> {
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(profile.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Récupère les préférences depuis le backend
   */
  static async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const res = await fetch(`/api/preferences/${encodeURIComponent(userId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Met à jour les préférences dans le backend
   */
  static async savePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences | null> {
    try {
      const res = await fetch(`/api/preferences/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Demande de conseil d'orientation IA sécurisé au serveur
   */
  static async getAiAdvice(
    profile: UserProfile | null,
    preferences: UserPreferences | null,
    programmeTitle?: string
  ): Promise<{ advice: string; isAiGenerated: boolean; note?: string }> {
    try {
      const res = await fetch('/api/ai/orientation-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, preferences, programmeTitle }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      return {
        advice: `Analyse MHM : Compte tenu de votre profil Bac Série ${profile?.series || 'D'}, concentrez-vous sur les programmes équilibrant vos chances de bourse et vos ambitions de carrière.`,
        isAiGenerated: false,
        note: err.message,
      };
    }
  }
}
