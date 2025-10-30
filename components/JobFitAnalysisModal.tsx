import React from 'react';
import type { Application, JobFitAnalysis } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { WrenchScrewdriverIcon } from './icons/WrenchScrewdriverIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';

interface JobFitAnalysisModalProps {
  application: Application;
  analysis: JobFitAnalysis;
  onClose: () => void;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center mb-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                {icon}
            </div>
            <h3 className="ms-3 text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="ps-2 space-y-2 text-sm text-gray-700">
            {children}
        </div>
    </div>
);

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700 bg-green-100 border-green-300';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    return 'text-red-700 bg-red-100 border-red-300';
}

export const JobFitAnalysisModal: React.FC<JobFitAnalysisModalProps> = ({ application, analysis, onClose }) => {
  const { t } = useTranslations();
  const { job } = application;
  const { matchScore, strengths, weaknesses, cvImprovements } = analysis;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-50 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-white rounded-t-lg">
           <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{t('jobFitAnalysis.title')}</h2>
              <p className="text-md text-gray-600">{job.title} - {job.company}</p>
            </div>
            <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow space-y-4">
            <div className={`p-5 rounded-lg border text-center ${getScoreColor(matchScore)}`}>
                 <h3 className="font-semibold uppercase tracking-wider text-sm">{t('jobFitAnalysis.matchScore')}</h3>
                 <p className="text-5xl font-bold">{matchScore}%</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Section title={t('jobFitAnalysis.strengthsTitle')} icon={<LightBulbIcon className="w-5 h-5"/>}>
                    <ul className="list-disc list-inside space-y-1">
                        {strengths.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </Section>
                <Section title={t('jobFitAnalysis.weaknessesTitle')} icon={<WrenchScrewdriverIcon className="w-5 h-5"/>}>
                     <ul className="list-disc list-inside space-y-1">
                        {weaknesses.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </Section>
            </div>

            <Section title={t('jobFitAnalysis.cvImprovementsTitle')} icon={<PencilSquareIcon className="w-5 h-5"/>}>
                 <ul className="list-disc list-inside space-y-2">
                    {cvImprovements.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </Section>

        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end bg-white rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {t('jobFitAnalysis.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
