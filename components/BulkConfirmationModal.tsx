import React from 'react';
import type { Application } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface BulkConfirmationModalProps {
  applications: Application[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const BulkConfirmationModal: React.FC<BulkConfirmationModalProps> = ({ applications, onConfirm, onCancel }) => {
  const count = applications.length;
  const { t } = useTranslations();

  if (count === 0) return null;
    
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">{t('bulkConfirmation.title')}</h2>
          <p className="mt-2 text-gray-600">
             {t('bulkConfirmation.description1_p1')} <span className="font-semibold">{count}</span> {t('bulkConfirmation.description1_p2')}
          </p>
          <p className="mt-4 text-gray-600">
            {t('bulkConfirmation.description2')}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('bulkConfirmation.cancelButton')}
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            {t('bulkConfirmation.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
};