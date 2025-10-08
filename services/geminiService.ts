import { GoogleGenAI, Type } from "@google/genai";
import type { CvData, Job, Candidate } from '../types';

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


async function findJobs(skills: string[], location: string, contractTypes: string[], datePosted: string): Promise<{ jobs: Job[], groundingChunks: any[] }> {
  
  let specificInstructions = `Ta mission est de fournir une liste de résultats aussi riche et pertinente que possible, en visant **environ 15 offres d'emploi**.`;

  if (contractTypes.some(ct => ['Freelance', 'Sous-traitance'].includes(ct))) {
    specificInstructions += `\n**Attention particulière pour les freelances/sous-traitants :** Cherche activement des "missions", "projets", ou des postes de "consultant". Explore les plateformes spécialisées pour freelances (comme Malt, Freelance-info, etc.) en plus des sites d'emploi traditionnels.`;
  }

  const dateFilterInstruction = datePosted === 'month' 
    ? "La recherche doit se concentrer sur les offres publiées il y a **moins d'un mois**."
    : "La date de publication est **indifférente**. Tu dois retourner toutes les offres pertinentes, **même si elles sont anciennes** (par exemple, datant de plus d'un an ou deux). Ne filtre pas par date.";


  const prompt = `En tant qu'expert en recrutement international, utilise la recherche Google pour trouver des offres d'emploi correspondant aux critères suivants. ${specificInstructions}

**Critères de recherche :**
- **Mots-clés / Compétences :** "${skills.join(', ')}"
- **Lieu :** "${location}"
- **Type de contrat :** "${contractTypes.length > 0 ? contractTypes.join(', ') : 'Tous types'}"

**Instruction sur la date de publication :** ${dateFilterInstruction}

**Instructions pour la réponse :**
1.  **Priorité à la pertinence et à la quantité :** Trouve un bon nombre d'offres (vise environ 15) qui correspondent au mieux aux compétences et au lieu. Si les résultats sont rares, élargis la recherche (localités proches, compétences connexes) pour atteindre l'objectif de quantité.
2.  **Format de sortie :** Retourne les résultats sous forme d'un tableau JSON. Chaque objet du tableau doit représenter une offre d'emploi.

3.  **Champs à extraire pour chaque offre :**
    *   \`title\`: Titre exact du poste.
    *   \`company\`: Nom de l'entreprise qui recrute.
    *   \`location\`: Ville.
    *   \`description\`: Description détaillée et complète du poste (missions, profil, compétences, avantages). Vise au moins 100 mots.
    *   \`source\`: Nom du site web source (ex: "LinkedIn", "Malt").
    *   \`url\`: **Crucial :** URL directe et publique de l'offre.
    *   \`phone\`: **Recherche active requise.** Le numéro de téléphone standard de l'entreprise.
    *   \`address\`: **Recherche active requise.** L'adresse physique complète du bureau ou de l'agence.
    *   \`companyWebsite\`: (Optionnel) URL du site de l'entreprise.
    *   \`hiringEmail\`: **Recherche active requise.** L'email de contact pour les candidatures.

4.  **MISSION CRITIQUE : Recherche approfondie des coordonnées (Email, Adresse, Téléphone)**
    *   Ta mission la plus importante est de trouver **l'email de contact RH/recrutement**, le numéro de téléphone et l'adresse physique de chaque entreprise. C'est **non négociable**. Tu ne dois **JAMAIS** te contenter de l'offre d'emploi seule.
    *   **Stratégie de recherche OBLIGATOIRE en plusieurs étapes :**
        1.  **Analyse de l'annonce :** Cherche d'abord dans le texte de l'annonce.
        2.  **Recherche Google Ciblée :** Si l'annonce est incomplète, tu DOIS effectuer une nouvelle recherche Google avec des termes comme : \`"email recrutement [Nom de l'entreprise]"\`, \`"carrières [Nom de l'entreprise]"\`, ou \`"[Nom de l'entreprise] [Ville] téléphone adresse"\`.
        3.  **Exploration des sites web :** Consulte la page "Contact", "Carrières", "À propos" ou le pied de page du site officiel de l'entreprise pour trouver ces informations. Cherche des adresses comme "rh@", "jobs@", "recrutement@", "careers@".
        4.  **Utilisation de Pages Jaunes / Google Maps :** Si les étapes précédentes échouent pour l'adresse/téléphone, utilise des requêtes comme \`"[Nom de l'entreprise] [Ville] sur Pages Jaunes"\` ou cherche directement sur Google Maps.
    *   **Objectif :** Remplir les champs \`hiringEmail\`, \`phone\` et \`address\` pour **chaque offre**. Ne les omets que si, et seulement si, après avoir suivi TOUTES ces étapes, l'information est absolument introuvable (par exemple, pour une entreprise 100% en télétravail sans siège social public ou qui n'accepte les candidatures que via un formulaire).
    *   **Exemple de résultat PARFAIT :**
        \`\`\`json
        {
          "title": "Plaquiste H/F",
          "company": "Domino Missions Toulouse",
          "location": "Toulouse",
          "description": "Nous recherchons un plaquiste expérimenté pour rejoindre notre équipe. Vos missions incluront la préparation des supports, la pose des panneaux préfabriqués (placo, BA13), le montage des cloisons, des sols et des faux plafonds. Vous réaliserez également les jointures et les finitions.",
          "url": "https://www.hellowork.com/fr-fr/emplois/xxxx.html",
          "source": "hellowork.com",
          "phone": "05 61 23 45 67",
          "address": "10 Place de la Bourse, 31000 Toulouse, France",
          "hiringEmail": "toulouse@domino-missions.com"
        }
        \`\`\`
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

  let jsonText = response.text.trim();
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

async function findCandidates(jobDescription: string, location: string): Promise<{ candidates: Omit<Candidate, 'id'>[] }> {
    const prompt = `Tu es un expert international en recrutement. Ta mission est de trouver les meilleurs profils de candidats sur le web, principalement sur LinkedIn, en utilisant la recherche Google.

Critères de recherche :
1. Profil/Compétences : "${jobDescription}"
2. Localisation : ${location ? `"${location}" (Priorité haute)` : "International (aucune localité spécifiée)"}

Instructions détaillées :
- Analyse de profil complète : Pour chaque profil potentiel, analyse l'intégralité de son contenu (titre, résumé, expériences, compétences, localisation, etc.) pour déterminer s'il correspond à la description du poste.
- Priorité à la localisation : Si une localisation est spécifiée, tu dois la rechercher activement dans les profils. Les candidats de cette région sont prioritaires.
- Flexibilité : Si tu ne trouves pas de candidats parfaits dans la localisation exacte, tu peux élargir légèrement la zone géographique (ex: régions voisines).
- Objectif de quantité : Retourne une liste aussi complète que possible, jusqu'à 50 candidats pertinents. Ne t'arrête pas après avoir trouvé seulement quelques profils.
- Source principale : Concentre-toi sur LinkedIn, mais si tu trouves d'excellents profils sur d'autres sites professionnels (comme GitHub pour les développeurs), inclus-les également.

Informations à extraire pour chaque candidat :
- name: Le nom complet.
- jobTitle: Le titre de poste actuel.
- photoUrl: **MISSION CRITIQUE :** L'URL directe et publique de la photo de profil. Fais tout ton possible pour la trouver. Cherche sur Google Images avec le nom et l'entreprise du candidat pour trouver une photo de profil professionnelle si elle n'est pas directement sur la page source.
- phone: Le numéro de téléphone (uniquement s'il est publiquement visible).
- linkedinUrl: L'URL complète et directe du profil LinkedIn public.
- source: Le site où le profil a été trouvé (ex: "LinkedIn", "GitHub").

Règles de formatage :
1. Si 'phone' n'est pas disponible, omets cette clé. Ne l'invente JAMAIS. Pour 'photoUrl', ne l'omets que si, après une recherche approfondie, l'image est absolument introuvable.
2. 'linkedinUrl' doit être une URL de profil valide et publique, commençant par "https://www.linkedin.com/in/...". Ne retourne jamais de liens de recherche, de liens internes ou d'URL invalides.
3. Si aucun candidat n'est trouvé, retourne un tableau JSON vide : [].
4. La sortie doit être une chaîne de caractères JSON valide, sans démarque de code (\`\`\`).`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });

    let jsonText = response.text.trim();
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

        const candidates = JSON.parse(jsonText) as Omit<Candidate, 'id'>[];
        return { candidates };
    } catch (e) {
        console.error("Failed to parse Candidates JSON:", response.text);
        throw new Error("L'IA a retourné un format invalide pour les données des candidats.");
    }
}


export const geminiService = {
  extractCvInfo,
  createCvFromLinkedIn,
  findJobs,
  generateCoverLetter,
  findCandidates,
};