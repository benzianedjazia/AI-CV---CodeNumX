import React from 'react';
import type { Application } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';


interface ApplicationCardProps {
  application: Application;
  onViewCoverLetter: () => void;
  onGenerateLetter: () => void;
  onApply: () => void;
  onToggleSelect: () => void;
}

const getStatusStyles = (status: Application['status']) => {
  switch (status) {
    case 'Ready': return 'bg-gray-100 text-gray-800';
    case 'GeneratingLetter': return 'bg-purple-100 text-purple-800 animate-pulse';
    case 'LetterGenerated': return 'bg-blue-100 text-blue-800';
    case 'AwaitingConfirmation': return 'bg-yellow-100 text-yellow-800';
    case 'Sent': return 'bg-green-100 text-green-800';
    case 'Error': return 'bg-red-100 text-red-800';
  }
};

const getStatusText = (status: Application['status']) => {
    switch (status) {
      case 'Ready': return 'Prêt';
      case 'GeneratingLetter': return 'Génération...';
      case 'LetterGenerated': return 'Lettre prête';
      case 'AwaitingConfirmation': return 'En attente de confirmation';
      case 'Sent': return 'Envoyé';
      case 'Error': return 'Erreur';
    }
}

const ActionButton: React.FC<{ application: Application; onGenerateLetter: () => void; onApply: () => void; }> = ({ application, onGenerateLetter, onApply }) => {
    const { status } = application;

    if (status === 'Ready' || status === 'Error') {
        return (
            <button
                onClick={onGenerateLetter}
                className="flex items-center justify-center w-full md:w-auto px-4 py-2 rounded-md transition-colors text-white bg-purple-600 hover:bg-purple-700"
            >
                Générer la lettre
            </button>
        );
    }

    if (status === 'GeneratingLetter') {
        return (
            <button disabled className="flex items-center justify-center w-full md:w-auto px-4 py-2 rounded-md transition-colors text-white bg-purple-400 cursor-wait">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Génération...
            </button>
        );
    }

    if (status === 'LetterGenerated' || status === 'AwaitingConfirmation' || status === 'Sent') {
        const isAwaitingOrSent = status === 'AwaitingConfirmation' || status === 'Sent';
        
        if (isAwaitingOrSent) {
            return (
                <button
                    disabled
                    className="flex items-center justify-center w-full md:w-auto px-4 py-2 rounded-md transition-colors text-white bg-green-500 cursor-not-allowed"
                >
                    {status === 'Sent' ? <CheckCircleIcon className="h-5 w-5 mr-2" /> : <PaperAirplaneIcon className="h-5 w-5 mr-2" />}
                    {status === 'Sent' ? `Candidature envoyée` : 'Confirmation...'}
                </button>
            );
        }

        // Status is 'LetterGenerated'
        return (
            <button
                onClick={onApply}
                className="flex items-center justify-center w-full md:w-auto px-4 py-2 rounded-md transition-colors text-white bg-indigo-600 hover:bg-indigo-700"
            >
                <ExternalLinkIcon className="h-5 w-5 mr-2" />
                Postuler sur le site
            </button>
        );
    }
    return null;
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


export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onViewCoverLetter, onGenerateLetter, onApply, onToggleSelect }) => {
  const { job, status, isSelected } = application;
  const letterIsGenerated = status === 'LetterGenerated' || status === 'AwaitingConfirmation' || status === 'Sent';

  return (
    <div className={`p-6 rounded-lg shadow-md border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 shadow-lg' : 'bg-white border-gray-200 hover:shadow-lg'}`}>
      <div className="flex items-start space-x-4">
         <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
        <div className="flex-1 flex flex-col md:flex-row justify-between items-start">
          <div className="flex-1 mb-4 md:mb-0 md:pr-6">
            <h3 className="text-xl font-bold text-indigo-700">{job.title}</h3>
            
            {job.companyWebsite ? (
              <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-md font-semibold text-gray-600 hover:text-indigo-600 hover:underline">
                {job.company}
                <ExternalLinkIcon className="h-4 w-4 ml-1.5" />
              </a>
            ) : (
               <p className="text-md font-semibold text-gray-600">{job.company}</p>
            )}

            <div className="flex items-center text-sm text-gray-500 mt-2">
              <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
              <span>{job.location}</span>
            </div>
            
             <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {job.address && (
                  <p>{job.address}</p>
                )}
                {job.phone && (
                  <a href={`tel:${job.phone}`} className="inline-flex items-center hover:text-indigo-600">
                    <PhoneIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span>{job.phone}</span>
                  </a>
                )}
                 {job.hiringEmail && (
                  <a href={`mailto:${job.hiringEmail}`} className="inline-flex items-center hover:text-indigo-600">
                    <EnvelopeIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span>{job.hiringEmail}</span>
                  </a>
                )}
              </div>

            <p className="mt-2 text-sm text-gray-600">{linkify(job.description)}</p>
             <div className="flex items-center mt-3 text-xs font-semibold text-gray-500 uppercase">
                Source: {job.source}
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:text-indigo-800">
                    <ExternalLinkIcon className="h-4 w-4" />
                </a>
            </div>
          </div>
          <div className="w-full md:w-auto flex-shrink-0 flex flex-col md:items-end space-y-2">
            <div className={`px-3 py-1 text-sm font-medium rounded-full self-start md:self-end ${getStatusStyles(status)}`}>
              {getStatusText(status)}
            </div>
            <div className="flex w-full md:w-auto space-x-2">
              <button
                onClick={onViewCoverLetter}
                disabled={!letterIsGenerated}
                className="flex items-center justify-center flex-grow px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <EyeIcon className="h-5 w-5 mr-2" />
                Voir la lettre
              </button>
               <div className="flex-grow">
                 <ActionButton application={application} onGenerateLetter={onGenerateLetter} onApply={onApply} />
              </div>
            </div>
            {status === 'Sent' && <p className="text-xs text-gray-500 mt-1">Candidature marquée comme envoyée.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
