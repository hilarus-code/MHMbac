/**
 * MHM SOLUTIONS — Après Mon Bac (v1)
 * Algorithme déterministe de Score d'Opportunité (Fonction pure, documentée & versionnée)
 * Créateur : Hilarus GBAGOULE
 * 
 * Version de l'algorithme : v1
 * Règle d'or : Ce score aide à comparer les options ; il ne garantit ni admission ni bourse.
 */

import {
  BacMention,
  BacSeries,
  DemoProgramme,
  OpportunityScoreDetails,
  PrimaryGoal,
  RiskTolerance,
  ScoredProgramme,
  ScoreFactor,
  UserPreferences,
  UserProfile,
} from '../types/orientation';

/**
 * Calcule l'adéquation d'une série avec une filière (0 à 100)
 */
export function calculateSeriesCompatibility(
  series: BacSeries | null | undefined,
  admissibleSeries: BacSeries[]
): { score: number; isAdmissible: boolean; note: string } {
  if (!series) {
    return { score: 65, isAdmissible: true, note: 'Série non renseignée (hypothèse standard)' };
  }

  const index = admissibleSeries.indexOf(series);
  if (index === 0) {
    return { score: 100, isAdmissible: true, note: `Série ${series} prioritaire pour cette formation` };
  } else if (index > 0) {
    const score = Math.max(60, 95 - index * 10);
    return { score, isAdmissible: true, note: `Série ${series} compatible et recevable (rang ${index + 1})` };
  } else if (series === 'Autre') {
    return { score: 45, isAdmissible: true, note: 'Série alternative soumise à équivalence ou dossier' };
  }

  return { score: 15, isAdmissible: false, note: `Série ${series} non prioritaire / hors cursus direct` };
}

/**
 * Calcule le coefficient de mention
 */
export function getMentionBonus(mention: BacMention | null | undefined): number {
  switch (mention) {
    case 'Très bien':
      return 15;
    case 'Bien':
      return 10;
    case 'Assez bien':
      return 5;
    case 'Passable':
    default:
      return 0;
  }
}

/**
 * Calcule le score bourse (0 à 100) basé sur les jauges de bourse observées
 */
export function calculateScholarshipScore(programme: DemoProgramme): number {
  const ratio = programme.liveStats.scholarshipRatio; // ex: 0.46
  const compScore = programme.liveStats.competitionScore; // 1 à 10

  // Trouver la jauge spécifique des bourses nationales si disponible
  const bourseCategory = programme.liveStats.categories.find(
    (c) => c.category === 'Bourses Nationales'
  );

  let categoryAvailabilityBonus = 0;
  if (bourseCategory) {
    const freeSlots = Math.max(0, bourseCategory.availableTotal - bourseCategory.allocated);
    categoryAvailabilityBonus = freeSlots > 5 ? 10 : freeSlots > 0 ? 5 : 0;
  }

  const baseRatioScore = Math.min(100, Math.round(ratio * 100));
  const compEaseBonus = (10 - compScore) * 2.5; // 0 à 22.5

  const rawScore = baseRatioScore * 0.7 + compEaseBonus + categoryAvailabilityBonus;
  return Math.min(100, Math.max(0, Math.round(rawScore)));
}

/**
 * Calcule le score d'admission observée (0 à 100)
 */
export function calculateObservedAdmissionScore(
  programme: DemoProgramme,
  seriesScore: number,
  mentionBonus: number,
  riskTolerance: RiskTolerance
): number {
  const compScore = programme.liveStats.competitionScore; // 10 = max pression
  
  // Facteur de pression observée
  const capacity = programme.liveStats.totalCapacity;
  const applicants = programme.liveStats.totalObservedApplicants;
  const pressureRatio = applicants > 0 && capacity > 0 ? applicants / capacity : 1.5;

  let pressureDeduction = 0;
  if (pressureRatio > 3.0) {
    pressureDeduction = 25;
  } else if (pressureRatio > 2.0) {
    pressureDeduction = 15;
  } else if (pressureRatio > 1.0) {
    pressureDeduction = 5;
  }

  let riskMod = 0;
  if (riskTolerance === 'prudente') {
    riskMod = compScore >= 8 ? -10 : +5;
  } else if (riskTolerance === 'ambitieuse') {
    riskMod = compScore >= 8 ? +5 : 0;
  }

  const rawAdmission = seriesScore * 0.55 + mentionBonus * 1.5 - pressureDeduction + riskMod + (10 - compScore) * 2;
  return Math.min(100, Math.max(10, Math.round(rawAdmission)));
}

/**
 * Calcule le score d'adéquation métier (0 à 100 ou null)
 */
export function calculateCareerScore(
  programme: DemoProgramme,
  careerKeywords: string[]
): { score: number | null; matchedKeywords: string[] } {
  if (!careerKeywords || careerKeywords.length === 0) {
    return { score: null, matchedKeywords: [] };
  }

  const matchedKeywords: string[] = [];
  const normalizedText = `${programme.programme} ${programme.domain} ${programme.school} ${programme.liveStats.sampleCareers.join(' ')}`.toLowerCase();

  for (const keyword of careerKeywords) {
    const normKw = keyword.trim().toLowerCase();
    if (normKw && normalizedText.includes(normKw)) {
      matchedKeywords.push(keyword);
    }
  }

  if (matchedKeywords.length >= 2) {
    return { score: 96, matchedKeywords };
  } else if (matchedKeywords.length === 1) {
    return { score: 85, matchedKeywords };
  }

  const hasPartialDomain = careerKeywords.some((kw) =>
    programme.domain.toLowerCase().includes(kw.toLowerCase().slice(0, 4))
  );

  return {
    score: hasPartialDomain ? 65 : 35,
    matchedKeywords,
  };
}

/**
 * Évalue le niveau de confiance des données
 */
export function evaluateConfidence(
  programme: DemoProgramme
): { level: 'Élevé' | 'Moyen' | 'Limité'; reason: string; missing: string[] } {
  const missing: string[] = [];
  const freshness = programme.liveStats.freshnessMinutes;

  if (programme.liveStats.categories.length === 0) {
    missing.push('Détail des sous-catégories de jauges non disponible');
  }
  if (!programme.liveStats.observableRank) {
    missing.push('Rang observable non synchronisé');
  }

  if (freshness <= 15 && missing.length === 0) {
    return {
      level: 'Élevé',
      reason: `Données fraîches (${freshness} min) et jauges catégorielles complètes.`,
      missing,
    };
  } else if (freshness <= 60 && missing.length <= 1) {
    return {
      level: 'Moyen',
      reason: `Collecte récente (${freshness} min), mise à jour recommandée avant arbitrage.`,
      missing,
    };
  }

  return {
    level: 'Limité',
    reason: `Données observées datant de plus d'une heure ou incomplètes (${missing.length} éléments manquants).`,
    missing,
  };
}

/**
 * Fonction PURE principale de calcul déterministe du Score d'Opportunité v1
 */
export function rankProgrammes(
  programmes: DemoProgramme[],
  profile: Partial<UserProfile> | null,
  preferences: Partial<UserPreferences> | null
): ScoredProgramme[] {
  const goal: PrimaryGoal = preferences?.primary_goal || 'explorer';
  const series: BacSeries = (profile?.series as BacSeries) || 'D';
  const mention: BacMention = (profile?.mention as BacMention) || 'Assez bien';
  const riskTolerance: RiskTolerance = preferences?.risk_tolerance || 'equilibree';
  const keywords = preferences?.career_keywords || [];

  const mentionBonus = getMentionBonus(mention);

  return programmes
    .map((prog) => {
      const seriesEval = calculateSeriesCompatibility(series, prog.admissibleSeries);
      const scholarshipScore = calculateScholarshipScore(prog);
      const careerEval = calculateCareerScore(prog, keywords);
      const observedAdmissionScore = calculateObservedAdmissionScore(
        prog,
        seriesEval.score,
        mentionBonus,
        riskTolerance
      );
      const competitionIndex = Math.min(100, Math.round(prog.liveStats.competitionScore * 10));

      // Pondérations déterministes selon l'objectif principal
      let wAdmission = 0.35;
      let wScholarship = 0.25;
      let wCareer = 0.25;
      let wCompetitionEase = 0.15;

      if (goal === 'bourse') {
        wScholarship = 0.50;
        wAdmission = 0.25;
        wCareer = careerEval.score !== null ? 0.15 : 0.05;
        wCompetitionEase = 0.10;
      } else if (goal === 'securite') {
        wAdmission = 0.45;
        wCompetitionEase = 0.35;
        wScholarship = 0.10;
        wCareer = careerEval.score !== null ? 0.10 : 0.05;
      } else if (goal === 'carriere') {
        wCareer = 0.45;
        wAdmission = 0.30;
        wScholarship = 0.15;
        wCompetitionEase = 0.10;
      } else {
        // Mode 'explorer' (équilibré)
        wAdmission = 0.35;
        wScholarship = 0.30;
        wCareer = careerEval.score !== null ? 0.20 : 0.0;
        wCompetitionEase = 0.15;
      }

      const effectiveCareerScore = careerEval.score ?? 50;
      const competitionEaseScore = 100 - competitionIndex;

      let rawOpportunityScore =
        observedAdmissionScore * wAdmission +
        scholarshipScore * wScholarship +
        effectiveCareerScore * wCareer +
        competitionEaseScore * wCompetitionEase;

      const opportunityScore = Math.min(100, Math.max(10, Math.round(rawOpportunityScore)));

      // Évaluation de la confiance
      const confidence = evaluateConfidence(prog);

      // Facteurs explicatifs pour la transparence (« Pourquoi ce score ? »)
      const factors: ScoreFactor[] = [
        {
          name: 'Compatibilité de série',
          impact: seriesEval.isAdmissible ? 'positif' : 'attention',
          weight: Math.round(wAdmission * 100),
          description: seriesEval.note,
        },
        {
          name: 'Disponibilité bourses & aides',
          impact: scholarshipScore >= 60 ? 'positif' : scholarshipScore >= 40 ? 'neutre' : 'attention',
          weight: Math.round(wScholarship * 100),
          description: `${Math.round(prog.liveStats.scholarshipRatio * 100)}% de ratio estimé avec ${prog.liveStats.estimatedScholarships} bourses observées.`,
        },
        {
          name: 'Pression de concurrence',
          impact: competitionIndex >= 75 ? 'attention' : competitionIndex >= 50 ? 'neutre' : 'positif',
          weight: Math.round(wCompetitionEase * 100),
          description: `Niveau ${prog.liveStats.competitionLevel} (${prog.liveStats.totalObservedApplicants} postulants observés pour ${prog.liveStats.totalCapacity} places).`,
        },
      ];

      if (careerEval.score !== null) {
        factors.push({
          name: 'Adéquation métier / carrière',
          impact: careerEval.score >= 70 ? 'positif' : 'neutre',
          weight: Math.round(wCareer * 100),
          description:
            careerEval.matchedKeywords.length > 0
              ? `Correspondance avec vos cibles : ${careerEval.matchedKeywords.join(', ')}`
              : `Filière du domaine ${prog.domain}`,
        });
      }

      // Raisons résumées
      const reasons: string[] = [seriesEval.note];
      if (scholarshipScore >= 65) {
        reasons.push(`Ratio de bourses très favorable (${Math.round(prog.liveStats.scholarshipRatio * 100)}%).`);
      }
      if (careerEval.matchedKeywords.length > 0) {
        reasons.push(`Aligné avec : ${careerEval.matchedKeywords.join(', ')}.`);
      }
      if (prog.liveStats.competitionScore <= 5) {
        reasons.push(`Pression concurrentielle modérée (${prog.liveStats.competitionLevel}).`);
      }

      // Badge
      let badge: ScoredProgramme['badge'] = {
        label: 'Opportunité Équilibrée',
        variant: 'indigo',
      };

      if (goal === 'bourse' && scholarshipScore >= 70) {
        badge = { label: 'Forte Opportunité Bourse', variant: 'emerald' };
      } else if (goal === 'securite' && competitionIndex <= 45) {
        badge = { label: 'Choix Sécurisé / Accessible', variant: 'emerald' };
      } else if (goal === 'carriere' && (careerEval.score ?? 0) >= 85) {
        badge = { label: 'Alignement Métier Optimal', variant: 'rose' };
      } else if (competitionIndex >= 85) {
        badge = { label: 'Filière Très Convoitée', variant: 'amber' };
      }

      const scoreDetails: OpportunityScoreDetails = {
        scoreVersion: 'v1',
        opportunityScore,
        scholarshipScore,
        observedAdmissionScore,
        careerScore: careerEval.score,
        competitionIndex,
        confidenceLevel: confidence.level,
        confidenceReason: confidence.reason,
        collectedAt: prog.liveStats.lastUpdatedAt,
        freshnessText: `Mis à jour il y a ${prog.liveStats.freshnessMinutes} minutes`,
        factors,
        missingData: confidence.missing,
      };

      return {
        programme: prog,
        score: opportunityScore,
        scoreDetails,
        compatibilityScore: seriesEval.score,
        scholarshipScore,
        careerScore: effectiveCareerScore,
        badge,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}

