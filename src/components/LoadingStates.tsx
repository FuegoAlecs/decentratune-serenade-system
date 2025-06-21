
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrackCardSkeleton() {
  return (
    <div className="glass-card p-4 rounded-2xl animate-pulse">
      <div className="w-full aspect-square bg-gray-600 rounded-xl mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-600 rounded w-3/4"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-700 rounded w-16"></div>
          <div className="h-3 bg-gray-700 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-dark">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-dt-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-white font-medium">Loading...</p>
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
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 bg-dt-primary/20 rounded-full flex items-center justify-center">
        <Music className="h-12 w-12 text-dt-primary" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-dt-gray-light mb-6 max-w-md mx-auto">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="btn-primary">
          {actionText}
        </Button>
      )}
    </div>
  );
}
