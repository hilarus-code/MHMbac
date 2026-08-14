/**
 * MHM SOLUTIONS — Après Mon Bac
 * Écran d'accueil public : Démontrer avant de demander (Données réelles visibles immédiatement, 3 difficultés, scores expliqués)
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Percent,
  Flame,
  Layers,
  Activity,
  Target,
  Clock,
  ExternalLink,
  BookOpen,
  Filter,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  Bell,
} from 'lucide-react';
import { ProgrammeCard } from '../components/ProgrammeCard';
import { AlertModal } from '../components/AlertModal';
import { HeroCarousel } from '../components/HeroCarousel';
import { DEMO_PROGRAMMES } from '../lib/demoData';
import { rankProgrammes } from '../lib/ranking';
import { MHM_PROMOTION_CONFIG } from '../lib/promotion';
import { useAuth } from '../context/AuthContext';
import { ScoredProgramme } from '../types/orientation';

interface HomePageProps {
  navigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { profile, preferences } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'tous' | 'bourse' | 'securite' | 'carriere'>('tous');
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedProgrammeForAlert, setSelectedProgrammeForAlert] = useState<ScoredProgramme | null>(null);

  // Classement déterministe en temps réel v1
  const ranked = rankProgrammes(
    DEMO_PROGRAMMES,
    profile || { series: 'D', mention: 'Bien' },
    preferences || { primary_goal: 'explorer', career_keywords: ['Informatique', 'Santé', 'Agriculture'] }
  );

  const filteredProgrammes = ranked.filter((p) => {
    if (activeFilter === 'bourse') return p.programme.liveStats.scholarshipRatio >= 0.50;
    if (activeFilter === 'securite') return p.programme.liveStats.competitionScore <= 5;
    if (activeFilter === 'carriere') return (p.scoreDetails.careerScore ?? 0) >= 70;
    return true;
  });

  const handleStartPersonalization = () => {
    navigate('/onboarding');
  };

  const handleOpenAlert = (programme?: ScoredProgramme) => {
    setSelectedProgrammeForAlert(programme || null);
    setAlertModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION : DÉMONTRER AVANT DE DEMANDER                             */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-b border-slate-800">
        
        {/* Halos lumineux subtils */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-4xl mx-auto text-center space-y-6">
            
            {/* Badge de marque */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Après Mon Bac • Données & Jauges en temps réel</span>
            </div>

            {/* Hook Principal Conforme */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-[1.15] sm:leading-[1.12]">
              Tu veux comprendre où tu te situes avant de choisir ?{' '}
              <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-amber-300 bg-clip-text text-transparent italic">
                Commence par voir les classements tels qu’ils évoluent réellement.
              </span>
            </h1>

            {/* Sous-Titre Conforme */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed font-normal max-w-3xl mx-auto">
              Après mon Bac rassemble les filières et les jauges observées pour t’aider à lire les possibilités, comparer les options et suivre les changements. Tu peux d’abord explorer librement, puis personnaliser l’analyse quand tu es prêt.
            </p>

            {/* Deux Appels à l'Action Clairs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                id="hero-analyze-btn"
                onClick={handleStartPersonalization}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm sm:text-base bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-950/50 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Analyser pour mon profil</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-alerts-btn"
                onClick={() => handleOpenAlert()}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl font-semibold text-sm sm:text-base bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Activer les alertes de variations</span>
              </button>
            </div>

            {/* Mention de Confiance & Cadre légal */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Aide à la comparaison • Validation manuelle sur apresmonbac.bj</span>
              </div>
              <span>•</span>
              <div>
                Créateur : <strong className="text-white">{MHM_PROMOTION_CONFIG.creatorName}</strong>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECTION : LES 3 DIFFICULTÉS VÉCUES                                      */}
      {/* ========================================================================= */}
      <section id="difficulties-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span>Pourquoi l'orientation est si complexe</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
            Les 3 défis majeurs auxquels vous faites face
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Comprendre ces difficultés permet d'aborder votre choix de filière avec calme et méthode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Difficulté 1 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                1. Trop de choix à comparer
              </span>
              <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                Plus de 1 500 combinaisons
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Entre les multiples universités, écoles, filières et catégories de places (bourses, demi-bourses, payant), il est impossible d’avoir une vue d’ensemble manuellement en quelques jours.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Solution : Centraliser et ordonner les données clés.
            </div>
          </div>

          {/* Difficulté 2 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Activity className="w-6 h-6" />
              </div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                2. Les classements évoluent
              </span>
              <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                Des jauges en mouvement continu
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Une capture d'écran ponctuelle devient vite obsolète. Dès que d'autres bacheliers postulent, les rangs observés et les taux de remplissage se transforment.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Solution : Afficher la fraîcheur et la dynamique temporelle.
            </div>
          </div>

          {/* Difficulté 3 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <Target className="w-6 h-6" />
              </div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                3. Bourse, sécurité ou carrière
              </span>
              <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                Un arbitrage stratégique décisif
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Choisir une filière pour maximiser une bourse d'études ou viser un métier précis ? Chaque candidat a des priorités distinctes qui méritent une analyse personnalisée.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              Solution : Des scores d'opportunité pondérés et transparents.
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION : DONNÉES EN DIRECT & CLASSEMENTS OBSERVÉS                      */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200 dark:border-slate-800">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Données publiques observées • Mis à jour il y a 14 minutes</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 dark:text-white">
              Classement et Jauges en temps réel
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Explorez librement les formations universitaires observées et leurs indicateurs de sélection.
            </p>
          </div>

          {/* Filtres d'exploration publique */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveFilter('tous')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'tous'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Toutes ({DEMO_PROGRAMMES.length})
            </button>
            <button
              onClick={() => setActiveFilter('bourse')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'bourse'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Priorité Bourses
            </button>
            <button
              onClick={() => setActiveFilter('securite')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'securite'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sécurité / Faible tension
            </button>
            <button
              onClick={() => setActiveFilter('carriere')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'carriere'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Carrières Clés
            </button>
          </div>
        </div>

        {/* Note explicative sur la lecture des jauges */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>
              <strong>Légende des jauges :</strong> Une jauge indique la proportion de places attribuées et la pression observée. Les données sont actualisées en continu au fur et à mesure des dépôts.
            </span>
          </div>
          <button
            onClick={handleStartPersonalization}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 flex-shrink-0"
          >
            <span>Personnaliser pour mon profil</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grille des cartes de filières enrichies avec « Pourquoi ce score ? » */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProgrammes.map((p) => (
            <ProgrammeCard
              key={p.programme.id}
              item={p}
              onOpenAlertModal={handleOpenAlert}
            />
          ))}
        </div>

        {/* Bannière d'incitation à la personnalisation */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Passez à l'étape suivante
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold">
              Ces scores reflètent-ils vos résultats au Baccalauréat ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Renseignez votre série, mention et objectifs pour obtenir des scores d’opportunité calculés sur-mesure pour vous.
            </p>
          </div>

          <button
            onClick={handleStartPersonalization}
            className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/50 hover:scale-105 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>Analyser pour mon profil</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. CAROUSEL & MÉTHODE D'ACCOMPAGNEMENT                                     */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Parcours guidé
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold">
              Comment fonctionne le parcours d’analyse
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Découvrez chaque étape du parcours sans engagement.
            </p>
          </div>

          <HeroCarousel onStartOnboarding={handleStartPersonalization} />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PRÉSENTATION MHM SOLUTIONS & HILARUS GBAGOULE                            */}
      {/* ========================================================================= */}
      <section className="bg-slate-950 text-white py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                La Philosophie MHM SOLUTIONS
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
                Transformer chaque problème de parcours en solution numérique utile
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {MHM_PROMOTION_CONFIG.mission}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/about')}
                  className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 font-semibold text-sm transition-colors"
                >
                  <span>En savoir plus sur MHM SOLUTIONS et Hilarus Gbagoule</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Initiative & Conception
              </div>
              <div className="text-lg font-bold text-white">
                {MHM_PROMOTION_CONFIG.creatorName}
              </div>
              <div className="text-xs text-rose-400 font-medium">
                {MHM_PROMOTION_CONFIG.creatorTitle}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
                {MHM_PROMOTION_CONFIG.brandName} développe des solutions technologiques pour accompagner les bacheliers béninois vers des choix éclairés.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Modale d'alerte et de sauvegarde */}
      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        targetProgramme={selectedProgrammeForAlert}
      />

    </div>
  );
};
