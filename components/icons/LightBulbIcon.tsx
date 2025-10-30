import React from 'react';

export const LightBulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        {...props}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311V21m-3.75-2.311V21m10.125-9.448a4.5 4.5 0 00-8.484-2.13A4.5 4.5 0 0012 3c-1.892 0-3.597 1.05-4.328 2.672L7.34 6.32a4.5 4.5 0 00-1.897 2.13A4.5 4.5 0 0012 15.75c1.548 0 2.94-.836 3.738-2.118a4.5 4.5 0 00.478-2.186Zm-3.738 2.118a2.625 2.625 0 11-4.682-3.238 2.625 2.625 0 014.682 3.238Z" 
        />
    </svg>
);