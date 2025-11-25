import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Application, CvData, JobFitAnalysis, Company, CompanyEmployee } from '../types';
import { ApplicationCard } from './ApplicationCard';
import { CoverLetterModal } from './CoverLetterModal';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { useTranslations } from '../hooks/useTranslations';
import { SparklesIcon } from './icons/SparklesIcon';
import { LocationFilter } from './LocationFilter';
import { CompanyCard } from './CompanyCard';
import { geminiService } from '../services/geminiService';
import { SpontaneousApplicationModal } from './SpontaneousApplicationModal';
import { PencilSquareIcon } from './icons/PencilSquareIcon';

interface ResultsDashboardProps {
  applications: Application[];
  cvData: CvData;
  onGenerateLetter: (id: string) => void;
  onApply: (id: string) => void;
  onReset: () => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onBulkGenerate: () => void;
  onBulkApply: () => void;
  groundingChunks: any[];
  onStartInterview: (id: string) => void;
  onAnalyzeTrajectory: () => void;
  isAnalyzingTrajectory: boolean;
  fitAnalyses: Record<string, { status: 'idle' | 'loading' | 'done' | 'error'; data?: JobFitAnalysis }>;
  onAnalyzeFit: (id: string) => void;
  onOpenFitAnalysis: (id: string) => void;
  onOpenMessageModal: (id: string) => void;
  onOpenCvRewriter: () => void;
}

const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-lg font-medium rounded-t-lg border-b-2 ${
                isActive
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
            {children}
        </button>
    )
}

const RecruiterLoadingIndicator: React.FC<{ title: string, description: string }> = ({ title, description }) => (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-2xl space-y-6 w-full max-w-md mt-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        <p className="text-xl font-semibold text-gray-700">{title}</p>
        <p className="text-sm text-gray-500 text-center">{description}</p>
    </div>
);


export const ResultsDashboard: React.FC<ResultsDashboardProps> = (props) => {
  const { 
    applications, 
    cvData,
    onGenerateLetter, 
    onApply, 
    onReset,
    onToggleSelect,
    onToggleSelectAll,
    onBulkGenerate,
    onBulkApply,
    groundingChunks,
    onStartInterview,
    onAnalyzeTrajectory,
    isAnalyzingTrajectory,
    fitAnalyses,
    onAnalyzeFit,
    onOpenFitAnalysis,
    onOpenMessageModal,
    onOpenCvRewriter,
  } = props;
  
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState<'jobs' | 'companies'>('jobs');

  // State for Company Finder
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isFindingCompanies, setIsFindingCompanies] = useState(false);
  const [companySearchError, setCompanySearchError] = useState<string | null>(null);
  const [companySearchDomain, setCompanySearchDomain] = useState('');
  const [companyLocation, setCompanyLocation] = useState({ country: '', cities: [] });
  const [companiesSearched, setCompaniesSearched] = useState(false);
  const [messageTarget, setMessageTarget] = useState<{company: Company, employee: CompanyEmployee} | null>(null);

  useEffect(() => {
    if (cvData?.skills) {
        setCompanySearchDomain(cvData.skills.join(', '));
    }
  }, [cvData]);

  const handleLocationChange = useCallback((newLocation: { country: string; cities: string[] }) => {
    setCompanyLocation(newLocation);
  }, []);

  const handleFindCompanies = useCallback(async () => {
    if (!companySearchDomain.trim()) {
        setCompanySearchError(t('results.companyFinder.errorDomain'));
        return;
    }
    if (!companyLocation.country) {
        setCompanySearchError(t('hero.errorCountry'));
        return;
    }

    setIsFindingCompanies(true);
    setCompaniesSearched(true);
    setCompanySearchError(null);
    setCompanies([]);

    try {
        const foundCompanies = await geminiService.findCompanies(companySearchDomain, companyLocation.country, companyLocation.cities);
        const companiesWithIds = foundCompanies.map(c => ({
            ...c,
            id: `${c.name}-${Math.random()}`.replace(/\s/g, ''),
        }));
        setCompanies(companiesWithIds);
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : t('app.errorTitle');
        setCompanySearchError(errorMessage);
    } finally {
        setIsFindingCompanies(false);
    }
  }, [companySearchDomain, companyLocation, t]);

  const selectedCount = useMemo(() => applications.filter(app => app.isSelected).length, [applications]);
  const areAllSelected = useMemo(() => applications.length > 0 && selectedCount === applications.length, [applications, selectedCount]);

  const viewCoverLetter = (app: Application) => {
    if(app.coverLetter) {
      setSelectedApplication(app);
    }
  };

  const closeModal = () => {
    setSelectedApplication(null);
  };
  
  const renderJobOffers = () => (
    <>
       {groundingChunks && groundingChunks.length > 0 && (
        <div className="mb-4 p-4 bg-slate-200/50 rounded-lg border border-slate-300">
          <h4 className="font-semibold text-gray-700 mb-2 text-sm">{t('results.sourcesTitle')}</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {groundingChunks.map((chunk, index) => (
              chunk.web && (
                <li key={index}>
                  <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    {chunk.web.title || chunk.web.uri}
                  </a>
                </li>
              )
            ))}
          </ul>
        </div>
      )}

      {selectedCount > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedCount}
          areAllSelected={areAllSelected}
          onToggleSelectAll={onToggleSelectAll}
          onBulkGenerate={onBulkGenerate}
          onBulkApply={onBulkApply}
          applications={applications.filter(app => app.isSelected)}
        />
      )}
      
      <div className="space-y-4">
        {applications.length > 0 ? (
          applications.map(app => (
            <ApplicationCard
              key={app.id}
              application={app}
              onViewCoverLetter={() => viewCoverLetter(app)}
              onGenerateLetter={() => onGenerateLetter(app.id)}
              onApply={() => onApply(app.id)}
              onToggleSelect={() => onToggleSelect(app.id)}
              onStartInterview={() => onStartInterview(app.id)}
              fitAnalysis={fitAnalyses[app.id]}
              onAnalyzeFit={() => onAnalyzeFit(app.id)}
              onOpenFitAnalysis={() => onOpenFitAnalysis(app.id)}
              onOpenMessageModal={() => onOpenMessageModal(app.id)}
            />
          ))
        ) : (
          <div className="text-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700">{t('results.noJobsFoundTitle')}</h3>
            <p className="mt-2 text-gray-500">{t('results.noJobsFoundDescription')}</p>
          </div>
        )}
      </div>
    </>
  );
  
  const renderCompanyProspecting = () => (
    <div className="animate-fade-in">
        <div className="w-full bg-white p-6 rounded-lg shadow-lg text-left space-y-4">
            <p className="text-gray-600">{t('results.companyFinder.subtitle')}</p>
            <div>
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                    {t('results.companyFinder.domainLabel')}
                </label>
                <input
                    id="domain"
                    type="text"
                    value={companySearchDomain}
                    onChange={(e) => setCompanySearchDomain(e.target.value)}
                    className="mt-1 w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder={t('results.companyFinder.domainPlaceholder')}
                    disabled={isFindingCompanies}
                />
            </div>
             
            <LocationFilter
                country={companyLocation.country}
                cities={companyLocation.cities}
                onChange={handleLocationChange}
                onError={setCompanySearchError}
            />

            {companySearchError && <p className="text-red-500 text-sm">{companySearchError}</p>}
            <button
                onClick={handleFindCompanies}
                disabled={isFindingCompanies}
                className="w-full py-3 px-6 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-transform disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
                {isFindingCompanies ? t('results.companyFinder.searchButtonLoading') : t('results.companyFinder.searchButton')}
            </button>
        </div>

        <div className="mt-8 w-full">
            {isFindingCompanies && <RecruiterLoadingIndicator title={t('results.companyFinder.loadingTitle')} description={t('results.companyFinder.loadingDescription')} />}

            {!isFindingCompanies && companies.length > 0 && (
                <div className="space-y-4">
                     <h3 className="text-2xl font-bold text-gray-800">{t('results.companyFinder.resultsTitle')}</h3>
                    {companies.map(company => (
                        <CompanyCard 
                            key={company.id} 
                            company={company} 
                            cvDataExists={!!cvData}
                            onGenerateMessage={(employee) => setMessageTarget({ company, employee })}
                        />
                    ))}
                </div>
            )}

            {!isFindingCompanies && companies.length === 0 && companiesSearched && !companySearchError && (
                 <div className="text-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-700">{t('results.companyFinder.noCompaniesTitle')}</h3>
                    <p className="mt-2 text-gray-500">{t('results.companyFinder.noCompaniesDescription')}</p>
                 </div>
            )}
             {companySearchError && !isFindingCompanies && (
                <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg relative w-full">
                    <strong className="font-bold">{t('app.errorTitle')}</strong>
                    <p>{companySearchError}</p>
                </div>
            )}
         </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">{t('results.title')}</h2>
        <div className="flex items-center gap-2">
            <button
              onClick={onOpenCvRewriter}
              className="px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-md hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
            >
                <PencilSquareIcon className="h-5 w-5"/>
                {t('cvRewriter.button')}
            </button>
            <button
              onClick={onAnalyzeTrajectory}
              disabled={isAnalyzingTrajectory}
              className="px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md disabled:from-purple-400 disabled:to-indigo-400 disabled:cursor-wait"
            >
              <SparklesIcon className="h-5 w-5"/>
              {isAnalyzingTrajectory ? t('results.analyzingCareer') : t('results.getCareerAnalysis')}
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              {t('results.newSearch')}
            </button>
        </div>
      </div>
      
       <div className="border-b border-gray-200 w-full">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <TabButton isActive={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')}>
                    {t('results.tabs.jobs')}
                </TabButton>
                <TabButton isActive={activeTab === 'companies'} onClick={() => setActiveTab('companies')}>
                    {t('results.tabs.companies')}
                </TabButton>
            </nav>
        </div>

      <div className="mt-6">
        {activeTab === 'jobs' ? renderJobOffers() : renderCompanyProspecting()}
      </div>


      {selectedApplication && (
        <CoverLetterModal
          application={selectedApplication}
          onClose={closeModal}
        />
      )}
      {messageTarget && cvData && (
        <SpontaneousApplicationModal
            cvData={cvData}
            company={messageTarget.company}
            contact={messageTarget.employee}
            onClose={() => setMessageTarget(null)}
        />
      )}
    </div>
  );
};