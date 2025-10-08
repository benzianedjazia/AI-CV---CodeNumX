import React, { useState } from 'react';
import type { Application } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface CoverLetterModalProps {
  application: Application;
  onClose: () => void;
}

const linkify = (text?: string): React.ReactNode => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
        if (part && part.match(urlRegex)) {
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                    onClick={(e) => e.stopPropagation()} 
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({ application, onClose }) => {
  const { job, coverLetter } = application;
  const { t } = useTranslations();
  
  const [copyButtonText, setCopyButtonText] = useState(t('coverLetter.copyButton'));


  const copyToClipboard = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter).then(() => {
        setCopyButtonText(t('coverLetter.copiedButton'));
        setTimeout(() => setCopyButtonText(t('coverLetter.copyButton')), 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
        setCopyButtonText(t('coverLetter.errorButton'));
        setTimeout(() => setCopyButtonText(t('coverLetter.copyButton')), 2000);
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-100 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{t('coverLetter.title')}</h2>
              <p className="text-md text-gray-600">{t('coverLetter.forPosition')} <span className="font-semibold">{job.title}</span> {t('coverLetter.atCompany')} <span className="font-semibold">{job.company}</span></p>
            </div>
            <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
          </div>
        </div>
        <div className="p-4 sm:p-8 overflow-y-auto flex-grow">
          <div className="bg-white p-8 sm:p-12 shadow-lg max-w-3xl mx-auto">
            <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed text-sm">
              {linkify(coverLetter)}
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-wrap justify-end gap-3 bg-white rounded-b-lg">
          <button 
            onClick={copyToClipboard}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors w-32 text-center"
          >
            {copyButtonText}
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('coverLetter.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};