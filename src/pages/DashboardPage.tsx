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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_PROGRAMMES } from '../lib/demoData';
import { rankProgrammes } from '../lib/ranking';
import { ProgrammeCard } from '../components/ProgrammeCard';
import { AlertModal } from '../components/AlertModal';
import { TransparencyBadge } from '../components/TransparencyBadge';
import { PrimaryGoal, ScoredProgramme } from '../types/orientation';

interface DashboardPageProps {
  navigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const { user, profile, preferences, updatePreferences } = useAuth();
  
  // État local de la shortlist
  const [shortlist, setShortlist] = useState<string[]>(['prog-01', 'prog-03']);
  const [activeTab, setActiveTab] = useState<'tous' | 'shortlist'>('tous');
  const [quickGoal, setQuickGoal] = useState<PrimaryGoal>(
    preferences?.primary_goal || 'explorer'
  );
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedProgrammeForAlert, setSelectedProgrammeForAlert] = useState<ScoredProgramme | null>(null);

  // Calcul du classement personnalisé
  const rankedProgrammes = rankProgrammes(
    DEMO_PROGRAMMES,
    profile || { series: 'D', mention: 'Bien' },
    {
      ...preferences,
      primary_goal: quickGoal,
    }
  );

  const topThree = rankedProgrammes.slice(0, 3);
  const shortlistedProgrammes = rankedProgrammes.filter((p) => shortlist.includes(p.programme.id));

  // Gestion de la shortlist
  const toggleShortlist = (item: ScoredProgramme) => {
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

  const displayedProgrammes = activeTab === 'shortlist' ? shortlistedProgrammes : rankedProgrammes;

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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Mon Analyse Stratégique • Algorithme v1</span>
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
        {/* 2. SÉLECTEUR RAPIDE D'OBJECTIF STRATÉGIQUE                                */}
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
        {/* 3. SYNTHÈSE DES RECOMMANDATIONS (3 CARTES CLÉS)                            */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Top Recommandations
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
                Toutes ({rankedProgrammes.length})
              </button>
              <button
                onClick={() => setActiveTab('shortlist')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                  activeTab === 'shortlist' ? 'bg-rose-500 text-white' : 'text-slate-500'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Ma Liste ({shortlist.length})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProgrammes.map((p) => (
              <ProgrammeCard
                key={p.programme.id}
                item={p}
                isShortlisted={shortlist.includes(p.programme.id)}
                onToggleShortlist={toggleShortlist}
                onOpenAlertModal={handleOpenAlert}
              />
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. SYNTHÈSE DE MA SÉLECTION PRÊTE POUR APRESMONBAC.BJ                       */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Préparation de vos vœux officiels
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold">
                Ma synthèse de choix ({shortlist.length} filière(s) sélectionnée(s))
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
            {shortlistedProgrammes.map((item, idx) => (
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
