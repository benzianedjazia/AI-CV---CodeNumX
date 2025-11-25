
import React from 'react';
import type { Company, CompanyEmployee } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { UserIcon } from './icons/UserIcon';
import { ChatBubbleBottomCenterTextIcon } from './icons/ChatBubbleBottomCenterTextIcon';
import { ShareIcon } from './icons/ShareIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { jsPDF } from "jspdf";

interface CompanyCardProps { 
    company: Company;
    cvDataExists: boolean;
    onGenerateMessage: (employee: CompanyEmployee) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, cvDataExists, onGenerateMessage }) => {
    const { t } = useTranslations();

    const handleShare = async () => {
        const shareTitle = `${t('results.companyCard.shareCompany')}: ${company.name}`;
        
        // Simplified content for sharing to avoid length limits
        const contacts = company.employees.slice(0, 3).map(e => `- ${e.name} (${e.title})`).join('\n');
        const shareText = `Company: ${company.name}
Domain: ${company.domain}
Website: ${company.website || 'N/A'}
Description: ${company.description.substring(0, 200)}...

Key Contacts:
${contacts}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                });
                return;
            } catch (error) {
                console.error('Error sharing:', error);
                // Fallback to mailto if user cancels or share fails
            }
        }
        
        // Fallback to mailto with safe length
        const subject = encodeURIComponent(shareTitle);
        // Truncate to ~1500 chars to be safe for mailto links
        const body = encodeURIComponent(shareText.substring(0, 1500));
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        const margin = 15;
        let y = 20;
        const PRIMARY_COLOR = '#4f46e5';
        const TEXT_COLOR = '#1f2937';
        
        doc.setFontSize(18);
        doc.setTextColor(PRIMARY_COLOR);
        doc.text(company.name, margin, y);
        y += 10;
        
        doc.setFontSize(14);
        doc.setTextColor(TEXT_COLOR);
        doc.text(company.domain, margin, y);
        y += 10;
        
        if (company.website) {
            doc.setTextColor(PRIMARY_COLOR);
            doc.setFontSize(10);
            doc.textWithLink(company.website, margin, y, { url: company.website });
            y += 10;
        }

        if (company.address || company.phone) {
             doc.setFontSize(10);
             doc.setTextColor(TEXT_COLOR);
             let info = '';
             if (company.address) info += company.address;
             if (company.phone) info += (info ? ' | ' : '') + company.phone;
             doc.text(info, margin, y);
             y += 15;
        } else {
             y += 5;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(TEXT_COLOR);
        const splitDesc = doc.splitTextToSize(company.description, 180);
        doc.text(splitDesc, margin, y);
        
        y += (splitDesc.length * 6) + 20;
        
        doc.setFontSize(14);
        doc.text(t('results.companyCard.keyContacts'), margin, y);
        y += 15;
        
        doc.setFontSize(12);
        company.employees.forEach(emp => {
            if (y > 280) { // New page if needed
                doc.addPage();
                y = 20;
            }
            const text = `${emp.name} - ${emp.title}`;
            doc.text(text, margin, y);
            
            if (emp.linkedinUrl) {
                doc.setTextColor(PRIMARY_COLOR);
                doc.setFontSize(10);
                doc.textWithLink('LinkedIn', 150, y, { url: emp.linkedinUrl });
                doc.setFontSize(12);
                doc.setTextColor(TEXT_COLOR);
            }
            y += 10;
        });
    
        doc.save(`company_${company.name.replace(/[\s/]/g, '_')}_prospect.pdf`);
    };

    return (
        <div className="p-5 rounded-lg shadow-md border bg-white border-gray-200 transition-all hover:shadow-lg hover:border-indigo-200 relative">
            <div className="absolute top-4 right-4 flex gap-2">
                 <button
                    onClick={handleDownloadPdf}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title={t('results.companyCard.downloadPdf')}
                >
                    <DownloadIcon className="h-6 w-6" />
                </button>
                <button
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title={t('results.companyCard.shareCompany')}
                >
                    <ShareIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-5 pr-20">
                <div className="flex-shrink-0 h-16 w-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="h-10 w-10 text-indigo-500" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-indigo-700">{company.name}</h3>
                    <div className="inline-flex items-center text-md font-semibold text-gray-600">
                        <BriefcaseIcon className="h-4 w-4 me-2 text-gray-400"/>
                        {company.domain}
                    </div>

                    <p className="mt-2 text-sm text-gray-600">{company.description}</p>
                    
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                        {company.address && <div className="inline-flex items-start"><MapPinIcon className="h-4 w-4 me-2 mt-0.5 text-gray-400 flex-shrink-0" /><span>{company.address}</span></div>}
                        {company.phone && <a href={`tel:${company.phone}`} className="inline-flex items-center hover:text-indigo-600"><PhoneIcon className="h-4 w-4 me-2 text-gray-400" /><span>{company.phone}</span></a>}
                        {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-indigo-600"><ExternalLinkIcon className="h-4 w-4 me-2 text-gray-400" /><span>{t('results.companyCard.website')}</span></a>}
                    </div>
                </div>
            </div>
            {company.employees && company.employees.length > 0 && (
                 <div className="mt-4 pt-4 border-t">
                     <h4 className="font-semibold text-gray-800 mb-2">{t('results.companyCard.keyContacts')}</h4>
                     <div className="space-y-3">
                        {company.employees.map(employee => (
                            <div key={employee.linkedinUrl} className="flex items-center gap-3 bg-gray-50 p-2 rounded-md">
                                 <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserIcon className="h-5 w-5 text-gray-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-gray-800">{employee.name}</p>
                                    <p className="text-xs text-gray-500">{employee.title}</p>
                                </div>
                                <a href={employee.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 p-1">
                                    <LinkedInIcon className="h-5 w-5" />
                                </a>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onGenerateMessage(employee);
                                    }}
                                    disabled={!cvDataExists}
                                    className="flex items-center px-2 py-1 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors text-xs disabled:bg-slate-300 disabled:cursor-not-allowed"
                                    title={t('results.companyCard.generateMessageTitle')}
                                >
                                    <ChatBubbleBottomCenterTextIcon className="h-4 w-4 me-1" />
                                    {t('applicationCard.generateMessage')}
                                </button>
                            </div>
                        ))}
                     </div>
                 </div>
            )}
        </div>
    )
}
