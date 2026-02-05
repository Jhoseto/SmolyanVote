
import React, { useState } from 'react';
import { Investment } from '../types';
import { Hammer, CheckCircle, Wallet, Info, Trash2, ArrowRight, Construction, Zap, TrendingUp, Heart, Leaf, Users } from 'lucide-react';

interface InvestmentPanelProps {
  availableProjects: Investment[];
  activeProjects: Investment[];
  completedProjects: Investment[];
  budget: number;
  onStart: (p: Investment) => void;
  onCancel: (id: string) => void;
  onReject: (id: string) => void;
}

export const getImpactIcon = (key: string) => {
  switch (key) {
    case 'budget': return <Wallet size={12} className="text-emerald-500" />;
    case 'trust': return <Heart size={12} className="text-rose-500" />;
    case 'infrastructure': return <Construction size={12} className="text-blue-500" />;
    case 'eco': return <Leaf size={12} className="text-green-500" />;
    case 'population': return <Users size={12} className="text-emerald-800" />;
    case 'innovation': return <Zap size={12} className="text-lime-500" />;
    default: return <TrendingUp size={12} />;
  }
};

export const getImpactLabel = (key: string) => {
  const labels: Record<string, string> = {
    budget: 'Бюджет',
    trust: 'Доверие',
    infrastructure: 'Инфраструктура',
    eco: 'Екология',
    population: 'Население',
    innovation: 'Иновация'
  };
  return labels[key] || key;
};

export const InvestmentPanel: React.FC<InvestmentPanelProps> = ({
  availableProjects, activeProjects, completedProjects, budget, onStart, onCancel, onReject
}) => {
  const [tab, setTab] = useState<'market' | 'active' | 'done'>('market');
  const [showInfoId, setShowInfoId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl md:rounded-[2.5rem] border border-emerald-100 overflow-hidden shadow-sm">
      <div className="flex border-b border-emerald-50 bg-emerald-50/30 p-1 md:p-2 gap-1 shrink-0">
        {[
          { id: 'market', label: 'Инвестиции', icon: <TrendingUp size={14} /> },
          { id: 'active', label: 'Строеж', icon: <Construction size={14} /> },
          { id: 'done', label: 'Завършени', icon: <CheckCircle size={14} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex-1 py-3 md:py-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-white text-emerald-600 shadow-sm border border-emerald-50' : 'text-emerald-300 hover:text-emerald-500'}`}
          >
            {t.icon} <span className="hidden md:inline">{t.label}</span>
            <span className="md:hidden text-[7px]">{t.label.slice(0, 5)}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 scrollbar-hide">
        {tab === 'market' && availableProjects.map((p, index) => {
          const isInfoVisible = showInfoId === p.id;
          return (
            <div
              key={p.id}
              className="p-4 md:p-6 rounded-3xl md:rounded-[2rem] border border-emerald-50 hover:border-emerald-300 transition-all group relative bg-white"
            >
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <h4 className="font-black text-emerald-900 text-sm md:text-base tracking-tighter leading-tight pr-2">{p.name}</h4>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[9px] md:text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 md:px-3 py-0.5 md:py-1 rounded-lg md:rounded-xl border border-emerald-100">{p.cost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} евро</span>
                </div>
              </div>
              <p className="text-[10px] md:text-xs text-emerald-900/50 mb-4 md:mb-6 font-medium leading-relaxed">{p.description}</p>

              {/* Expandable Info Panel for Mobile & Desktop */}
              <div className={`overflow-hidden transition-all duration-300 ${isInfoVisible ? 'max-h-40 mb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-emerald-50/50 border border-emerald-100 p-3 md:p-4 rounded-2xl">
                  <div className="text-[8px] md:text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 border-b border-emerald-100 pb-1">Ефект при завършване</div>
                  <div className="grid grid-cols-2 gap-x-3 md:gap-x-4 gap-y-1.5 md:gap-y-2">
                    {Object.entries(p.impact).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1.5 md:gap-2">
                        <div className="p-1 bg-white rounded-lg scale-75 md:scale-100">
                          {getImpactIcon(key)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[7px] md:text-[8px] font-bold text-emerald-600/50 uppercase leading-none">{getImpactLabel(key)}</span>
                          <span className={`text-[9px] md:text-[11px] font-black ${Number(value) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {Number(value) > 0 ? '+' : ''}{value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={budget < p.cost}
                  onClick={() => onStart(p)}
                  className="flex-[3] py-3 md:py-4 rounded-xl md:rounded-2xl bg-emerald-600 text-white text-[9px] md:text-[10px] font-black uppercase hover:bg-emerald-700 transition-all disabled:opacity-30 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  <Hammer size={14} className="md:w-4 md:h-4" /> <span className="hidden md:inline">Стартирай</span>
                </button>
                <button
                  onClick={() => setShowInfoId(isInfoVisible ? null : p.id)}
                  className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl border transition-all flex items-center justify-center ${isInfoVisible ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-emerald-100 text-emerald-400'}`}
                >
                  <Info size={16} />
                </button>
                <button
                  onClick={() => onReject(p.id)}
                  className="flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white border border-emerald-100 text-emerald-300 text-[9px] md:text-[10px] font-black uppercase hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {tab === 'active' && activeProjects.map(p => {
          const progress = (p.currentStep / p.totalSteps) * 100;
          return (
            <div key={p.id} className="p-4 md:p-6 rounded-3xl md:rounded-[2rem] bg-emerald-50/50 border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-3 md:mb-5">
                <div>
                  <h4 className="font-black text-emerald-900 text-sm md:text-base tracking-tighter leading-none mb-1">{p.name}</h4>
                  <p className="text-[8px] md:text-[10px] text-emerald-500 font-bold uppercase">В процес</p>
                </div>
                <button onClick={() => onCancel(p.id)} className="text-emerald-300 hover:text-red-500 transition-colors p-1.5 md:p-2 bg-white rounded-lg md:rounded-xl shadow-sm"><Trash2 size={14} /></button>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="w-full h-2 md:h-4 bg-white rounded-full overflow-hidden border border-emerald-100 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Construction size={12} className="text-emerald-400 animate-bounce md:w-3.5 md:h-3.5" />
                    <span className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">Прогрес</span>
                  </div>
                  <span className="text-xs md:text-sm font-black text-emerald-900">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          );
        })}

        {tab === 'done' && completedProjects.map(p => (
          <div key={p.id} className="p-4 rounded-2xl bg-white border border-emerald-50 flex items-center justify-between group hover:border-emerald-200 transition-all shadow-sm">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle size={16} className="text-emerald-600 md:w-5 md:h-5" />
              </div>
              <div>
                <h4 className="font-black text-xs md:text-sm text-emerald-900 tracking-tight">{p.name}</h4>
                <span className="text-[8px] md:text-[9px] font-bold text-emerald-400 uppercase">Изпълнен</span>
              </div>
            </div>
            <ArrowRight size={14} className="text-emerald-100 group-hover:text-emerald-500 transition-colors md:w-4 md:h-4" />
          </div>
        ))}

        {(tab === 'market' && availableProjects.length === 0) || (tab === 'active' && activeProjects.length === 0) || (tab === 'done' && completedProjects.length === 0) ? (
          <div className="h-48 flex flex-col items-center justify-center text-emerald-100 opacity-50">
            <Info size={48} />
            <p className="font-black uppercase tracking-widest mt-4">Секцията е празна</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
