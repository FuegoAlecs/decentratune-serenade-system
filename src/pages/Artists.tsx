import React from 'react';

const ArtistsPlaceholder: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-150px)] flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-light-background dark:bg-dark-background">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">
        Artists Page
      </h1>
      <p className="text-lg sm:text-xl text-light-text-secondary dark:text-dark-text-secondary mb-8">
        This page will feature artists on the platform. Content coming soon!
      </p>
      <a
        href="/explore"
        className="text-accent-primary hover:text-accent-hover dark:text-dark-accent-primary dark:hover:text-dark-accent-hover underline text-base sm:text-lg"
      >
        &larr; Back to Explore
      </a>
    </div>
  );
};

export default ArtistsPlaceholder;
