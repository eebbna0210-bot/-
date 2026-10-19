import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IngredientMeta } from '../types/cooking';
import { sound } from '../utils/soundEngine';
import { Waves, Flame, RefreshCw, CheckCircle, Utensils } from 'lucide-react';

interface BoilItem {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  density: number; // relative to water (1.0 = neutral, <1.0 = floats, >1.0 = sinks)
  color: string;
  doneness: number;
  rotation: number;
  vRot: number;
}

interface Bubble {
  x: number;
  y: number;
  vy: number;
  radius: number;
  life: number;
}

interface Props {
  initialIngredients: IngredientMeta[];
  targetDoneness?: number;
  onCookProgress?: (avgDoneness: number) => void;
  onStepComplete?: () => void;
}

export const BoilingStationCanvas: React.FC<Props> = ({
  initialIngredients,
  targetDoneness = 80,
  onCookProgress,
  onStepComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [items, setItems] = useState<BoilItem[]>([]);
  const [boilHeat, setBoilHeat] = useState<number>(2); // 0 = off, 1 = simmer, 2 = rolling boil
  const [isStirring, setIsStirring] = useState(false);
  const [soupFlavor, setSoupFlavor] = useState<string>('맑은 야채 육수');

  const itemsRef = useRef<BoilItem[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const heatRef = useRef<number>(boilHeat);
  const lastStirPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    heatRef.current = boilHeat;
  }, [boilHeat]);

  // Spawn items in pot
  const addItemToPot = useCallback((meta: IngredientMeta, count = 2) => {
    const newItems: BoilItem[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push({
        id: `pot-${Date.now()}-${Math.random()}`,
        name: meta.koreanName,
        x: 380 + (Math.random() * 160 - 80),
        y: 220 + (Math.random() * 80 - 40),
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0,
        width: Math.max(30, meta.defaultWidth * 0.5),
        height: Math.max(20, meta.defaultHeight * 0.4),
        density: meta.category === 'noodle_grain' ? 0.95 : meta.category === 'vegetable' ? 0.85 : 1.1,
        color: meta.color,
        doneness: 0,
        rotation: (Math.random() - 0.5) * 0.5,
        vRot: 0,
      });
    }
    setItems((prev) => [...prev, ...newItems]);
    sound.playBubble();
  }, []);

  useEffect(() => {
    if (initialIngredients.length > 0 && items.length === 0) {
      initialIngredients.forEach((meta) => {
        addItemToPot(meta, 3);
      });
    }
  }, [initialIngredients, addItemToPot]);

  // Canvas Boiling Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const potRect = {
      x: 180,
      y: 110,
      width: 400,
      height: 270,
    };
    const waterSurfaceY = potRect.y + 40;

    let waveOffset = 0;

    const render = () => {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      waveOffset += 0.05 * (1 + heatRef.current);

      // Draw Stainless Steel Pot Outer Wall
      ctx.save();
      // Pot handles
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(potRect.x - 45, potRect.y + 50, 45, 20, 6);
      ctx.roundRect(potRect.x + potRect.width, potRect.y + 50, 45, 20, 6);
      ctx.fill();

      // Pot body
      const potGrad = ctx.createLinearGradient(potRect.x, 0, potRect.x + potRect.width, 0);
      potGrad.addColorStop(0, '#334155');
      potGrad.addColorStop(0.5, '#64748B');
      potGrad.addColorStop(1, '#1E293B');

      ctx.fillStyle = potGrad;
      ctx.beginPath();
      ctx.roundRect(potRect.x, potRect.y, potRect.width, potRect.height, [0, 0, 40, 40]);
      ctx.fill();

      // Pot inner cavity with boiling broth
      ctx.fillStyle = '#0B1329';
      ctx.beginPath();
      ctx.roundRect(potRect.x + 12, potRect.y + 12, potRect.width - 24, potRect.height - 20, [0, 0, 30, 30]);
      ctx.fill();

      // Boiling Broth Fluid
      const brothGrad = ctx.createLinearGradient(0, waterSurfaceY, 0, potRect.y + potRect.height);
      brothGrad.addColorStop(0, 'rgba(234, 179, 8, 0.45)'); // Golden bouillon
      brothGrad.addColorStop(1, 'rgba(180, 83, 9, 0.7)');

      ctx.fillStyle = brothGrad;
      ctx.beginPath();
      ctx.moveTo(potRect.x + 14, waterSurfaceY);

      // Animated sinusoidal boiling liquid surface
      for (let x = potRect.x + 14; x <= potRect.x + potRect.width - 14; x += 10) {
        const wave = Math.sin((x - potRect.x) * 0.05 + waveOffset) * (heatRef.current * 3.5);
        ctx.lineTo(x, waterSurfaceY + wave);
      }
      ctx.lineTo(potRect.x + potRect.width - 14, potRect.y + potRect.height - 10);
      ctx.lineTo(potRect.x + 14, potRect.y + potRect.height - 10);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Generate Boiling Bubbles
      const currentHeat = heatRef.current;
      if (currentHeat > 0 && Math.random() < 0.3 * currentHeat) {
        bubblesRef.current.push({
          x: potRect.x + 30 + Math.random() * (potRect.width - 60),
          y: potRect.y + potRect.height - 25,
          vy: -2 - Math.random() * (2 + currentHeat * 1.5),
          radius: 2 + Math.random() * (currentHeat * 3),
          life: 1.0,
        });
      }

      // Update & Draw Bubbles
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        b.y += b.vy;
        b.x += (Math.random() - 0.5) * 1.2;

        if (b.y <= waterSurfaceY + 5) {
          // Pop at surface!
          if (Math.random() < 0.25) sound.playBubble();
          bubblesRef.current.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Update & Draw Boil Items with Buoyancy & Convection Physics
      const currentItems = [...itemsRef.current];
      const heatCookingRate = currentHeat * 0.08;

      currentItems.forEach((item) => {
        // Buoyancy calculations:
        // When submerged below surface, upward buoyant force acts proportional to depth
        const depth = item.y - waterSurfaceY;

        if (depth > 0) {
          // In fluid
          const buoyancyForce = (1.0 - item.density) * 0.45;
          item.vy += 0.25 - buoyancyForce; // balance gravity vs buoyancy
          item.vy *= 0.94; // water viscosity damping
          item.vx *= 0.94;

          // Heat convection currents push items up and side to side
          if (currentHeat > 0) {
            item.vy -= (Math.random() * 0.15 * currentHeat);
            item.vx += (Math.random() - 0.5) * 0.2 * currentHeat;
            item.vRot += (Math.random() - 0.5) * 0.02;
          }

          // Doneness accumulation
          if (currentHeat > 0) {
            item.doneness = Math.min(140, item.doneness + heatCookingRate);
          }
        } else {
          // In air above surface
          item.vy += 0.4;
        }

        item.x += item.vx;
        item.y += item.vy;
        item.rotation += item.vRot;

        // Pot boundary collisions
        const minX = potRect.x + 30;
        const maxX = potRect.x + potRect.width - 30;
        const maxY = potRect.y + potRect.height - 25;

        if (item.x < minX) {
          item.x = minX;
          item.vx = Math.abs(item.vx) * 0.6;
        } else if (item.x > maxX) {
          item.x = maxX;
          item.vx = -Math.abs(item.vx) * 0.6;
        }

        if (item.y > maxY) {
          item.y = maxY;
          item.vy = -Math.abs(item.vy) * 0.5;
        }

        // Draw Item in soup
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.roundRect(-item.width / 2, -item.height / 2, item.width, item.height, 4);
        ctx.fill();

        // Water refraction sheen
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Doneness indicator bar
        const bw = 28;
        const bh = 3.5;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-bw / 2, -item.height / 2 - 6, bw, bh);

        const donenessColor = item.doneness >= 70 && item.doneness <= 100 ? '#10B981' : '#38BDF8';
        ctx.fillStyle = donenessColor;
        ctx.fillRect(-bw / 2, -item.height / 2 - 6, (bw * Math.min(100, item.doneness)) / 100, bh);

        ctx.restore();
      });

      if (currentItems.length > 0 && onCookProgress) {
        const avgDoneness = Math.round(
          currentItems.reduce((acc, cur) => acc + cur.doneness, 0) / currentItems.length
        );
        onCookProgress(avgDoneness);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [onCookProgress]);

  // Pointer Stirring Interaction (Whirlpool swirl vortex)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isStirring) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (lastStirPoint.current) {
      const dx = x - lastStirPoint.current.x;
      const dy = y - lastStirPoint.current.y;
      const speed = Math.hypot(dx, dy);

      if (speed > 5) {
        // Apply vortex force to nearby items in pot
        setItems((prev) =>
          prev.map((item) => {
            const dist = Math.hypot(item.x - x, item.y - y);
            if (dist < 140) {
              const angle = Math.atan2(item.y - y, item.x - x);
              // Perpendicular swirl impulse
              return {
                ...item,
                vx: item.vx - Math.sin(angle) * (speed * 0.08),
                vy: item.vy + Math.cos(angle) * (speed * 0.08),
                vRot: item.vRot + 0.05,
              };
            }
            return item;
          })
        );
      }
    }
    lastStirPoint.current = { x, y };
  };

  const avgDoneness = items.length > 0
    ? Math.round(items.reduce((acc, cur) => acc + cur.doneness, 0) / items.length)
    : 0;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-sky-400" />
            <span className="font-semibold text-sm">냄비 삶기 &amp; 수프 (Boiling &amp; Broth Pot)</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span>목표 익힘:</span>
            <span className="text-amber-400 font-bold tabular-nums">{targetDoneness}%</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span>현재 평균 익힘:</span>
            <span className="font-bold tabular-nums text-emerald-400">{avgDoneness}%</span>
          </div>
        </div>

        {/* Heat Dial Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">화력 조절:</span>
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
            {[
              { lvl: 0, label: '소화 (OFF)' },
              { lvl: 1, label: '약불 (은근히)' },
              { lvl: 2, label: '중불' },
              { lvl: 3, label: '강불 (팔팔)' },
            ].map((btn) => (
              <button
                key={btn.lvl}
                onClick={() => setBoilHeat(btn.lvl)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  boilHeat === btn.lvl
                    ? btn.lvl === 3
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-sky-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {onStepComplete && (
            <button
              onClick={onStepComplete}
              disabled={avgDoneness < 40}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                avgDoneness >= 40
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>삶기 완료 &gt; 다음 단계</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Boiling Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={760}
          height={440}
          className={`w-full h-[360px] md:h-[440px] touch-none ${isStirring ? 'cursor-grab' : ''}`}
          onPointerDown={(e) => {
            setIsStirring(true);
            lastStirPoint.current = null;
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={() => {
            setIsStirring(false);
            lastStirPoint.current = null;
          }}
          onPointerCancel={() => {
            setIsStirring(false);
            lastStirPoint.current = null;
          }}
        />

        {/* Stir Spoon Toggle Button */}
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <button
            onClick={() => setIsStirring(!isStirring)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl shadow-lg transition-all ${
              isStirring
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sky-500/20'
                : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>{isStirring ? '스푼으로 젓는 중 (드래그하여 회오리 형성)' : '국물 저어주기 (스푼 활성화)'}</span>
          </button>
        </div>

        {/* Add more ingredients to pot */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-400 shrink-0 ml-1">냄비에 넣기:</span>
            {initialIngredients.map((ing) => (
              <button
                key={ing.id}
                onClick={() => addItemToPot(ing, 2)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors shrink-0"
              >
                <span>{ing.icon}</span>
                <span>{ing.koreanName}</span>
                <span className="text-sky-400 text-[10px]">+2</span>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 shrink-0 mr-2">
            부력/대류 물리 적용 중
          </div>
        </div>
      </div>
    </div>
  );
};
