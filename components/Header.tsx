import React from 'react';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { UserIcon } from './icons/UserIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { useTranslations } from '../hooks/useTranslations';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
    mode: 'candidate' | 'recruiter';
    onModeChange: (mode: 'candidate' | 'recruiter') => void;
    userEmail: string | null;
    onLogout: () => void;
}

const ModeButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
        >
            {children}
        </button>
    )
}


export const Header: React.FC<HeaderProps> = ({ mode, onModeChange, userEmail, onLogout }) => {
  const { t } = useTranslations();
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

          <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                  <ModeButton isActive={mode === 'candidate'} onClick={() => onModeChange('candidate')}>
                      <UserIcon className="h-5 w-5"/>
                      <span>{t('header.candidateSpace')}</span>
                  </ModeButton>
                  <ModeButton isActive={mode === 'recruiter'} onClick={() => onModeChange('recruiter')}>
                      <UserGroupIcon className="h-5 w-5"/>
                      <span>{t('header.recruiterSpace')}</span>
                  </ModeButton>
              </div>
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