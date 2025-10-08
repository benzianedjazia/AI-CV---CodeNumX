import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Testimonials } from './Testimonials';

interface HomePageProps {
  onNavigate: (page: 'login' | 'signup') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { t } = useTranslations();

  return (
    <div className="w-full text-center flex flex-col items-center animate-fade-in">
      <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl md:text-7xl">
        {t('home.title_p1')} <span className="text-indigo-600">{t('home.title_p2')}</span>
      </h1>
      <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
        {t('home.subtitle')}
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => onNavigate('signup')}
          className="px-8 py-4 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition-transform"
        >
          {t('home.getStarted')}
        </button>
        <button
          onClick={() => onNavigate('login')}
          className="px-8 py-4 border border-transparent rounded-md shadow-lg text-lg font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transform hover:scale-105 transition-transform"
        >
          {t('home.login')}
        </button>
      </div>
       <div className="mt-20 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 text-left rtl:text-right">
          <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">{t('home.forCandidates')}</h3>
              <p className="mt-2 text-gray-600">{t('home.forCandidatesDesc')}</p>
              <ul className="mt-4 space-y-2 text-gray-700">
                  <li className="flex items-start"><span className="text-indigo-500 font-bold me-2">✓</span><span>{t('home.candidatesFeature1')}</span></li>
                  <li className="flex items-start"><span className="text-indigo-500 font-bold me-2">✓</span><span>{t('home.candidatesFeature2')}</span></li>
                  <li className="flex items-start"><span className="text-indigo-500 font-bold me-2">✓</span><span>{t('home.candidatesFeature3')}</span></li>
              </ul>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">{t('home.forRecruiters')}</h3>
              <p className="mt-2 text-gray-600">{t('home.forRecruitersDesc')}</p>
               <ul className="mt-4 space-y-2 text-gray-700">
                  <li className="flex items-start"><span className="text-indigo-500 font-bold me-2">✓</span><span>{t('home.recruitersFeature1')}</span></li>
                  <li className="flex items-start"><span className="text-indigo-500 font-bold me-2">✓</span><span>{t('home.recruitersFeature2')}</span></li>
                  <li className="flex items-start"><span className="text-indigo-500 font-bold me-2">✓</span><span>{t('home.recruitersFeature3')}</span></li>
              </ul>
          </div>
      </div>
      <Testimonials />
    </div>
  );
};