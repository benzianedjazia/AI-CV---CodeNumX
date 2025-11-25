
import React, { useRef, useEffect } from 'react';
import type { CvData } from '../types';
import { cvGenerator } from '../services/cvGenerator';
import { DownloadIcon } from './icons/DownloadIcon';
import { useTranslations } from '../hooks/useTranslations';
import { jsPDF } from "jspdf";

interface CvPreviewProps {
  cvData: CvData;
  templateKey: string;
  onTemplateChange: (key: string) => void;
}

export const CvPreview: React.FC<CvPreviewProps> = ({ cvData, templateKey, onTemplateChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslations();

  useEffect(() => {
    if (canvasRef.current) {
      cvGenerator.drawCv(canvasRef.current, cvData, templateKey);
    }
  }, [cvData, templateKey]);

  const handleDownloadPng = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      const fileName = (cvData.personalInfo.name || 'cv').replace(/\s+/g, '_');
      link.download = `${fileName}_CV.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const handleDownloadPdf = () => {
    if (canvasRef.current) {
        const fileName = (cvData.personalInfo.name || 'cv').replace(/\s+/g, '_');
        // Initialize jsPDF with A4 format and points as unit (matching the canvas 595x842)
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        const imgData = canvasRef.current.toDataURL('image/png');
        // Add image to PDF. (0, 0) coordinates, 595 width, 842 height
        pdf.addImage(imgData, 'PNG', 0, 0, 595, 842);
        pdf.save(`${fileName}_CV.pdf`);
    }
  };

  return (
    <div className="sticky top-8">
      <h3 className="font-semibold mb-2 text-gray-800 text-left">{t('cvPreview.title')}</h3>
      
      <div className="mb-4 bg-gray-100 p-2 rounded-lg flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full">
            {Object.entries(cvGenerator.templates).map(([key, { name }]) => (
            <button
                key={key}
                onClick={() => onTemplateChange(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                templateKey === key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
                {name}
            </button>
            ))}
        </div>
        <div className="flex gap-2">
            <button
            onClick={handleDownloadPng}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            aria-label={t('cvPreview.downloadAria')}
            >
            <DownloadIcon className="h-4 w-4" />
            <span className="hidden lg:inline">PNG</span>
            </button>
            <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            aria-label={t('cvPreview.downloadPdfButton')}
            >
            <DownloadIcon className="h-4 w-4" />
            <span className="hidden lg:inline">PDF</span>
            </button>
        </div>
      </div>

      <div className="bg-gray-200 p-4 rounded-lg shadow-inner overflow-x-auto">
        <canvas
          ref={canvasRef}
          width={cvGenerator.dimensions.width}
          height={cvGenerator.dimensions.height}
          className="shadow-lg mx-auto"
          style={{ width: '100%', maxWidth: `${cvGenerator.dimensions.width}px`, height: 'auto' }}
          aria-label={t('cvPreview.canvasAria')}
        />
      </div>
    </div>
  );
};
