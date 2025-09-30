import React from 'react';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { UserIcon } from './icons/UserIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';

interface HeaderProps {
    mode: 'candidate' | 'recruiter';
    onModeChange: (mode: 'candidate' | 'recruiter') => void;
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


export const Header: React.FC<HeaderProps> = ({ mode, onModeChange }) => (
  <header className="bg-white shadow-md">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-3">
          <BriefcaseIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Assistant CV IA
          </h1>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <ModeButton isActive={mode === 'candidate'} onClick={() => onModeChange('candidate')}>
                <UserIcon className="h-5 w-5"/>
                <span>Espace Candidat</span>
            </ModeButton>
            <ModeButton isActive={mode === 'recruiter'} onClick={() => onModeChange('recruiter')}>
                <UserGroupIcon className="h-5 w-5"/>
                <span>Espace Recruteur</span>
            </ModeButton>
        </div>

      </div>
    </div>
  </header>
);
