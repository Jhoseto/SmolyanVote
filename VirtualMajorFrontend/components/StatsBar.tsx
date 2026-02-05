
import React from 'react';
import { CityResources } from '../types';
import { Wallet, Users, Zap, Leaf, Construction, Heart } from 'lucide-react';

interface StatsBarProps {
  resources: CityResources;
}

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string; max?: number }> = ({ icon, label, value, color, max = 100 }) => {
  const numericValue = typeof value === 'number' ? value : 0;
  const percentage = Math.min(100, (numericValue / max) * 100);

  return (
    <div className="flex flex-col gap-1.5 md:gap-2 flex-1 min-w-[120px] md:min-w-[150px] p-3 md:p-4 rounded-3xl md:rounded-[2rem] bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`${color} w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100 flex-shrink-0`}>
          {React.cloneElement(icon as React.ReactElement, { size: 14 })}
        </div>
        <span className="text-[8px] md:text-[9px] text-emerald-800 font-black uppercase tracking-widest opacity-40 text-right leading-tight ml-2">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between mt-0.5 md:mt-1">
        <span className="text-sm md:text-xl font-black text-emerald-950 leading-none truncate">
          {typeof value === 'number' ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : value}
        </span>
      </div>
      {max === 100 && (
        <div className="w-full h-1 md:h-1.5 bg-emerald-50 rounded-full mt-1.5 md:mt-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${numericValue < 25 ? 'bg-red-400' : numericValue < 55 ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const StatsBar: React.FC<StatsBarProps> = ({ resources }) => {
  return (
    <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2 md:gap-4 w-full animate-in fade-in slide-in-from-top duration-700">
      <StatItem icon={<Wallet />} label="Фонд" value={`${resources.budget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} евро`} color="bg-emerald-500" max={10000000} />
      <StatItem icon={<Heart />} label="Доверие" value={resources.trust} color="bg-rose-500" />
      <StatItem icon={<Construction />} label="Инфра" value={resources.infrastructure} color="bg-blue-500" />
      <StatItem icon={<Leaf />} label="Еко" value={resources.eco} color="bg-green-600" />
      <StatItem icon={<Users />} label="Жители" value={resources.population} color="bg-emerald-800" max={50000} />
      <StatItem icon={<Zap />} label="Иновация" value={resources.innovation} color="bg-lime-500" />
    </div>
  );
};
