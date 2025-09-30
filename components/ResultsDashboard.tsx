import React, { useState, useMemo } from 'react';
import type { Application } from '../types';
import { ApplicationCard } from './ApplicationCard';
import { CoverLetterModal } from './CoverLetterModal';
import { BulkActionsToolbar } from './BulkActionsToolbar';

interface ResultsDashboardProps {
  applications: Application[];
  onGenerateLetter: (id: string) => void;
  onApply: (id: string) => void;
  onReset: () => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onBulkGenerate: () => void;
  onBulkApply: () => void;
  groundingChunks: any[];
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = (props) => {
  const { 
    applications, 
    onGenerateLetter, 
    onApply, 
    onReset,
    onToggleSelect,
    onToggleSelectAll,
    onBulkGenerate,
    onBulkApply,
    groundingChunks,
  } = props;
  
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const selectedCount = useMemo(() => applications.filter(app => app.isSelected).length, [applications]);
  const areAllSelected = useMemo(() => applications.length > 0 && selectedCount === applications.length, [applications, selectedCount]);

  const viewCoverLetter = (app: Application) => {
    if(app.coverLetter) {
      setSelectedApplication(app);
    }
  };

  const closeModal = () => {
    setSelectedApplication(null);
  };

  return (
    <div className="w-full max-w-6xl animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Opportunités trouvées</h2>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Nouvelle Recherche
        </button>
      </div>

      {groundingChunks && groundingChunks.length > 0 && (
        <div className="mb-4 p-4 bg-slate-200/50 rounded-lg border border-slate-300">
          <h4 className="font-semibold text-gray-700 mb-2 text-sm">Sources utilisées pour cette recherche :</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {groundingChunks.map((chunk, index) => (
              chunk.web && (
                <li key={index}>
                  <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    {chunk.web.title || chunk.web.uri}
                  </a>
                </li>
              )
            ))}
          </ul>
        </div>
      )}

      {selectedCount > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedCount}
          areAllSelected={areAllSelected}
          onToggleSelectAll={onToggleSelectAll}
          onBulkGenerate={onBulkGenerate}
          onBulkApply={onBulkApply}
          applications={applications.filter(app => app.isSelected)}
        />
      )}
      
      <div className="space-y-4">
        {applications.length > 0 ? (
          applications.map(app => (
            <ApplicationCard
              key={app.id}
              application={app}
              onViewCoverLetter={() => viewCoverLetter(app)}
              onGenerateLetter={() => onGenerateLetter(app.id)}
              onApply={() => onApply(app.id)}
              onToggleSelect={() => onToggleSelect(app.id)}
            />
          ))
        ) : (
          <div className="text-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700">Aucune offre d'emploi trouvée</h3>
            <p className="mt-2 text-gray-500">Essayez de modifier vos critères de recherche ou de fournir un CV plus détaillé pour de meilleurs résultats.</p>
          </div>
        )}
      </div>

      {selectedApplication && (
        <CoverLetterModal
          application={selectedApplication}
          onClose={closeModal}
        />
      )}
    </div>
  );
};