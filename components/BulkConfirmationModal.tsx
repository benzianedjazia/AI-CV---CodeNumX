import React from 'react';

interface BulkConfirmationModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BulkConfirmationModal: React.FC<BulkConfirmationModalProps> = ({ count, onConfirm, onCancel }) => {
  if (count === 0) return null;
    
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Confirmer les envois</h2>
          <p className="mt-2 text-gray-600">
             Plusieurs fenêtres de votre client de messagerie se sont ouvertes pour envoyer vos <span className="font-semibold">{count}</span> candidature(s).
          </p>
          <p className="mt-4 text-gray-600">
            Après avoir envoyé tous les e-mails, veuillez cliquer sur le bouton ci-dessous pour confirmer que vos candidatures ont bien été envoyées.
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
            Candidatures envoyées !
          </button>
        </div>
      </div>
    </div>
  );
};