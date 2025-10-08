import React, { useState, useCallback } from 'react';
import type { CvData } from '../types';
import { ManualCvForm } from './ManualCvForm';
import { CvPreview } from './CvPreview';
import { useTranslations } from '../hooks/useTranslations';

declare const pdfjsLib: any;

export type CvInput = 
  | { type: 'text'; content: string }
  | { type: 'linkedin'; url: string }
  | { type: 'manual'; data: CvData };

export interface SearchOptions {
  location: string;
  contractTypes: string[];
  datePosted: string;
}
interface HeroProps {
  onAnalyze: (cvInput: CvInput, searchOptions: SearchOptions) => void;
}

const initialCvData: CvData = {
  personalInfo: { name: '', email: '', phone: '' },
  linkedin: '',
  summary: '',
  skills: [],
  experience: [{ jobTitle: '', company: '', duration: '', responsibilities: [''] }],
  education: [{ degree: '', institution: '', duration: '' }],
};

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
  tabId: 'upload' | 'linkedin' | 'manual';
  activeTab: 'upload' | 'linkedin' | 'manual';
  setActiveTab: (tabId: 'upload' | 'linkedin' | 'manual') => void;
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

export const Hero: React.FC<HeroProps> = ({ onAnalyze }) => {
  const { t } = useTranslations();

  const contractOptions = [
    { id: 'cdd', label: t('hero.contractTypeCDI') },
    { id: 'freelance', label: t('hero.contractTypeFreelance') },
    { id: 'subcontracting', label: t('hero.contractTypeSubcontracting') },
  ];
  
  const [cvInput, setCvInput] = useState<CvInput>({ type: 'manual', data: initialCvData });
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    location: '',
    contractTypes: [],
    datePosted: '',
  });

  const [activeTab, setActiveTab] = useState<'upload' | 'linkedin' | 'manual'>('upload');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [templateKey, setTemplateKey] = useState('modern');

  const handleManualCvDataChange = useCallback((data: CvData) => {
    setCvInput({ type: 'manual', data });
  }, []);
  
  const manualDataForForm = cvInput.type === 'manual' ? cvInput.data : initialCvData;

  const handleSubmit = () => {
    let finalCvInput = cvInput;
    if (activeTab === 'linkedin') {
      finalCvInput = { type: 'linkedin', url: linkedinUrl };
      if (!linkedinUrl.trim()) {
        setError(t('hero.errorLinkedInUrl'));
        return;
      }
    } else if (activeTab === 'upload') {
      if (cvInput.type !== 'text' || !cvInput.content?.trim()) {
        setError(t('hero.errorProvideCv'));
        return;
      }
    } else if (activeTab === 'manual') {
       const data = cvInput.type === 'manual' ? cvInput.data : initialCvData;
       if (!data.personalInfo.name) {
          setError(t('hero.errorManualFormName'));
          return;
      }
       finalCvInput = { type: 'manual', data };
    }

    if (!searchOptions.location.trim()) {
      setError(t('hero.errorLocation'));
      return;
    }

    setError('');
    onAnalyze(finalCvInput, searchOptions);
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
              throw new Error(t('hero.errorFileType'));
          }
          setCvInput({ type: 'text', content: text });
      } catch (e) {
          console.error(e);
          setError(e instanceof Error ? e.message : t('hero.errorReadFile'));
          setFileName('');
      } finally {
          setIsParsingFile(false);
      }
  }, [t]);

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

  const handleContractTypeChange = (contractId: string) => {
    setSearchOptions(prev => {
      const newContractTypes = prev.contractTypes.includes(contractId)
        ? prev.contractTypes.filter(c => c !== contractId)
        : [...prev.contractTypes, contractId];
      return { ...prev, contractTypes: newContractTypes };
    });
  }

  return (
    <div className="w-full max-w-7xl text-center flex flex-col items-center">
      <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
        {t('hero.title')}
      </h2>
      <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
        {t('hero.subtitle')}
      </p>

      <div className="mt-10 w-full space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-lg text-left">
           <label className="block text-lg font-medium text-gray-700 mb-4">
            {t('hero.step1')}
           </label>
           <div className="flex space-x-2 border-b mb-4">
               <TabButton tabId="upload" activeTab={activeTab} setActiveTab={setActiveTab}>{t('hero.tabUpload')}</TabButton>
               <TabButton tabId="linkedin" activeTab={activeTab} setActiveTab={setActiveTab}>{t('hero.tabLinkedIn')}</TabButton>
               <TabButton tabId="manual" activeTab={activeTab} setActiveTab={setActiveTab}>{t('hero.tabManual')}</TabButton>
           </div>
           
           {activeTab === 'upload' && (
             <>
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`file-drop-zone border-2 border-dashed rounded-md p-8 text-center cursor-pointer ${isDragging ? 'file-drop-zone-active' : 'border-gray-300'}`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input id="file-upload" type="file" className="hidden" accept=".pdf,.txt" onChange={onFileChange} />
                <p className="text-gray-500">{t('hero.dropzoneText')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('hero.dropzoneFormats')}</p>
              </div>
              {isParsingFile && <p className="mt-2 text-indigo-600">{t('hero.parsingFile')}</p>}
              {fileName && !isParsingFile && <p className="mt-2 text-green-600">{t('hero.fileLoaded')}: {fileName}</p>}
               <textarea
                    rows={8}
                    value={cvInput.type === 'text' ? cvInput.content : ''}
                    onChange={(e) => setCvInput({type: 'text', content: e.target.value})}
                    className="mt-4 w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder={t('hero.pasteCvPlaceholder')}
              />
             </>
           )}

           {activeTab === 'linkedin' && (
              <div>
                 <p className="text-gray-600 mb-2">{t('hero.linkedInDescription')}</p>
                 <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="https://www.linkedin.com/in/your-name"
                  />
              </div>
           )}

           {activeTab === 'manual' && (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/2">
                   <ManualCvForm 
                    cvData={manualDataForForm}
                    onCvDataChange={handleManualCvDataChange} 
                  />
                </div>
                <div className="lg:w-1/2">
                  <CvPreview 
                    cvData={manualDataForForm}
                    templateKey={templateKey}
                    onTemplateChange={setTemplateKey}
                  />
                </div>
              </div>
           )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg text-left">
          <label className="block text-lg font-medium text-gray-700 mb-2">
            {t('hero.step2')}
          </label>
           <div className="space-y-4">
               <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('hero.locationLabel')}
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={searchOptions.location}
                    onChange={(e) => setSearchOptions({...searchOptions, location: e.target.value})}
                    className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder={t('hero.locationPlaceholder')}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('hero.contractTypeLabel')}
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {contractOptions.map(option => (
                        <div key={option.id} className="flex items-center">
                            <input
                                id={`contract-${option.id}`}
                                type="checkbox"
                                checked={searchOptions.contractTypes.includes(option.label)}
                                onChange={() => handleContractTypeChange(option.label)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor={`contract-${option.id}`} className="ms-2 block text-sm text-gray-900">
                                {option.label}
                            </label>
                        </div>
                    ))}
                  </div>
               </div>
                <div>
                    <label htmlFor="date-posted" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('hero.datePostedLabel')}
                    </label>
                    <select
                        id="date-posted"
                        value={searchOptions.datePosted}
                        onChange={(e) => setSearchOptions({...searchOptions, datePosted: e.target.value})}
                        className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
                    >
                        <option value="">{t('hero.datePostedAny')}</option>
                        <option value="month">{t('hero.datePostedMonth')}</option>
                    </select>
                </div>
           </div>
        </div>
        
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        <button
          onClick={handleSubmit}
          disabled={isParsingFile}
          className="w-full py-4 px-8 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-transform disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isParsingFile ? t('hero.submitButtonLoading') : t('hero.submitButton')}
        </button>
      </div>
    </div>
  );
};