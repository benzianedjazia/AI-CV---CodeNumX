
import React from 'react';
import { BriefcaseIcon } from './icons/BriefcaseIcon';

export const Header: React.FC = () => (
  <header className="bg-white shadow-md">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center h-16">
        <div className="flex items-center space-x-3">
          <BriefcaseIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Assistant CV IA
          </h1>
        </div>
      </div>
    </div>
  </header>
);
