
import React from 'react';
import type { Application } from '../types';

interface CoverLetterModalProps {
  application: Application;
  onClose: () => void;
}

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({ application, onClose }) => {
  const { job, coverLetter } = application;

  const copyToClipboard = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter);
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
              <h2 className="text-2xl font-bold text-gray-800">Lettre de Motivation</h2>
              <p className="text-md text-gray-600">Pour le poste de <span className="font-semibold">{job.title}</span> chez <span className="font-semibold">{job.company}</span></p>
            </div>
            <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
          </div>
        </div>
        <div className="p-4 sm:p-8 overflow-y-auto flex-grow">
          <div className="bg-white p-8 sm:p-12 shadow-lg max-w-3xl mx-auto">
            <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed text-sm">
              {coverLetter}
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-wrap justify-end gap-3 bg-white rounded-b-lg">
          <button 
            onClick={copyToClipboard}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Copier le texte
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};