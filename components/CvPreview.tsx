import React, { useRef, useEffect } from 'react';
import type { CvData } from '../types';
import { cvGenerator } from '../services/cvGenerator';
import { DownloadIcon } from './icons/DownloadIcon';

interface CvPreviewProps {
  cvData: CvData;
  templateKey: string;
  onTemplateChange: (key: string) => void;
}

export const CvPreview: React.FC<CvPreviewProps> = ({ cvData, templateKey, onTemplateChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      cvGenerator.drawCv(canvasRef.current, cvData, templateKey);
    }
  }, [cvData, templateKey]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      const fileName = (cvData.personalInfo.name || 'cv').replace(/\s+/g, '_');
      link.download = `${fileName}_CV.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="sticky top-8">
      <h3 className="font-semibold mb-2 text-gray-800 text-left">Aperçu et modèles</h3>
      
      <div className="mb-4 bg-gray-100 p-2 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
            {Object.entries(cvGenerator.templates).map(([key, { name }]) => (
            <button
                key={key}
                onClick={() => onTemplateChange(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                templateKey === key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
                {name}
            </button>
            ))}
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          aria-label="Télécharger le CV en PNG"
        >
          <DownloadIcon className="h-4 w-4" />
          <span>Télécharger (PNG)</span>
        </button>
      </div>

      <div className="bg-gray-200 p-4 rounded-lg shadow-inner overflow-x-auto">
        <canvas
          ref={canvasRef}
          width={cvGenerator.dimensions.width}
          height={cvGenerator.dimensions.height}
          className="shadow-lg mx-auto"
          style={{ width: '100%', maxWidth: `${cvGenerator.dimensions.width}px`, height: 'auto' }}
          aria-label="Aperçu du CV"
        />
      </div>
    </div>
  );
};