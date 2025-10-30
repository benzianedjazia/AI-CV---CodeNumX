import React, { useState, useCallback } from 'react';
import type { CvData } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { geminiService } from '../services/geminiService';
import { CvPreview } from './CvPreview';

interface CvRewriterModalProps {
  cvData: CvData;
  onClose: () => void;
  onRewriteComplete: (newCvData: CvData) => void;
}

export const CvRewriterModal: React.FC<CvRewriterModalProps> = ({ cvData, onClose, onRewriteComplete }) => {
  const { t, language } = useTranslations();
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [rewrittenCv, setRewrittenCv] = useState<CvData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [templateKey, setTemplateKey] = useState('modern');

  const handleRewrite = useCallback(async () => {
    if (!targetJobTitle.trim()) {
      setError(t('cvRewriter.error'));
      return;
    }
    setError('');
    setIsLoading(true);
    setRewrittenCv(null);
    try {
      const newCv = await geminiService.rewriteCv(cvData, targetJobTitle, language);
      setRewrittenCv(newCv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [cvData, targetJobTitle, language, t]);

  const handleUseCv = () => {
    if (rewrittenCv) {
      onRewriteComplete(rewrittenCv);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{t('cvRewriter.modalTitle')}</h2>
              <p className="text-md text-gray-600">{t('cvRewriter.modalSubtitle')}</p>
            </div>
            <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 space-y-4">
             <div>
                <label htmlFor="target-job" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('cvRewriter.jobTitleLabel')}
                </label>
                <input
                    id="target-job"
                    type="text"
                    value={targetJobTitle}
                    onChange={(e) => setTargetJobTitle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder={t('cvRewriter.jobTitlePlaceholder')}
                    disabled={isLoading}
                />
             </div>
             <button
                onClick={handleRewrite}
                disabled={isLoading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
             >
                {isLoading ? t('cvRewriter.optimizingButton') : t('cvRewriter.optimizeButton')}
             </button>
             {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <div className="md:w-2/3">
             {rewrittenCv ? (
                <CvPreview 
                    cvData={rewrittenCv}
                    templateKey={templateKey}
                    onTemplateChange={setTemplateKey}
                />
             ) : isLoading ? (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-md">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
                </div>
             ) : (
                 <div className="flex items-center justify-center h-full bg-gray-100 rounded-md p-8 text-center text-gray-500">
                    <p>{t('cvRewriter.previewArea')}</p>
                </div>
             )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            {t('cvRewriter.cancelButton')}
          </button>
           <button 
            onClick={handleUseCv}
            disabled={!rewrittenCv}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {t('cvRewriter.useButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
