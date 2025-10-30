import React, { useState, useCallback } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { CvInput } from '../types';

declare const pdfjsLib: any;

interface CvUploaderProps {
  onAnalyze: (cvInput: CvInput) => void;
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

const TabButton: React.FC<{
  tabId: 'upload' | 'linkedin' | 'paste';
  activeTab: 'upload' | 'linkedin' | 'paste';
  setActiveTab: (tabId: 'upload' | 'linkedin' | 'paste') => void;
  children: React.ReactNode;
}> = ({ tabId, activeTab, setActiveTab, children }) => (
  <button
    onClick={() => setActiveTab(tabId)}
    className={`px-4 py-2 text-sm font-medium rounded-md ${
      activeTab === tabId
        ? 'bg-indigo-600 text-white'
        : 'text-gray-600 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);


export const CvUploader: React.FC<CvUploaderProps> = ({ onAnalyze }) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<'upload' | 'linkedin' | 'paste'>('upload');
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [isParsingFile, setIsParsingFile] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [pastedContent, setPastedContent] = useState('');
    const [uploadedContent, setUploadedContent] = useState('');

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
              throw new Error(t('hero.errorFileType'));
          }
          setUploadedContent(text);
      } catch (e) {
          console.error(e);
          setError(e instanceof Error ? e.message : t('hero.errorReadFile'));
          setFileName('');
      } finally {
          setIsParsingFile(false);
      }
    }, [t]);

    const handleSubmit = () => {
        let finalCvInput: CvInput | null = null;
        if (activeTab === 'linkedin') {
            if (!linkedinUrl.trim()) {
                setError(t('hero.errorLinkedInUrl'));
                return;
            }
            finalCvInput = { type: 'linkedin', url: linkedinUrl };
        } else if (activeTab === 'upload') {
            if (!uploadedContent.trim()) {
                setError(t('hero.errorProvideCv'));
                return;
            }
            finalCvInput = { type: 'text', content: uploadedContent };
        } else if (activeTab === 'paste') {
            if (!pastedContent.trim()) {
                setError(t('hero.errorProvideCv'));
                return;
            }
            finalCvInput = { type: 'text', content: pastedContent };
        }

        if (finalCvInput) {
            setError('');
            onAnalyze(finalCvInput);
        }
    };
    
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); }
    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); }
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
        <div className="mt-10 w-full bg-white p-6 rounded-lg shadow-lg text-left space-y-4">
             <div>
                <h3 className="text-lg font-medium text-gray-800">{t('cvUploader.title')}</h3>
                <p className="text-sm text-gray-500">{t('cvUploader.subtitle')}</p>
            </div>
            <div className="flex space-x-2 border-b">
               <TabButton tabId="upload" activeTab={activeTab} setActiveTab={setActiveTab}>{t('cvUploader.tabUpload')}</TabButton>
               <TabButton tabId="linkedin" activeTab={activeTab} setActiveTab={setActiveTab}>{t('cvUploader.tabLinkedIn')}</TabButton>
               <TabButton tabId="paste" activeTab={activeTab} setActiveTab={setActiveTab}>{t('cvUploader.tabPaste')}</TabButton>
           </div>
           
           {activeTab === 'upload' && (
             <>
                <div 
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`file-drop-zone border-2 border-dashed rounded-md p-8 text-center cursor-pointer ${isDragging ? 'file-drop-zone-active' : 'border-gray-300'}`}
                    onClick={() => document.getElementById('recruiter-file-upload')?.click()}
                >
                    <input id="recruiter-file-upload" type="file" className="hidden" accept=".pdf,.txt" onChange={onFileChange} />
                    <p className="text-gray-500">{t('hero.dropzoneText')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('hero.dropzoneFormats')}</p>
                </div>
                {isParsingFile && <p className="mt-2 text-indigo-600">{t('hero.parsingFile')}</p>}
                {fileName && !isParsingFile && <p className="mt-2 text-green-600">{t('hero.fileLoaded')}: {fileName}</p>}
             </>
           )}
           {activeTab === 'linkedin' && (
              <div>
                 <p className="text-gray-600 mb-2 text-sm">{t('hero.linkedInDescription')}</p>
                 <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="https://www.linkedin.com/in/your-name"
                  />
              </div>
           )}
           {activeTab === 'paste' && (
              <textarea
                    rows={8}
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder={t('hero.pasteCvPlaceholder')}
              />
           )}
           
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <button
                onClick={handleSubmit}
                disabled={isParsingFile}
                className="w-full py-3 px-6 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-transform disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
                {isParsingFile ? t('hero.submitButtonLoading') : t('cvUploader.submitButton')}
            </button>
        </div>
    );
}