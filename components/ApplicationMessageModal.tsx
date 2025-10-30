import React, { useState, useCallback, useEffect } from 'react';
import type { Application, CvData } from '../types';
import { geminiService } from '../services/geminiService';
import { useTranslations } from '../hooks/useTranslations';

interface ApplicationMessageModalProps {
  application: Application;
  cvData: CvData;
  onClose: () => void;
}

type MessageType = 'direct_site' | 'email_spontaneous';

const TabButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 ${
        isActive
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
);


export const ApplicationMessageModal: React.FC<ApplicationMessageModalProps> = ({ application, cvData, onClose }) => {
  const { t, language } = useTranslations();
  const { job } = application;
  
  const [activeTab, setActiveTab] = useState<MessageType>('direct_site');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [copyButtonText, setCopyButtonText] = useState(t('appMessage.copyButton'));

  const generateMessage = useCallback(async (type: MessageType) => {
    setIsLoading(true);
    setMessage('');
    setSubject('');
    setCopyButtonText(t('appMessage.copyButton'));
    try {
        const result = await geminiService.generateApplicationMessage(cvData, job, type, language);
        if (type === 'email_spontaneous') {
            const parts = (result || '').split('---');
            setSubject(parts[0].replace(/Objet:|Subject:/i, '').trim());
            setMessage(parts[1].trim());
        } else {
            setMessage(result);
        }
    } catch (error) {
        console.error("Failed to generate message", error);
        setMessage("Erreur lors de la génération du message.");
    } finally {
        setIsLoading(false);
    }
    // FIX: Removed `type` from the `useCallback` dependency array. The `type` variable is a parameter of the callback function and not a dependency from the outer scope.
  }, [cvData, job, language, t]);

  useEffect(() => {
    generateMessage(activeTab);
  }, [activeTab, generateMessage]);


  const copyToClipboard = () => {
    const textToCopy = subject ? `Objet: ${subject}\n\n${message}` : message;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyButtonText(t('appMessage.copiedButton'));
        setTimeout(() => setCopyButtonText(t('appMessage.copyButton')), 2000);
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
              <h2 className="text-2xl font-bold text-gray-800">{t('appMessage.title')}</h2>
              <p className="text-md text-gray-600">{t('appMessage.forPosition')} <span className="font-semibold">{job.title}</span> {t('appMessage.atCompany')} <span className="font-semibold">{job.company}</span></p>
            </div>
            <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
          </div>
           <div className="border-b border-gray-200 -mb-px mt-2">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton isActive={activeTab === 'direct_site'} onClick={() => setActiveTab('direct_site')}>{t('appMessage.tabJob')}</TabButton>
                    <TabButton isActive={activeTab === 'email_spontaneous'} onClick={() => setActiveTab('email_spontaneous')}>{t('appMessage.tabSpontaneous')}</TabButton>
                </nav>
            </div>
        </div>
        <div className="p-4 sm:p-8 overflow-y-auto flex-grow">
          <div className="bg-white p-6 shadow-lg min-h-[200px]">
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                     <p className="text-gray-500">{t('appMessage.generating')}</p>
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors w-32 text-center"
          >
            {copyButtonText}
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('appMessage.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};