import React, { useState, useCallback, useEffect } from 'react';
import type { Company, CompanyEmployee, CvData } from '../types';
import { geminiService } from '../services/geminiService';
import { useTranslations } from '../hooks/useTranslations';

interface SpontaneousApplicationModalProps {
  company: Company;
  contact: CompanyEmployee;
  cvData: CvData;
  onClose: () => void;
}

export const SpontaneousApplicationModal: React.FC<SpontaneousApplicationModalProps> = ({ company, contact, cvData, onClose }) => {
  const { t, language } = useTranslations();
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [copyButtonText, setCopyButtonText] = useState(t('spontaneousApp.copyButton'));

  const generateMessage = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    setSubject('');
    setCopyButtonText(t('spontaneousApp.copyButton'));
    try {
        const result = await geminiService.generateSpontaneousApplicationMessage(cvData, company, contact, language);
        const parts = (result || '').split('---');
        if (parts.length > 1) {
            setSubject(parts[0].replace(/Objet:|Subject:/i, '').trim());
            setMessage(parts[1].trim());
        } else {
             setMessage(result);
        }
    } catch (error) {
        console.error("Failed to generate spontaneous message", error);
        setMessage("Erreur lors de la génération du message.");
    } finally {
        setIsLoading(false);
    }
  }, [cvData, company, contact, language, t]);

  useEffect(() => {
    generateMessage();
  }, [generateMessage]);


  const copyToClipboard = () => {
    const textToCopy = subject ? `Objet: ${subject}\n\n${message}` : message;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyButtonText(t('spontaneousApp.copiedButton'));
        setTimeout(() => setCopyButtonText(t('spontaneousApp.copyButton')), 2000);
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-100 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{t('spontaneousApp.title')}</h2>
              <p className="text-md text-gray-600">{t('spontaneousApp.toContact')} <span className="font-semibold">{contact.name}</span> {t('spontaneousApp.atCompany')} <span className="font-semibold">{company.name}</span></p>
            </div>
            <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
          </div>
        </div>
        <div className="p-4 sm:p-8 overflow-y-auto flex-grow">
          <div className="bg-white p-6 shadow-lg min-h-[250px]">
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                     <p className="text-gray-500">{t('spontaneousApp.generating')}</p>
                </div>
            ) : (
                <div className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-sm">
                    {subject && (
                        <p className="mb-4">
                            <span className="font-semibold">Objet:</span> {subject}
                        </p>
                    )}
                    {message}
                </div>
            )}
          </div>
        </div>
        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-wrap justify-end gap-3 bg-white rounded-b-lg">
          <button 
            onClick={copyToClipboard}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors w-40 text-center disabled:bg-indigo-300"
          >
            {copyButtonText}
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('spontaneousApp.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};