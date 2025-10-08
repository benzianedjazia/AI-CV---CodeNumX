import React, { useState } from 'react';

interface LinkedInAuthModalProps {
  onClose: () => void;
  onConnect: (url: string) => boolean;
}

export const LinkedInAuthModal: React.FC<LinkedInAuthModalProps> = ({ onClose, onConnect }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (!url.trim() || !url.includes('linkedin.com/in/')) {
      setError('Veuillez entrer une URL de profil LinkedIn valide (ex: https://www.linkedin.com/in/votre-nom).');
      return;
    }
    setError('');
    const success = onConnect(url);
    if (!success) {
        setError('Impossible de se connecter avec cette URL.');
    }
    // onConnect handles the user state change which closes the login page, so no need to call onClose
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Se connecter avec LinkedIn</h2>
          <p className="mt-2 text-sm text-gray-600">
            Pour des raisons de sécurité, une application réelle vous redirigerait vers LinkedIn pour vous connecter.
            Pour cette démonstration, veuillez entrer l'URL de votre profil public pour continuer.
          </p>
          <div className="mt-4">
            <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700">
              URL de votre profil LinkedIn
            </label>
            <input
              id="linkedin-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="https://www.linkedin.com/in/..."
              autoFocus
            />
          </div>
          {error && <p className="mt-2 text-red-500 text-xs">{error}</p>}
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};
