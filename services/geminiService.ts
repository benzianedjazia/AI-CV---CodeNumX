import { GoogleGenAI, Type } from "@google/genai";
import type { CvData, Job } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cvSchema = {
  type: Type.OBJECT,
  properties: {
    personalInfo: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
      },
      required: ["name", "email", "phone"],
      description: "Les informations personnelles du candidat."
    },
    linkedin: {
      type: Type.STRING,
      description: "URL du profil LinkedIn du candidat, si disponible."
    },
    summary: {
        type: Type.STRING,
        description: "Un résumé professionnel de 2-4 phrases."
    },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Liste des compétences techniques et non techniques clés."
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          jobTitle: { type: Type.STRING },
          company: { type: Type.STRING },
          duration: { type: Type.STRING },
          responsibilities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Liste à puces des responsabilités et réalisations."
          }
        },
        required: ["jobTitle", "company", "duration", "responsibilities"]
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          duration: { type: Type.STRING }
        },
        required: ["degree", "institution", "duration"]
      }
    }
  },
  required: ["personalInfo", "skills", "experience", "education"]
};

const jobsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            company: { type: Type.STRING, description: "Un nom d'entreprise fictif mais plausible." },
            location: { type: Type.STRING },
            description: { type: Type.STRING, description: "Une brève description du poste en 2-3 phrases." },
            source: { type: Type.STRING, description: "Le nom du site où l'offre a été trouvée (ex: LinkedIn, Indeed, Site Carrière)." },
            url: { type: Type.STRING, description: "Une URL fictive mais valide vers l'offre d'emploi." },
            hiringEmail: { type: Type.STRING, description: "Une adresse e-mail de recrutement fictive mais plausible (ex: careers@company.com)." },
            address: { type: Type.STRING, description: "Une adresse civique fictive mais plausible pour l'entreprise." },
            phone: { type: Type.STRING, description: "Un numéro de téléphone fictif mais plausible pour l'entreprise." }
        },
        required: ["title", "company", "location", "description", "source", "url"]
    }
};

async function extractCvInfo(cvText: string): Promise<CvData> {
  const prompt = `Analysez le texte de CV suivant et extrayez les informations personnelles (nom, email, téléphone), l'URL LinkedIn (si présente), un résumé, les compétences clés, l'expérience professionnelle et la formation. Retournez le résultat sous forme d'objet JSON.\n\nCV:\n${cvText}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: cvSchema,
    }
  });

  const jsonText = response.text.trim();
  try {
    return JSON.parse(jsonText) as CvData;
  } catch (e) {
    console.error("Failed to parse CV JSON:", jsonText);
    throw new Error("The AI returned an invalid format for CV data.");
  }
}

async function createCvFromLinkedIn(linkedinUrl: string): Promise<CvData> {
    const prompt = `En vous basant sur l'URL de profil LinkedIn suivante, générez un CV détaillé et plausible au format JSON. Le CV doit être bien structuré avec des informations personnelles, un résumé, des compétences, plusieurs expériences professionnelles avec des responsabilités et une formation. Les données doivent être réalistes et d'aspect professionnel. Assurez-vous d'inventer des détails crédibles si le profil est générique.\n\nURL: ${linkedinUrl}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: cvSchema,
        }
    });

    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as CvData;
    } catch (e) {
        console.error("Failed to parse LinkedIn CV JSON:", jsonText);
        throw new Error("The AI returned an invalid format for LinkedIn CV data.");
    }
}


async function findJobs(skills: string[], location: string, contractTypes: string[], datePosted: string): Promise<Job[]> {
  const contractPrompt = contractTypes.length > 0 ? `pour les types de contrat suivants : [${contractTypes.join(', ')}]` : '';
  const datePrompt = datePosted === 'month' ? `publiées il y a moins d'un mois` : '';

  const prompt = `Basé sur les compétences suivantes: [${skills.join(', ')}], la localisation '${location}' ${contractPrompt}, générez une liste de 15 offres d'emploi appropriées ${datePrompt}. Pour chaque emploi, fournissez un titre, un nom d'entreprise, une localisation, une brève description, la source (ex: LinkedIn, Indeed), une URL fictive valide, une adresse e-mail de recrutement fictive, une adresse civique fictive et un numéro de téléphone fictif pour l'entreprise. Retournez le résultat sous forme de tableau JSON.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: jobsSchema,
    }
  });

  const jsonText = response.text.trim();
  try {
    return JSON.parse(jsonText) as Job[];
  } catch (e) {
    console.error("Failed to parse Jobs JSON:", jsonText);
    throw new Error("The AI returned an invalid format for job data.");
  }
}

async function generateCoverLetter(cvData: CvData, job: Job): Promise<string> {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const prompt = `Vous êtes un coach de carrière expert. Rédigez une lettre de motivation complète et percutante.

**Instructions :**
1.  Structurez la lettre avec un en-tête professionnel :
    - D'abord, les informations du candidat : Nom complet, Email, Téléphone, et URL LinkedIn (si fournie). Chaque information sur une nouvelle ligne.
    - Ensuite, aligné à droite, la date du jour.
    - Puis, les informations du destinataire : Nom de l'entreprise, et l'adresse de l'entreprise (si fournie). Chaque information sur une nouvelle ligne.
2.  Adressez la lettre de manière professionnelle (ex: "Madame, Monsieur,").
3.  Le corps de la lettre doit être personnalisé pour l'offre d'emploi, en mettant en évidence les compétences et expériences les plus pertinentes du CV.
4.  Terminez par une formule de politesse professionnelle (ex: "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.") et le nom complet du candidat.
5.  Le ton doit être enthousiaste et confiant.
6.  Ne laissez AUCUN placeholder (ex: '[Votre Nom]'). La lettre doit être prête à être envoyée.

**Date du jour:**
${currentDate}

**Détails du CV du candidat:**
${JSON.stringify(cvData, null, 2)}

**Offre d'emploi:**
Titre: ${job.title}
Entreprise: ${job.company}
Adresse de l'entreprise: ${job.address || "Non spécifiée"}
Description: ${job.description}

Générez uniquement le texte de la lettre de motivation.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  
  return response.text;
}

export const geminiService = {
  extractCvInfo,
  createCvFromLinkedIn,
  findJobs,
  generateCoverLetter,
};
