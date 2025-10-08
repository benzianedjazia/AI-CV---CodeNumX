import React from 'react';
import type { LoadingState } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface LoadingIndicatorProps {
  state: LoadingState;
}

const Spinner: React.FC = () => (
  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
);

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ state }) => {
  const { t } = useTranslations();
  
  const stateMessages: Record<string, string> = {
    parsing: t('loading.parsing'),
    findingJobs: t('loading.findingJobs'),
  };

  if (state !== 'parsing' && state !== 'findingJobs') {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-2xl space-y-6 w-full max-w-md">
      <Spinner />
      <p className="text-xl font-semibold text-gray-700">{stateMessages[state]}</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${state === 'parsing' ? '50%' : '100%'}` }}
        ></div>
      </div>
    </div>
  );
};