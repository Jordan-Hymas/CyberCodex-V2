export interface CommunityStatsProps {
  totalUsers: number;
  totalXP: number;
  activeToday?: number;
}

export function CommunityStats({ totalUsers, totalXP, activeToday = 0 }: CommunityStatsProps) {
  const stats = [
    { label: "Players", value: totalUsers, color: "text-cyber-primary" },
    { label: "XP earned", value: totalXP, color: "text-cyber-warning" },
    { label: "Active today", value: activeToday, color: "text-cyber-secondary" },
  ];

  return (
    <dl className="pixel-panel grid grid-cols-3 divide-x-2 divide-dashed divide-cyber-border lg:grid-cols-1 lg:divide-x-0 lg:divide-y-2">
      {stats.map((stat) => (
        <div key={stat.label} className="p-4 text-center lg:flex lg:items-center lg:justify-between lg:text-left">
          <dt className="pixel-label text-cyber-text-muted">{stat.label}</dt>
          <dd className={`mt-1 font-pixel text-base lg:mt-0 ${stat.color}`}>{stat.value.toLocaleString()}</dd>
        </div>
      ))}
    </dl>
  );
}
