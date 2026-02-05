
import React, { useState, useEffect, useRef } from 'react';
import { StatsBar } from './components/StatsBar';
import { Map } from './components/Map';
import { InvestmentPanel } from './components/InvestmentPanel';
import { processTurn, loadGame, createNewGame } from './services/geminiService';
import {
  INITIAL_RESOURCES,
  ALL_POTENTIAL_PROJECTS,
  REGIONS as INITIAL_REGIONS
} from './constants';
import {
  GameState,
  CityResources,
  Region,
  AIResponse,
  Investment
} from './types';
import { TrendingUp, AlertTriangle, Calendar, ChevronRight, MessageSquare, Play, Bell, Map as MapIcon, XCircle, BrainCircuit, Trees, Mountain, Clock, Sparkles, MapPin, UserCheck, FileText, Newspaper, Building, Sun, Moon, Hammer, Info, Trash2, CheckCircle, ArrowRight, Eye, Users, Wallet } from 'lucide-react';

const AnimatedNumber: React.FC<{ value: number, duration?: number }> = ({ value, duration = 3000 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    let animationFrame: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // High-end cubic easing out for "premium" feel
      const easing = 1 - Math.pow(1 - progress, 4);

      const current = Math.floor(startValue + (endValue - startValue) * easing);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}</span>;
};

const LoadingOverlay: React.FC<{ month: number, prev?: CityResources, current?: CityResources }> = ({ month, prev, current }) => {
  const [day, setDay] = useState(1);
  const [captionIndex, setCaptionIndex] = useState(0);

  const captions = [
    "Общинският съвет заседава в Смолян...",
    "Анализираме демографските показатели...",
    "Бюджетната комисия калкулира разходите...",
    "Екологичният инспекторат проверява изворите...",
    "Планираме бъдещето на Родопите...",
    "Слънцето над Перелик се издига...",
    "Транспортната мрежа се актуализира...",
    "Гражданите подават нови предложения..."
  ];

  useEffect(() => {
    const dayInterval = setInterval(() => {
      setDay(prevDay => (prevDay >= 30 ? 1 : prevDay + 1));
    }, 100);

    const captionInterval = setInterval(() => {
      setCaptionIndex(prevIndex => (prevIndex + 1) % captions.length);
    }, 2000);

    return () => {
      clearInterval(dayInterval);
      clearInterval(captionInterval);
    };
  }, []);

  const getDelta = (key: keyof CityResources) => {
    if (!prev || !current) return 0;
    return current[key] - prev[key];
  };

  const renderDataCard = (label: string, value: number, delta: number, icon: React.ReactNode, delay: string) => (
    <div className={`flex items-center justify-between p-2 md:p-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both ${delay}`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-white shadow-inner">
          {icon}
        </div>
        <div>
          <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.15em] mb-0.5">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-white tracking-tighter">
              <AnimatedNumber value={value} />
            </span>
          </div>
        </div>
      </div>
      {delta !== 0 && (
        <div className={`flex flex-col items-end animate-in zoom-in fade-in duration-1000 delay-1000`}>
          <span className={`text-[10px] font-black flex items-center gap-1 ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {delta > 0 ? '+' : ''}{delta.toLocaleString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
            {delta > 0 ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
          </span>
          <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-0.5">Тенденция</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden">
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 bg-emerald-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/50 via-emerald-900/50 to-emerald-950 animate-sky-cycle" />
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {/* Decorative Light Rays */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent rotate-12 blur-sm" />
      <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent -rotate-12 blur-sm" />

      {/* Main HUD Container */}
      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-12">

        {/* Left Side: Secondary Stats (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col gap-3 w-56">
          {prev && current && (
            <>
              {renderDataCard("Инфраструктура", current.infrastructure, getDelta("infrastructure"), <Building size={18} />, "delay-[200ms]")}
              {renderDataCard("Екология", current.eco, getDelta("eco"), <Trees size={18} />, "delay-[400ms]")}
            </>
          )}
        </div>

        {/* Center Piece: Calendar & Captions */}
        <div className="flex flex-col items-center flex-1">
          <div className="relative group">
            <div className="absolute -inset-8 bg-emerald-500/20 rounded-full blur-[80px] animate-pulse pointer-events-none" />
            <div className="w-48 h-64 md:w-56 md:h-72 bg-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border-t-[16px] border-emerald-600 flex flex-col overflow-hidden animate-calendar-flip relative z-10">
              <div className="bg-emerald-50 py-3 text-center border-b border-emerald-100">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-[0.3em]">Месец {month}</span>
              </div>
              <div className="flex-1 flex items-center justify-center bg-white relative">
                <span className="text-[6rem] md:text-[7rem] font-black text-emerald-950 tabular-nums tracking-tighter leading-none">{day}</span>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/[0.03] pointer-events-none" />
              </div>
              <div className="bg-emerald-600 py-2.5 text-center">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.15em]">СИМУЛАЦИЯ: СМОЛЯН</span>
              </div>
            </div>
          </div>

          <div className="mt-10 md:mt-16 text-center h-16 flex items-center justify-center">
            <p className="text-white text-lg md:text-xl font-black italic tracking-tight animate-pulse transition-all duration-1000 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              {captions[captionIndex]}
            </p>
          </div>
        </div>

        {/* Right Side: Primary Stats */}
        <div className="flex flex-col gap-3 w-full md:w-56">
          {prev && current && (
            <>
              {renderDataCard("Население", current.population, getDelta("population"), <UserCheck size={18} />, "delay-[600ms]")}
              {renderDataCard("Фонд (Евро)", current.budget, getDelta("budget"), <Sparkles size={18} />, "delay-[800ms]")}
              {renderDataCard("Доверие", current.trust, getDelta("trust"), <TrendingUp size={18} />, "delay-[1000ms]")}
            </>
          )}
          <div className="mt-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_15px_#34d399] animate-ping" />
            <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.3em]">Актуализация...</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sky-cycle {
          0%, 100% { filter: hue-rotate(0deg) brightness(0.6); }
          50% { filter: hue-rotate(30deg) brightness(1.1); }
        }
        @keyframes orbit {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes calendar-flip {
          0%, 100% { transform: scale(1) translateY(0) rotate(0deg); }
          50% { transform: scale(1.02) translateY(-15px) rotate(1deg); }
        }
        .animate-sky-cycle { animation: sky-cycle 10s ease-in-out infinite; }
        .animate-orbit { animation: orbit 6s linear infinite; }
        .animate-calendar-flip { animation: calendar-flip 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const InfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[500] bg-emerald-950/95 backdrop-blur-3xl flex items-center justify-center p-3 md:p-8 overflow-hidden scrollbar-hide">
      <div className="bg-white/95 w-full max-w-5xl md:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col animate-in zoom-in duration-500 h-[85vh]">
        {/* Header Section */}
        <div className="p-6 md:p-10 bg-gradient-to-br from-emerald-800 via-emerald-900 to-green-950 text-white flex justify-between items-center relative overflow-hidden shrink-0 border-b border-white/10">
          <div className="absolute -right-16 -bottom-16 opacity-10 rotate-12 scale-125"><Info size={180} /></div>
          <div className="relative z-10">
            <h2 className="font-['Cinzel'] text-2xl md:text-4xl font-black uppercase tracking-tight leading-none text-stone-100">Наръчник на кмета</h2>
            <div className="flex items-center gap-3 mt-4">
              <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">Техническа документация</span>
              <div className="h-px w-16 bg-emerald-400/30" />
              <p className="text-[10px] font-bold text-emerald-300 italic">Версия 2030.1 • Смолян</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-90 relative z-10 border border-white/10 group">
            <XCircle size={32} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 bg-white/40 scroll-smooth">

          {/* Section: Quick Start Guide */}
          <div className="relative">
            <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-emerald-500 rounded-full" />
            <h3 className="font-['Cinzel'] text-xl font-black text-emerald-950 mb-6 flex items-center gap-4">
              <span className="text-blue-500 text-3xl opacity-30">01</span>
              Първи стъпки: Как да започна?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Провери Оперативните задачи", desc: "Кликнете върху големия бутон 'Оперативни задачи' горе вдясно. Там ви очакват AI казуси, които изискват вашето решение за месеца.", color: "bg-amber-500" },
                { step: "2", title: "Управлявай ресурсите", desc: "Погледнете левия панел – настройте данъците. Ако бюджетът е на червено, вдигнете ги леко, но не гонете хората!", color: "bg-blue-500" },
                { step: "3", title: "Завърши хода", desc: "След като сте направили изборите си, натиснете 'Следващ ход' горе вдясно. AI ще изчисли ефекта от вашите действия.", color: "bg-emerald-500" }
              ].map((item) => (
                <div key={item.step} className="bg-white p-5 rounded-[2rem] border border-emerald-100 shadow-sm relative group hover:shadow-xl transition-all">
                  <div className={`absolute -top-3 -left-3 w-9 h-9 ${item.color} text-white rounded-xl flex items-center justify-center font-black text-base shadow-lg`}>{item.step}</div>
                  <h4 className="text-sm font-black text-emerald-900 mb-3 mt-2 leading-tight">{item.title}</h4>
                  <p className="text-emerald-800/70 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Technical Interface Explanation */}
          <div className="space-y-8">
            <h3 className="font-['Cinzel'] text-xl font-black text-emerald-950 mb-6 flex items-center gap-4">
              <span className="text-emerald-500 text-3xl opacity-30">02</span>
              Интерфейс: Къде да натискам?
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* UI Guide Item */}
              <div className="flex gap-5 group">
                <div className="shrink-0 w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-inner">
                  <MapIcon size={28} />
                </div>
                <div>
                  <h4 className="font-black text-base text-emerald-950 mb-2 uppercase tracking-tight">Карта и Региони</h4>
                  <p className="text-emerald-900/60 leading-relaxed text-xs">
                    **Кликнете директно върху иконите на картата.** Жълтите маркери са квартали. Ако видите символ за криза, кликнете върху него, за да приложите **интервенция** (Ремонт, Патрул или Субсидия). Това струва пари, но спасява доверието.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="shrink-0 w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-inner">
                  <Building size={36} />
                </div>
                <div>
                  <h4 className="font-black text-xl text-emerald-950 mb-3 uppercase tracking-tight">Инвестиционни Проекти</h4>
                  <p className="text-emerald-900/60 leading-relaxed text-sm">
                    **Долният десен панел.** Там ще виждате предложения за инвестиции. Кликнете **"Започни"**, за да стартирате строителство. Проектите отнемат няколко месеца. Бутонът **"Отхвърли"** ще премахне предложението и ще генерира ново.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="shrink-0 w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 shadow-inner">
                  <BrainCircuit size={36} />
                </div>
                <div>
                  <h4 className="font-black text-xl text-emerald-950 mb-3 uppercase tracking-tight">Анализ на състоянието</h4>
                  <p className="text-emerald-900/60 leading-relaxed text-sm">
                    **Бутонът "Анализ" в хедъра.** Използвайте го по всяко време, за да получите обобщение от вашия AI асистент за това какво е постигнато до момента, какви са основните проблеми и къде точно се намира градът в своето развитие.
                  </p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="shrink-0 w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 shadow-inner">
                  <Bell size={36} />
                </div>
                <div>
                  <h4 className="font-black text-xl text-emerald-950 mb-3 uppercase tracking-tight">Оперативни Задачи</h4>
                  <p className="text-emerald-900/60 leading-relaxed text-sm">
                    **Бутонът вдясно на Хедъра.** Когато имате нови задачи, той ще свети и пулсира. Кликнете върху всяка задача, за да прочетете описанието и да изберете един от трите варианта за решение. Всяко решение се отразята на града мигновено.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Area */}
        <div className="p-10 md:p-14 bg-white/80 border-t border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-8 shrink-0">
          <div className="flex flex-col">
            <span className="text-lg font-black text-emerald-950 uppercase tracking-tighter">Спрете да четете, г-н Кмет.</span>
            <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest mt-1">Гражданите на Смолян очакват вашите решения.</p>
          </div>
          <button
            onClick={onClose}
            className="w-full md:w-auto px-24 py-7 bg-emerald-700 hover:bg-emerald-800 text-white rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-sm transition-all shadow-2xl shadow-emerald-200 active:scale-95 group overflow-hidden relative"
          >
            <span className="relative z-10">Към управлението</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
        </div>
      </div>
    </div>
  );
};

const WelcomeScreen: React.FC<{ onStart: () => void, onOpenInfo: () => void, resources: CityResources }> = ({ onStart, onOpenInfo, resources }) => {
  return (
    <div className="absolute inset-0 z-[300] bg-black flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Cinematic Background - Real Smolyan View */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/virtual-mayor-assets/smolyan-bg.jpg"
          className="w-full h-full object-cover opacity-60 scale-100 animate-in fade-in zoom-in duration-[5000ms]"
          alt="Real Smolyan View"
        />
        {/* Cinematic Lighting Overlays - Darkened as requested */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />

        {/* Subtle Sun Flare (Top Right) */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-500/5 blur-[150px] rounded-full animate-pulse" />
      </div>

      {/* Main UI Container */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center px-10 md:px-24">

        {/* Left HUD (Matches reference image column) */}
        <div className="absolute left-10 md:left-24 top-1/2 -translate-y-1/2 flex flex-col gap-16 animate-in slide-in-from-left-20 duration-1000 delay-500 fill-mode-both">
          {/* Vertical Technical Line */}
          <div className="absolute -left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-400/30 to-transparent" />

          {[
            { label: "НАСЕЛЕНИЕ:", value: resources.population, icon: <UserCheck size={20} />, color: "blue", prefix: "" },
            { label: "БЮДЖЕТ:", value: resources.budget, icon: <Sparkles size={20} />, color: "blue", prefix: "€ " },
            { label: "ДОВЕРИЕ:", value: `${resources.trust}/50`, icon: <TrendingUp size={20} />, color: "blue", prefix: "" }
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 group">
              {/* Technical Bracket Icon */}
              <div className="relative flex items-center justify-center">
                <div className="text-blue-400/80 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                  {stat.icon}
                </div>
                {/* Visual Brackets from reference */}
                <div className="absolute -left-2 -top-0.5 w-1.5 h-1.5 border-t border-l border-white/20" />
                <div className="absolute -right-2 -bottom-0.5 w-1.5 h-1.5 border-b border-r border-white/20" />
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/50 tracking-[0.15em] mb-0.5 font-sans">{stat.label}</span>
                <span className="text-xl font-black text-stone-100 tracking-tighter tabular-nums drop-shadow-lg">
                  {stat.prefix}{typeof stat.value === 'number' ? <AnimatedNumber value={stat.value} /> : stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Central Component (Matches reference card/title) */}
        <div className="self-center w-full max-w-6xl relative flex flex-col items-center justify-center animate-in zoom-in fade-in duration-1000 delay-300">

          {/* Orbital Technical Elements Behind */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-[45rem] h-[45rem] border border-blue-400/10 rounded-full animate-spin-slow" />
            <div className="absolute w-[35rem] h-[35rem] border border-white/5 rounded-full animate-spin-reverse" />
            <div className="absolute w-[40rem] h-[40.5rem] border-l border-r border-blue-400/20 rounded-full animate-pulse" />
          </div>

          {/* Main Glass Panel */}
          <div className="relative w-full aspect-[21/9] flex flex-col items-center justify-center bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl md:rounded-[1.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Corner Markers */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-white/10" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-white/10" />

            {/* Title Content */}
            <div className="relative z-10 text-center px-6">
              <h2 className="font-['Cinzel'] text-[10px] md:text-sm font-bold tracking-[0.5em] text-stone-100/60 mb-1 drop-shadow-2xl">
                ВИРТУАЛЕН КМЕТ
              </h2>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto my-2" />
              <h1 className="font-['Cinzel'] text-3xl md:text-5xl font-black tracking-[-0.02em] leading-none text-stone-gold select-none filter contrast-125">
                СМОЛЯН
              </h1>
            </div>

            {/* Scanning Line Animation */}
            <div className="absolute left-0 right-0 h-px bg-blue-400/10 shadow-[0_0_15px_rgba(96,165,250,0.3)] animate-scan pointer-events-none" />
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-2xl mx-auto my-4">
            {/* Stat items - reduced size */}
            {[
              { icon: <Users size={18} />, label: "Население", val: "30k" },
              { icon: <Wallet size={18} />, label: "Бюджет", val: "5M" },
              { icon: <TrendingUp size={18} />, label: "Рейтинг", val: "A+" }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="text-stone-300">{s.icon}</div>
                <div className="text-xl font-black text-white leading-none">{s.val}</div>
                <div className="text-[9px] text-emerald-400 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col md:flex-row items-center gap-4">
            <button
              onClick={onStart}
              className="group relative px-10 py-3 bg-white/5 hover:bg-emerald-600/20 text-white rounded-full font-['Inter'] font-light uppercase tracking-[0.4em] text-[10px] transition-all border border-white/20 hover:border-emerald-400 backdrop-blur-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
            >
              <span className="relative z-10">Започни мандата</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            <button
              onClick={onOpenInfo}
              className="group px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all backdrop-blur-xl shadow-2xl relative font-['Inter'] font-light uppercase tracking-[0.4em] text-[10px] text-white/70 hover:text-white"
            >
              ИНФОРМАЦИЯ
              <div className="absolute -inset-1 border border-white/5 rounded-full group-hover:scale-105 transition-all opacity-0 group-hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* Secondary Technical HUD Overlays */}
        <div className="absolute top-12 right-12 text-right opacity-30 animate-pulse hidden md:block">
          <div className="flex flex-col gap-1">
            {[
              "STATUS: PROTOCOL_READY",
              "REGION: RODOPE_SMOLYAN_VALLEY",
              "VERSION: 2.1.0_BETA",
              `TIME: ${new Date().toLocaleTimeString('bg-BG')}`
            ].map(line => (
              <span key={line} className="text-[9px] font-black tracking-[0.4em] uppercase text-white/80">{line}</span>
            ))}
          </div>
        </div>

        <div className="absolute bottom-12 left-10 md:left-24 flex items-center gap-10 opacity-40">
          <span className="text-[10px] font-black tracking-[0.6em] text-white/60">СИМУЛАЦИЯ: УСТОЙЧИВО РАЗВИТИЕ</span>
          <div className="h-px w-20 bg-white/20" />
          <span className="text-[10px] font-black tracking-[0.6em] text-white/60">© 2030 ОБЩИНА СМОЛЯН</span>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-spin-slow { animation: spin-slow 60s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 40s linear infinite; }
        .animate-scan { animation: scan 8s linear infinite; }
      `}</style>
    </div>
  );
};

const LogsModal: React.FC<{ logs: string[], onClose: () => void }> = ({ logs, onClose }) => {
  return (
    <div className="absolute inset-0 z-[500] bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-6 overflow-hidden scrollbar-hide">
      <div className="bg-white w-full max-w-4xl md:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-500 h-[80vh] border-b-8 border-emerald-600">
        <div className="p-8 md:p-12 bg-white flex justify-between items-center relative overflow-hidden shrink-0 border-b border-emerald-50">
          <div>
            <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter leading-none">Оперативен дневник</h2>
            <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest mt-2 flex items-center gap-2">
              <Clock size={14} /> Пълна история на събитията • Община Смолян
            </p>
          </div>
          <button onClick={onClose} className="p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-3xl transition-all active:scale-90 shadow-sm">
            <XCircle size={32} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-4 bg-emerald-50/20">
          {logs.slice().reverse().map((log, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex gap-6 items-start animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                <FileText size={20} />
              </div>
              <p className="text-emerald-900 font-medium leading-relaxed mt-2">{log}</p>
            </div>
          ))}
        </div>
        <div className="p-8 bg-white border-t border-emerald-50 text-center">
          <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.4em]">Край на дневника за текущия период</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [prevResources, setPrevResources] = useState<CityResources | undefined>(undefined);
  const [state, setState] = useState<GameState>({
    month: 1,
    year: 2030,
    resources: INITIAL_RESOURCES,
    taxes: { property: 1.8, vehicle: 2.2, waste: 1.2 },
    budgets: { culture: 60000, sport: 40000 },
    investments: [],
    availableProjects: [],
    history: [INITIAL_RESOURCES],
    consecutiveNegativeBudget: 0,
    isGameOver: false,
    logs: ["Добре дошли, г-н Кмет. Смолян ви очаква за първия работен ден."]
  });

  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS);
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showCasesPanel, setShowCasesPanel] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [resolvedCasesCount, setResolvedCasesCount] = useState(0);
  const [pendingImpacts, setPendingImpacts] = useState<Partial<CityResources>[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'cases' | 'stats'>('map');

  const scrollRef = useRef<HTMLDivElement>(null);

  const unreadCases = Math.max(0, (aiData?.cases.length || 0) - resolvedCasesCount);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Try to load existing session
      try {
        const savedSession = await loadGame();

        if (savedSession.exists && savedSession.gameState) {
          setState(savedSession.gameState);
          setGameStarted(true);

          // Fetch initial AI analysis if not already present
          const data = await processTurn(savedSession.gameState);
          setAiData(data);
        } else {
          // No session, prepare starter projects but don't call processTurn yet
          const starterProjects = ALL_POTENTIAL_PROJECTS.filter(p => p.tier === 1).sort(() => 0.5 - Math.random()).slice(0, 4);
          setState(prev => ({ ...prev, availableProjects: starterProjects }));
        }
      } catch (error) {
        console.error("Initialization error:", error);
        // Fallback to initial state
        const starterProjects = ALL_POTENTIAL_PROJECTS.filter(p => p.tier === 1).sort(() => 0.5 - Math.random()).slice(0, 4);
        setState(prev => ({ ...prev, availableProjects: starterProjects }));
      }

      setLoading(false);
    };
    init();
  }, []);

  const handleStartMandate = async () => {
    setLoading(true);
    try {
      // 1. Initialize session on backend
      const initialState = await createNewGame();

      // 2. Get initial AI events
      const data = await processTurn(initialState);

      setAiData(data);
      setState(initialState);
      setGameStarted(true);
      if (data.analysis) setShowAnalysisModal(true);
    } catch (error) {
      console.error("Error starting mandate:", error);
      // Fallback: just start locally if backend is down
      setGameStarted(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [state.logs]);

  const handleNextTurn = async () => {
    if (state.isGameOver || loading) return;
    setLoading(true);
    setShowCasesPanel(false);

    setPrevResources(state.resources);

    setState(prev => {
      let newResources = { ...prev.resources };
      let newYear = prev.year;
      let newMonth = prev.month + 1;

      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }

      pendingImpacts.forEach(impact => {
        Object.keys(impact).forEach(key => {
          const k = key as keyof CityResources;
          newResources[k] = (newResources[k] || 0) + (impact[k] || 0);
        });
      });

      // --- PREMIUM SIMULATION ENGINE ---
      const totalTax = prev.taxes.property + prev.taxes.vehicle + prev.taxes.waste;
      const isWinter = [1, 2, 12].includes(newMonth);

      // 1. Season-aware population change
      let popChange = -35; // Base churn
      popChange += (newResources.trust - 50) * 4;
      popChange += (newResources.innovation - 35) * 6;
      popChange += (newResources.infrastructure - 60) * 3;

      // Heavy taxation leads to exodus
      if (totalTax > 8) popChange -= (totalTax - 8) * 45;
      if (isWinter && newResources.infrastructure < 40) popChange -= 20;

      newResources.population = Math.max(5000, Math.floor(newResources.population + popChange));

      // 2. High-precision financial simulation
      let totalMaintenance = 120000; // Base city maintenance

      // Winter maintenance surcharge
      if (isWinter) totalMaintenance += 85000;

      regions.forEach(r => {
        if (r.status === 'crisis') totalMaintenance += 25000;
        // Infrastructure decay overhead
        totalMaintenance += (100 - newResources.infrastructure) * 1400;
      });

      // Revenue based on tax efficiency and population
      const taxEfficiency = totalTax / 5.2;
      const baseRevenue = (newResources.population * 68 * taxEfficiency) + (newResources.innovation * 2800);
      newResources.budget = Math.floor(newResources.budget + baseRevenue - totalMaintenance);

      const updatedInvestments = prev.investments.map(inv => {
        if (inv.isStarted && !inv.built) {
          const nextStep = inv.currentStep + 1;
          const isFinished = nextStep >= inv.totalSteps;
          if (isFinished) {
            Object.keys(inv.impact).forEach(k => {
              const key = k as keyof CityResources;
              newResources[key] = (newResources[key] || 0) + (inv.impact[key] || 0);
            });
          }
          return { ...inv, currentStep: nextStep, built: isFinished };
        }
        return inv;
      });

      let newMarket = prev.availableProjects;
      if (newMonth % 4 === 0 || prev.availableProjects.length < 2) {
        const currentIds = new Set([
          ...prev.availableProjects.map(p => p.id),
          ...prev.investments.map(p => p.id)
        ]);
        const possible = ALL_POTENTIAL_PROJECTS.filter(p => !currentIds.has(p.id));
        const tierFilter = newResources.innovation > 100 ? [2, 3] : [1, 2];
        const filtered = possible.filter(p => tierFilter.includes(p.tier));
        newMarket = [...prev.availableProjects, ...filtered.sort(() => 0.5 - Math.random()).slice(0, 3)].slice(-4);
      }

      const isGameOver = newResources.budget < -3000000 || newResources.trust < 5 || newResources.population < 15000;

      const newState = {
        ...prev,
        month: newMonth,
        year: newYear,
        resources: newResources,
        investments: updatedInvestments,
        availableProjects: newMarket,
        isGameOver,
        gameOverReason: newResources.population < 15000 ? "Градът се обезлюди критично." : (newResources.budget < -3000000 ? "Пълен финансов колапс." : "Вот на недоверие."),
        logs: [...prev.logs, `${newMonth}/${newYear}: ${popChange > 0 ? 'Ръст' : 'Спад'} на населението с ${Math.abs(Math.floor(popChange))} души.`]
      };

      return newState;
    });

    // 2. Process turn with AI outside of state updates
    try {
      // We calculate the expected next state to send to AI
      // This is slightly redundant but necessary to avoid side effects in setState
      const currentState = state;
      let newResources = { ...currentState.resources };
      let newYear = currentState.year;
      let newMonth = currentState.month + 1;
      if (newMonth > 12) { newMonth = 1; newYear += 1; }

      pendingImpacts.forEach(impact => {
        Object.keys(impact).forEach(key => {
          const k = key as keyof CityResources;
          newResources[k] = (newResources[k] || 0) + (impact[k] || 0);
        });
      });

      // Simple pop calculation for AI context (doesn't need to be 100% exact as state will be updated properly)
      let popChange = -35 + (newResources.trust - 50) * 4 + (newResources.innovation - 35) * 6;
      newResources.population = Math.max(5000, Math.floor(newResources.population + popChange));

      const aiState = { ...currentState, month: newMonth, year: newYear, resources: newResources };
      const data = await processTurn(aiState);

      setAiData(data);
      if (data.analysis) setShowAnalysisModal(true);
      if (data.regionUpdates) {
        setRegions(rgs => rgs.map(r => ({
          ...r,
          status: data.regionUpdates![r.id] || r.status
        })));
      }
    } catch (error) {
      console.error("Failed to process turn:", error);
    } finally {
      setLoading(false);
      setResolvedCasesCount(0);
      setPendingImpacts([]);
    }
  };

  const startProject = (project: Investment) => {
    setState(prev => ({
      ...prev,
      resources: { ...prev.resources, budget: prev.resources.budget - project.cost },
      investments: [...prev.investments, { ...project, isStarted: true, currentStep: 0 }],
      availableProjects: prev.availableProjects.filter(p => p.id !== project.id),
      logs: [...prev.logs, `🔨 Започнат проект: ${project.name}`]
    }));
  };

  const cancelProject = (id: string) => {
    setState(prev => ({
      ...prev,
      investments: prev.investments.filter(i => i.id !== id),
      logs: [...prev.logs, `⚠️ Спрян проект: ${id}`]
    }));
  };

  const rejectProject = (id: string) => {
    setState(prev => {
      const currentIds = new Set([
        ...prev.availableProjects.map(p => p.id),
        ...prev.investments.map(p => p.id)
      ]);
      const possible = ALL_POTENTIAL_PROJECTS.filter(p => !currentIds.has(p.id));
      const tierFilter = prev.resources.innovation > 100 ? [2, 3] : [1, 2];
      const filtered = possible.filter(p => tierFilter.includes(p.tier));
      const nextOne = filtered[Math.floor(Math.random() * filtered.length)];

      return {
        ...prev,
        availableProjects: [...prev.availableProjects.filter(p => p.id !== id), nextOne].slice(-4),
        logs: [...prev.logs, `❌ Отхвърлен проект: ${id}`]
      };
    });
  };

  const applyIntervention = (regionId: string, type: 'repair' | 'patrol' | 'subsidy') => {
    const costs = { repair: 200000, patrol: 40000, subsidy: 100000 };
    const cost = costs[type];
    if (state.resources.budget < cost) return;

    setState(prev => ({
      ...prev,
      resources: { ...prev.resources, budget: prev.resources.budget - cost },
      logs: [...prev.logs, `💼 Акция в ${regionId}: ${type === 'repair' ? 'Ремонтни дейности' : type === 'patrol' ? 'Засилен контрол' : 'Подпомагане'}`]
    }));

    setRegions(prev => prev.map(r => r.id === regionId ? { ...r, status: 'normal' } : r));
  };

  if (state.isGameOver) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-emerald-950 p-6">
        <div className="bg-white p-20 rounded-[4rem] shadow-2xl max-w-2xl text-center border-b-[16px] border-red-500 animate-in zoom-in">
          <XCircle size={120} className="text-red-500 mx-auto mb-8" />
          <h1 className="text-6xl font-black text-emerald-900 mb-6 uppercase tracking-tighter">Мандатът приключи</h1>
          <p className="text-2xl text-emerald-600 mb-12 font-bold italic">"{state.gameOverReason}"</p>
          <button
            onClick={() => window.location.reload()}
            className="px-16 py-6 bg-emerald-600 text-white rounded-[2.5rem] text-2xl font-black uppercase hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
          >
            Ново начало
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-emerald-50/30 font-inter pt-[130px] pb-10">
      {/* Cinematic Background elements */}
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-lime-100/20 rounded-full blur-[100px] -z-10" />

      {/* Modals & Overlays */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {showLogsModal && <LogsModal logs={state.logs} onClose={() => setShowLogsModal(false)} />}
      {!gameStarted && <WelcomeScreen onStart={handleStartMandate} onOpenInfo={() => setShowInfo(true)} resources={state.resources} />}

      {/* Header - Optimized for all screens */}
      <header className="fixed top-[80px] left-0 w-full px-4 py-2 flex justify-between items-center z-40 bg-white/95 backdrop-blur-xl border-b border-emerald-100 shadow-sm shrink-0 transition-all duration-300">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-600 to-green-700 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 floating shrink-0">
            <Mountain className="text-white" size={16} />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-sm md:text-lg font-black tracking-tighter text-emerald-950 leading-none">СМОЛЯН 2030</h1>
              <span className="hidden sm:inline text-[7px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-100 px-1 py-0.5 rounded-md">Областен</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[7px] font-black text-emerald-600/70 uppercase tracking-widest">Стратегическо управление</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* Desktop/Tablet Stats Quickview */}
          <div className="hidden lg:flex bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100/50 items-center gap-3">
            <div className="flex flex-col border-r border-emerald-100 pr-3">
              <span className="text-[7px] text-emerald-600 font-black uppercase tracking-tighter">Период</span>
              <span className="text-xs font-black text-emerald-900">{state.month < 10 ? `0${state.month}` : state.month} / {state.year}</span>
            </div>
            <Calendar size={16} className="text-emerald-500" />
          </div>

          <button
            onClick={() => setShowAnalysisModal(true)}
            className="hidden md:flex bg-white border border-emerald-100 text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-lg transition-all items-center gap-1.5 shadow-sm group"
          >
            <BrainCircuit size={14} className="text-emerald-500 group-hover:rotate-12 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-900">Анализ</span>
          </button>

          <button
            onClick={() => setShowInfo(true)}
            className="p-2 bg-white border border-emerald-100 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all shadow-sm active:scale-95"
            title="Инструкции"
          >
            <Info size={16} />
          </button>

          <button
            disabled={loading}
            onClick={handleNextTurn}
            className="group flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg md:rounded-xl font-black uppercase text-[9px] md:text-[10px] transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:opacity-50"
          >
            <span className="hidden sm:inline">{loading ? '⏳' : 'Следващ ход'}</span>
            <Play size={12} fill="currentColor" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">

        {/* Sidebar - Desktop only */}
        <aside className="hidden lg:flex w-[300px] flex-col gap-2 p-2 border-r border-emerald-100 bg-white/50 overflow-y-auto scrollbar-hide">
          <div className="bg-white p-3 rounded-[1.5rem] shadow-sm border border-emerald-100">
            <h2 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.15em] flex items-center gap-2 mb-5">
              <TrendingUp size={14} className="text-emerald-500" /> Местни данъци (2030)
            </h2>
            <div className="space-y-5">
              {Object.entries(state.taxes).map(([tax, val]) => (
                <div key={tax} className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase text-emerald-800/60">
                    <span className="flex items-center gap-1.5">
                      {tax === 'property' && <Building size={12} className="text-blue-400" />}
                      {tax === 'vehicle' && <Hammer size={12} className="text-amber-400" />}
                      {tax === 'waste' && <Trash2 size={12} className="text-emerald-400" />}
                      {tax === 'property' ? 'Данък Сгради' : tax === 'vehicle' ? 'Данък МПС' : 'Такса Смет'}
                    </span>
                    <span className="text-emerald-950 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-[9px]">{val}%</span>
                  </div>
                  <input
                    type="range" min="0" max="15" step="0.1" value={val}
                    onChange={(e) => setState(p => ({ ...p, taxes: { ...p.taxes, [tax]: parseFloat(e.target.value) } }))}
                    className="w-full h-1 bg-emerald-50 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-emerald-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.15em] flex items-center gap-2">
                <Clock size={14} className="text-emerald-500" /> Дневник на кмета
              </h2>
              <button
                onClick={() => setShowLogsModal(true)}
                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                title="Отвори архив"
              >
                <Eye size={12} />
              </button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 scrollbar-hide pr-2">
              {state.logs.map((log, i) => (
                <div key={i} className="group relative pl-5 border-l-2 border-emerald-50 hover:border-emerald-300 transition-all duration-300">
                  <div className="absolute -left-[5px] top-1 w-1.5 h-1.5 rounded-full bg-emerald-200 group-hover:bg-emerald-500 transition-all" />
                  <p className="text-[11px] text-emerald-950/80 font-bold leading-relaxed">{log}</p>
                  <span className="text-[8px] font-black text-emerald-300 uppercase mt-1.5 block tracking-widest">{state.month}/{state.year}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            onClick={() => setShowAnalysisModal(true)}
            className="bg-gradient-to-br from-emerald-800 to-green-950 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group cursor-pointer border-t border-white/10"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-700"><BrainCircuit size={80} /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <UserCheck size={28} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Стратегически анализ</h3>
              </div>
              <p className="text-sm italic font-medium text-emerald-50/80 leading-relaxed border-l-2 border-white/20 pl-4">
                "{aiData?.analysis || "Системата анализира демографския и икономически статут на Смолян..."}"
              </p>
            </div>
          </div>
        </aside>

        {/* Dynamic Center Section (Mobile Tab Control) */}
        <section className="flex-1 flex flex-col overflow-hidden">

          {/* Mobile Tab Heade - Visible only on LG downwards */}
          <div className="lg:hidden px-4 pt-4 shrink-0 flex gap-2">
            <button onClick={() => setActiveTab('map')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'map' ? 'bg-emerald-700 text-white shadow-lg' : 'bg-white text-emerald-900 border border-emerald-100'}`}>Карта</button>
            <button onClick={() => setActiveTab('cases')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all relative ${activeTab === 'cases' ? 'bg-emerald-700 text-white shadow-lg' : 'bg-white text-emerald-900 border border-emerald-100'}`}>
              Задачи
              {unreadCases > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center border-2 border-white">{unreadCases}</span>}
            </button>
            <button onClick={() => setActiveTab('stats')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'stats' ? 'bg-emerald-700 text-white shadow-lg' : 'bg-white text-emerald-900 border border-emerald-100'}`}>Стат</button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row p-2 md:p-4 gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">

            {/* Main Interactive Segment */}
            <div className={`flex-1 flex flex-col gap-3 md:gap-4 ${activeTab === 'map' || activeTab === 'stats' ? '' : 'hidden lg:flex'}`}>
              <StatsBar resources={state.resources} />

              <div className={`flex-1 flex flex-col gap-8 min-h-0 ${activeTab === 'map' ? '' : 'hidden lg:flex'}`}>
                <Map onRegionSelect={setSelectedRegion} selectedRegionId={selectedRegion?.id} regions={regions} />

                {selectedRegion && (
                  <div className="bg-white/95 backdrop-blur-3xl p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-emerald-100 shadow-[0_25px_60px_rgba(0,0,0,0.1)] animate-in zoom-in slide-in-from-bottom-10 duration-500 relative z-10 mx-2 mb-2">
                    <div className="flex justify-between items-start mb-5 md:mb-6">
                      <div className="flex items-center gap-4 md:gap-5">
                        <div className="p-3 md:p-4 bg-emerald-50 rounded-[1.5rem] md:rounded-[2rem] text-emerald-600 shadow-inner">
                          <MapPin size={28} />
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-black text-emerald-950 uppercase tracking-tighter leading-none">{selectedRegion.name}</h3>
                          <p className="text-xs md:text-sm text-emerald-600/70 font-bold mt-1.5 uppercase tracking-wide">Районен профил: {selectedRegion.description}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedRegion(null)} className="p-3 hover:bg-red-50 text-red-400 rounded-xl transition-all active:scale-90"><XCircle size={28} /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                      {[
                        { type: 'repair' as const, label: 'Инфра-ремонт', cost: '200k', icon: <TrendingUp size={24} />, color: 'emerald' },
                        { type: 'patrol' as const, label: 'Ред и сигурност', cost: '40k', icon: <AlertTriangle size={24} />, color: 'amber' },
                        { type: 'subsidy' as const, label: 'Финансова помощ', cost: '100k', icon: <MessageSquare size={24} />, color: 'blue' }
                      ].map((action) => (
                        <button
                          key={action.type}
                          onClick={() => applyIntervention(selectedRegion.id, action.type)}
                          className={`flex flex-col items-center p-4 md:p-5 rounded-[2rem] md:rounded-[2.5rem] bg-white border-2 border-${action.color}-50 hover:bg-${action.color}-50 hover:border-${action.color}-500 transition-all group relative overflow-hidden shadow-sm hover:shadow-lg`}
                        >
                          <div className={`w-12 h-12 md:w-14 md:h-14 bg-${action.color}-100 rounded-[1.5rem] flex items-center justify-center text-${action.color}-700 mb-3 group-hover:scale-110 transition-transform shadow-inner`}>
                            {action.icon}
                          </div>
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-950 mb-0.5">{action.label}</span>
                          <span className={`text-[10px] md:text-[11px] font-black text-${action.color}-600`}>{action.cost} лв.</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Stats (only visible on mobile stats tab) */}
              <div className={`lg:hidden space-y-6 overflow-y-auto pb-20 ${activeTab === 'stats' ? '' : 'hidden'}`}>
                {/* Re-using desktop sidebar components but simplified for mobile */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-emerald-100">
                  <h2 className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.2em] mb-6">Данъчна политика</h2>
                  <div className="space-y-6">
                    {Object.entries(state.taxes).map(([tax, val]) => (
                      <div key={tax} className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase text-emerald-800/60">
                          <span>{tax === 'property' ? 'Сгради' : tax === 'vehicle' ? 'МПС' : 'Такса Смет'}</span>
                          <span className="text-emerald-950">{val}%</span>
                        </div>
                        <input type="range" value={val} className="w-full h-1.5" disabled />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Assignments/Investments Panel */}
            <div className={`w-full lg:w-[420px] transition-all duration-500 overflow-y-auto pb-4 lg:pb-0 ${activeTab === 'cases' ? '' : 'hidden lg:block'}`}>
              <InvestmentPanel
                availableProjects={state.availableProjects}
                activeProjects={state.investments.filter(i => i.isStarted && !i.built)}
                completedProjects={state.investments.filter(i => i.built)}
                budget={state.resources.budget}
                onStart={startProject}
                onCancel={cancelProject}
                onReject={rejectProject}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Mobile-only Bottom Navigation Bar - Fixed */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 bg-emerald-950 text-white rounded-[2rem] flex items-center justify-between px-10 z-50 shadow-2xl border border-white/10 overflow-hidden">
        <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'map' ? 'text-emerald-400 scale-110' : 'text-white/40'}`}>
          <MapIcon size={24} />
          <span className="text-[8px] font-black uppercase tracking-widest">Карта</span>
        </button>
        <button onClick={() => setShowCasesPanel(true)} className="w-20 h-20 -mt-12 bg-white rounded-full flex flex-col items-center justify-center text-emerald-950 shadow-2xl border-4 border-emerald-950 active:scale-90 transition-all relative">
          <Bell size={28} className={unreadCases > 0 ? 'animate-bounce' : ''} />
          {unreadCases > 0 && <span className="absolute top-3 right-3 w-6 h-6 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center border-2 border-white">{unreadCases}</span>}
        </button>
        <button onClick={() => setActiveTab('cases')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'cases' ? 'text-emerald-400 scale-110' : 'text-white/40'}`}>
          <Building size={24} />
          <span className="text-[8px] font-black uppercase tracking-widest">Проекти</span>
        </button>
      </nav>

      {/* Persistent Modals */}
      {showAnalysisModal && aiData && (
        <div className="absolute inset-0 z-[600] bg-emerald-950/80 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 overflow-hidden scrollbar-hide">
          <div className="bg-white w-full max-w-5xl h-full md:max-h-[90vh] md:rounded-[4rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-500 border-b-[20px] border-emerald-500">
            <div className="p-8 md:p-12 bg-gradient-to-br from-emerald-600 to-green-700 text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute -right-10 -bottom-10 opacity-10"><Newspaper size={200} /></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none text-white drop-shadow-lg">Анализ на управлението</h2>
                <div className="flex items-center gap-4 mt-6">
                  <span className="px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">Сутрешен брифинг</span>
                  <p className="text-xs font-bold text-emerald-100 uppercase tracking-wide">Месец {state.month}, {state.year} • Смолян</p>
                </div>
              </div>
              <button onClick={() => setShowAnalysisModal(false)} className="p-5 bg-white/10 hover:bg-white/30 text-white rounded-3xl transition-all active:scale-90 relative z-10 border border-white/10 group">
                <XCircle size={40} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 md:p-16 space-y-12 bg-emerald-50/20 scrollbar-hide">
              <div className="bg-white p-10 rounded-[3rem] border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><BrainCircuit size={100} /></div>
                <div className="flex gap-8 items-start relative z-10">
                  <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                    <Sparkles size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-emerald-950 mb-6 uppercase tracking-tight flex items-center gap-4">
                      Статус на региона
                    </h3>
                    <p className="text-lg text-emerald-900/80 leading-relaxed font-medium italic">
                      "{aiData.analysis}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 bg-white rounded-[3rem] border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><TrendingUp size={24} /></div>
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Профил на населението</h4>
                  </div>
                  <p className="text-sm font-medium text-emerald-800/70 leading-relaxed">
                    Тенденциите сочат, че вашето доверие е в пряка зависимост от качеството на инфраструктурата. Демографският прираст изисква устойчива среда и добра екология.
                  </p>
                </div>
                <div className="p-10 bg-white rounded-[3rem] border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><Sparkles size={24} /></div>
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Финансова прогноза</h4>
                  </div>
                  <p className="text-sm font-medium text-emerald-800/70 leading-relaxed">
                    Планирането на следващите мащабни инвестиции зависи от събираемостта на местните данъци. Внимавайте с разходите за поддръжка на остарелите системи.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10 bg-white border-t border-emerald-100 flex justify-center shrink-0">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="w-full md:w-auto px-24 py-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm transition-all shadow-2xl shadow-emerald-200 active:scale-95"
              >
                Приемам доклада
              </button>
            </div>
          </div>
        </div>
      )}

      {showCasesPanel && (
        <div className="absolute inset-0 z-[700] bg-emerald-950/80 backdrop-blur-2xl flex items-center justify-center lg:justify-end p-0 md:p-6 overflow-hidden">
          <div className="w-full max-w-3xl h-full bg-white flex flex-col animate-in slide-in-from-right duration-500 lg:rounded-l-[5rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.4)] border-l-4 border-emerald-500">
            <div className="p-8 md:p-12 border-b border-emerald-50 flex justify-between items-center bg-white relative">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-emerald-950 uppercase tracking-tighter leading-none">Оперативен щаб</h2>
                <div className="flex items-center gap-4 mt-3">
                  <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]"></span>
                  <p className="text-[10px] md:text-xs text-emerald-600/70 font-black uppercase tracking-widest">Директни намеси • Месец {state.month}</p>
                </div>
              </div>
              <button onClick={() => setShowCasesPanel(false)} className="p-4 md:p-6 bg-emerald-50 hover:bg-emerald-100 rounded-[2rem] text-emerald-500 shadow-sm border border-emerald-100 active:scale-90 transition-all"><XCircle size={36} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 scroll-smooth scrollbar-hide bg-emerald-50/20">
              {aiData?.cases.map((c, i) => {
                const isResolved = i < resolvedCasesCount;
                return (
                  <div key={i} className={`p-8 md:p-10 rounded-[3rem] transition-all relative overflow-hidden group border-2 ${isResolved ? 'opacity-30 scale-95 border-emerald-50' : 'bg-white border-white shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_100px_rgba(0,0,0,0.1)] hover:border-emerald-200'}`}>
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"><Bell size={120} /></div>
                    <div className="flex items-center gap-4 mb-8">
                      <span className={`px-4 py-2 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm text-white ${c.type === 'emergency' ? 'bg-red-600 animate-pulse' :
                        c.type === 'strategic' ? 'bg-indigo-600' : 'bg-emerald-600'
                        }`}>
                        {c.type === 'emergency' ? 'Критичен казус' : c.type === 'strategic' ? 'Стратегически избор' : 'Ежедневно управление'}
                      </span>
                      {c.targetRegion && <span className="bg-emerald-50 px-4 py-2 rounded-2xl text-[10px] font-black uppercase text-emerald-600 border border-emerald-100">Район: {regions.find(r => r.id === c.targetRegion)?.name}</span>}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-emerald-950 mb-5 leading-none tracking-tight">{c.title}</h3>
                    <p className="text-base md:text-lg text-emerald-900/70 leading-relaxed mb-10 font-medium italic border-l-4 border-emerald-100 pl-6">"{c.description}"</p>

                    {!isResolved && (
                      <div className="grid gap-4">
                        {c.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setPendingImpacts(p => [...p, opt.impact]); setResolvedCasesCount(v => v + 1); }}
                            className="w-full p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-emerald-50/50 border-2 border-transparent hover:border-emerald-600 hover:bg-white text-left transition-all group flex justify-between items-center shadow-inner hover:shadow-xl"
                          >
                            <div className="flex-1 pr-10">
                              <span className="font-black text-emerald-950 block text-base md:text-lg group-hover:translate-x-2 transition-transform duration-300">{opt.label}</span>
                              <div className="flex gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                {Object.entries(opt.impact).map(([key, val]) => {
                                  const numVal = val as number;
                                  return (
                                    <span key={key} className={`text-[9px] font-black uppercase tracking-widest ${numVal > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                      {key}: {numVal > 0 ? '+' : ''}{numVal}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <ChevronRight size={24} className="text-emerald-400 group-hover:text-emerald-600 transition-all group-hover:translate-x-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-10 md:p-14 border-t border-emerald-50 bg-white shrink-0">
              <button onClick={() => setShowCasesPanel(false)} className="w-full py-6 bg-emerald-950 hover:bg-black text-white rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-sm transition-all shadow-2xl active:scale-95 group relative overflow-hidden">
                <span className="relative z-10">Приключване на сесията</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingOverlay month={state.month} prev={prevResources} current={state.resources} />}
    </div>
  );
};

export default App;
