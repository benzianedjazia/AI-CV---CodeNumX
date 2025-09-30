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

export interface Job {
  title: string;
  company: string;
  location: string;
  description: string;
  source: string; // e.g., "LinkedIn", "Indeed", "Company Website"
  url: string;    // The direct URL to the job posting
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