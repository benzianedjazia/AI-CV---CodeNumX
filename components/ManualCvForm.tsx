import React from 'react';
import type { CvData } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface ManualCvFormProps {
  cvData: CvData;
  onCvDataChange: (cvData: CvData) => void;
}

export const ManualCvForm: React.FC<ManualCvFormProps> = ({ cvData, onCvDataChange }) => {
  const { t } = useTranslations();
  
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onCvDataChange({
      ...cvData,
      personalInfo: { ...cvData.personalInfo, [name]: value },
    });
  };

  const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "skills") {
      onCvDataChange({ ...cvData, skills: value.split(',').map(s => s.trim()) });
    } else {
      onCvDataChange({ ...cvData, [name]: value });
    }
  };
  
  const handleExperienceChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newExperience = [...cvData.experience];
    (newExperience[index] as any)[name] = value;
    onCvDataChange({ ...cvData, experience: newExperience });
  };

  const handleResponsibilityChange = (expIndex: number, respIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newExperience = [...cvData.experience];
    newExperience[expIndex].responsibilities[respIndex] = e.target.value;
    onCvDataChange({ ...cvData, experience: newExperience });
  };

  const addResponsibility = (expIndex: number) => {
    const newExperience = [...cvData.experience];
    newExperience[expIndex].responsibilities.push('');
    onCvDataChange({ ...cvData, experience: newExperience });
  }

  const removeResponsibility = (expIndex: number, respIndex: number) => {
    const newExperience = [...cvData.experience];
    newExperience[expIndex].responsibilities.splice(respIndex, 1);
    onCvDataChange({ ...cvData, experience: newExperience });
  }

  const addExperience = () => {
    onCvDataChange({
      ...cvData,
      experience: [...cvData.experience, { jobTitle: '', company: '', duration: '', responsibilities: [''] }],
    });
  };
  
  const removeExperience = (index: number) => {
    const newExperience = [...cvData.experience];
    newExperience.splice(index, 1);
    onCvDataChange({ ...cvData, experience: newExperience });
  };

  const handleEducationChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newEducation = [...cvData.education];
    (newEducation[index] as any)[name] = value;
    onCvDataChange({ ...cvData, education: newEducation });
  };
  
  const addEducation = () => {
    onCvDataChange({
      ...cvData,
      education: [...cvData.education, { degree: '', institution: '', duration: '' }],
    });
  };

  const removeEducation = (index: number) => {
    const newEducation = [...cvData.education];
    newEducation.splice(index, 1);
    onCvDataChange({ ...cvData, education: newEducation });
  };

  const inputClass = "w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-md">
        <h3 className="font-semibold mb-2 text-gray-800">{t('manualCv.personalInfoTitle')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>{t('manualCv.fullNameLabel')}</label>
            <input type="text" name="name" value={cvData.personalInfo.name} onChange={handlePersonalInfoChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('manualCv.emailLabel')}</label>
            <input type="email" name="email" value={cvData.personalInfo.email} onChange={handlePersonalInfoChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('manualCv.phoneLabel')}</label>
            <input type="tel" name="phone" value={cvData.personalInfo.phone} onChange={handlePersonalInfoChange} className={inputClass} />
          </div>
        </div>
         <div className="mt-4">
            <label className={labelClass}>{t('manualCv.linkedinUrlLabel')}</label>
            <input type="url" name="linkedin" value={cvData.linkedin || ''} onChange={handleSimpleChange} className={inputClass} />
        </div>
      </div>

       <div className="p-4 border rounded-md">
        <h3 className="font-semibold mb-2 text-gray-800">{t('manualCv.summarySkillsTitle')}</h3>
         <div>
            <label className={labelClass}>{t('manualCv.summaryLabel')}</label>
            <textarea name="summary" value={cvData.summary || ''} onChange={handleSimpleChange} className={inputClass} rows={3}></textarea>
        </div>
        <div className="mt-4">
            <label className={labelClass}>{t('manualCv.skillsLabel')}</label>
            <textarea name="skills" value={cvData.skills.join(', ')} onChange={handleSimpleChange} className={inputClass} rows={3}></textarea>
        </div>
       </div>

      <div className="p-4 border rounded-md">
        <h3 className="font-semibold mb-2 text-gray-800">{t('manualCv.experienceTitle')}</h3>
        {cvData.experience.map((exp, index) => (
          <div key={index} className="space-y-2 p-3 my-2 border rounded-md relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="text" name="jobTitle" placeholder={t('manualCv.jobTitlePlaceholder')} value={exp.jobTitle} onChange={(e) => handleExperienceChange(index, e)} className={inputClass} />
              <input type="text" name="company" placeholder={t('manualCv.companyPlaceholder')} value={exp.company} onChange={(e) => handleExperienceChange(index, e)} className={inputClass} />
              <input type="text" name="duration" placeholder={t('manualCv.durationPlaceholder')} value={exp.duration} onChange={(e) => handleExperienceChange(index, e)} className={inputClass} />
            </div>
            <div className="ps-4 space-y-2">
                {exp.responsibilities.map((resp, rIndex) => (
                    <div key={rIndex} className="flex items-center gap-2">
                         <input type="text" placeholder={t('manualCv.responsibilityPlaceholder')} value={resp} onChange={(e) => handleResponsibilityChange(index, rIndex, e)} className={inputClass} />
                         <button type="button" onClick={() => removeResponsibility(index, rIndex)} className="text-red-500 hover:text-red-700 text-xs p-1">&times;</button>
                    </div>
                ))}
                <button type="button" onClick={() => addResponsibility(index)} className="text-xs text-indigo-600 hover:underline">{t('manualCv.addResponsibility')}</button>
            </div>
            <button type="button" onClick={() => removeExperience(index)} className="absolute top-1 end-1 text-red-500 hover:text-red-700 font-bold p-1">&times;</button>
          </div>
        ))}
        <button type="button" onClick={addExperience} className="mt-2 text-sm text-indigo-600 hover:underline">{t('manualCv.addExperience')}</button>
      </div>

      <div className="p-4 border rounded-md">
        <h3 className="font-semibold mb-2 text-gray-800">{t('manualCv.educationTitle')}</h3>
        {cvData.education.map((edu, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 my-2 border rounded-md relative">
            <input type="text" name="degree" placeholder={t('manualCv.degreePlaceholder')} value={edu.degree} onChange={(e) => handleEducationChange(index, e)} className={inputClass} />
            <input type="text" name="institution" placeholder={t('manualCv.institutionPlaceholder')} value={edu.institution} onChange={(e) => handleEducationChange(index, e)} className={inputClass} />
            <input type="text" name="duration" placeholder={t('manualCv.durationPlaceholder')} value={edu.duration} onChange={(e) => handleEducationChange(index, e)} className={inputClass} />
            <button type="button" onClick={() => removeEducation(index)} className="absolute top-1 end-1 text-red-500 hover:text-red-700 font-bold p-1">&times;</button>
          </div>
        ))}
        <button type="button" onClick={addEducation} className="mt-2 text-sm text-indigo-600 hover:underline">{t('manualCv.addEducation')}</button>
      </div>
    </div>
  );
};