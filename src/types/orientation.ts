/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Types & Modèles de données pour l'orientation post-baccalauréat
 * Créateur : Hilarus GBAGOULE
 */

export type BacSeries = 'A' | 'B' | 'C' | 'D' | 'E' | 'Autre';

export type BacMention = 'Passable' | 'Assez bien' | 'Bien' | 'Très bien';

export type PrimaryGoal = 'explorer' | 'bourse' | 'securite' | 'carriere';

export type RiskTolerance = 'prudente' | 'equilibree' | 'ambitieuse';

export interface UserProfile {
  id: string;
  display_name: string;
  email?: string;
  series?: BacSeries | null;
  mention?: BacMention | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  primary_goal: PrimaryGoal;
  risk_tolerance?: RiskTolerance;
  career_keywords: string[];
  preferred_universities: string[];
  scholarship_priority: number; // 0 à 100
  career_priority: number;      // 0 à 100
  competition_priority: number; // 0 à 100
  created_at?: string;
  updated_at?: string;
}

export interface GaugeCategoryItem {
  category: 'Bourses Nationales' | 'Demi-Bourses / Aides' | 'Frais d’Études / Payant' | 'Total Général';
  allocated: number;
  availableTotal: number;
  applicantsCount: number;
  pressureRatio: number; // ex: 0.85 = 85% rempli
}

export interface DemoProgramme {
  id: string;
  university: string;
  school: string;
  programme: string;
  domain: string;
  description?: string;
  admissibleSeries: BacSeries[];
  is_demo: boolean;
  
  // Données de jauges et de classement observés
  liveStats: {
    lastUpdatedAt: string; // ISO string
    freshnessMinutes: number;
    observableRank?: number;
    totalObservedApplicants: number;
    totalCapacity: number;
    categories: GaugeCategoryItem[];
    estimatedScholarships: number;
    scholarshipRatio: number; // e.g. 0.45 = 45% des places
    competitionLevel: 'Faible' | 'Modéré' | 'Élevé' | 'Très élevé';
    competitionScore: number; // 1 à 10 (10 = hyper concurrentiel)
    employmentRateDemo: number;
    marketDemand: 'Forte' | 'Moyenne' | 'Émergente';
    keySubjects: string[];
    sampleCareers: string[];
  };
}

export interface ScoreFactor {
  name: string;
  impact: 'positif' | 'neutre' | 'attention';
  weight: number; // %
  description: string;
}

export interface OpportunityScoreDetails {
  scoreVersion: 'v1';
  opportunityScore: number; // 0 à 100 (Score d'opportunité)
  scholarshipScore: number; // 0 à 100 (Score bourse)
  observedAdmissionScore: number; // 0 à 100 (Score admission observée)
  careerScore: number | null; // 0 à 100 ou null si pas de métier spécifié
  competitionIndex: number; // 0 à 100 (Indice de concurrence)
  confidenceLevel: 'Élevé' | 'Moyen' | 'Limité';
  confidenceReason: string;
  collectedAt: string;
  freshnessText: string;
  factors: ScoreFactor[];
  missingData: string[];
}

export interface ScoredProgramme {
  programme: DemoProgramme;
  score: number; // Score d'opportunité principal (0 à 100)
  scoreDetails: OpportunityScoreDetails;
  compatibilityScore: number; // Série
  scholarshipScore: number;   // Bourse
  careerScore: number;        // Adéquation métier
  badge: {
    label: string;
    variant: 'emerald' | 'rose' | 'indigo' | 'amber';
  };
  reasons: string[];
}

export interface DomainSuggestion {
  id: string;
  name: string;
  iconName: string;
  description: string;
  popularCareers: string[];
}

// ============================================================================
// CONTRATS D'EXTENSION CHROME & SYNCHRONISATION SÉCURISÉE (MHM SOLUTIONS)
// ============================================================================

export interface LiveProgramme {
  id?: string;
  programme_id: number;
  university_id?: number;
  university: string;
  school_id?: number;
  school: string;
  programme: string;
  domain?: string;
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
  raw_gauge?: Record<string, unknown> | null;
  score_version?: string;
  score_opportunity?: number;
  score_scholarship?: number;
  score_admission?: number;
  score_confidence?: 'Élevé' | 'Moyen' | 'Limité';
  factors?: ScoreFactor[];
  source?: string;
  observed_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface LiveGaugeSnapshotItem {
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

export interface MhmExtensionSyncPayload {
  schemaVersion?: string; // 'mhm-extension.v1'
  batchId: string;
  source: string; // 'chrome_extension'
  extensionVersion?: string;
  scoreVersion?: string;
  series?: BacSeries | string;
  criteria?: {
    mention?: BacMention | string;
    goal?: PrimaryGoal | string;
    careerKeywords?: string;
  };
  observedAt: string;
  items: LiveGaugeSnapshotItem[];
}

export interface GaugeAlert {
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
  created_at?: string;
}

export interface SyncBatch {
  id: string;
  batch_id: string;
  source: string;
  extension_version?: string;
  series?: string;
  criteria?: Record<string, unknown>;
  received_count: number;
  updated_count: number;
  alert_count: number;
  status: 'completed' | 'partial' | 'failed';
  error_message?: string;
  observed_at: string;
  created_at?: string;
}

export interface ScoredLiveProgramme {
  programme: LiveProgramme;
  score: number; // 0 à 100
  scoreDetails: OpportunityScoreDetails;
  badge: {
    label: string;
    variant: 'emerald' | 'rose' | 'indigo' | 'amber';
  };
  reasons: string[];
}

export interface ExtensionGaugeEntry {
  category_name: string;
  capacity: number | null;
  allocated_count: number | null;
  applicant_count: number | null;
  status?: string;
}

export interface ChromeExtensionSnapshotPayload {
  extension_version: string;
  snapshot_hash: string;
  source_origin: string; // e.g. "https://apresmonbac.bj"
  timestamp: string; // ISO 8601
  university_code: string;
  university_name: string;
  school_code?: string;
  school_name?: string;
  programme_code: string;
  programme_name: string;
  total_capacity: number | null;
  total_applicants: number | null;
  observed_rank: number | null;
  gauges: ExtensionGaugeEntry[];
  capture_errors?: string[];
}

export interface GaugeObservation {
  id: string;
  programme_id: number | string;
  batch_id?: string;
  snapshot_hash?: string;
  source: string;
  scholarship_ratio?: number;
  competition_index?: number;
  payload?: Record<string, unknown>;
  observed_at: string;
  created_at?: string;
}

export interface RegistrationHistoryEntry {
  id: string;
  programme_id: string;
  academic_year: string;
  admitted_count: number;
  scholarship_count: number;
  min_bac_average?: number;
}

export interface OrientationAlert {
  id: string;
  user_id: string;
  programme_id: string;
  programme_title: string;
  alert_type: 'gauge_drop' | 'competition_spike' | 'rank_change' | 'score_update';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ShortlistItem {
  id: string;
  programme_id: string;
  programme: DemoProgramme;
  order_rank: number;
  opportunity_score: number;
  alert_enabled: boolean;
  user_notes?: string;
  added_at: string;
}
