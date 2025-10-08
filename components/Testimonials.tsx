import React from 'react';
import { StarIcon } from './icons/StarIcon';
import { useTranslations } from '../hooks/useTranslations';
import { UserIcon } from './icons/UserIcon';


const TestimonialCard: React.FC<{
    quote: string;
    name: string;
    role: string;
}> = ({ quote, name, role }) => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 flex flex-col h-full">
            <div className="flex items-center mb-4">
                {Array(5).fill(0).map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
            </div>
            <p className="text-gray-600 italic flex-grow">"{quote}"</p>
            <div className="mt-6 flex items-center">
                 <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <UserIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ms-4">
                    <p className="font-semibold text-gray-800">{name}</p>
                    <p className="text-sm text-gray-500">{role}</p>
                </div>
            </div>
        </div>
    );
}

export const Testimonials: React.FC = () => {
    const { t } = useTranslations();

    return (
        <div className="mt-20 w-full max-w-5xl text-left rtl:text-right">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">{t('testimonials.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TestimonialCard 
                    quote={t('testimonials.candidateQuote')}
                    name={t('testimonials.candidateName')}
                    role={t('testimonials.candidateRole')}
                />
                <TestimonialCard 
                    quote={t('testimonials.recruiterQuote')}
                    name={t('testimonials.recruiterName')}
                    role={t('testimonials.recruiterRole')}
                />
            </div>
        </div>
    );
};