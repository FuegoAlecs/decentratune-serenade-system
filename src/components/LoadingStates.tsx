
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrackCardSkeleton() {
  return (
    // Adjusted padding to match TrackCard, themed placeholder colors
    <div className="glass-card p-3 sm:p-4 rounded-2xl animate-pulse">
      <div className="w-full aspect-square bg-light-borders-lines/50 dark:bg-dark-borders-lines/50 rounded-lg sm:rounded-xl mb-3 sm:mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-light-borders-lines/50 dark:bg-dark-borders-lines/50 rounded w-3/4"></div>
        <div className="h-3 bg-light-borders-lines/40 dark:bg-dark-borders-lines/40 rounded w-1/2"></div> {/* Slightly different shade for variety */}
        <div className="flex justify-between">
          <div className="h-3 bg-light-borders-lines/40 dark:bg-dark-borders-lines/40 rounded w-16"></div>
          <div className="h-3 bg-light-borders-lines/40 dark:bg-dark-borders-lines/40 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    // Use theme background colors
    <div className="flex items-center justify-center min-h-screen bg-light-background dark:bg-dark-background">
      <div className="text-center space-y-3 sm:space-y-4"> {/* Responsive spacing */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-dt-primary border-t-transparent rounded-full animate-spin mx-auto"></div> {/* Responsive spinner size */}
        <p className="text-light-text-primary dark:text-dark-text-primary font-medium text-sm sm:text-base">Loading...</p> {/* Themed text, responsive size */}
      </div>
    </div>
  );
}

export function EmptyState({ 
  title, 
  description, 
  actionText, 
  onAction 
}: { 
  title: string; 
  description: string; 
  actionText?: string; 
  onAction?: () => void; 
}) {
  return (
    <div className="text-center py-10 sm:py-16 px-4"> {/* Responsive padding */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-dt-primary/20 rounded-full flex items-center justify-center"> {/* Responsive Icon Container */}
        <Music className="h-8 w-8 sm:h-10 sm:h-10 text-dt-primary" /> {/* Responsive Icon */}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">{title}</h3> {/* Responsive Text, Themed Color */}
      <p className="text-sm sm:text-base text-light-text-secondary dark:text-dark-text-secondary mb-4 sm:mb-6 max-w-sm sm:max-w-md mx-auto">{description}</p> {/* Responsive Text, Themed Color, Max-width */}
      {actionText && onAction && (
        // Assuming btn-primary is already responsive, otherwise, add responsive text/padding here too
        <Button onClick={onAction} className="btn-primary text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-2.5">
          {actionText}
        </Button>
      )}
    </div>
  );
}
