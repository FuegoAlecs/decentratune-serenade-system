import React from 'react';

const WalletPlaceholder: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-150px)] flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-light-background dark:bg-dark-background">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">
        Wallet Page
      </h1>
      <p className="text-lg sm:text-xl text-light-text-secondary dark:text-dark-text-secondary mb-8">
        This page will display wallet information, balances, and transaction history. Content coming soon!
      </p>
      <a
        href="/"
        className="text-accent-primary hover:text-accent-hover dark:text-dark-accent-primary dark:hover:text-dark-accent-hover underline text-base sm:text-lg"
      >
        &larr; Back to Dashboard
      </a>
    </div>
  );
};

export default WalletPlaceholder;
