
import { Users, Music, Coins, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: Users,
    label: "Active Artists",
    value: "12,450",
    change: "+8.2%",
  },
  {
    icon: Music,
    label: "Tracks Minted",
    value: "89,230",
    change: "+15.3%",
  },
  {
    icon: Coins,
    label: "Total Volume",
    value: "2.4M ETH",
    change: "+23.7%",
  },
  {
    icon: TrendingUp,
    label: "Monthly Streams",
    value: "45.2M",
    change: "+12.1%",
  },
];

export function StatsSection() {
  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="glass-card p-6 rounded-2xl text-center">
            <div className="w-12 h-12 bg-dt-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <stat.icon className="h-6 w-6 text-dt-primary" />
            </div>
            <h3 className="font-satoshi font-bold text-2xl text-white mb-1">
              {stat.value}
            </h3>
            <p className="text-dt-gray-light text-sm mb-2">{stat.label}</p>
            <span className="text-green-500 text-sm font-medium">{stat.change}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
