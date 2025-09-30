import React, { useState, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import type { Candidate } from '../types';
import { CandidateCard } from './CandidateCard';
import { UserGroupIcon } from './icons/UserGroupIcon';

const RecruiterLoadingIndicator: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-2xl space-y-6 w-full max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        <p className="text-xl font-semibold text-gray-700">Recherche de candidats...</p>
        <p className="text-sm text-gray-500 text-center">L'IA analyse le web pour trouver les meilleurs profils. Cela peut prendre un moment.</p>
    </div>
);

export const RecruiterSpace: React.FC = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [location, setLocation] = useState('');
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = useCallback(async () => {
        if (!jobDescription.trim()) {
            setError('Veuillez fournir une description de poste ou un titre.');
            return;
        }

        setIsLoading(true);
        setSearched(true);
        setError(null);
        setCandidates([]);

        try {
            const { candidates: foundCandidates } = await geminiService.findCandidates(jobDescription, location);
            const candidatesWithIds = foundCandidates.map(c => ({
                ...c,
                id: `${c.name}-${Math.random()}`.replace(/\s/g, ''),
            }));
            setCandidates(candidatesWithIds);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [jobDescription, location]);

    return (
        <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in">
            <UserGroupIcon className="h-16 w-16 text-indigo-200" />
            <h2 className="mt-4 text-4xl font-extrabold text-gray-900 sm:text-5xl text-center">
                Trouvez les meilleurs talents
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 text-center">
                Décrivez le poste que vous cherchez à pourvoir et laissez notre IA trouver les candidats les plus pertinents pour vous.
            </p>

            <div className="mt-10 w-full bg-white p-6 rounded-lg shadow-lg text-left space-y-4">
                <div>
                    <label htmlFor="job-description" className="block text-lg font-medium text-gray-700">
                        Description du poste ou compétences clés
                    </label>
                    <textarea
                        id="job-description"
                        rows={5}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="mt-2 w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: Développeur React senior avec 5 ans d'expérience dans les applications web à grande échelle, compétent en TypeScript et GraphQL..."
                        disabled={isLoading}
                    />
                </div>
                 <div>
                    <label htmlFor="location" className="block text-lg font-medium text-gray-700">
                        Ville ou pays (optionnel)
                    </label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-2 w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Ex: Lyon, France"
                        disabled={isLoading}
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="w-full py-3 px-6 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-transform disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Recherche en cours...' : 'Chercher des candidats'}
                </button>
            </div>

            <div className="mt-12 w-full">
                {isLoading && <RecruiterLoadingIndicator />}

                {!isLoading && candidates.length > 0 && (
                    <div className="space-y-4">
                         <h3 className="text-2xl font-bold text-gray-800">Résultats de la recherche</h3>
                        {candidates.map(candidate => (
                            <CandidateCard key={candidate.id} candidate={candidate} />
                        ))}
                    </div>
                )}
                
                {!isLoading && candidates.length === 0 && searched && !error && (
                     <div className="text-center p-12 bg-white rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-700">Aucun candidat trouvé</h3>
                        <p className="mt-2 text-gray-500">Essayez de reformuler votre recherche ou de fournir plus de détails pour de meilleurs résultats.</p>
                     </div>
                )}

                 {error && !isLoading && (
                    <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg relative w-full">
                        <strong className="font-bold">Erreur!</strong>
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};