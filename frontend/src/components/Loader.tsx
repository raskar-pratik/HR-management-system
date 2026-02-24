import React from 'react';

const Loader: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="relative">
                <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin"></div>
                <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
        </div>
    );
};

export default Loader;
