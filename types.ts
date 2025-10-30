export interface CvData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
  };
  linkedin?: string;
  summary?: string;
  skills: string[];
  experience: {
    jobTitle: string;
    company: string;
    duration: string;
    responsibilities: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    duration: string;
  }[];
}

export type CvInput = 
  | { type: 'text'; content: string }
  | { type: 'linkedin'; url: string }
  | { type: 'manual'; data: CvData };

export interface SearchOptions {
  country: string;
  cities: string[];
  contractTypes: string[];
  datePosted: string;
}

export interface Job {
  title: string;
  company: string;
  location: string;
  description: string;
  source: string; // e.g., "LinkedIn", "Indeed", "Company Website"
  url: string;    // The direct URL to the job posting
  datePosted?: string; // e.g., "Posted 2 days ago"
  companyWebsite?: string; // e.g., "https://www.company.com"
  hiringEmail?: string; // e.g., "careers@company.com"
  address?: string; // e.g., "123 Rue de la République, 75001 Paris, France"
  phone?: string;
}

export interface Application {
  id: string;
  job: Job;
  coverLetter?: string;
  status: 'Ready' | 'GeneratingLetter' | 'LetterGenerated' | 'AwaitingConfirmation' | 'Sent' | 'Error';
  isSelected: boolean;
}

export type LoadingState = 'idle' | 'parsing' | 'findingJobs' | 'results' | 'error';

export interface Candidate {
  id: string;
  name: string;
  jobTitle: string;
  photoUrl?: string;
  phone?: string;
  linkedinUrl: string;
  source: string;
}

export interface CompanyEmployee {
  name: string;
  title: string;
  linkedinUrl: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  description: string;
  address?: string;
  phone?: string;
  website?: string;
  employees: CompanyEmployee[];
}


export interface CareerPath {
  title: string;
  description: string;
  requiredSkills: string[];
}

export interface TrainingRecommendation {
    area: string;
    recommendation: string;
}

export interface CareerTrajectoryAnalysis {
  synthesis: string;
  strengths: string[];
  improvements: string[];
  careerPaths: CareerPath[];
  recommendedTraining: TrainingRecommendation[];
}

export interface JobFitAnalysis {
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  cvImprovements: string[];
}