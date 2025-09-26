import React from 'react';
import type { Application } from '../types';

interface ConfirmationModalProps {
  application: Application;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ application, onConfirm, onCancel }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Confirmer l'envoi</h2>
          <p className="mt-2 text-gray-600">
            Votre client de messagerie s'est ouvert pour envoyer votre candidature pour le poste de <span className="font-semibold">{application.job.title}</span>.
          </p>
          <p className="mt-4 text-gray-600">
            Après avoir envoyé l'e-mail, veuillez cliquer sur le bouton ci-dessous pour confirmer que votre candidature a bien été envoyée.
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Candidature envoyée !
          </button>
        </div>
      </div>
    </div>
  );
};