/**
 * MHM SOLUTIONS — Après Mon Bac
 * Barre de navigation principale
 * Créateur : Hilarus GBAGOULE
 */

import React, { useState } from 'react';
import {
  Compass,
  GraduationCap,
  LayoutDashboard,
  User,
  Info,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  openTestsModal?: () => void;
  openBackendModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate }) => {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (route: string) => {
    navigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Identité */}
          <div 
            id="brand-logo-container"
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform border border-rose-400/20">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-white">
                  MHM <span className="text-rose-400 font-sans font-semibold">SOLUTIONS</span>
                </span>
              </div>
              <span className="text-xs text-slate-300 font-medium tracking-wide">
                Créateur : <strong className="text-slate-100 font-semibold">Hilarus GBAGOULE</strong>
              </span>
            </div>
          </div>

          {/* Navigation Liens Desktop */}
          <nav id="desktop-nav" className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              id="nav-link-home"
              onClick={() => handleNav('/')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentRoute === '/'
                  ? 'bg-slate-800 text-white shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Accueil
            </button>

            <button
              id="nav-link-about"
              onClick={() => handleNav('/about')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentRoute === '/about'
                  ? 'bg-slate-800 text-white shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Info className="w-4 h-4 text-indigo-400" />
              À propos
            </button>

            {user ? (
              <>
                <button
                  id="nav-link-dashboard"
                  onClick={() => handleNav('/dashboard')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentRoute === '/dashboard'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-rose-400" />
                  Tableau de bord
                </button>

                <button
                  id="nav-link-profile"
                  onClick={() => handleNav('/profile')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentRoute === '/profile'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  Mon profil
                </button>
              </>
            ) : null}
          </nav>

          {/* Actions & Profil à droite */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white">{profile?.display_name || user.email}</div>
                  <div className="text-[11px] text-slate-400">Bac Série {profile?.series || '—'}</div>
                </div>
                <button
                  id="btn-nav-logout"
                  onClick={async () => {
                    await signOut();
                    handleNav('/');
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  onClick={() => handleNav('/login')}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Connexion
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => handleNav('/register')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-900/30 transition-all hover:scale-105"
                >
                  S'inscrire
                </button>
              </div>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 focus:outline-none"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Déroulant Mobile */}
      {mobileMenuOpen && (
        <div id="mobile-menu-panel" className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top">
          {user && (
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-300">
                Connecté : <strong className="text-white">{profile?.display_name || user.email}</strong>
              </div>
            </div>
          )}

          <button
            onClick={() => handleNav('/')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentRoute === '/' ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
          >
            Accueil
          </button>
          <button
            onClick={() => handleNav('/about')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
              currentRoute === '/about' ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
          >
            <Info className="w-4 h-4 text-indigo-400" />
            À propos de MHM SOLUTIONS
          </button>

          {user ? (
            <>
              <button
                onClick={() => handleNav('/dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  currentRoute === '/dashboard' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-rose-400" />
                Tableau de bord
              </button>
              <button
                onClick={() => handleNav('/profile')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  currentRoute === '/profile' ? 'bg-slate-800 text-white' : 'text-slate-300'
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                Mon profil & Préférences
              </button>
              <button
                onClick={() => handleNav('/onboarding')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-amber-300 flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" />
                Repasser la personnalisation
              </button>

              <button
                onClick={async () => {
                  await signOut();
                  handleNav('/');
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </>
          ) : (
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNav('/login')}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-center bg-slate-800 text-white"
              >
                Connexion
              </button>
              <button
                onClick={() => handleNav('/register')}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-center bg-rose-500 text-white shadow-md"
              >
                S'inscrire
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

