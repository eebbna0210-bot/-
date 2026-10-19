import React from 'react';
import { sound } from '../utils/soundEngine';
import { Volume2, VolumeX, Sparkles, ChefHat } from 'lucide-react';

export type MainNavTab = 'simulator' | 'restaurant' | 'recipes' | 'coop' | 'battle' | 'custom';

interface Props {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  money: number;
  reputation: number;
}

export const TopNavigation: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  money,
  reputation,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('simulator')}
          className="text-lg font-extrabold tracking-tight text-white font-display whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="text-xl">🍳</span>
          <span>마스터 셰프 시뮬레이터</span>
        </button>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => onSelectTab('simulator')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'simulator' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            주방 시뮬레이터
          </button>

          <button
            onClick={() => onSelectTab('restaurant')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'restaurant' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            식당 경영 모드
          </button>

          <button
            onClick={() => onSelectTab('recipes')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'recipes' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            레시피 북
          </button>

          <button
            onClick={() => onSelectTab('coop')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'coop' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            멀티 협동 키친
          </button>

          <button
            onClick={() => onSelectTab('battle')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'battle' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            1v1 요리 대결
          </button>

          <button
            onClick={() => onSelectTab('custom')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'custom' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            신메뉴 개발
          </button>
        </nav>

        {/* Zone 3: 1 primary action & sound control */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleSound}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition-colors"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <span className="text-slate-400">자금</span>
            <span className="font-bold text-amber-400 tabular-nums">
              {money.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div className="flex md:hidden items-center gap-2 px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 overflow-x-auto text-xs">
        <button
          onClick={() => onSelectTab('simulator')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${
            activeTab === 'simulator' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          주방
        </button>
        <button
          onClick={() => onSelectTab('restaurant')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${
            activeTab === 'restaurant' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          경영
        </button>
        <button
          onClick={() => onSelectTab('recipes')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${
            activeTab === 'recipes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          레시피
        </button>
        <button
          onClick={() => onSelectTab('coop')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${
            activeTab === 'coop' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          멀티협동
        </button>
        <button
          onClick={() => onSelectTab('battle')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${
            activeTab === 'battle' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          요리대결
        </button>
        <button
          onClick={() => onSelectTab('custom')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${
            activeTab === 'custom' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          신메뉴개발
        </button>
      </div>
    </header>
  );
};
