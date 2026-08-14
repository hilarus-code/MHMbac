/**
 * MHM SOLUTIONS — Après Mon Bac
 * Modale d'activation des alertes et de conservation d'analyse (Conversion au bon moment)
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  Bell,
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Smartphone,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ScoredProgramme } from '../types/orientation';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProgramme?: ScoredProgramme | null;
  onContinueOffline?: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  targetProgramme,
  onContinueOffline,
}) => {
  const { user, signInWithMagicLink, isDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      setErrorMessage('Veuillez entrer une adresse e-mail ou un numéro pour recevoir les alertes.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (email.trim()) {
        await signInWithMagicLink(email.trim());
      }
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="alert-signup-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white animate-in zoom-in-95 duration-200">
        
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Fermer la modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Alertes configurées avec succès !
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
              Votre sélection est conservée. Vous recevrez une notification par e-mail dès qu'une variation significative de jauge ou de rang est détectée sur vos choix.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-2xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                Retourner au tableau de bord
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* En-tête */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <Bell className="w-3.5 h-3.5" />
                <span>Suivi & Alertes en temps réel</span>
              </div>
              <h2 className="text-2xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
                Ne rate aucune évolution sur tes filières
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Les classements et le remplissage des bourses varient pendant la phase d’orientation. Active les alertes pour être averti en cas de changement important.
              </p>
            </div>

            {targetProgramme && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-400 block font-medium">Filière ciblée :</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {targetProgramme.programme.programme}
                </span>
                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                  {targetProgramme.programme.school} • Score d'opportunité : {targetProgramme.score}/100
                </span>
              </div>
            )}

            {/* Formulaire d'alerte & création de compte au bon moment */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Adresse e-mail pour recevoir le lien de connexion et les alertes
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="ex: ton.nom@domaine.bj"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Règle de Sécurité : Aucun mot de passe en clair */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span><strong>Sécurité & Confidentialité :</strong> Authentification sécurisée par lien magique instantané. Aucun mot de passe stocké en clair.</span>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Activation en cours...' : 'Conserver mon analyse & Activer les alertes'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onContinueOffline) onContinueOffline();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  Continuer sans compte (sauvegarde locale sur mon navigateur)
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};
