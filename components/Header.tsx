import React from 'react';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { useTranslations } from '../hooks/useTranslations';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
    userEmail: string | null;
    onLogout: () => void;
    mode: 'candidate' | 'recruiter';
    onModeChange: (mode: 'candidate' | 'recruiter') => void;
}

export const Header: React.FC<HeaderProps> = ({ userEmail, onLogout, mode, onModeChange }) => {
  const { t } = useTranslations();
  
  const handleModeChange = (newMode: 'candidate' | 'recruiter') => {
    if (mode !== newMode) {
        onModeChange(newMode);
    }
  }

  return (
    <header className="bg-white shadow-md w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <BriefcaseIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              {t('header.title')}
            </h1>
          </div>

           <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
            <button
                onClick={() => handleModeChange('candidate')}
                className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${
                    mode === 'candidate' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
                {t('header.candidateMode')}
            </button>
            <button
                onClick={() => handleModeChange('recruiter')}
                className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${
                    mode === 'recruiter' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
                 {t('header.recruiterMode')}
            </button>
          </div>

          <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                  <LanguageSwitcher />
                  <span className="text-sm text-gray-600 hidden sm:block">{userEmail}</span>
                  <button
                      onClick={onLogout}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-red-100 hover:text-red-700"
                      aria-label={t('header.logout')}
                  >
                      <LogoutIcon className="h-5 w-5"/>
                  </button>
              </div>
          </div>
        </div>
      </div>
    </header>
  )
};
