import { ShieldCheckIcon, ClockIcon, BoltIcon } from '@heroicons/react/24/outline';

export default function TrustBadges() {
  const badges = [
    {
      icon: ShieldCheckIcon,
      text: "Données Officielles",
      subtext: "DVF, Géorisques, INSEE"
    },
    {
      icon: BoltIcon,
      text: "Analyse IA",
      subtext: "127 points de contrôle"
    },
    {
      icon: ClockIcon,
      text: "Instantané",
      subtext: "Rapport en < 45sec"
    }
  ];

  return (
    <div className="flex flex-wrap justify-center gap-6 md:gap-12">
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-brand-300">
            <badge.icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-white">{badge.text}</div>
            <div className="text-xs text-gray-500">{badge.subtext}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
