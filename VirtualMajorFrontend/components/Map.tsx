
import React from 'react';
import { Region } from '../types';
import { AlertCircle, TrendingUp, Users, Zap, MapPin, Trees, Mountain } from 'lucide-react';

interface MapProps {
  onRegionSelect: (region: Region) => void;
  selectedRegionId?: string;
  regions: Region[];
}

// Placeholder images mapping for regions
const regionImages: Record<string, string> = {
  nov_centur: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=400',
  star_centur: 'https://images.unsplash.com/photo-1518391846015-55a9cb003b25?auto=format&fit=crop&q=80&w=400',
  gorno_raikovo: 'https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=400',
  dolno_raikovo: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=400',
  ustovo: 'https://images.unsplash.com/photo-1521791136064-7986c2959d1c?auto=format&fit=crop&q=80&w=400',
  neviastata: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400',
  kaptaja: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=400',
  stanevska: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=400',
  ezerovo: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=400'
};

export const Map: React.FC<MapProps> = ({ onRegionSelect, selectedRegionId, regions }) => {
  return (
    <div className="relative w-full md:aspect-[16/9] bg-white rounded-[2.5rem] md:rounded-[3rem] border border-emerald-100 overflow-hidden shadow-xl group flex flex-col p-4 md:p-10">
      <div className="absolute inset-0 bg-emerald-50 opacity-30" />

      <div className="relative z-10 flex items-center justify-between mb-4 md:mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-emerald-100 rounded-xl md:rounded-2xl text-emerald-600">
            <Mountain size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-black text-emerald-900 uppercase tracking-tighter leading-none">Карта на Районите</h2>
            <span className="text-[8px] md:text-[10px] font-bold text-emerald-600/50 uppercase tracking-widest">Гео-пространствен анализ</span>
          </div>
        </div>
        <div className="hidden md:block px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Система: Активна</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {regions.map((region) => {
          const isSelected = selectedRegionId === region.id;
          const isCrisis = region.status === 'crisis' || region.status === 'protest';

          return (
            <button
              key={region.id}
              onClick={() => onRegionSelect(region)}
              className={`
                relative transition-all duration-500 rounded-3xl md:rounded-[2.5rem] border overflow-hidden flex flex-col group/item
                min-h-[100px] md:min-h-[120px]
                ${isSelected
                  ? 'ring-4 ring-emerald-500 scale-[1.02] md:scale-105 z-20 shadow-2xl border-white'
                  : 'border-emerald-50 bg-white hover:border-emerald-200'
                }
              `}
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 z-0">
                <img src={regionImages[region.id]} className="w-full h-full object-cover opacity-20 grayscale transition-all duration-700" alt="" />
                <div className={`absolute inset-0 transition-opacity duration-500 ${isSelected ? 'opacity-10' : 'opacity-0'}`} style={{ backgroundColor: region.color }} />
              </div>

              {/* Status Indicator */}
              <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
                {isCrisis ? (
                  <div className="bg-red-500 p-1 md:p-1.5 rounded-full animate-pulse shadow-lg shadow-red-200">
                    <AlertCircle size={10} className="text-white md:w-3.5 md:h-3.5" />
                  </div>
                ) : region.status === 'growth' ? (
                  <div className="bg-emerald-500 p-1 md:p-1.5 rounded-full shadow-lg shadow-emerald-200">
                    <TrendingUp size={10} className="text-white md:w-3.5 md:h-3.5" />
                  </div>
                ) : null}
              </div>

              <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-3 md:p-6 bg-gradient-to-t from-white/95 via-white/40 to-transparent">
                <span className={`text-[10px] md:text-sm font-black uppercase tracking-tighter text-center leading-tight transition-colors ${isSelected ? 'text-emerald-900' : 'text-emerald-800/60 group-hover/item:text-emerald-900'}`}>
                  {region.name}
                </span>
                <div className={`h-0.5 md:h-1 w-6 md:w-8 rounded-full mt-1.5 md:mt-2 transition-all duration-500 ${isSelected ? 'w-10 md:w-16 bg-emerald-500' : 'bg-emerald-100'}`} />
              </div>

              {isSelected && (
                <div className="absolute bottom-2 md:bottom-4 left-0 right-0 px-3 md:px-6 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex gap-1 md:gap-2">
                    <Zap size={10} className="text-lime-500 md:w-3.5 md:h-3.5" />
                    <Users size={10} className="text-emerald-500 md:w-3.5 md:h-3.5" />
                  </div>
                  <div className="text-[6px] md:text-[8px] font-black tracking-widest uppercase text-emerald-900/40 hidden md:block">ОПЕРАТИВЕН КОНТРОЛ</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
