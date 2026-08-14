/**
 * MHM SOLUTIONS — Après Mon Bac
 * Contrat d'intégration et spécifications techniques de l'Extension Chrome
 * Créateur : Hilarus GBAGOULE
 * 
 * Ce fichier définit les règles de validation, normalisation et sécurité pour
 * la collecte passive des jauges publiques d'orientation universitaire.
 * 
 * RÈGLES DE CONFORMITÉ STRICTES :
 * 1. Collecte passive d'indicateurs publics uniquement (places, bourses, postulants).
 * 2. AUCUNE soumission automatique de choix à la place de l'élève.
 * 3. AUCUN stockage de mot de passe ni contournement de protection.
 * 4. Validation finale TOUJOURS manuelle par l'élève sur apresmonbac.bj.
 */

import { ChromeExtensionSnapshotPayload, ExtensionGaugeEntry } from '../types/orientation';

/**
 * Calcule une empreinte de déduplication pour éviter les enregistrements redondants
 */
export function generateSnapshotHash(
  universityCode: string,
  programmeCode: string,
  totalApplicants: number | null,
  timestamp: string
): string {
  const rawString = `${universityCode}_${programmeCode}_${totalApplicants ?? 'na'}_${timestamp.slice(0, 13)}`;
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `snap_${Math.abs(hash).toString(16)}`;
}

/**
 * Valide un payload reçu d'une observation de jauge
 */
export function validateExtensionPayload(payload: unknown): {
  isValid: boolean;
  errors: string[];
  normalized?: ChromeExtensionSnapshotPayload;
} {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Payload invalide ou non-objet'] };
  }

  const p = payload as Record<string, unknown>;

  if (!p.university_code || typeof p.university_code !== 'string') {
    errors.push('university_code manquant ou invalide');
  }

  if (!p.programme_code || typeof p.programme_code !== 'string') {
    errors.push('programme_code manquant ou invalide');
  }

  const timestamp = typeof p.timestamp === 'string' ? p.timestamp : new Date().toISOString();
  const extensionVersion = typeof p.extension_version === 'string' ? p.extension_version : '1.0.0';
  const universityCode = String(p.university_code || 'UAC');
  const universityName = String(p.university_name || 'Université');
  const programmeCode = String(p.programme_code || 'GEN');
  const programmeName = String(p.programme_name || 'Formation');

  const totalCapacity = typeof p.total_capacity === 'number' ? p.total_capacity : null;
  const totalApplicants = typeof p.total_applicants === 'number' ? p.total_applicants : null;
  const observedRank = typeof p.observed_rank === 'number' ? p.observed_rank : null;

  const rawGauges = Array.isArray(p.gauges) ? p.gauges : [];
  const normalizedGauges: ExtensionGaugeEntry[] = rawGauges.map((g: Record<string, unknown>) => ({
    category_name: String(g.category_name || 'Général'),
    capacity: typeof g.capacity === 'number' ? g.capacity : null,
    allocated_count: typeof g.allocated_count === 'number' ? g.allocated_count : null,
    applicant_count: typeof g.applicant_count === 'number' ? g.applicant_count : null,
    status: typeof g.status === 'string' ? g.status : undefined,
  }));

  const snapshotHash = generateSnapshotHash(universityCode, programmeCode, totalApplicants, timestamp);

  const normalized: ChromeExtensionSnapshotPayload = {
    extension_version: extensionVersion,
    snapshot_hash: snapshotHash,
    source_origin: typeof p.source_origin === 'string' ? p.source_origin : 'https://apresmonbac.bj',
    timestamp,
    university_code: universityCode,
    university_name: universityName,
    school_code: typeof p.school_code === 'string' ? p.school_code : undefined,
    school_name: typeof p.school_name === 'string' ? p.school_name : undefined,
    programme_code: programmeCode,
    programme_name: programmeName,
    total_capacity: totalCapacity,
    total_applicants: totalApplicants,
    observed_rank: observedRank,
    gauges: normalizedGauges,
    capture_errors: Array.isArray(p.capture_errors) ? p.capture_errors.map(String) : [],
  };

  return {
    isValid: errors.length === 0,
    errors,
    normalized,
  };
}
