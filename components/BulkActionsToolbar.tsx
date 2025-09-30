import React from 'react';
import type { Application } from '../types';

interface BulkActionsToolbarProps {
  selectedCount: number;
  areAllSelected: boolean;
  onToggleSelectAll: () => void;
  onBulkGenerate: () => void;
  onBulkApply: () => void;
  applications: Application[];
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  areAllSelected,
  onToggleSelectAll,
  onBulkGenerate,
  onBulkApply,
  applications,
}) => {
  const canBulkGenerate = applications.some(app => app.status === 'Ready' || app.status === 'Error');
  const canBulkApply = applications.some(app => app.status === 'LetterGenerated');

  return (
    <div className="bg-white p-4 mb-4 rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-10">
      <div className="flex items-center">
        <input
          id="select-all"
          type="checkbox"
          checked={areAllSelected}
          onChange={onToggleSelectAll}
          className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
        <label htmlFor="select-all" className="ml-3 text-md font-medium text-gray-700">
          {selectedCount} sélectionné(s)
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onBulkGenerate}
          disabled={!canBulkGenerate}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
        >
          Générer les lettres
        </button>
        <button
          onClick={onBulkApply}
          disabled={!canBulkApply}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
        >
          Postuler (sites externes)
        </button>
      </div>
    </div>
  );
};