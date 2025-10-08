import React, { useState } from 'react';
import { useTranslations, availableLanguages } from '../hooks/useTranslations';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const languageNames: Record<string, string> = {
    fr: 'Français',
    en: 'English',
    ar: 'العربية',
  };

  const handleLanguageChange = (lang: typeof availableLanguages[number]) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-200"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('languageSwitcher.language')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 13a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm4 0a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1z" />
          <path d="M4.33 6.052A6.023 6.023 0 0110 4c1.886 0 3.63.863 4.825 2.25.17.152.01.442-.23.442H5.405c-.24 0-.4-.29-.23-.442a6.004 6.004 0 01-.845-2.2z" />
        </svg>
        <span className="hidden sm:inline">{language.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div 
            className="origin-top-right absolute end-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
            role="menu" 
            aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full text-left block px-4 py-2 text-sm ${
                  language === lang ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } hover:bg-gray-100 hover:text-gray-900`}
                role="menuitem"
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
