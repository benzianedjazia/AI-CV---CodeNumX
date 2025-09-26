import React, { useState, useCallback } from 'react';

declare const pdfjsLib: any;

interface HeroProps {
  onAnalyze: (cvText: string, location: string) => void;
}

const extractTextFromPdf = async (file: File): Promise<string> => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
};

const extractTextFromTxt = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target?.result as string);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsText(file);
    });
};

export const Hero: React.FC<HeroProps> = ({ onAnalyze }) => {
  const [cvText, setCvText] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showTextArea, setShowTextArea] = useState(false);

  const handleSubmit = () => {
    if (!cvText.trim() || !location.trim()) {
      setError('Veuillez fournir un CV et une ville.');
      return;
    }
    setError('');
    onAnalyze(cvText, location);
  };
  
  const handleFile = useCallback(async (file: File | null) => {
      if (!file) return;

      setIsParsingFile(true);
      setError('');
      setFileName(file.name);

      try {
          let text = '';
          if (file.type === 'application/pdf') {
              text = await extractTextFromPdf(file);
          } else if (file.type === 'text/plain') {
              text = await extractTextFromTxt(file);
          } else {
              throw new Error('Type de fichier non supporté. Veuillez utiliser un PDF ou un TXT.');
          }
          setCvText(text);
      } catch (e) {
          console.error(e);
          setError(e instanceof Error ? e.message : 'Erreur lors de la lecture du fichier.');
          setFileName('');
      } finally {
          setIsParsingFile(false);
      }
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file || null);
  }


  return (
    <div className="w-full max-w-4xl text-center flex flex-col items-center">
      <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
        Optimisez votre recherche d'emploi
      </h2>
      <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
        Téléchargez votre CV, indiquez une ville, et laissez notre IA trouver les meilleurs postes et rédiger des lettres de motivation pour vous.
      </p>

      <div className="mt-10 w-full space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-lg text-left">
           <label className="block text-lg font-medium text-gray-700 mb-2">
            1. Téléchargez votre CV
          </label>
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`file-drop-zone border-2 border-dashed rounded-md p-8 text-center cursor-pointer ${isDragging ? 'file-drop-zone-active' : 'border-gray-300'}`}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input id="file-upload" type="file" className="hidden" accept=".pdf,.txt" onChange={onFileChange} />
            <p className="text-gray-500">Glissez-déposez votre fichier ici, ou cliquez pour sélectionner.</p>
            <p className="text-sm text-gray-400 mt-1">Formats supportés: PDF, TXT</p>
          </div>
          {isParsingFile && <p className="mt-2 text-indigo-600">Analyse du fichier...</p>}
          {fileName && !isParsingFile && <p className="mt-2 text-green-600">Fichier chargé: {fileName}</p>}
           <div className="text-center mt-4">
              <button onClick={() => setShowTextArea(!showTextArea)} className="text-sm text-indigo-600 hover:underline">
                {showTextArea ? 'Cacher' : 'Ou coller le texte du CV manuellement'}
              </button>
            </div>
            {showTextArea && (
              <textarea
                rows={10}
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                className="mt-4 w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Collez le contenu de votre CV ici..."
              />
            )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg text-left">
          <label htmlFor="location" className="block text-lg font-medium text-gray-700 mb-2">
            2. Entrez une ville ou une région de recherche
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="Ex: Paris, France"
          />
        </div>
        
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        <button
          onClick={handleSubmit}
          disabled={isParsingFile}
          className="w-full py-4 px-8 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-transform disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isParsingFile ? 'Chargement du CV...' : "Lancer l'analyse et trouver des emplois"}
        </button>
      </div>
    </div>
  );
};