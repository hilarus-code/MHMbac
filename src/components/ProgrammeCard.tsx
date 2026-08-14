/**
 * MHM SOLUTIONS — Après Mon Bac
 * Carte de filière enrichie avec Score d'Opportunité (v1), jauges réelles et explication « Pourquoi ce score ? »
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  Percent,
  Flame,
  CheckCircle2,
  HelpCircle,
  X,
  BookOpen,
  ShieldCheck,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { ScoredProgramme } from '../types/orientation';

interface ProgrammeCardProps {
  item: ScoredProgramme;
  onSelect?: (item: ScoredProgramme) => void;
  isShortlisted?: boolean;
  onToggleShortlist?: (item: ScoredProgramme) => void;
  onOpenAlertModal?: (item: ScoredProgramme) => void;
}

export const ProgrammeCard: React.FC<ProgrammeCardProps> = ({
  item,
  isShortlisted = false,
  onToggleShortlist,
  onOpenAlertModal,
}) => {
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const { programme, score, scoreDetails, badge, reasons } = item;

  const badgeColors = {
    emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  };

  const confidenceColors = {
    Élevé: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Moyen: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Limité: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  return (
    <>
      <div
        id={`prog-card-${programme.id}`}
        className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          {/* Ligne d'en-tête avec Statut & Score d'Opportunité v1 */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                badgeColors[badge.variant] || badgeColors.indigo
              }`}
            >
              {badge.label}
            </span>

            {/* Score d'opportunité mis en avant */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-mono text-xs shadow-sm">
              <span className="text-slate-400 font-sans text-[11px] uppercase tracking-wider font-semibold">
                Score d'opportunité
              </span>
              <span className="font-bold text-sm text-rose-400">{score}/100</span>
            </div>
          </div>

          {/* Fraîcheur des données observées */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mb-2">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{scoreDetails.freshnessText}</span>
            {programme.liveStats.observableRank && (
              <>
                <span>•</span>
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  Rang observé : #{programme.liveStats.observableRank} / {programme.liveStats.totalObservedApplicants}
                </span>
              </>
            )}
          </div>

          {/* Titre & Établissement */}
          <h3 className="font-serif font-bold text-lg sm:text-xl text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors tracking-tight leading-snug">
            {programme.programme}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span className="truncate">{programme.school}</span>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {programme.university}
          </div>

          {/* Séries Admissibles */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Séries :</span>
            {programme.admissibleSeries.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {s}
              </span>
            ))}
          </div>

          {/* Jauges Catégorielles Observées (Bourses & Concurrence) */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            
            {/* Jauge Bourses & Aides */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bourses observées : {programme.liveStats.estimatedScholarships} places</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {Math.round(programme.liveStats.scholarshipRatio * 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(programme.liveStats.scholarshipRatio * 100)}%` }}
                />
              </div>
            </div>

            {/* Jauge Concurrence & Tension */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Tension postulants ({programme.liveStats.totalObservedApplicants}/{programme.liveStats.totalCapacity})</span>
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  {programme.liveStats.competitionLevel}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    programme.liveStats.competitionScore >= 8
                      ? 'bg-rose-500'
                      : programme.liveStats.competitionScore >= 5
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${programme.liveStats.competitionScore * 10}%` }}
                />
              </div>
            </div>

            {/* Mini indicateur de sous-scores */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 text-[10px] font-mono text-center">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block font-sans">Bourse</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{scoreDetails.scholarshipScore}/100</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block font-sans">Admission</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{scoreDetails.observedAdmissionScore}/100</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block font-sans">Confiance</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{scoreDetails.confidenceLevel}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Actions en bas de carte */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            id={`btn-why-score-${programme.id}`}
            onClick={() => setShowExplanationModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Pourquoi ce score ?</span>
          </button>

          <div className="flex items-center gap-1.5">
            {onOpenAlertModal && (
              <button
                onClick={() => onOpenAlertModal(item)}
                title="Recevoir une alerte si la jauge change"
                className="p-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 text-slate-500 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}

            {onToggleShortlist && (
              <button
                id={`btn-shortlist-${programme.id}`}
                onClick={() => onToggleShortlist(item)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isShortlisted
                    ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
                }`}
              >
                {isShortlisted ? '✓ Dans ma liste' : '+ Suivre'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL EXPLICATIVE : « POURQUOI CE SCORE ? »                               */}
      {/* ========================================================================= */}
      {showExplanationModal && (
        <div
          id={`prog-modal-${programme.id}`}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Bouton Fermer */}
            <button
              onClick={() => setShowExplanationModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Fermer l'explication"
            >
              <X className="w-5 h-5" />
            </button>

            {/* En-tête Modal */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  Algorithme version {scoreDetails.scoreVersion}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${confidenceColors[scoreDetails.confidenceLevel]}`}>
                  Confiance : {scoreDetails.confidenceLevel}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                {programme.programme}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {programme.school} — {programme.university}
              </p>
            </div>

            {/* Avertissement de Non-Promesse Réglementaire */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Rappel d'aide à la comparaison (Aucune promesse d'admission)</span>
              </div>
              <p className="leading-relaxed">
                Ce score aide à comparer les options à partir des indicateurs observés. Il ne garantit ni admission ni bourse. La soumission de vos choix reste manuelle et exclusive sur le site officiel <strong>apresmonbac.bj</strong>.
              </p>
            </div>

            {/* Décomposition des 4 Sous-Scores */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-500" />
                Décomposition du Score d'Opportunité ({score}/100)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Score Bourse</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{scoreDetails.scholarshipScore}/100</span>
                  <p className="text-[10px] text-slate-400 mt-1">Ratio & quotas visibles</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Admission Observée</span>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{scoreDetails.observedAdmissionScore}/100</span>
                  <p className="text-[10px] text-slate-400 mt-1">Série & mention</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Score Carrière</span>
                  <span className="text-xl font-bold text-rose-500 font-mono">
                    {scoreDetails.careerScore !== null ? `${scoreDetails.careerScore}/100` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {scoreDetails.careerScore !== null ? 'Affinité métier' : 'Non renseigné'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Concurrence</span>
                  <span className="text-xl font-bold text-amber-500 font-mono">{scoreDetails.competitionIndex}/100</span>
                  <p className="text-[10px] text-slate-400 mt-1">Pression relative</p>
                </div>
              </div>
            </div>

            {/* Facteurs Utilisés dans le Calcul */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Facteurs pris en compte dans votre calcul
              </h4>

              <div className="space-y-2">
                {scoreDetails.factors.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            f.impact === 'positif'
                              ? 'bg-emerald-500'
                              : f.impact === 'attention'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span>{f.name}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{f.description}</p>
                    </div>

                    <span className="font-mono text-slate-400 text-[11px] font-semibold flex-shrink-0">
                      Poids : {f.weight}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Détails des Jauges par Catégorie */}
            {programme.liveStats.categories.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Détail des jauges observées par catégorie
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {programme.liveStats.categories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold">{cat.category}</div>
                        <div className="text-[11px] text-slate-400">
                          {cat.allocated} allouées / {cat.availableTotal} total ({cat.applicantsCount} postulants)
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {Math.round(cat.pressureRatio * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Données Manquantes / Limites de Données */}
            {scoreDetails.missingData.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-500 space-y-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Éléments à considérer :
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {scoreDetails.missingData.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Métiers et Débouchés Associés */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Débouchés & Métiers de cette filière
              </h4>
              <div className="flex flex-wrap gap-2">
                {programme.liveStats.sampleCareers.map((career, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    {career}
                  </span>
                ))}
              </div>
            </div>

            {/* Pied de Page Modal */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <a
                href="https://apresmonbac.bj"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
              >
                <span>Accéder au portail officiel apresmonbac.bj</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setShowExplanationModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                Compris, fermer
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
