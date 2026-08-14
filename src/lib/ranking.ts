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
  ScoredLiveProgramme,
  LiveProgramme,
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

/**
 * Calcule le score d'opportunité purement à partir d'un objet LiveProgramme
 */
export function calculateLiveProgrammeScore(
  prog: import('../types/orientation').LiveProgramme,
  profile: Partial<UserProfile> | null,
  preferences: Partial<UserPreferences> | null
): import('../types/orientation').ScoredLiveProgramme {
  const goal: PrimaryGoal = preferences?.primary_goal || 'explorer';
  const series: BacSeries = (profile?.series as BacSeries) || 'D';
  const mention: BacMention = (profile?.mention as BacMention) || 'Assez bien';
  const keywords = preferences?.career_keywords || [];

  const mentionBonus = getMentionBonus(mention);

  // Détermination de l'âge en minutes de la donnée observée
  const observedDate = prog.observed_at ? new Date(prog.observed_at).getTime() : Date.now();
  const diffMinutes = Math.max(1, Math.floor((Date.now() - observedDate) / (1000 * 60)));

  // 1. Score Bourse
  const totalSlots = Math.max(0, prog.total || (prog.scholarships + prog.aid + prog.passable + prog.ab + prog.b + prog.tb));
  const effectiveScholarships = prog.scholarships || 0;
  const effectiveAid = prog.aid || 0;
  
  const rawRatio = totalSlots > 0 ? (effectiveScholarships + effectiveAid * 0.5) / totalSlots : 0;
  const scholarshipRatio = Math.min(1.0, Math.max(0, rawRatio));
  const scholarshipScore = Math.min(100, Math.round(scholarshipRatio * 100));

  // 2. Concurrence & Pression observée
  let competitionIndex = 50; // Par défaut modéré
  let competitionScore = 5;

  if (prog.applicants && prog.capacity && prog.capacity > 0) {
    const pressureRatio = prog.applicants / prog.capacity;
    competitionIndex = Math.min(100, Math.max(10, Math.round(pressureRatio * 30)));
    competitionScore = Math.min(10, Math.max(1, Math.round(competitionIndex / 10)));
  } else if (prog.rank && prog.total > 0) {
    const rankRatio = prog.rank / prog.total;
    competitionIndex = Math.min(100, Math.max(10, Math.round(rankRatio * 100)));
    competitionScore = Math.min(10, Math.max(1, Math.round(competitionIndex / 10)));
  } else if (totalSlots > 0) {
    // Si répartition mention disponible
    const highlySelective = (prog.tb + prog.b) / totalSlots;
    competitionIndex = Math.min(95, Math.max(20, Math.round(40 + highlySelective * 60)));
    competitionScore = Math.min(10, Math.max(1, Math.round(competitionIndex / 10)));
  }

  // 3. Admission Observée
  // Compatibilité de base par déduction de nom/domaine
  let seriesScore = 70;
  const progText = `${prog.programme} ${prog.school} ${prog.university} ${prog.domain || ''}`.toLowerCase();
  
  if (series === 'C' || series === 'D' || series === 'E') {
    if (progText.includes('informatique') || progText.includes('ingénieur') || progText.includes('santé') || progText.includes('médecine') || progText.includes('agronomie') || progText.includes('polytechnique') || progText.includes('math')) {
      seriesScore = 95;
    }
  } else if (series === 'A' || series === 'B') {
    if (progText.includes('droit') || progText.includes('lettres') || progText.includes('gestion') || progText.includes('économie') || progText.includes('sociologie') || progText.includes('administration')) {
      seriesScore = 95;
    }
  }

  const rawAdmission = seriesScore * 0.55 + mentionBonus * 1.5 + (10 - competitionScore) * 2.5;
  const observedAdmissionScore = Math.min(100, Math.max(15, Math.round(rawAdmission)));

  // 4. Adéquation Carrière
  let careerScore: number | null = null;
  const matchedKeywords: string[] = [];

  if (keywords.length > 0) {
    for (const kw of keywords) {
      const norm = kw.trim().toLowerCase();
      if (norm && progText.includes(norm)) {
        matchedKeywords.push(kw);
      }
    }

    if (matchedKeywords.length >= 2) {
      careerScore = 95;
    } else if (matchedKeywords.length === 1) {
      careerScore = 85;
    } else {
      careerScore = 40;
    }
  }

  // Pondérations selon goal
  let wAdmission = 0.35;
  let wScholarship = 0.25;
  let wCareer = 0.25;
  let wCompetitionEase = 0.15;

  if (goal === 'bourse') {
    wScholarship = 0.50;
    wAdmission = 0.25;
    wCareer = careerScore !== null ? 0.15 : 0.05;
    wCompetitionEase = 0.10;
  } else if (goal === 'securite') {
    wAdmission = 0.45;
    wCompetitionEase = 0.35;
    wScholarship = 0.10;
    wCareer = careerScore !== null ? 0.10 : 0.05;
  } else if (goal === 'carriere') {
    wCareer = 0.45;
    wAdmission = 0.30;
    wScholarship = 0.15;
    wCompetitionEase = 0.10;
  } else {
    // Explorer
    wAdmission = 0.35;
    wScholarship = 0.30;
    wCareer = careerScore !== null ? 0.20 : 0.0;
    wCompetitionEase = 0.15;
  }

  const effectiveCareerScore = careerScore ?? 50;
  const competitionEaseScore = 100 - competitionIndex;

  const rawOpportunityScore =
    observedAdmissionScore * wAdmission +
    scholarshipScore * wScholarship +
    effectiveCareerScore * wCareer +
    competitionEaseScore * wCompetitionEase;

  const opportunityScore = Math.min(100, Math.max(10, Math.round(rawOpportunityScore)));

  // Évaluation de la confiance des données
  const missingData: string[] = [];
  if (!prog.rank) missingData.push('Rang individuel non synchronisé');
  if (!prog.applicants) missingData.push('Total des postulants non renseigné');
  if (totalSlots === 0) missingData.push('Total des places à 0 ou non renseigné');

  let confidenceLevel: 'Élevé' | 'Moyen' | 'Limité' = 'Élevé';
  let confidenceReason = `Données observées récentes (${diffMinutes} min) et jauges cohérentes.`;

  if (diffMinutes > 120 || totalSlots === 0) {
    confidenceLevel = 'Limité';
    confidenceReason = `Données observées datant de plus de 2 heures ou partielles.`;
  } else if (diffMinutes > 30 || missingData.length > 1) {
    confidenceLevel = 'Moyen';
    confidenceReason = `Collecte effectuée il y a ${diffMinutes} min, jauges exploitables.`;
  }

  const factors: ScoreFactor[] = [
    {
      name: 'Disponibilité Bourses & Aides observées',
      impact: scholarshipScore >= 55 ? 'positif' : scholarshipScore >= 35 ? 'neutre' : 'attention',
      weight: Math.round(wScholarship * 100),
      description: `${effectiveScholarships} bourses et ${effectiveAid} aides observées sur ${totalSlots} places (${Math.round(scholarshipRatio * 100)}%).`,
    },
    {
      name: 'Tension & Concurrence observée',
      impact: competitionIndex >= 70 ? 'attention' : competitionIndex >= 45 ? 'neutre' : 'positif',
      weight: Math.round(wCompetitionEase * 100),
      description: `Indice de pression ${competitionIndex}/100 (Score de tension ${competitionScore}/10).`,
    },
    {
      name: 'Admission observée & Profil',
      impact: observedAdmissionScore >= 65 ? 'positif' : 'neutre',
      weight: Math.round(wAdmission * 100),
      description: `Série ${series} avec mention ${mention}.`,
    },
  ];

  if (careerScore !== null) {
    factors.push({
      name: 'Adéquation Métier / Mots-clés',
      impact: careerScore >= 70 ? 'positif' : 'neutre',
      weight: Math.round(wCareer * 100),
      description:
        matchedKeywords.length > 0
          ? `Mots-clés repérés : ${matchedKeywords.join(', ')}`
          : `Filière dans le domaine ${prog.domain || 'Général'}`,
    });
  }

  const reasons: string[] = [];
  if (scholarshipScore >= 60) {
    reasons.push(`Ratio de bourses très favorable (${Math.round(scholarshipRatio * 100)}%).`);
  }
  if (matchedKeywords.length > 0) {
    reasons.push(`Correspond aux métiers : ${matchedKeywords.join(', ')}.`);
  }
  if (competitionScore <= 4) {
    reasons.push(`Filière à faible pression observée.`);
  } else {
    reasons.push(`Données observées en direct.`);
  }

  let badge: ScoredLiveProgramme['badge'] = {
    label: 'Opportunité Équilibrée',
    variant: 'indigo',
  };

  if (goal === 'bourse' && scholarshipScore >= 65) {
    badge = { label: 'Forte Opportunité Bourse', variant: 'emerald' };
  } else if (goal === 'securite' && competitionIndex <= 45) {
    badge = { label: 'Choix Sécurisé / Accessible', variant: 'emerald' };
  } else if (goal === 'carriere' && (careerScore ?? 0) >= 80) {
    badge = { label: 'Alignement Métier Optimal', variant: 'rose' };
  } else if (competitionIndex >= 75) {
    badge = { label: 'Filière Très Demandée', variant: 'amber' };
  }

  const scoreDetails: OpportunityScoreDetails = {
    scoreVersion: 'v1',
    opportunityScore,
    scholarshipScore,
    observedAdmissionScore,
    careerScore,
    competitionIndex,
    confidenceLevel,
    confidenceReason,
    collectedAt: prog.observed_at,
    freshnessText: `Mis à jour il y a ${diffMinutes} min`,
    factors,
    missingData,
  };

  return {
    programme: prog,
    score: opportunityScore,
    scoreDetails,
    badge,
    reasons,
  };
}

/**
 * Classe une liste de LiveProgramme de manière déterministe
 */
export function rankLiveProgrammes(
  programmes: import('../types/orientation').LiveProgramme[],
  profile: Partial<UserProfile> | null,
  preferences: Partial<UserPreferences> | null
): import('../types/orientation').ScoredLiveProgramme[] {
  return programmes
    .map((prog) => calculateLiveProgrammeScore(prog, profile, preferences))
    .sort((a, b) => b.score - a.score);
}


