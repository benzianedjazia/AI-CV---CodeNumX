import React from 'react';
import type { CareerTrajectoryAnalysis } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { WrenchScrewdriverIcon } from './icons/WrenchScrewdriverIcon';
import { ArrowTrendingUpIcon } from './icons/ArrowTrendingUpIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';


interface CareerTrajectoryModalProps {
  analysisData: CareerTrajectoryAnalysis;
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


export const CareerTrajectoryModal: React.FC<CareerTrajectoryModalProps> = ({ analysisData, onClose }) => {
  const { t } = useTranslations();
  const { synthesis, strengths, improvements, careerPaths, recommendedTraining } = analysisData;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-white rounded-t-lg text-center">
            <h2 className="text-2xl font-bold text-gray-800">{t('careerAnalysis.title')}</h2>
            <p className="text-md text-gray-600">{t('careerAnalysis.subtitle')}</p>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-lg">
                 <h3 className="font-semibold text-indigo-800 mb-2">{t('careerAnalysis.synthesisTitle')}</h3>
                 <p className="text-sm text-indigo-700 italic">"{synthesis}"</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Section title={t('careerAnalysis.strengthsTitle')} icon={<LightBulbIcon className="w-5 h-5"/>}>
                    <ul className="list-disc list-inside space-y-1">
                        {strengths.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </Section>
                <Section title={t('careerAnalysis.improvementsTitle')} icon={<WrenchScrewdriverIcon className="w-5 h-5"/>}>
                     <ul className="list-disc list-inside space-y-1">
                        {improvements.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </Section>
            </div>

            <Section title={t('careerAnalysis.pathsTitle')} icon={<ArrowTrendingUpIcon className="w-5 h-5"/>}>
                <div className="space-y-4">
                    {careerPaths.map((path, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-md border">
                            <h4 className="font-semibold text-gray-800">{path.title}</h4>
                            <p className="mt-1 text-gray-600">{path.description}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {path.requiredSkills.map((skill, s_i) => (
                                    <span key={s_i} className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded-full">{skill}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

             <Section title={t('careerAnalysis.trainingTitle')} icon={<AcademicCapIcon className="w-5 h-5"/>}>
                <div className="space-y-3">
                     {recommendedTraining.map((rec, i) => (
                        <div key={i}>
                            <p className="font-semibold text-gray-800">{rec.area}</p>
                            <p className="text-gray-600">{rec.recommendation}</p>
                        </div>
                    ))}
                </div>
            </Section>

        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end bg-white rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {t('careerAnalysis.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};