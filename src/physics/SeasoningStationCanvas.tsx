import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IngredientMeta } from '../types/cooking';
import { sound } from '../utils/soundEngine';
import { Sparkles, CheckCircle, RefreshCw } from 'lucide-react';

interface SeasoningParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  stuck: boolean;
  type: 'salt' | 'pepper' | 'chili' | 'herb' | 'sauce';
}

interface TargetFoodItem {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface Props {
  targetIngredients: IngredientMeta[];
  targetSalt?: number;
  targetSpice?: number;
  targetHerb?: number;
  onSeasoningProgress?: (salt: number, spice: number, herb: number) => void;
  onStepComplete?: () => void;
}

export const SeasoningStationCanvas: React.FC<Props> = ({
  targetIngredients,
  targetSalt = 60,
  targetSpice = 40,
  targetHerb = 50,
  onSeasoningProgress,
  onStepComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedSeasoning, setSelectedSeasoning] = useState<'salt' | 'pepper' | 'chili' | 'herb' | 'sauce'>('salt');

  // Gauges (0 - 100)
  const [saltLevel, setSaltLevel] = useState(0);
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [herbLevel, setHerbLevel] = useState(0);
  const [sauceLevel, setSauceLevel] = useState(0);

  const particlesRef = useRef<SeasoningParticle[]>([]);
  const isDispensing = useRef(false);
  const dispenserPos = useRef({ x: 380, y: 80 });

  const foodItems: TargetFoodItem[] = targetIngredients.map((ing, idx) => ({
    id: ing.id,
    name: ing.koreanName,
    x: 220 + idx * 140,
    y: 280,
    width: ing.defaultWidth * 0.9,
    height: ing.defaultHeight * 0.8,
    color: ing.color,
  }));

  // Dispense particles
  const dispense = useCallback((x: number, y: number, type: 'salt' | 'pepper' | 'chili' | 'herb' | 'sauce') => {
    sound.playSeasoningShake();

    const count = type === 'sauce' ? 6 : 14;
    for (let i = 0; i < count; i++) {
      let color = '#FFFFFF';
      let size = 2;
      if (type === 'salt') {
        color = '#F8FAFC';
        size = 1.8;
      } else if (type === 'pepper') {
        color = '#1E293B';
        size = 2.5;
      } else if (type === 'chili') {
        color = '#DC2626';
        size = 2.2;
      } else if (type === 'herb') {
        color = '#15803D';
        size = 3;
      } else if (type === 'sauce') {
        color = '#78350F';
        size = 4.5;
      }

      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 35,
        y: y + Math.random() * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        color,
        size,
        stuck: false,
        type,
      });
    }

    // Accumulate flavor
    if (type === 'salt') {
      setSaltLevel((prev) => Math.min(100, prev + 2.5));
    } else if (type === 'pepper') {
      setSpiceLevel((prev) => Math.min(100, prev + 2));
      setHerbLevel((prev) => Math.min(100, prev + 1));
    } else if (type === 'chili') {
      setSpiceLevel((prev) => Math.min(100, prev + 4));
    } else if (type === 'herb') {
      setHerbLevel((prev) => Math.min(100, prev + 4));
    } else if (type === 'sauce') {
      setSauceLevel((prev) => Math.min(100, prev + 3));
      setSaltLevel((prev) => Math.min(100, prev + 1.5));
    }
  }, []);

  // Update parent
  useEffect(() => {
    if (onSeasoningProgress) {
      onSeasoningProgress(saltLevel, spiceLevel, herbLevel);
    }
  }, [saltLevel, spiceLevel, herbLevel, onSeasoningProgress]);

  // Main Canvas Particle Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Marble prep counter background
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Faint counter texture
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Draw Food Target Items on counter
      foodItems.forEach((food) => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(food.x, food.y + food.height / 2 + 5, food.width / 2 + 6, food.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Food Body
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.roundRect(food.x - food.width / 2, food.y - food.height / 2, food.width, food.height, 8);
        ctx.fill();

        // Highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(food.name, food.x, food.y + 4);
      });

      // Update & Draw Particles with Sticking Physics
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!p.stuck) {
          p.vy += 0.3; // Gravity
          p.x += p.vx;
          p.y += p.vy;

          // Check collision with food items
          for (let f = 0; f < foodItems.length; f++) {
            const food = foodItems[f];
            const inX = p.x >= food.x - food.width / 2 && p.x <= food.x + food.width / 2;
            const inY = p.y >= food.y - food.height / 2 && p.y <= food.y + food.height / 2;

            if (inX && inY) {
              p.stuck = true;
              p.vx = 0;
              p.vy = 0;
              break;
            }
          }

          // Floor stop
          if (p.y >= canvas.height - 30) {
            p.y = canvas.height - 30;
            p.stuck = true;
            p.vx = 0;
            p.vy = 0;
          }
        }

        // Draw particle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Active Shaker / Grinder at dispenser position
      const pos = dispenserPos.current;
      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Shaker tool body
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.roundRect(-16, -30, 32, 50, 6);
      ctx.fill();

      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(0, 20, 15, 0, Math.PI);
      ctx.fill();

      // Label on shaker
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      const label = selectedSeasoning === 'salt' ? 'SALT' : selectedSeasoning === 'pepper' ? 'PEPPER' : selectedSeasoning === 'chili' ? 'CHILI' : selectedSeasoning === 'herb' ? 'HERB' : 'GLAZE';
      ctx.fillText(label, 0, -4);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [foodItems, selectedSeasoning]);

  // Pointer interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDispensing.current = true;
    updateDispenser(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updateDispenser(e);
  };

  const updateDispenser = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    dispenserPos.current = { x, y: Math.min(180, y) };

    if (isDispensing.current) {
      dispense(x, Math.min(180, y) + 20, selectedSeasoning);
    }
  };

  const handlePointerUp = () => {
    isDispensing.current = false;
  };

  const resetSeasoning = () => {
    particlesRef.current = [];
    setSaltLevel(0);
    setSpiceLevel(0);
    setHerbLevel(0);
    setSauceLevel(0);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">시즈닝 &amp; 양념 배합 (Flavor Seasoning)</span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetSeasoning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>양념 비우기</span>
          </button>

          {onStepComplete && (
            <button
              onClick={onStepComplete}
              disabled={saltLevel < 30}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                saltLevel >= 30
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>간 맞추기 완료 &gt; 다음 단계</span>
            </button>
          )}
        </div>
      </div>

      {/* Flavor Balance Meters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
        {/* Salt */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">염도 (소금/간장)</span>
            <span className="text-slate-200 font-semibold tabular-nums">{Math.round(saltLevel)}% (목표 {targetSalt}%)</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                Math.abs(saltLevel - targetSalt) <= 15 ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
              style={{ width: `${saltLevel}%` }}
            />
          </div>
        </div>

        {/* Spice */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">매운맛 (후추/칠리)</span>
            <span className="text-slate-200 font-semibold tabular-nums">{Math.round(spiceLevel)}% (목표 {targetSpice}%)</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                Math.abs(spiceLevel - targetSpice) <= 15 ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
              style={{ width: `${spiceLevel}%` }}
            />
          </div>
        </div>

        {/* Herb */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">허브 아로마 &amp; 풍미</span>
            <span className="text-slate-200 font-semibold tabular-nums">{Math.round(herbLevel)}% (목표 {targetHerb}%)</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                Math.abs(herbLevel - targetHerb) <= 15 ? 'bg-emerald-400' : 'bg-emerald-600'
              }`}
              style={{ width: `${herbLevel}%` }}
            />
          </div>
        </div>

        {/* Sauce */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">특제 소스 &amp; 윤기</span>
            <span className="text-slate-200 font-semibold tabular-nums">{Math.round(sauceLevel)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600 transition-all duration-200"
              style={{ width: `${sauceLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Seasoning Shakers Selector Strip */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
        <span className="text-xs text-slate-400 ml-2">선택한 양념 도구:</span>
        {[
          { id: 'salt', name: '🧂 신안 천일염', desc: '기본 염도 조절' },
          { id: 'pepper', name: '🫙 통후추 그라인더', desc: '은은한 매운향' },
          { id: 'chili', name: '🌶️ 크러쉬드 레드페퍼', desc: '강렬한 매콤함' },
          { id: 'herb', name: '🌿 이탈리안 생 파슬리/허브', desc: '향긋한 아로마' },
          { id: 'sauce', name: '🍯 특제 비법 글레이즈', desc: '달콤 감칠맛 윤기' },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => setSelectedSeasoning(tool.id as typeof selectedSeasoning)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedSeasoning === tool.id
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tool.name}
          </button>
        ))}
      </div>

      {/* Main Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={760}
          height={420}
          className="w-full h-[340px] md:h-[420px] cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        <div className="absolute top-3 left-4 pointer-events-none bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs text-slate-200 flex items-center gap-2">
          <span>마우스를 누른 채로 드래그하면 양념이 흩뿌려집니다!</span>
        </div>
      </div>
    </div>
  );
};
