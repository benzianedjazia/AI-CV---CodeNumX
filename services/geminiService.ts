import { GoogleGenAI, Type } from "@google/genai";
import type { CvData, Job, Candidate, CareerTrajectoryAnalysis, JobFitAnalysis, Company, CompanyEmployee, CvInput } from '../types';

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

  const jsonText = (response.text || '').trim();
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

    const jsonText = (response.text || '').trim();
    try {
        return JSON.parse(jsonText) as CvData;
    } catch (e) {
        console.error("Failed to parse LinkedIn CV JSON:", jsonText);
        throw new Error("The AI returned an invalid format for LinkedIn CV data.");
    }
}

async function parseCvInput(cvInput: CvInput): Promise<CvData> {
    if (cvInput.type === 'text' && cvInput.content) {
        return await extractCvInfo(cvInput.content);
    } else if (cvInput.type === 'linkedin' && cvInput.url) {
        return await createCvFromLinkedIn(cvInput.url);
    } else if (cvInput.type === 'manual' && cvInput.data) {
        return cvInput.data;
    } else {
        throw new Error("Invalid CV input provided.");
    }
}


async function findJobs(skills: string[], country: string, cities: string[], contractTypes: string[], datePosted: string): Promise<{ jobs: Job[], groundingChunks: any[] }> {
  
  let specificInstructions = `Ta mission est de fournir une liste de résultats aussi riche et pertinente que possible, en visant **un minimum de 20 offres d'emploi, et jusqu'à 30 si possible**. Sois exhaustif dans ta recherche.`;

  if (contractTypes.some(ct => ['Freelance', 'Sous-traitance'].includes(ct))) {
    specificInstructions += `\n**Attention particulière pour les freelances/sous-traitants :** Cherche activement des "missions", "projets", ou des postes de "consultant". Explore les plateformes spécialisées pour freelances (comme Malt, Freelance-info, etc.) en plus des sites d'emploi traditionnels.`;
  }

  const dateFilterInstruction = datePosted === 'month' 
    ? "La recherche doit se concentrer **prioritairement et quasi exclusivement** sur les offres publiées il y a **moins d'un mois**. Les offres les plus récentes sont les plus importantes."
    : "La date de publication est **indifférente**. Tu dois retourner toutes les offres pertinentes, **même si elles sont anciennes** (par exemple, datant de plus d'un an ou deux). Ne filtre pas par date.";

  let locationQuery = `"${country}"`;
  if (cities.length > 0) {
      locationQuery = `"${cities.join(', ')} au pays ${country}"`;
  }

  const prompt = `En tant qu'expert en recrutement international, utilise la recherche Google pour trouver des offres d'emploi correspondant aux critères suivants. ${specificInstructions}

**Critères de recherche :**
- **Mots-clés / Compétences :** "${skills.join(', ')}"
- **Lieu :** ${locationQuery}
- **Type de contrat :** "${contractTypes.length > 0 ? contractTypes.join(', ') : 'Tous types'}"

**Instruction sur la date de publication :** ${dateFilterInstruction}

**Instructions pour la réponse :**
1.  **VALIDITÉ DES URLS - RÈGLE FONDAMENTALE ET NON NÉGOCIABLE :**
    *   Le champ \`url\` est le plus important. Il DOIT pointer **directement et uniquement** vers la page de l'offre d'emploi détaillée, là où le candidat peut lire les détails complets et postuler.
    *   **DISTINCTION CRITIQUE :** Le champ \`url\` NE DOIT PAS être le site web général de l'entreprise (ça, c'est pour le champ \`companyWebsite\`). Le champ \`url\` est pour l'offre, et l'offre seulement.
        *   **MAUVAIS EXEMPLE :** \`"url": "https://www.google.com/careers"\`
        *   **BON EXEMPLE :** \`"url": "https://www.google.com/careers/jobs/12345/software-engineer"\`
    *   **Auto-vérification OBLIGATOIRE :** Avant de fournir l'URL, tu dois te demander : "Est-ce que ce lien mène à une page unique pour UNE SEULE offre d'emploi ?". Si la réponse est non (si ça mène à une liste, une page d'accueil, une page "carrières" générale), le lien est **INCORRECT** et tu dois trouver le bon ou exclure l'offre.
    *   **ABSOLUMENT INTERDIT :** Les pages d'accueil, les pages "Carrières" listant plusieurs postes, les résultats de recherche. L'URL doit être spécifique et profonde.
    *   Le lien doit provenir directement des résultats de recherche Google. Ne devine ou ne construis JAMAIS une URL.

2.  **Format de sortie :** Retourne les résultats sous forme d'un tableau JSON. Chaque objet du tableau doit représenter une offre d'emploi.

3.  **Champs à extraire pour chaque offre :**
    *   \`title\`: Titre exact du poste.
    *   \`company\`: Nom de l'entreprise qui recrute.
    *   \`location\`: Ville.
    *   \`description\`: Description détaillée et complète du poste (missions, profil, compétences, avantages). Vise au moins 100 mots.
    *   \`source\`: Nom du site web source (ex: "LinkedIn", "Malt").
    *   \`url\`: L'URL directe et VÉRIFIÉE de l'offre, conformément à la règle n°1.
    *   \`datePosted\`: La date de publication de l'offre (ex: "il y a 2 jours", "le 15 juin 2024"). Cherche cette information sur la page de l'offre.
    *   \`phone\`: **Recherche active requise.** Le numéro de téléphone standard de l'entreprise.
    *   \`address\`: **Recherche active requise.** L'adresse physique complète du bureau ou de l'agence.
    *   \`companyWebsite\`: (Optionnel) URL du site de l'entreprise.
    *   \`hiringEmail\`: **Recherche active requise.** L'email de contact pour les candidatures.

4.  **MISSION CRITIQUE : Recherche approfondie des coordonnées (Email, Adresse, Téléphone)**
    *   Ta mission la plus importante, après la validité des URL, est de trouver **l'email de contact RH/recrutement**, le numéro de téléphone et l'adresse physique de chaque entreprise. C'est **non négociable**.
    *   **Stratégie de recherche OBLIGATOIRE en plusieurs étapes :**
        1.  **Analyse de l'annonce :** Cherche d'abord dans le texte de l'annonce.
        2.  **Recherche Google Ciblée :** Si l'annonce est incomplète, tu DOIS effectuer une nouvelle recherche Google avec des termes comme : \`"email recrutement [Nom de l'entreprise]"\`, \`"carrières [Nom de l'entreprise]"\`, ou \`"[Nom de l'entreprise] [Ville] téléphone adresse"\`.
        3.  **Exploration des sites web :** Consulte la page "Contact", "Carrières", "À propos" ou le pied de page du site officiel de l'entreprise pour trouver ces informations.
    *   **Objectif :** Remplir les champs \`hiringEmail\`, \`phone\` et \`address\` pour **chaque offre**. Ne les omets que si, et seulement si, après avoir suivi TOUTES ces étapes, l'information est absolument introuvable.
    *   L'invention d'informations est strictement interdite. La précision est capitale.

5.  **Cas sans résultat :** Si, après une recherche approfondie, aucune offre pertinente n'est trouvée, retourne un tableau JSON vide \`[]\`. N'invente pas d'offres.
6.  **Qualité avant tout :** Assure-toi que la sortie est un JSON valide et bien formaté, sans texte ou démarque de code (comme \`\`\`json) autour.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{googleSearch: {}}],
    }
  });

  let jsonText = (response.text || '').trim();
  try {
    // Handle potential markdown code blocks and preambles
    const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        jsonText = match[1];
    } else {
        const arrayStartIndex = jsonText.indexOf('[');
        if (arrayStartIndex !== -1) {
            const arrayEndIndex = jsonText.lastIndexOf(']');
            if (arrayEndIndex !== -1 && arrayEndIndex > arrayStartIndex) {
                jsonText = jsonText.substring(arrayStartIndex, arrayEndIndex + 1);
            }
        }
    }
    
    const jobs = JSON.parse(jsonText) as Job[];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { jobs, groundingChunks };
  } catch (e) {
    console.error("Failed to parse Jobs JSON:", response.text);
    throw new Error("The AI returned an invalid format for job data.");
  }
}

// FIX: Implement the missing `findCandidates` function.
async function findCandidates(jobDescription: string, country: string, cities: string[]): Promise<{ candidates: Omit<Candidate, 'id'>[], groundingChunks: any[] }> {
  let locationQuery = `"${country}"`;
  if (cities.length > 0) {
      locationQuery = `dans "${cities.join(', ')}, ${country}"`;
  }

  const prompt = `Tu es un recruteur expert en technologie utilisant la recherche Google pour trouver des candidats potentiels pour un poste. En te basant sur la description de poste et la localisation fournies, trouve une liste de 5 à 10 candidats appropriés.

**Description de poste :**
${jobDescription}

**Localisation :**
Les candidats doivent être localisés ${locationQuery}.

**Instructions pour la réponse :**
1.  **Priorise les profils professionnels publics :** Concentre-toi sur la recherche de candidats sur des plateformes comme LinkedIn.
2.  **Format de sortie :** Retourne le résultat sous la forme d'un tableau JSON d'objets de candidats.
3.  **Champs à extraire pour chaque candidat :**
    *   \`name\`: Nom complet du candidat.
    *   \`jobTitle\`: Titre de poste actuel ou le plus récent pertinent.
    *   \`photoUrl\`: (Optionnel) Une URL directe vers une photo d'aspect professionnel si disponible.
    *   \`phone\`: (Optionnel) Un numéro de téléphone public si disponible.
    *   \`linkedinUrl\`: **CRUCIAL :** L'URL publique directe et valide de leur profil LinkedIn. C'est obligatoire.
    *   \`source\`: Le nom du site web où l'information a été trouvée (ex: "LinkedIn").
4.  **Intégrité des données :** Toutes les informations doivent être accessibles au public. N'invente aucune donnée. L'URL \`linkedinUrl\` doit être un lien réel et fonctionnel vers le profil d'une personne.
5.  **Aucun résultat :** Si aucun candidat approprié n'est trouvé après une recherche approfondie, retourne un tableau JSON vide : \`[]\`.
6.  **Qualité de la sortie :** Assure-toi que la sortie est un tableau JSON valide et bien formaté, sans texte environnant ni démarque de code (comme \`\`\`json).`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{googleSearch: {}}],
    }
  });

  let jsonText = (response.text || '').trim();
  try {
    // Handle potential markdown code blocks and preambles
    const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        jsonText = match[1];
    } else {
        const arrayStartIndex = jsonText.indexOf('[');
        if (arrayStartIndex !== -1) {
            const arrayEndIndex = jsonText.lastIndexOf(']');
            if (arrayEndIndex !== -1 && arrayEndIndex > arrayStartIndex) {
                jsonText = jsonText.substring(arrayStartIndex, arrayEndIndex + 1);
            }
        }
    }
    
    const candidates = JSON.parse(jsonText) as Omit<Candidate, 'id'>[];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { candidates, groundingChunks };
  } catch (e) {
    console.error("Failed to parse Candidates JSON:", response.text);
    throw new Error("The AI returned an invalid format for candidate data.");
  }
}

async function generateCoverLetter(cvData: CvData, job: Job, language: string): Promise<string> {
  const dateLocale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'fr-FR';
  const currentDate = new Date().toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const prompt = `Vous êtes un coach de carrière expert. Rédigez une lettre de motivation complète et percutante dans la langue suivante : ${language}.

**Instructions :**
1.  Structurez la lettre avec un en-tête professionnel.
2.  Adressez la lettre de manière professionnelle.
3.  Le corps de la lettre doit être personnalisé pour l'offre d'emploi, en mettant en évidence les compétences et expériences les plus pertinentes du CV.
4.  Terminez par une formule de politesse professionnelle et le nom complet du candidat.
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

const careerAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    synthesis: { type: Type.STRING, description: "Un résumé concis et percutant du profil professionnel du candidat." },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste de 3 à 5 points forts clés détectés dans le CV." },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste de 2 à 3 axes d'amélioration constructifs et actionnables." },
    careerPaths: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Titre du poste ou de la trajectoire de carrière suggérée." },
          description: { type: Type.STRING, description: "Brève description de la trajectoire et pourquoi elle est pertinente." },
          requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Compétences clés à acquérir pour cette trajectoire." },
        },
        required: ["title", "description", "requiredSkills"],
      },
      description: "Liste de 2 à 3 trajectoires de carrière potentielles."
    },
    recommendedTraining: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                area: { type: Type.STRING, description: "Le domaine de compétence visé par la formation (ex: 'Cloud Computing', 'Gestion de projet')." },
                recommendation: { type: Type.STRING, description: "Une recommandation de formation ou de certification spécifique (ex: 'Certification AWS Certified Solutions Architect sur A Cloud Guru')." },
            },
            required: ["area", "recommendation"],
        },
        description: "Liste de recommandations de formations concrètes pour développer les compétences nécessaires."
    }
  },
  required: ["synthesis", "strengths", "improvements", "careerPaths", "recommendedTraining"],
};

async function analyzeCareerTrajectory(cvData: CvData, language: string): Promise<CareerTrajectoryAnalysis> {
    const prompt = `En tant que coach de carrière expert international, analyse en profondeur le CV suivant. Fournis une analyse stratégique complète et actionnable pour le candidat. La réponse doit être formulée dans la langue : ${language}.

**Données du CV :**
${JSON.stringify(cvData, null, 2)}

**Mission :**
Produis une analyse structurée au format JSON qui couvre les points suivants :
1.  **synthesis :** Un résumé percutant du profil actuel du candidat en 2-3 phrases.
2.  **strengths :** Identifie 3 à 5 points forts majeurs. Sois spécifique (ex: "Excellente maîtrise de React et de son écosystème" plutôt que "Bonnes compétences techniques").
3.  **improvements :** Suggère 2 à 3 axes d'amélioration concrets et pertinents pour le marché actuel (ex: "Obtenir une certification en sécurité web", "Développer des compétences en communication interpersonnelle pour évoluer vers un rôle de lead").
4.  **careerPaths :** Propose 2 ou 3 trajectoires de carrière logiques ou créatives. Pour chaque trajectoire, fournis un titre de poste, une brève description expliquant la pertinence, et les compétences clés à acquérir.
5.  **recommendedTraining :** Pour les axes d'amélioration et les trajectoires suggérées, recommande des formations ou certifications spécifiques et concrètes. Mentionne des plateformes connues si possible (Coursera, Udemy, certifications officielles, etc.).

La qualité de l'analyse doit être digne d'un consultant en carrière de haut niveau. Sois encourageant mais réaliste.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: careerAnalysisSchema,
        }
    });

    const jsonText = (response.text || '').trim();
    try {
        return JSON.parse(jsonText) as CareerTrajectoryAnalysis;
    } catch (e) {
        console.error("Failed to parse Career Trajectory JSON:", jsonText);
        throw new Error("The AI returned an invalid format for career trajectory data.");
    }
}

const jobFitAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    matchScore: { type: Type.NUMBER, description: "Un score de 0 à 100 représentant l'adéquation du CV avec l'offre." },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste de 3 à 4 points forts clés du candidat pour ce poste spécifique." },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste de 1 à 2 points faibles ou des manques du candidat pour ce poste." },
    cvImprovements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste de 2 à 3 suggestions concrètes pour améliorer le CV pour cette offre spécifique (ex: 'Mettre en avant le projet X qui utilise TypeScript')." },
  },
  required: ["matchScore", "strengths", "weaknesses", "cvImprovements"],
};

async function analyzeJobFit(cvData: CvData, job: Job, language: string): Promise<JobFitAnalysis> {
    const prompt = `En tant que coach de carrière et expert en recrutement, analyse l'adéquation entre le CV du candidat et l'offre d'emploi ci-dessous. Fournis une analyse concise et actionnable dans la langue : ${language}.

**CV du candidat :**
${JSON.stringify(cvData, null, 2)}

**Offre d'emploi :**
Titre : ${job.title}
Entreprise : ${job.company}
Description : ${job.description}

**Mission :**
Retourne un objet JSON avec les propriétés suivantes :
1.  **matchScore** : Un score de 0 à 100 estimant la compatibilité. Sois réaliste.
2.  **strengths** : Une liste de 3-4 points qui font du candidat un excellent profil pour ce poste.
3.  **weaknesses** : Une liste de 1-2 points où le candidat pourrait être moins pertinent ou manquer de compétences.
4.  **cvImprovements** : Une liste de 2-3 conseils concrets pour que le candidat adapte son CV afin de mieux correspondre à CETTE offre (ex: Mettre en avant une technologie, quantifier une réussite, etc.).`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: jobFitAnalysisSchema,
        }
    });

    const jsonText = (response.text || '').trim();
    try {
        return JSON.parse(jsonText) as JobFitAnalysis;
    } catch (e) {
        console.error("Failed to parse Job Fit Analysis JSON:", jsonText);
        throw new Error("The AI returned an invalid format for job fit analysis data.");
    }
}


async function generateApplicationMessage(cvData: CvData, job: Job, type: 'direct_site' | 'email_spontaneous', language: string): Promise<string> {
    const basePrompt = `Tu es un expert en communication professionnelle. Rédige un message court et percutant dans la langue : ${language}.

**CV du candidat :**
${JSON.stringify(cvData.summary, null, 2)}
${JSON.stringify(cvData.skills, null, 2)}

**Entreprise ciblée :** ${job.company}
**Poste ciblé :** ${job.title}
`;

    let specificInstruction = '';
    if (type === 'direct_site') {
        specificInstruction = `**Type de message :** Message pour un champ "Message au recruteur" sur un site d'emploi.
**Instructions :** Sois concis (3-4 phrases maximum), professionnel et engageant. Mets en évidence 1 ou 2 compétences clés du CV qui correspondent parfaitement au poste. Termine par un appel à l'action clair. Ne commence pas par "Bonjour", va droit au but.`;
    } else { // email_spontaneous
        specificInstruction = `**Type de message :** Email de candidature spontanée.
**Instructions :** Rédige un email court (2-3 paragraphes).
- **Objet :** Propose un objet d'email clair et attractif (ex: "Candidature spontanée - [Titre du poste visé]").
- **Introduction :** Exprime ton intérêt pour l'entreprise ${job.company}.
- **Corps :** Mets en avant comment tes compétences (mentionne 2-3 compétences clés du CV) peuvent bénéficier à l'entreprise, même en l'absence d'une offre spécifique.
- **Conclusion :** Propose un échange et termine par une formule de politesse professionnelle.
- **Format :** Inclus l'objet de l'email au début, séparé par "---".`;
    }

    const prompt = basePrompt + specificInstruction;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
  
    return response.text;
}

async function getCitiesForCountry(countryName: string, language: string): Promise<string[]> {
  const languageMap: Record<string, string> = {
    fr: 'français',
    en: 'anglais',
    ar: 'arabe'
  };
  const targetLanguage = languageMap[language] || 'français';

  const prompt = `Liste les 20 villes les plus importantes (en population ou importance économique) pour le pays suivant : "${countryName}".
Retourne le résultat sous la forme d'un tableau JSON de chaînes de caractères. Le tableau ne doit contenir que les noms des villes.
Trie les villes par ordre alphabétique.
La langue de sortie pour les noms de villes doit être en ${targetLanguage}.

Exemple de sortie pour "France":
[
  "Bordeaux",
  "Lille",
  "Lyon",
  "Marseille",
  "Montpellier",
  "Nantes",
  "Nice",
  "Paris",
  "Strasbourg",
  "Toulouse"
]
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Une liste de noms de villes."
      },
    }
  });

  const jsonText = (response.text || '').trim();
  try {
    const cities = JSON.parse(jsonText) as string[];
    return cities;
  } catch (e) {
    console.error(`Failed to parse cities JSON for ${countryName}:`, jsonText);
    throw new Error(`The AI returned an invalid format for city data for ${countryName}.`);
  }
}

async function findCompanies(domain: string, country: string, cities: string[]): Promise<Omit<Company, 'id'>[]> {
    let locationQuery = `"${country}"`;
    if (cities.length > 0) {
        locationQuery = `"${cities.join(', ')} in ${country}"`;
    }

    const prompt = `Tu es un expert en intelligence de marché spécialisé dans la cartographie d'entreprises et de talents. Ta mission est d'utiliser la recherche Google pour identifier les entreprises susceptibles de recruter pour des rôles spécifiques, même si elles n'ont pas d'offres d'emploi actives. Tu dois également trouver des contacts clés au sein de ces entreprises.

**Critères de recherche :**
- **Domaine/Compétences :** "${domain}"
- **Localisation :** ${locationQuery}

**Instructions :**
1.  **Identifier les entreprises :** Trouve 5 à 10 entreprises dans la localité spécifiée qui opèrent dans le domaine donné ou qui requièrent les compétences spécifiées. Donne la priorité aux entreprises qui montrent des signes de croissance (par exemple, financement récent, lancement de nouveaux produits, tendances de recrutement mentionnées dans l'actualité).
2.  **Collecter les données de l'entreprise :** Pour chaque entreprise, trouve les informations suivantes :
    *   \`name\`: Le nom officiel de l'entreprise.
    *   \`domain\`: Une courte description de leur secteur (ex: "FinTech", "SaaS basé sur l'IA", "Plateforme e-commerce").
    *   \`description\`: Un bref paragraphe décrivant ce que fait l'entreprise.
    *   \`address\`: L'adresse physique complète de leur bureau principal dans la localité spécifiée.
    *   \`phone\`: Le numéro de téléphone de contact général de l'entreprise.
    *   \`website\`: L'URL du site web principal de l'entreprise. Vérifie que c'est le site officiel et non une page sur un annuaire (ex: Pages Jaunes).
3.  **Trouver les employés clés :** Pour chaque entreprise, trouve 3 à 5 employés pertinents. Il doit s'agir de personnes qu'un chercheur d'emploi voudrait contacter, telles que :
    *   Responsables du recrutement
    *   Chefs d'équipe ou Directeurs de département (ex: "Directeur de l'Ingénierie", "CTO")
    *   Recruteurs ou personnel des RH.
4.  **Collecter les données des employés :** Pour chaque employé trouvé, extrais :
    *   \`name\`: Nom complet.
    *   \`title\`: Leur titre de poste actuel dans l'entreprise.
    *   \`linkedinUrl\`: L'URL directe et publique de leur profil LinkedIn. C'est crucial. Le format doit être \`https://www.linkedin.com/in/nom-prenom-identifiant\`. Ne retourne JAMAIS de lien de recherche. La validité de ce lien est primordiale.
5.  **Format de sortie :** Retourne les données sous la forme d'un unique tableau JSON valide d'objets d'entreprise. N'inclus aucun texte, explication ou démarque de code autour du JSON.
6.  **Intégrité des données :** Toutes les informations doivent être accessibles au public. N'invente aucune donnée. Si une information (comme un numéro de téléphone) ne peut être trouvée après une recherche approfondie, omets la clé pour ce champ. Cependant, \`linkedinUrl\` pour les employés est obligatoire. Si tu ne trouves pas d'employés pertinents sur LinkedIn, l'entreprise n'est peut-être pas un bon choix pour cette liste.
7.  **Aucun résultat :** Si aucune entreprise pertinente n'est trouvée, retourne un tableau JSON vide \`[]\`.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });

    let jsonText = (response.text || '').trim();
    try {
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonText = match[1];
        } else {
            const arrayStartIndex = jsonText.indexOf('[');
            if (arrayStartIndex !== -1) {
                const arrayEndIndex = jsonText.lastIndexOf(']');
                if (arrayEndIndex !== -1 && arrayEndIndex > arrayStartIndex) {
                    jsonText = jsonText.substring(arrayStartIndex, arrayEndIndex + 1);
                }
            }
        }

        const companies = JSON.parse(jsonText) as Omit<Company, 'id'>[];
        return companies;
    } catch (e) {
        console.error("Failed to parse Companies JSON:", response.text);
        throw new Error("L'IA a retourné un format invalide pour les données des entreprises.");
    }
}

async function generateSpontaneousApplicationMessage(cvData: CvData, company: Company, contact: CompanyEmployee, language: string): Promise<string> {
    const prompt = `Tu es un expert en communication professionnelle et en réseautage. Rédige un email de prise de contact pour une candidature spontanée. Le message doit être rédigé dans la langue : ${language}.

**Informations sur le candidat (extrait du CV) :**
- Nom: ${cvData.personalInfo.name}
- Résumé: ${cvData.summary || 'Professionnel expérimenté.'}
- Compétences clés: ${cvData.skills.slice(0, 5).join(', ')}

**Informations sur l'entreprise et le contact :**
- Nom de l'entreprise: ${company.name}
- Domaine de l'entreprise: ${company.domain}
- Nom du contact: ${contact.name}
- Titre du contact: ${contact.title}

**Instructions :**
1.  **Format :** Rédige un email complet avec un objet et un corps. Sépare l'objet du corps par "---".
2.  **Objet :** L'objet doit être professionnel, concis et attractif. Il doit mentionner le domaine de compétence du candidat en lien avec l'entreprise. Par exemple : "Prise de contact : [Compétence clé du candidat] pour [Nom de l'entreprise]".
3.  **Personnalisation :** Adresse l'email directement à ${contact.name}.
4.  **Introduction (1er paragraphe) :** Mentionne que tu as découvert l'entreprise ${company.name} et que tu es impressionné(e) par son travail dans le domaine de ${company.domain}. Exprime ton intérêt.
5.  **Proposition de valeur (2ème paragraphe) :** Fais le lien entre tes compétences clés et les besoins potentiels de l'entreprise. Explique brièvement en 2-3 phrases comment ton profil pourrait leur être bénéfique.
6.  **Appel à l'action (3ème paragraphe) :** Propose un bref échange pour discuter de potentielles collaborations futures, même en l'absence de poste ouvert actuellement.
7.  **Ton :** Le ton doit être professionnel, respectueux et proactif, mais pas arrogant.
8.  **Signature :** Termine par une formule de politesse et le nom du candidat.

Ne génère que l'email (objet et corps), sans aucun autre texte ou explication.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
  
    return response.text;
}

async function rewriteCv(cvData: CvData, targetJobTitle: string, language: string): Promise<CvData> {
    const prompt = `En tant qu'expert en recrutement et coach de carrière, réécris le CV suivant pour le poste de "${targetJobTitle}". La réponse doit être en langue : ${language}.

**Instructions Clés (NON NÉGOCIABLES) :**
1.  **Verbes d'action percutants :** Remplace les phrases passives par des verbes d'action forts (ex: "J'étais responsable de" devient "Géré", "Développé", "Optimisé").
2.  **Résultats mesurables :** Quantifie les réalisations autant que possible. Si les chiffres ne sont pas présents, infère des résultats plausibles et impressionnants basés sur le contexte. (ex: "Amélioration des performances" devient "Optimisation des performances de 20%").
3.  **Mots-clés :** Intègre subtilement des mots-clés pertinents pour le poste de "${targetJobTitle}" dans les descriptions de poste et les compétences.
4.  **Clarté et concision :** Assure-toi que chaque point est clair, concis et met en avant une valeur ajoutée.
5.  **Structure inchangée :** Conserve la structure globale du CV (informations personnelles, expériences, formation). Ne modifie que le contenu textuel (summary, responsibilities, skills).
6.  **Format de sortie :** La sortie DOIT être un objet JSON valide qui respecte scrupuleusement le schéma fourni. Ne renvoie aucun texte en dehors du JSON.

**CV Original (JSON) :**
${JSON.stringify(cvData, null, 2)}

Réécris le contenu pour maximiser l'impact et l'alignement avec le poste cible.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: cvSchema,
        }
    });

    const jsonText = (response.text || '').trim();
    try {
        return JSON.parse(jsonText) as CvData;
    } catch (e) {
        console.error("Failed to parse Rewritten CV JSON:", jsonText);
        throw new Error("The AI returned an invalid format for the rewritten CV data.");
    }
}


export const geminiService = {
  extractCvInfo,
  createCvFromLinkedIn,
  parseCvInput,
  findJobs,
  findCandidates,
  generateCoverLetter,
  analyzeCareerTrajectory,
  analyzeJobFit,
  generateApplicationMessage,
  getCitiesForCountry,
  findCompanies,
  generateSpontaneousApplicationMessage,
  rewriteCv,
};