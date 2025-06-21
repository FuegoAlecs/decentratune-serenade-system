import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background px-4"> {/* Themed background and padding for small screens */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary"> {/* Responsive & Themed Text */}
          404
        </h1>
        <p className="text-lg sm:text-xl text-light-text-secondary dark:text-dark-text-secondary mb-6 sm:mb-8"> {/* Responsive & Themed Text, adjusted margin */}
          Oops! Page not found
        </p>
        <a
          href="/"
          className="text-accent-primary hover:text-accent-hover dark:text-dark-accent-primary dark:hover:text-dark-accent-hover underline text-base sm:text-lg" /* Themed Link & Responsive Text */
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
