/**
 * MHM SOLUTIONS — Après Mon Bac (MVP1)
 * Modal de Gestion & Diagnostic de la Connexion Directe URI Backend
 * Fondateur & Concepteur : Hilarus GBAGOULE
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Activity,
  Layers,
  Sparkles,
  X,
  Copy,
  Check,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { BackendApi, BackendHealthResponse, DbStatusResponse, DbTestResponse } from '../lib/backendApi';

interface BackendManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendManagerModal: React.FC<BackendManagerModalProps> = ({ isOpen, onClose }) => {
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTestingUri, setIsTestingUri] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [customUriInput, setCustomUriInput] = useState<string>('');
  const [testResult, setTestResult] = useState<DbTestResponse | null>(null);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [h, s] = await Promise.all([BackendApi.getHealth(), BackendApi.getDbStatus()]);
      setHealth(h);
      setDbStatus(s);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setTestResult(null);
      setMigrationResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTestingUri(true);
    setTestResult(null);
    try {
      const res = await BackendApi.testConnection(customUriInput.trim() || undefined);
      setTestResult(res);
      if (res.success) {
        await loadData();
      }
    } finally {
      setIsTestingUri(false);
    }
  };

  const handleInitSchema = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await BackendApi.initSchema();
      setMigrationResult(res);
      await loadData();
    } finally {
      setIsMigrating(false);
    }
  };

  const copyTemplateUri = () => {
    navigator.clipboard.writeText(
      'postgresql://postgres.[project-ref]:[password]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require'
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConnected = health?.database?.connected ?? false;

  return (
    <div
      id="backend-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="backend-manager-modal-card"
        className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-white">
                  Gestionnaire Backend & Connexion Directe URI
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  PostgreSQL Direct
                </span>
              </div>
              <p className="text-xs text-slate-400">
                MHM SOLUTIONS — Supervision de la base de données & des flux backend
              </p>
            </div>
          </div>
          <button
            id="close-backend-manager-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
              isConnected
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isConnected ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">
                  {isConnected
                    ? 'Connexion Directe URI Active'
                    : 'Mode Fallback In-Memory / Prêt pour URI'}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isConnected ? 'PostgreSQL Connecté' : 'Attente DATABASE_URL'}
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                {isConnected
                  ? `Le backend communique en direct avec la base de données PostgreSQL (${health?.database.info?.database || 'postgres'}). Toutes les opérations CRUD sont persistées.`
                  : 'Le serveur fonctionne actuellement avec le magasin en mémoire haute performance. Définissez DATABASE_URL dans les variables d’environnement pour activer la synchronisation PostgreSQL en temps réel.'}
              </p>
            </div>
          </div>

          {/* Detailed Connection Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>URI Détectée</span>
                <Server className="w-4 h-4 text-slate-500" />
              </div>
              <p className="font-mono text-xs text-white truncate font-medium">
                {health?.database?.maskedUri || 'Aucune URI active'}
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Temps de Réponse</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-base font-semibold text-emerald-400 font-mono">
                {health?.database?.latency || (dbStatus?.latencyMs ? `${dbStatus.latencyMs}ms` : '< 2ms (In-Memory)')}
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Service IA Gemini</span>
                <Sparkles className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-sm font-semibold text-white">
                {health?.ai_service?.configured ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Prêt côté serveur
                  </span>
                ) : (
                  <span className="text-slate-400">Mode par défaut</span>
                )}
              </p>
            </div>
          </div>

          {/* Database Tables & Record Counts */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-medium text-sm">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Tables & Synchronisation des Données</span>
              </div>
              <button
                onClick={loadData}
                disabled={isLoading}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg">
                <div className="text-[11px] text-slate-400 font-mono">profiles</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  {dbStatus?.counts?.profiles ?? 1}
                </div>
                <div className="text-[10px] text-slate-500">Profils bacheliers</div>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg">
                <div className="text-[11px] text-slate-400 font-mono">user_preferences</div>
                <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">
                  {dbStatus?.counts?.user_preferences ?? 1}
                </div>
                <div className="text-[10px] text-slate-500">Critères & priorités</div>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg">
                <div className="text-[11px] text-slate-400 font-mono">demo_programmes</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                  {dbStatus?.counts?.demo_programmes ?? 10}
                </div>
                <div className="text-[10px] text-slate-500">Filières UAC/UNA/UP</div>
              </div>

              <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg">
                <div className="text-[11px] text-slate-400 font-mono">future_shortlists</div>
                <div className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
                  {dbStatus?.counts?.future_user_shortlists ?? 0}
                </div>
                <div className="text-[10px] text-slate-500">Sélections bacheliers</div>
              </div>
            </div>
          </div>

          {/* Test de Connexion Directe URI */}
          <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                Tester une Connexion URI PostgreSQL
              </span>
              <button
                onClick={copyTemplateUri}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Exemple format Supabase</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customUriInput}
                onChange={(e) => setCustomUriInput(e.target.value)}
                placeholder="postgresql://user:pass@host:6543/postgres?sslmode=require (optionnel)"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleTestConnection}
                disabled={isTestingUri}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0"
              >
                {isTestingUri ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>Tester Connexion</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs font-mono border ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> {testResult.message}
                    </div>
                    <div>Base : {testResult.database} | Utilisateur : {testResult.user}</div>
                    <div>Latence : {testResult.latencyMs}ms | Version : {testResult.version}</div>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{testResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configuration Extension Chrome & Jeton MHM_SYNC_TOKEN */}
          <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Extension Chrome & Jeton de Sécurité MHM_SYNC_TOKEN
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Synchronisation Réelle
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Pour synchroniser les jauges publiques capturées sur <code>apresmonbac.bj</code>, configurez le fichier <code>config.js</code> à la racine de l'extension avec le jeton <code>MHM_SYNC_TOKEN</code> :
            </p>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`// config.js (Extension Chrome MHM SOLUTIONS)
window.MHM_CONFIG = {
  API_URL: "${window.location.origin}/api/mhmbac-sync",
  MHM_SYNC_TOKEN: "votre_jeton_secret_sync_mhmbac",
  OBSERVE_INTERVAL_MS: 30000,
  SOURCE: "chrome_extension",
  EXTENSION_VERSION: "0.3.0"
};`}
            </pre>
            <div className="text-[11px] text-slate-400">
              Le serveur et la fonction Edge <code>mhmbac-sync</code> vérifient l'entête <code>x-mhm-token</code> avec <code>MHM_SYNC_TOKEN</code>.
            </div>
          </div>

          {/* Action : Initialisation du Schéma SQL */}
          <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
            <div>
              <h4 className="font-medium text-white text-xs">Schéma & Tables SQL Automatiques</h4>
              <p className="text-[11px] text-slate-400">
                Crée ou met à jour les tables (profiles, user_preferences, live_programmes, gauge_observations, gauge_alerts) et injecte le jeu de données réelles béninoises.
              </p>
            </div>
            <button
              onClick={handleInitSchema}
              disabled={isMigrating || !isConnected}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition shrink-0 ml-3"
            >
              {isMigrating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Exécuter Schéma SQL</span>
            </button>
          </div>

          {migrationResult && (
            <div
              className={`p-3 rounded-lg text-xs font-mono border ${
                migrationResult.success
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {migrationResult.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>MHM SOLUTIONS — Hilarus GBAGOULE</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
