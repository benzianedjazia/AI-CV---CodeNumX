import React from 'react';
import type { Application } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface ConfirmationModalProps {
  application: Application;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ application, onConfirm, onCancel }) => {
  const { t } = useTranslations();
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">{t('confirmation.title')}</h2>
          <p className="mt-2 text-gray-600">
            {t('confirmation.description1')} <span className="font-semibold">{application.job.title}</span>.
          </p>
          <p className="mt-4 text-gray-600">
            {t('confirmation.description2')}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('confirmation.cancelButton')}
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            {t('confirmation.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
};