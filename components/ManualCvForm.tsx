import React, { useState, useEffect } from 'react';
import type { CvData } from '../types';

interface ManualCvFormProps {
  onCvDataChange: (cvData: CvData) => void;
}

const initialCvData: CvData = {
  personalInfo: { name: '', email: '', phone: '' },
  linkedin: '',
  summary: '',
  skills: [],
  experience: [{ jobTitle: '', company: '', duration: '', responsibilities: [''] }],
  education: [{ degree: '', institution: '', duration: '' }],
};

export const ManualCvForm: React.FC<ManualCvFormProps> = ({ onCvDataChange }) => {
  const [cvData, setCvData] = useState<CvData>(initialCvData);

  useEffect(() => {
    onCvDataChange(cvData);
  }, [cvData, onCvDataChange]);
  
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCvData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [name]: value },
    }));
  };

  const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "skills") {
      setCvData(prev => ({ ...prev, skills: value.split(',').map(s => s.trim()) }));
    } else {
      setCvData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleExperienceChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newExperience = [...cvData.experience];
    newExperience[index] = { ...newExperience[index], [name]: value };
    setCvData(prev => ({ ...prev, experience: newExperience }));
  };

  const handleResponsibilityChange = (expIndex: number, respIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newExperience = [...cvData.experience];
    newExperience[expIndex].responsibilities[respIndex] = e.target.value;
    setCvData(prev => ({ ...prev, experience: newExperience }));
  };

  const addResponsibility = (expIndex: number) => {
    const newExperience = [...cvData.experience];
    newExperience[expIndex].responsibilities.push('');
    setCvData(prev => ({ ...prev, experience: newExperience }));
  }

  const removeResponsibility = (expIndex: number, respIndex: number) => {
    const newExperience = [...cvData.experience];
    newExperience[expIndex].responsibilities.splice(respIndex, 1);
    setCvData(prev => ({ ...prev, experience: newExperience }));
  }

  const addExperience = () => {
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, { jobTitle: '', company: '', duration: '', responsibilities: [''] }],
    }));
  };
  
  const removeExperience = (index: number) => {
    const newExperience = [...cvData.experience];
    newExperience.splice(index, 1);
    setCvData(prev => ({ ...prev, experience: newExperience }));
  };

  const handleEducationChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newEducation = [...cvData.education];
    newEducation[index] = { ...newEducation[index], [name]: value };
    setCvData(prev => ({ ...prev, education: newEducation }));
  };
  
  const addEducation = () => {
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', duration: '' }],
    }));
  };

  const removeEducation = (index: number) => {
    const newEducation = [...cvData.education];
    newEducation.splice(index, 1);
    setCvData(prev => ({ ...prev, education: newEducation }));
  };

  const inputClass = "w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-md">
        <h3 className="font-semibold mb-2 text-gray-800">Informations Personnelles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Nom complet</label>
            <input type="text" name="name" value={cvData.personalInfo.name} onChange={handlePersonalInfoChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" name="email" value={cvData.personalInfo.email} onChange={handlePersonalInfoChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input type="tel" name="phone" value={cvData.personalInfo.phone} onChange={handlePersonalInfoChange} className={inputClass} />
          </div>
        </div>
         <div className="mt-4">
            <label className={labelClass}>URL LinkedIn</label>
            <input type="url" name="linkedin" value={cvData.linkedin} onChange={handleSimpleChange} className={inputClass} />
        </div>
      </div>

       <div className="p-4 border rounded-md">
        <h3 className="font-semibold mb-2 text-gray-800">Résumé & Compétences</h3>
         <div>
            <label className={labelClass}>Résumé professionnel</label>
            <textarea name="summary" value={cvData.summary} onChange={handleSimpleChange} className={inputClass} rows={3}></textarea>
        </div>
        <div className="mt-4">
            <label className={labelClass}>Compétences (séparées par des virgules)</label>
            <textarea name="skills" value={cvData.skills.join(', ')} onChange={handleSimpleChange} className={inputClass} rows={3}></textarea>
        </div>
       </div>

      <div className="p-4 border rounded-md">
        <h3 className="font-semibold mb-2 text-gray-800">Expérience Professionnelle</h3>
        {cvData.experience.map((exp, index) => (
          <div key={index} className="space-y-2 p-3 my-2 border rounded-md relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="text" name="jobTitle" placeholder="Titre du poste" value={exp.jobTitle} onChange={(e) => handleExperienceChange(index, e)} className={inputClass} />
              <input type="text" name="company" placeholder="Entreprise" value={exp.company} onChange={(e) => handleExperienceChange(index, e)} className={inputClass} />
              <input type="text" name="duration" placeholder="Durée (ex: 2020-2022)" value={exp.duration} onChange={(e) => handleExperienceChange(index, e)} className={inputClass} />
            </div>
            <div className="pl-4 space-y-2">
                {exp.responsibilities.map((resp, rIndex) => (
                    <div key={rIndex} className="flex items-center gap-2">
                         <input type="text" placeholder="Responsabilité ou réalisation" value={resp} onChange={(e) => handleResponsibilityChange(index, rIndex, e)} className={inputClass} />
                         <button type="button" onClick={() => removeResponsibility(index, rIndex)} className="text-red-500 hover:text-red-700 text-xs p-1">&times;</button>
                    </div>
                ))}
                <button type="button" onClick={() => addResponsibility(index)} className="text-xs text-indigo-600 hover:underline">+ Ajouter une responsabilité</button>
            </div>
            <button type="button" onClick={() => removeExperience(index)} className="absolute top-1 right-1 text-red-500 hover:text-red-700 font-bold p-1">&times;</button>
          </div>
        ))}
        <button type="button" onClick={addExperience} className="mt-2 text-sm text-indigo-600 hover:underline">+ Ajouter une expérience</button>
      </div>

      <div className="p-4 border rounded-md">
        <h3 className="font-semibold mb-2 text-gray-800">Formation</h3>
        {cvData.education.map((edu, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 my-2 border rounded-md relative">
            <input type="text" name="degree" placeholder="Diplôme" value={edu.degree} onChange={(e) => handleEducationChange(index, e)} className={inputClass} />
            <input type="text" name="institution" placeholder="Établissement" value={edu.institution} onChange={(e) => handleEducationChange(index, e)} className={inputClass} />
            <input type="text" name="duration" placeholder="Durée" value={edu.duration} onChange={(e) => handleEducationChange(index, e)} className={inputClass} />
            <button type="button" onClick={() => removeEducation(index)} className="absolute top-1 right-1 text-red-500 hover:text-red-700 font-bold p-1">&times;</button>
          </div>
        ))}
        <button type="button" onClick={addEducation} className="mt-2 text-sm text-indigo-600 hover:underline">+ Ajouter une formation</button>
      </div>
    </div>
  );
};
