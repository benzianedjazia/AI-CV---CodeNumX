import React, { useState } from 'react';
import { GoogleIcon } from './icons/GoogleIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { useTranslations } from '../hooks/useTranslations';

type SocialProvider = 'google' | 'facebook' | 'instagram' | 'linkedin';

interface SignUpPageProps {
  onSignUp: (email: string, pass: string) => boolean;
  onNavigate: (page: 'login' | 'home') => void;
  onSocialLogin: (provider: SocialProvider) => void;
}

const SocialButton: React.FC<{
    provider: SocialProvider;
    onClick: (provider: SocialProvider) => void;
}> = ({ provider, onClick }) => {
    const { t } = useTranslations();
    const icons: Record<SocialProvider, React.ReactNode> = {
        google: <GoogleIcon className="h-6 w-6" />,
        facebook: <FacebookIcon className="h-6 w-6" />,
        instagram: <InstagramIcon className="h-6 w-6" />,
        linkedin: <LinkedInIcon className="h-6 w-6 text-[#0A66C2]" />,
    };

    return (
        <button
            type="button"
            onClick={() => onClick(provider)}
            aria-label={t('signup.continueWith', { provider })}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
            {icons[provider]}
        </button>
    );
};

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onNavigate, onSocialLogin }) => {
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('signup.errorPasswordMismatch'));
      return;
    }
    const success = onSignUp(email, password);
    if (!success) {
      setError(t('signup.errorUserExists'));
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800">{t('signup.title')}</h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('signup.emailLabel')}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('signup.passwordLabel')}</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          <div>
            <label htmlFor="confirm-password"
                   className="block text-sm font-medium text-gray-700">{t('signup.confirmPasswordLabel')}</label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          >
            {t('signup.submitButton')}
          </button>
        </form>

        <div className="mt-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-sm">{t('signup.socialSeparator')}</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
            <SocialButton provider="google" onClick={onSocialLogin} />
            <SocialButton provider="facebook" onClick={onSocialLogin} />
            <SocialButton provider="instagram" onClick={onSocialLogin} />
            <SocialButton provider="linkedin" onClick={onSocialLogin} />
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('signup.hasAccount')}{' '}
          <button onClick={() => onNavigate('login')} className="font-medium text-indigo-600 hover:text-indigo-500">
            {t('signup.loginLink')}
          </button>
        </p>
      </div>
    </div>
  );
};