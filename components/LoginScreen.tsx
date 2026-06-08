import React, { useState, useEffect } from 'react';
import { auth } from '../src/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile
} from 'firebase/auth';
import { useLanguage } from '../src/contexts/LanguageContext';

interface LoginScreenProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ isModal = false, onClose }) => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasAnimatedIn(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasSymbol;

  const getFriendlyErrorMessage = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
        return t('login.errors.invalidCredential');
      case 'auth/user-not-found':
        return t('login.errors.userNotFound');
      case 'auth/wrong-password':
        return t('login.errors.wrongPassword');
      case 'auth/email-already-in-use':
        return t('login.errors.emailInUse');
      case 'auth/weak-password':
        return t('login.errors.weakPassword');
      case 'auth/too-many-requests':
        return t('login.errors.tooManyRequests');
      case 'auth/popup-closed-by-user':
        return t('login.errors.popupClosed');
      case 'auth/network-request-failed':
        return t('login.errors.networkFailed');
      case 'auth/operation-not-allowed':
        return t('login.errors.operationNotAllowed');
      default:
        return error.message || t('login.errors.default');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && !isPasswordValid) {
      setError(t("login.passRequirements"));
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: `${firstName.trim()} ${lastName.trim()}`
        });
      }
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div className={`w-full max-w-lg bg-white/20 dark:bg-slate-900/30 backdrop-blur-3xl backdrop-saturate-150 border border-white/50 border-b-white/20 border-r-white/20 dark:border-white/20 dark:border-b-white/5 dark:border-r-white/5 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] p-10 relative z-10 ${shake ? 'animate-shake' : (hasAnimatedIn ? '' : 'animate-fade-up-soft')}`}>

      {/* Close button for modal mode */}
      {isModal && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all z-20"
          aria-label={t('common.close')}
        >
          <span className="material-symbols-outlined notranslate text-xl" translate="no">close</span>
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-500/20">
          <img src="/Meteosran-logo.png" alt="MeteoSran Logo" className="w-10 h-10 object-contain drop-shadow-md" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight text-glow-none">MeteoSran</h1>
        <p className="text-slate-500 dark:text-slate-300 mt-2 text-sm font-medium">{t('login.tagline')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 dark:border-red-500/50 rounded-xl p-3 mb-6 animate-fade-up-soft text-center">
          <p className="text-red-500 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative w-full">
        <div className={`grid transition-all duration-500 ease-in-out ${!isLogin ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0 mb-0 pointer-events-none'}`}>
          <div className="overflow-hidden flex gap-3">
            <input
              type="text"
              placeholder={t('login.firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required={!isLogin}
              className="w-1/2 bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/50 border-b-white/20 border-r-white/20 dark:border-white/10 dark:border-b-transparent dark:border-r-transparent shadow-inner rounded-full px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
            <input
              type="text"
              placeholder={t('login.lastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required={!isLogin}
              className="w-1/2 bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/50 border-b-white/20 border-r-white/20 dark:border-white/10 dark:border-b-transparent dark:border-r-transparent shadow-inner rounded-full px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="mb-4">
          <input
            type="email"
            placeholder={t('login.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/50 border-b-white/20 border-r-white/20 dark:border-white/10 dark:border-b-transparent dark:border-r-transparent shadow-inner rounded-full px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t('login.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/50 border-b-white/20 border-r-white/20 dark:border-white/10 dark:border-b-transparent dark:border-r-transparent shadow-inner rounded-full px-4 py-3 pr-12 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors focus:outline-none"
            aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
          >
            <span className="material-symbols-outlined notranslate text-xl" translate="no">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
 
        <div className={`grid transition-all duration-500 ease-in-out ${!isLogin ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0 mb-0 pointer-events-none'}`}>
          <div className="overflow-hidden space-y-2 text-xs font-medium">
            <div className="pt-2"></div>
            <div className={`flex items-center gap-2 transition-colors ${hasMinLength ? 'text-green-500 dark:text-green-400' : 'text-slate-400 dark:text-slate-300'}`}>
              <span className="material-symbols-outlined notranslate text-sm" translate="no">{hasMinLength ? 'check_circle' : 'radio_button_unchecked'}</span>
              <span>{t('login.minChar')}</span>
            </div>
            <div className={`flex items-center gap-2 transition-colors ${hasUpperCase ? 'text-green-500 dark:text-green-400' : 'text-slate-400 dark:text-slate-300'}`}>
              <span className="material-symbols-outlined notranslate text-sm" translate="no">{hasUpperCase ? 'check_circle' : 'radio_button_unchecked'}</span>
              <span>{t('login.uppercase')}</span>
            </div>
            <div className={`flex items-center gap-2 transition-colors ${hasSymbol ? 'text-green-500 dark:text-green-400' : 'text-slate-400 dark:text-slate-300'}`}>
              <span className="material-symbols-outlined notranslate text-sm" translate="no">{hasSymbol ? 'check_circle' : 'radio_button_unchecked'}</span>
              <span>{t('login.specialChar')}</span>
            </div>
            <div className="pb-2"></div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-full px-4 py-3 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 mt-2"
        >
          {loading ? t('login.authenticating') : (isLogin ? t('login.signInBtn') : t('login.createAccountBtn'))}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center space-x-4">
        <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
        <span className="text-slate-400 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">{t('login.or')}</span>
        <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
      </div>

      <div className="flex flex-col gap-3 mt-6">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white/40 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 backdrop-blur-lg border border-white/60 border-b-white/20 border-r-white/20 dark:border-white/10 dark:border-b-transparent dark:border-r-transparent text-slate-800 dark:text-white font-medium rounded-full px-4 py-3 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('login.googleBtn')}
        </button>

        <button
          type="button"
          onClick={handleAppleSignIn}
          disabled={loading}
          className="w-full bg-black/80 hover:bg-black/90 dark:bg-black/40 dark:hover:bg-black/60 backdrop-blur-lg border border-white/20 dark:border-white/10 text-white font-medium rounded-full px-4 py-3 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.48 3.605-2.935 1.156-1.69 1.632-3.326 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.484-4.524 2.597-4.594-1.425-2.078-3.623-2.364-4.42-2.43-1.896-.2-3.55 1.066-4.51 1.066zm2.42-2.906c.829-1.004 1.385-2.408 1.233-3.806-1.2.052-2.656.805-3.52 1.815-.76.853-1.42 2.296-1.233 3.665 1.35.105 2.684-.663 3.52-1.674z" />
          </svg>
          {t('login.appleBtn')}
        </button>
      </div>

      <p className="mt-8 text-center text-slate-500 dark:text-slate-300 text-sm font-medium">
        {isLogin ? t('login.noAccount') : t('login.hasAccount')}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition-colors"
        >
          {isLogin ? t('login.switchSignUp') : t('login.switchSignIn')}
        </button>
      </p>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 overflow-hidden"
        onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
      >
        {/* Background Liquid Orbs inside the modal */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
          <div className="gradient-bg w-full h-full absolute inset-0">
            <div className="gradients-blur-wrapper w-full h-full absolute inset-0">
              <div className="gradients-container w-full h-full absolute inset-0">
                <div className="g1"></div>
                <div className="g2"></div>
                <div className="g3"></div>
                <div className="g4"></div>
                <div className="g5"></div>
                <div className="g6"></div>
                <div className="g7"></div>
                <div className="interactive-orb"></div>
              </div>
            </div>
          </div>
          <div className="noise-overlay w-full h-full absolute inset-0"></div>
        </div>

        {cardContent}

        {/* Footer link */}
        <div className="absolute bottom-6 text-slate-400 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 z-10">
          <span>Secured by Firebase Auth.</span>
          <span>&bull;</span>
          <a href="/privacy" className="hover:underline hover:text-sky-500 transition-colors">Privacy Policy</a>
          <span>&bull;</span>
          <a href="/terms" className="hover:underline hover:text-sky-500 transition-colors">Terms of Service</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {cardContent}

      {/* Footer link */}
      <div className="absolute bottom-6 text-slate-400 dark:text-slate-300 text-xs font-semibold flex items-center gap-2">
        <span>Secured by Firebase Auth.</span>
        <span>&bull;</span>
        <a href="/privacy" className="hover:underline hover:text-sky-500 transition-colors">Privacy Policy</a>
        <span>&bull;</span>
        <a href="/terms" className="hover:underline hover:text-sky-500 transition-colors">Terms of Service</a>
      </div>
    </div>
  );
};
