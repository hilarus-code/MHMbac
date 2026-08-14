/**
 * MHM SOLUTIONS — Après Mon Bac
 * Tableau de bord d'orientation : Recommandations, Score d'Opportunité v1, Alertes et Shortlist
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Target,
  Percent,
  Flame,
  Briefcase,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  CheckCircle2,
  Bell,
  Clock,
  Printer,
  ExternalLink,
  ShieldCheck,
  Radio,
  RefreshCw,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLiveProgrammes } from '../hooks/useLiveProgrammes';
import { DEMO_PROGRAMMES } from '../lib/demoData';
import { rankProgrammes } from '../lib/ranking';
import { ProgrammeCard } from '../components/ProgrammeCard';
import { LiveProgrammeCard } from '../components/LiveProgrammeCard';
import { AlertModal } from '../components/AlertModal';
import { TransparencyBadge } from '../components/TransparencyBadge';
import { PrimaryGoal, ScoredProgramme, ScoredLiveProgramme } from '../types/orientation';

interface DashboardPageProps {
  navigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const { user, profile, preferences, updatePreferences } = useAuth();
  
  // Hook Live Programmes & Realtime
  const {
    liveProgrammes,
    scoredProgrammes: liveRanked,
    alerts,
    stats,
    loading: liveLoading,
    isRealtimeActive,
    refresh: refreshLive,
    triggerSyncSeed,
  } = useLiveProgrammes(
    profile || { series: 'D', mention: 'Bien' },
    preferences
  );

  // Mode de données : 'live' si disponible, ou 'demo'
  const [dataSourceMode, setDataSourceMode] = useState<'live' | 'demo'>('live');
  
  // État local de la shortlist
  const [shortlist, setShortlist] = useState<string[]>(['1001', '1003', 'prg-01']);
  const [activeTab, setActiveTab] = useState<'tous' | 'shortlist'>('tous');
  const [quickGoal, setQuickGoal] = useState<PrimaryGoal>(
    preferences?.primary_goal || 'explorer'
  );
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedProgrammeForAlert, setSelectedProgrammeForAlert] = useState<ScoredProgramme | null>(null);

  // Calcul du classement Démo classique
  const demoRanked = rankProgrammes(
    DEMO_PROGRAMMES,
    profile || { series: 'D', mention: 'Bien' },
    {
      ...preferences,
      primary_goal: quickGoal,
    }
  );

  const isLiveActive = dataSourceMode === 'live' && liveProgrammes.length > 0;
  const currentLiveProgrammes = liveRanked;
  const currentDemoProgrammes = demoRanked;

  const shortlistedLive = currentLiveProgrammes.filter((p) =>
    shortlist.includes(String(p.programme.programme_id))
  );
  const shortlistedDemo = currentDemoProgrammes.filter((p) =>
    shortlist.includes(p.programme.id)
  );

  // Gestion de la shortlist
  const toggleShortlistLive = (item: ScoredLiveProgramme) => {
    const idStr = String(item.programme.programme_id);
    if (shortlist.includes(idStr)) {
      setShortlist(shortlist.filter((id) => id !== idStr));
    } else {
      setShortlist([...shortlist, idStr]);
    }
  };

  const toggleShortlistDemo = (item: ScoredProgramme) => {
    if (shortlist.includes(item.programme.id)) {
      setShortlist(shortlist.filter((id) => id !== item.programme.id));
    } else {
      setShortlist([...shortlist, item.programme.id]);
    }
  };

  const handleOpenAlert = (programme?: ScoredProgramme) => {
    setSelectedProgrammeForAlert(programme || null);
    setAlertModalOpen(true);
  };

  const handleToggleGoal = async (newGoal: PrimaryGoal) => {
    setQuickGoal(newGoal);
    try {
      await updatePreferences({
        primary_goal: newGoal,
      });
    } catch (err) {
      console.error('Erreur mise à jour objectif:', err);
    }
  };

  const totalDisplayed = isLiveActive
    ? activeTab === 'shortlist'
      ? shortlistedLive.length
      : currentLiveProgrammes.length
    : activeTab === 'shortlist'
    ? shortlistedDemo.length
    : currentDemoProgrammes.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* ========================================================================= */}
        {/* 1. EN-TÊTE DU TABLEAU DE BORD                                             */}
        {/* ========================================================================= */}
        <div
          id="dashboard-welcome-banner"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Mon Analyse Stratégique • Algorithme v1</span>
                </div>

                {isRealtimeActive && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    <Radio className="w-3 h-3 text-emerald-400" />
                    <span>Realtime Connecté</span>
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
                Tableau de bord de{' '}
                <span className="bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent italic">
                  {profile?.display_name || user?.user_metadata?.display_name || 'Bachelier'}
                </span>
              </h1>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
                <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 font-semibold text-white">
                  Série {profile?.series || 'D'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 font-semibold text-rose-400">
                  Mention {profile?.mention || 'Bien'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 font-semibold text-emerald-400">
                  Priorité : {quickGoal.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-edit-onboarding"
                onClick={() => navigate('/onboarding')}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Modifier mon profil</span>
              </button>

              <button
                id="btn-trigger-alert-modal"
                onClick={() => handleOpenAlert()}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/40 transition-colors flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Alertes de changements</span>
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. STATUT DE LA SOURCE & SYNCHRONISATION LIVE                              */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${isLiveActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                <Radio className={`w-5 h-5 ${isLiveActive ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {isLiveActive ? 'Données officielles observées en direct' : 'Mode démonstration représentatif'}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isLiveActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {isLiveActive ? 'apresmonbac.bj' : 'Démo'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {stats?.lastObservedAt
                    ? `Dernière synchronisation il y a ${stats.diffMinutes ?? 0} min (${stats.totalProgrammes} filières, ${stats.totalUniversities} universités)`
                    : 'Données synchronisées automatiquement via l’extension Chrome MHM.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDataSourceMode(dataSourceMode === 'live' ? 'demo' : 'live')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {dataSourceMode === 'live' ? 'Passer en Démo' : 'Passer en Live'}
              </button>

              <button
                onClick={() => refreshLive()}
                disabled={liveLoading}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Actualiser les données"
              >
                <RefreshCw className={`w-4 h-4 ${liveLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Bannière des alertes récentes si existantes */}
          {alerts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <Bell className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Dernière variation observée :</span>
                <p>
                  <strong>{alerts[0].programme}</strong> ({alerts[0].school}) : Jauge <em>{alerts[0].field_name}</em> passée de {alerts[0].old_value} à <strong>{alerts[0].new_value}</strong> (Delta: {alerts[0].delta && alerts[0].delta > 0 ? `+${alerts[0].delta}` : alerts[0].delta}).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. SÉLECTEUR RAPIDE D'OBJECTIF STRATÉGIQUE                                */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" />
              <span>Priorité de calcul en temps réel :</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              L'algorithme recalcule instantanément le Score d'Opportunité (/100) selon votre objectif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleToggleGoal('explorer')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                quickGoal === 'explorer'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Équilibré
            </button>
            <button
              onClick={() => handleToggleGoal('bourse')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                quickGoal === 'bourse'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Priorité Bourse</span>
            </button>
            <button
              onClick={() => handleToggleGoal('securite')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                quickGoal === 'securite'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>Sécurité</span>
            </button>
            <button
              onClick={() => handleToggleGoal('carriere')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                quickGoal === 'carriere'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Carrière Cible</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. CLASSEMENT ET FILIÈRES (LIVE OU DEMO)                                  */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Classement & Opportunités
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
                Filières à plus fort Score d'Opportunité
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('tous')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  activeTab === 'tous' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500'
                }`}
              >
                Toutes ({isLiveActive ? currentLiveProgrammes.length : currentDemoProgrammes.length})
              </button>
              <button
                onClick={() => setActiveTab('shortlist')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                  activeTab === 'shortlist' ? 'bg-rose-500 text-white' : 'text-slate-500'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Ma Liste ({isLiveActive ? shortlistedLive.length : shortlistedDemo.length})</span>
              </button>
            </div>
          </div>

          {/* Grille des cartes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLiveActive ? (
              (activeTab === 'shortlist' ? shortlistedLive : currentLiveProgrammes).map((p) => (
                <LiveProgrammeCard
                  key={p.programme.programme_id}
                  item={p}
                  isShortlisted={shortlist.includes(String(p.programme.programme_id))}
                  onToggleShortlist={toggleShortlistLive}
                  onOpenAlertModal={handleOpenAlert}
                />
              ))
            ) : (
              (activeTab === 'shortlist' ? shortlistedDemo : currentDemoProgrammes).map((p) => (
                <ProgrammeCard
                  key={p.programme.id}
                  item={p}
                  isShortlisted={shortlist.includes(p.programme.id)}
                  onToggleShortlist={toggleShortlistDemo}
                  onOpenAlertModal={handleOpenAlert}
                />
              ))
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. SYNTHÈSE DE MA SÉLECTION PRÊTE POUR APRESMONBAC.BJ                      */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Préparation de vos vœux officiels
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold">
                Ma synthèse de choix ({isLiveActive ? shortlistedLive.length : shortlistedDemo.length} filière(s) sélectionnée(s))
              </h3>
            </div>

            <a
              href="https://apresmonbac.bj"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
            >
              <span>Accéder à apresmonbac.bj</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Conservez votre liste ordonnée pour renseigner vos choix sur le site officiel. Après mon Bac ne soumet aucun choix automatiquement.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {isLiveActive
              ? shortlistedLive.map((item, idx) => (
                  <div
                    key={item.programme.programme_id}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold">Choix #{idx + 1}</span>
                      <span className="font-mono text-rose-400 font-bold">{item.score}/100</span>
                    </div>
                    <div className="font-semibold text-white truncate">{item.programme.programme}</div>
                    <div className="text-[11px] text-slate-400 truncate">{item.programme.school}</div>
                  </div>
                ))
              : shortlistedDemo.map((item, idx) => (
                  <div
                    key={item.programme.id}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold">Choix #{idx + 1}</span>
                      <span className="font-mono text-rose-400 font-bold">{item.score}/100</span>
                    </div>
                    <div className="font-semibold text-white truncate">{item.programme.programme}</div>
                    <div className="text-[11px] text-slate-400 truncate">{item.programme.school}</div>
                  </div>
                ))}
          </div>
        </div>

        {/* Note de Transparence */}
        <TransparencyBadge variant="banner" />

      </div>

      {/* Modale d'Alerte */}
      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        targetProgramme={selectedProgrammeForAlert}
      />

    </div>
  );
};

