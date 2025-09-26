import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ResultsDashboard } from './components/ResultsDashboard';
import { geminiService } from './services/geminiService';
import type { Application, CvData, LoadingState } from './types';
import { ConfirmationModal } from './components/ConfirmationModal';
import { BulkConfirmationModal } from './components/BulkConfirmationModal';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [applications, setApplications] = useState<Application[]>([]);
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appToConfirm, setAppToConfirm] = useState<Application | null>(null);
  const [isBulkConfirming, setIsBulkConfirming] = useState(false);


  const handleAnalysis = useCallback(async (cvText: string, location: string) => {
    setLoadingState('parsing');
    setError(null);
    setApplications([]);
    setCvData(null);

    try {
      const extractedCvData = await geminiService.extractCvInfo(cvText);
      setCvData(extractedCvData);
      
      setLoadingState('findingJobs');
      
      const foundJobs = await geminiService.findJobs(extractedCvData.skills, location);
      if (!foundJobs || foundJobs.length === 0) {
        throw new Error("Could not find any job opportunities. Try refining your CV or location.");
      }

      const initialApplications: Application[] = foundJobs.map(job => ({
        id: `${job.company}-${job.title}-${Math.random()}`.replace(/\s/g, ''),
        job,
        status: 'Ready',
        isSelected: false,
      }));
      setApplications(initialApplications);
      setLoadingState('results');

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed during step ${loadingState}. ${errorMessage}`);
      setLoadingState('error');
    }
  }, [loadingState]);

  const handleGenerateLetter = useCallback(async (appId: string) => {
    if (!cvData) {
      setError("CV data is missing. Please start over.");
      setLoadingState('error');
      return;
    }

    const appToUpdate = applications.find(app => app.id === appId);
    if (!appToUpdate) return;

    setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'GeneratingLetter' } : app));

    try {
      const coverLetter = await geminiService.generateCoverLetter(cvData, appToUpdate.job);
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'LetterGenerated', coverLetter } : app));
    } catch (err) {
      console.error(err);
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'Error' } : app));
    }
  }, [cvData, applications]);

  const handleApply = useCallback((id: string) => {
    const appToApply = applications.find(app => app.id === id);
    if (!appToApply || !cvData || !appToApply.coverLetter) return;

    const to = appToApply.job.hiringEmail || '';
    const subject = `Candidature pour le poste de ${appToApply.job.title} - ${cvData.personalInfo.name}`;
    const body = `${appToApply.coverLetter}\n\n---\nCe message a été préparé par l'Assistant CV IA. N'oubliez pas de joindre votre CV avant d'envoyer.`;
    
    const mailtoLink = `mailto:${to}?bcc=${cvData.personalInfo.email}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'AwaitingConfirmation' } : app));
    setAppToConfirm(appToApply);
  }, [applications, cvData]);

  const handleConfirmSent = useCallback((id: string) => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'Sent' } : app));
    setAppToConfirm(null);
  }, []);

  const handleCancelConfirmation = useCallback((id: string) => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'LetterGenerated' } : app));
    setAppToConfirm(null);
  }, []);
  
  const handleToggleSelect = useCallback((id: string) => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, isSelected: !app.isSelected } : app));
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    const areAllSelected = applications.every(app => app.isSelected);
    setApplications(prev => prev.map(app => ({...app, isSelected: !areAllSelected})));
  }, [applications]);

  const selectedApplications = useMemo(() => applications.filter(app => app.isSelected), [applications]);

  const handleBulkGenerate = useCallback(() => {
    selectedApplications.forEach(app => {
      if (app.status === 'Ready' || app.status === 'Error') {
        handleGenerateLetter(app.id);
      }
    });
  }, [selectedApplications, handleGenerateLetter]);

  const handleBulkApply = useCallback(() => {
     if (!cvData) return;
     selectedApplications.forEach(app => {
       if (app.status === 'LetterGenerated') {
         const to = app.job.hiringEmail || '';
         const subject = `Candidature pour le poste de ${app.job.title} - ${cvData.personalInfo.name}`;
         const body = `${app.coverLetter}\n\n---\nCe message a été préparé par l'Assistant CV IA. N'oubliez pas de joindre votre CV avant d'envoyer.`;
         const mailtoLink = `mailto:${to}?bcc=${cvData.personalInfo.email}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
         window.open(mailtoLink, '_blank');
       }
     });
     setApplications(prev => prev.map(app => app.isSelected && app.status === 'LetterGenerated' ? { ...app, status: 'AwaitingConfirmation' } : app));
     setIsBulkConfirming(true);
  }, [selectedApplications, cvData]);

  const handleConfirmBulkSent = useCallback(() => {
    setApplications(prev => prev.map(app => app.status === 'AwaitingConfirmation' ? { ...app, status: 'Sent', isSelected: false } : app));
    setIsBulkConfirming(false);
  }, []);
  
  const handleCancelBulkConfirmation = useCallback(() => {
     setApplications(prev => prev.map(app => app.status === 'AwaitingConfirmation' ? { ...app, status: 'LetterGenerated' } : app));
     setIsBulkConfirming(false);
  }, []);

  const reset = () => {
    setLoadingState('idle');
    setApplications([]);
    setCvData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
        {loadingState === 'idle' && <Hero onAnalyze={handleAnalysis} />}
        
        {(loadingState === 'parsing' || loadingState === 'findingJobs') && (
          <LoadingIndicator state={loadingState} />
        )}

        {loadingState === 'error' && (
          <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg relative w-full max-w-2xl">
            <strong className="font-bold">Erreur!</strong>
            <p>{error}</p>
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {loadingState === 'results' && (
          <ResultsDashboard 
            applications={applications} 
            onGenerateLetter={handleGenerateLetter}
            onApply={handleApply}
            onReset={reset}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onBulkGenerate={handleBulkGenerate}
            onBulkApply={handleBulkApply}
          />
        )}

        {appToConfirm && (
          <ConfirmationModal
            application={appToConfirm}
            onConfirm={() => handleConfirmSent(appToConfirm.id)}
            onCancel={() => handleCancelConfirmation(appToConfirm.id)}
          />
        )}
        
        {isBulkConfirming && (
           <BulkConfirmationModal
            count={selectedApplications.filter(a => a.status === 'AwaitingConfirmation').length}
            onConfirm={handleConfirmBulkSent}
            onCancel={handleCancelBulkConfirmation}
           />
        )}

      </main>
    </div>
  );
};

export default App;