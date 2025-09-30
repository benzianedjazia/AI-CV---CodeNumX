import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import type { CvInput, SearchOptions } from './components/Hero';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ResultsDashboard } from './components/ResultsDashboard';
import { geminiService } from './services/geminiService';
import type { Application, CvData, LoadingState } from './types';
import { ConfirmationModal } from './components/ConfirmationModal';
import { BulkConfirmationModal } from './components/BulkConfirmationModal';
import { RecruiterSpace } from './components/RecruiterSpace';

const App: React.FC = () => {
  // State for candidate flow
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [applications, setApplications] = useState<Application[]>([]);
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appToConfirm, setAppToConfirm] = useState<Application | null>(null);
  const [isBulkConfirming, setIsBulkConfirming] = useState(false);
  const [appsToBulkConfirm, setAppsToBulkConfirm] = useState<Application[]>([]);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);

  // State for app mode
  const [mode, setMode] = useState<'candidate' | 'recruiter'>('candidate');

  const handleAnalysis = useCallback(async (cvInput: CvInput, searchOptions: SearchOptions) => {
    let currentStep: LoadingState = 'parsing';
    setLoadingState('parsing');
    setError(null);
    setApplications([]);
    setCvData(null);
    setGroundingChunks([]);

    try {
      let extractedCvData: CvData;

      if (cvInput.type === 'text' && cvInput.content) {
        extractedCvData = await geminiService.extractCvInfo(cvInput.content);
      } else if (cvInput.type === 'linkedin' && cvInput.url) {
        extractedCvData = await geminiService.createCvFromLinkedIn(cvInput.url);
      } else if (cvInput.type === 'manual' && cvInput.data) {
        extractedCvData = cvInput.data;
      } else {
        throw new Error("Invalid CV input provided.");
      }
      
      setCvData(extractedCvData);
      
      currentStep = 'findingJobs';
      setLoadingState('findingJobs');
      
      const { jobs: foundJobs, groundingChunks: foundChunks } = await geminiService.findJobs(
        extractedCvData.skills, 
        searchOptions.location,
        searchOptions.contractTypes,
        searchOptions.datePosted
      );
      
      setGroundingChunks(foundChunks || []);

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
      setError(`Failed during step ${currentStep}. ${errorMessage}`);
      setLoadingState('error');
    }
  }, []);

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
    if (!appToApply) return;

    window.open(appToApply.job.url, '_blank', 'noopener,noreferrer');
    
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'AwaitingConfirmation' } : app));
    setAppToConfirm(appToApply);
  }, [applications]);

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
     
     const applicableApps = selectedApplications.filter(
       app => app.status === 'LetterGenerated'
     );

     if (applicableApps.length === 0) return;
     
     setAppsToBulkConfirm(applicableApps);

     applicableApps.forEach(app => {
        window.open(app.job.url, '_blank', 'noopener,noreferrer');
     });
     
     const applicableAppIds = new Set(applicableApps.map(app => app.id));

     setApplications(prev => prev.map(app => 
      applicableAppIds.has(app.id) ? { ...app, status: 'AwaitingConfirmation' } : app
     ));

     setIsBulkConfirming(true);
  }, [selectedApplications, cvData]);

  const handleConfirmBulkSent = useCallback(() => {
    setApplications(prev => prev.map(app => app.status === 'AwaitingConfirmation' ? { ...app, status: 'Sent', isSelected: false } : app));
    setIsBulkConfirming(false);
    setAppsToBulkConfirm([]);
  }, []);
  
  const handleCancelBulkConfirmation = useCallback(() => {
     setApplications(prev => prev.map(app => app.status === 'AwaitingConfirmation' ? { ...app, status: 'LetterGenerated' } : app));
     setIsBulkConfirming(false);
     setAppsToBulkConfirm([]);
  }, []);

  const reset = () => {
    setLoadingState('idle');
    setApplications([]);
    setCvData(null);
    setError(null);
    setGroundingChunks([]);
  };

  const renderCandidateSpace = () => (
    <>
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
          groundingChunks={groundingChunks}
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
          applications={appsToBulkConfirm}
          onConfirm={handleConfirmBulkSent}
          onCancel={handleCancelBulkConfirmation}
         />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header mode={mode} onModeChange={setMode} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
        {mode === 'candidate' ? renderCandidateSpace() : <RecruiterSpace />}
      </main>
    </div>
  );
};

export default App;
