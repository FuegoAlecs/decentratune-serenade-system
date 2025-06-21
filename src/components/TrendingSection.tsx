
import { TrendingUp, Flame } from "lucide-react";

// Mock data for trending tracks is removed.
// Real trending data would require a backend service for analytics.
// For now, we will display a placeholder message.

export function TrendingSection() {
  return (
    <section className="mb-12">
      <div className="flex items-center mb-6 md:mb-8">
        <Flame className="h-6 w-6 text-dt-accent mr-2 sm:mr-3" />
        <h2 className="font-satoshi font-bold text-2xl sm:text-3xl text-light-text-primary dark:text-dark-text-primary">Trending Now</h2>
      </div>

      <div className="glass-card p-4 sm:p-6 rounded-2xl">
        <div className="text-center text-dt-gray-light py-8">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-dt-primary" />
          <p className="text-lg font-semibold">Trending Tracks Coming Soon!</p>
          <p className="text-sm">We're working on bringing you the latest trending music. Check back later!</p>
        </div>
      </div>
    </section>
  );
}
