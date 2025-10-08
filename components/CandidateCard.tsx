import React, { useState } from 'react';
import type { Candidate } from '../types';
import { PhoneIcon } from './icons/PhoneIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { UserIcon } from './icons/UserIcon';
import { useTranslations } from '../hooks/useTranslations';

interface CandidateCardProps {
  candidate: Candidate;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const [imageError, setImageError] = useState(false);
  const { t } = useTranslations();

  const showPlaceholder = !candidate.photoUrl || imageError;

  return (
    <div className="p-5 rounded-lg shadow-md border bg-white border-gray-200 transition-all hover:shadow-lg hover:border-indigo-200">
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {showPlaceholder ? (
            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
              <UserIcon className="h-12 w-12 text-gray-400" />
            </div>
          ) : (
            <img 
              src={candidate.photoUrl} 
              alt={candidate.name}
              className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-indigo-700">{candidate.name}</h3>
          <p className="text-md font-semibold text-gray-600 -mt-1">{candidate.jobTitle}</p>
          
          <p className="mt-2 text-sm text-gray-500">{t('candidateCard.source')}: <span className="font-medium">{candidate.source}</span></p>
          
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            {candidate.linkedinUrl && (
              <a 
                href={candidate.linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
              >
                <LinkedInIcon className="h-5 w-5 me-2"/>
                <span>{t('candidateCard.linkedinProfile')}</span>
                <ExternalLinkIcon className="h-4 w-4 ms-1.5 text-gray-400"/>
              </a>
            )}
            
            {candidate.phone && (
              <div className="inline-flex items-center">
                <PhoneIcon className="h-5 w-5 me-2 text-gray-400" />
                <span>{candidate.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};