import React, { useEffect, useRef } from 'react';
import type { Application, CvData } from '../types';
import { useInterviewCoach } from '../hooks/useInterviewCoach';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { UserIcon } from './icons/UserIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { useTranslations } from '../hooks/useTranslations';

interface InterviewCoachModalProps {
  application: Application;
  cvData: CvData;
  onClose: () => void;
}

export const InterviewCoachModal: React.FC<InterviewCoachModalProps> = ({ application, cvData, onClose }) => {
  const { status, transcript, error, startSession, stopSession } = useInterviewCoach(application, cvData, onClose);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslations();

  useEffect(() => {
    startSession();
    // The hook's cleanup effect will handle stopping the session on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);
  
  const getButtonState = () => {
      switch(status) {
          case 'idle':
              return { text: t('interview.start'), disabled: false, style: 'bg-green-600 hover:bg-green-700' };
          case 'connecting':
              return { text: t('interview.connecting'), disabled: true, style: 'bg-yellow-500 cursor-wait' };
          case 'active':
              return { text: t('interview.end'), disabled: false, style: 'bg-red-600 hover:bg-red-700' };
          case 'error':
              return { text: t('interview.error'), disabled: true, style: 'bg-red-400 cursor-not-allowed' };
      }
  }
  
  const handleButtonClick = () => {
      if(status === 'active') {
          stopSession();
      } else if (status === 'idle') {
          startSession();
      }
  }
  
  const buttonState = getButtonState();

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
              <h2 className="text-2xl font-bold text-gray-800">{t('interview.title')}</h2>
              <p className="text-md text-gray-600">
                {t('interview.subtitle')} <span className="font-semibold">{application.job.title}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-gray-50 space-y-4">
          {transcript.map((item, index) => (
            <div key={index} className={`flex items-start gap-3 ${item.speaker === 'user' ? 'justify-end' : ''}`}>
              {item.speaker === 'model' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                    <BriefcaseIcon className="w-5 h-5" />
                </div>
              )}
              <div className={`p-3 rounded-lg max-w-sm sm:max-w-md ${item.speaker === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                <p className="text-sm">{item.text}</p>
              </div>
               {item.speaker === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center">
                    <UserIcon className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
           {status === 'active' && (
             <div className="flex items-center justify-center pt-4">
                <div className="flex items-center space-x-2 text-gray-500">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>{t('interview.listening')}</span>
                </div>
             </div>
           )}
          <div ref={transcriptEndRef} />
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col items-center gap-3 bg-white rounded-b-lg">
          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
           <button
             onClick={handleButtonClick}
             disabled={buttonState.disabled}
             className={`flex items-center justify-center w-full max-w-xs px-6 py-3 rounded-full text-white font-semibold transition-colors shadow-lg ${buttonState.style}`}
           >
              <MicrophoneIcon className="w-6 h-6 me-2"/>
              <span>{buttonState.text}</span>
           </button>
        </div>
      </div>
    </div>
  );
};