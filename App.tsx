import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ResultsDashboard } from './components/ResultsDashboard';
import { geminiService } from './services/geminiService';
import type { Application, CvData, LoadingState, CareerTrajectoryAnalysis, JobFitAnalysis, CvInput, SearchOptions } from './types';
import { ConfirmationModal } from './components/ConfirmationModal';
import { BulkConfirmationModal } from './components/BulkConfirmationModal';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { useAuth } from './hooks/useAuth';
import { InterviewCoachModal } from './components/InterviewCoachModal';
import { useTranslations } from './hooks/useTranslations';
import { CareerTrajectoryModal } from './components/CareerTrajectoryModal';
import { JobFitAnalysisModal } from './components/JobFitAnalysisModal';
import { ApplicationMessageModal } from './components/ApplicationMessageModal';
import { RecruiterSpace } from './components/RecruiterSpace';
import { CvRewriterModal } from './components/CvRewriterModal';

type FitAnalysisState = Record<string, { status: 'idle' | 'loading' | 'done' | 'error'; data?: JobFitAnalysis }>;

const App: React.FC = () => {
  const { language } = useTranslations();
   
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Auth and page state
  const { user, login, signup, logout, isAuthenticated, socialLogin } = useAuth();
  const [page, setPage] = useState<'home' | 'login' | 'signup'>('home');

  // App mode state
  const [mode, setMode] = useState<'candidate' | 'recruiter'>('candidate');

  // State for candidate flow
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [applications, setApplications] = useState<Application[]>([]);
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appToConfirm, setAppToConfirm] = useState<Application | null>(null);
  const [isBulkConfirming, setIsBulkConfirming] = useState(false);
  const [appsToBulkConfirm, setAppsToBulkConfirm] = useState<Application[]>([]);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [appForInterview, setAppForInterview] = useState<Application | null>(null);

  // State for new Career Trajectory feature
  const [isAnalyzingTrajectory, setIsAnalyzingTrajectory] = useState(false);
  const [trajectoryAnalysis, setTrajectoryAnalysis] = useState<CareerTrajectoryAnalysis | null>(null);

  // State for new Job Fit Analysis feature
  const [fitAnalyses, setFitAnalyses] = useState<FitAnalysisState>({});
  const [appForFitAnalysis, setAppForFitAnalysis] = useState<Application | null>(null);

  // State for new Application Message feature
  const [appForMessage, setAppForMessage] = useState<Application | null>(null);

  // State for new CV Rewriter feature
  const [isCvRewriterOpen, setIsCvRewriterOpen] = useState(false);
  
  const handleLogout = () => {
      logout();
      setPage('home');
      // Reset app state
      setLoadingState('idle');
      setApplications([]);
      setCvData(null);
      setError(null);
      setMode('candidate');
  }

  const handleAnalysis = useCallback(async (cvInput: CvInput, searchOptions: SearchOptions) => {
    let currentStep: LoadingState = 'parsing';
    setLoadingState('parsing');
    setError(null);
    setApplications([]);
    setCvData(null);
    setGroundingChunks([]);
    setFitAnalyses({});

    try {
      // For all cases, we first need the structured CV data for the UI and other features.
      const extractedCvData = await geminiService.parseCvInput(cvInput);
      setCvData(extractedCvData);
      
      currentStep = 'findingJobs';
      setLoadingState('findingJobs');
      
      let jobSearchPromise;

      // For PDF/pasted text, use the new, more robust method that analyzes the full CV text.
      if (cvInput.type === 'text' && cvInput.content) {
          jobSearchPromise = geminiService.findJobsFromCvText(
              cvInput.content, 
              searchOptions.country,
              searchOptions.cities,
              searchOptions.contractTypes,
              searchOptions.datePosted
          );
      } else {
          // Fallback to the original method for LinkedIn and Manual inputs, which are already structured.
          jobSearchPromise = geminiService.findJobs(
              extractedCvData.skills, 
              searchOptions.country,
              searchOptions.cities,
              searchOptions.contractTypes,
              searchOptions.datePosted
          );
      }

      const { jobs: foundJobs, groundingChunks: foundChunks } = await jobSearchPromise;
      
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
      const coverLetter = await geminiService.generateCoverLetter(cvData, appToUpdate.job, language);
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'LetterGenerated', coverLetter } : app));
    } catch (err) {
      console.error(err);
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: 'Error' } : app));
    }
  }, [cvData, applications, language]);

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

  const handleStartInterview = useCallback((appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (app) {
      setAppForInterview(app);
    }
  }, [applications]);

  const handleCloseInterview = () => {
    setAppForInterview(null);
  };
  
  const handleAnalyzeTrajectory = useCallback(async () => {
    if (!cvData) return;
    setIsAnalyzingTrajectory(true);
    setTrajectoryAnalysis(null);
    try {
      const analysis = await geminiService.analyzeCareerTrajectory(cvData, language);
      setTrajectoryAnalysis(analysis);
    } catch (err) {
        console.error("Failed to analyze career trajectory", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred during trajectory analysis.");
    } finally {
        setIsAnalyzingTrajectory(false);
    }
  }, [cvData, language]);

  const handleAnalyzeFit = useCallback(async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app || !cvData) return;

    setFitAnalyses(prev => ({ ...prev, [appId]: { status: 'loading' } }));

    try {
        const analysis = await geminiService.analyzeJobFit(cvData, app.job, language);
        setFitAnalyses(prev => ({ ...prev, [appId]: { status: 'done', data: analysis } }));
    } catch (err) {
        console.error("Failed to analyze job fit", err);
        setFitAnalyses(prev => ({ ...prev, [appId]: { status: 'error' } }));
    }
  }, [applications, cvData, language]);

  const handleOpenFitAnalysis = (appId: string) => {
      const app = applications.find(a => a.id === appId);
      if(app && fitAnalyses[appId]?.status === 'done') {
        setAppForFitAnalysis(app);
      }
  };

  const handleOpenMessageModal = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (app) {
        setAppForMessage(app);
    }
  };

  const handleRewriteComplete = useCallback((newCvData: CvData) => {
    setCvData(newCvData);
    setIsCvRewriterOpen(false);
  }, []);


  const reset = () => {
    setLoadingState('idle');
    setApplications([]);
    setCvData(null);
    setError(null);
    setGroundingChunks([]);
    setFitAnalyses({});
  };

  const { t } = useTranslations();

  const renderAppContent = () => {
    if (!isAuthenticated) {
      switch (page) {
        case 'login':
          return <LoginPage onLogin={login} onNavigate={setPage} onSocialLogin={socialLogin} />;
        case 'signup':
          return <SignUpPage onSignUp={signup} onNavigate={setPage} onSocialLogin={socialLogin} />;
        case 'home':
        default:
          return <HomePage onNavigate={setPage} />;
      }
    }
    
    const renderCandidateSpace = () => (
      <>
        {loadingState === 'idle' && <Hero onAnalyze={handleAnalysis} />}
        {(loadingState === 'parsing' || loadingState === 'findingJobs') && (
          <LoadingIndicator state={loadingState} />
        )}
        {loadingState === 'error' && (
          <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg relative w-full max-w-2xl">
            <strong className="font-bold">{t('app.errorTitle')}</strong>
            <p>{error}</p>
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              {t('app.retryButton')}
            </button>
          </div>
        )}
        {loadingState === 'results' && cvData && (
          <ResultsDashboard 
            applications={applications} 
            cvData={cvData}
            onGenerateLetter={handleGenerateLetter}
            onApply={handleApply}
            onReset={reset}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onBulkGenerate={handleBulkGenerate}
            onBulkApply={handleBulkApply}
            groundingChunks={groundingChunks}
            onStartInterview={handleStartInterview}
            onAnalyzeTrajectory={handleAnalyzeTrajectory}
            isAnalyzingTrajectory={isAnalyzingTrajectory}
            fitAnalyses={fitAnalyses}
            onAnalyzeFit={handleAnalyzeFit}
            onOpenFitAnalysis={handleOpenFitAnalysis}
            onOpenMessageModal={handleOpenMessageModal}
            onOpenCvRewriter={() => setIsCvRewriterOpen(true)}
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
        {appForInterview && cvData && (
            <InterviewCoachModal
                application={appForInterview}
                cvData={cvData}
                onClose={handleCloseInterview}
            />
        )}
        {trajectoryAnalysis && (
            <CareerTrajectoryModal
                analysisData={trajectoryAnalysis}
                onClose={() => setTrajectoryAnalysis(null)}
            />
        )}
         {appForFitAnalysis && fitAnalyses[appForFitAnalysis.id]?.data && (
            <JobFitAnalysisModal
                application={appForFitAnalysis}
                analysis={fitAnalyses[appForFitAnalysis.id].data!}
                onClose={() => setAppForFitAnalysis(null)}
            />
        )}
        {appForMessage && cvData && (
            <ApplicationMessageModal
                application={appForMessage}
                cvData={cvData}
                onClose={() => setAppForMessage(null)}
            />
        )}
        {isCvRewriterOpen && cvData && (
            <CvRewriterModal
                cvData={cvData}
                onClose={() => setIsCvRewriterOpen(false)}
                onRewriteComplete={handleRewriteComplete}
            />
        )}
      </>
    );

    return (
      <>
        <Header 
            userEmail={user?.email || null} 
            onLogout={handleLogout}
            mode={mode}
            onModeChange={setMode}
        />
        <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center w-full">
          {mode === 'candidate' ? renderCandidateSpace() : <RecruiterSpace />}
        </main>
      </>
    );
  };
  
  const mainContainerClass = !isAuthenticated
    ? "flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center justify-center"
    : "";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {isAuthenticated ? (
         renderAppContent()
      ) : (
        <main className={mainContainerClass}>
            {renderAppContent()}
        </main>
      )}
    </div>
  );
};

export default App;