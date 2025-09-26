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
    onBulkApply
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
        {applications.map(app => (
          <ApplicationCard
            key={app.id}
            application={app}
            onViewCoverLetter={() => viewCoverLetter(app)}
            onGenerateLetter={() => onGenerateLetter(app.id)}
            onApply={() => onApply(app.id)}
            onToggleSelect={() => onToggleSelect(app.id)}
          />
        ))}
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