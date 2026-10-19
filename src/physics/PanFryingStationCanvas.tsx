import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IngredientMeta } from '../types/cooking';
import { sound } from '../utils/soundEngine';
import { Flame, RotateCcw, Droplets, CheckCircle, AlertTriangle } from 'lucide-react';

interface PanPiece {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  vRot: number;
  baseColor: string;
  doneness: number; // 0 to 100+
  isAirborne: boolean;
  category: string;
}

interface SizzleSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface Props {
  initialIngredients: IngredientMeta[];
  panLevel: number;
  stoveLevel: number;
  targetDoneness?: number;
  onCookProgress?: (avgDoneness: number) => void;
  onStepComplete?: () => void;
}

export const PanFryingStationCanvas: React.FC<Props> = ({
  initialIngredients,
  panLevel,
  stoveLevel,
  targetDoneness = 85,
  onCookProgress,
  onStepComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pieces, setPieces] = useState<PanPiece[]>([]);
  const [heatLevel, setHeatLevel] = useState<number>(2); // 0 = off, 1 = low, 2 = med, 3 = high
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [hasOil, setHasOil] = useState(false);
  const [flipsCount, setFlipsCount] = useState(0);

  const piecesRef = useRef<PanPiece[]>([]);
  const sparksRef = useRef<SizzleSpark[]>([]);
  const heatLevelRef = useRef<number>(heatLevel);
  const isDraggingPan = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  useEffect(() => {
    heatLevelRef.current = heatLevel;
    if (heatLevel > 0 && pieces.length > 0) {
      sound.startSizzle(0.3 * heatLevel);
    } else {
      sound.stopSizzle();
    }
  }, [heatLevel, pieces.length]);

  // Clean up sizzle on unmount
  useEffect(() => {
    return () => {
      sound.stopSizzle();
    };
  }, []);

  // Spawn pieces onto pan
  const addPieceToPan = useCallback((meta: IngredientMeta, count = 2) => {
    const newItems: PanPiece[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push({
        id: `pan-${Date.now()}-${Math.random()}`,
        name: meta.koreanName,
        x: 380 + (Math.random() * 120 - 60),
        y: 240 + (Math.random() * 60 - 30),
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0,
        width: Math.max(30, meta.defaultWidth * 0.5),
        height: Math.max(22, meta.defaultHeight * 0.45),
        rotation: (Math.random() - 0.5) * 0.4,
        vRot: 0,
        baseColor: meta.color,
        doneness: 0,
        isAirborne: false,
        category: meta.category,
      });
    }
    setPieces((prev) => [...prev, ...newItems]);
  }, []);

  // Initialize with initial ingredients
  useEffect(() => {
    if (initialIngredients.length > 0 && pieces.length === 0) {
      initialIngredients.forEach((meta) => {
        addPieceToPan(meta, 3);
      });
    }
  }, [initialIngredients, addPieceToPan]);

  // Execute Pan Toss / Flip Physics
  const executePanFlip = () => {
    sound.playPanFlip();
    setFlipsCount((c) => c + 1);

    // Pan jerk animation
    setPanOffset({ x: 0, y: -25 });
    setTimeout(() => setPanOffset({ x: 0, y: 5 }), 120);
    setTimeout(() => setPanOffset({ x: 0, y: 0 }), 260);

    // Give pieces upward impulse and spin
    setPieces((prev) =>
      prev.map((p) => ({
        ...p,
        vy: -9 - Math.random() * 5,
        vx: p.vx + (Math.random() - 0.5) * 4,
        vRot: (Math.random() - 0.5) * 0.6,
        isAirborne: true,
      }))
    );
  };

  // Add butter / olive oil
  const addButterOrOil = () => {
    sound.playSeasoningShake();
    setHasOil(true);
    // Sparks
    for (let i = 0; i < 20; i++) {
      sparksRef.current.push({
        x: 380 + (Math.random() * 160 - 80),
        y: 250 + (Math.random() * 80 - 40),
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        color: '#FDE047',
        size: 3 + Math.random() * 4,
        life: 1.0,
      });
    }
  };

  // Main Canvas Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const panCenter = { x: 380, y: 240 };
    const panRadiusX = 220;
    const panRadiusY = 130;

    const render = () => {
      // Background: Dark commercial stainless steel kitchen cooktop
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gas Burner Glow underneath pan
      const currentHeat = heatLevelRef.current;
      if (currentHeat > 0) {
        ctx.save();
        const flameGradient = ctx.createRadialGradient(
          panCenter.x,
          panCenter.y + 40,
          10,
          panCenter.x,
          panCenter.y + 40,
          140
        );
        const flameColor = currentHeat === 3 ? 'rgba(59, 130, 246, 0.7)' : currentHeat === 2 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(249, 115, 22, 0.4)';
        flameGradient.addColorStop(0, flameColor);
        flameGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.ellipse(panCenter.x, panCenter.y + 35, 160, 90, 0, 0, Math.PI * 2);
        ctx.fill();

        // Burner ring jets
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.5;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          const rx = panCenter.x + Math.cos(a) * 110;
          const ry = panCenter.y + 35 + Math.sin(a) * 55;
          ctx.beginPath();
          ctx.arc(rx, ry, 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Pan Outer Rim & Handle
      ctx.save();
      // Handle extending to bottom-left
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(panCenter.x - panRadiusX + 20, panCenter.y + 50);
      ctx.lineTo(80, canvas.height - 30);
      ctx.stroke();

      // Pan body (Cast iron skillet / non-stick dark bronze)
      const panGrad = ctx.createRadialGradient(
        panCenter.x,
        panCenter.y,
        30,
        panCenter.x,
        panCenter.y,
        panRadiusX
      );
      panGrad.addColorStop(0, '#1E293B');
      panGrad.addColorStop(0.85, '#0F172A');
      panGrad.addColorStop(1, '#475569');

      ctx.fillStyle = panGrad;
      ctx.beginPath();
      ctx.ellipse(panCenter.x, panCenter.y, panRadiusX, panRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pan Rim Highlight
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Melted Butter / Oil Gloss Layer
      if (hasOil) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
        ctx.beginPath();
        ctx.ellipse(panCenter.x, panCenter.y + 10, panRadiusX * 0.8, panRadiusY * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Update & Draw Sparks / Steam Particles
      if (currentHeat > 0 && Math.random() < 0.35 * currentHeat) {
        sparksRef.current.push({
          x: panCenter.x + (Math.random() * 260 - 130),
          y: panCenter.y + (Math.random() * 120 - 60),
          vx: (Math.random() - 0.5) * 2,
          vy: -2 - Math.random() * 3,
          color: Math.random() > 0.4 ? 'rgba(255, 255, 255, 0.6)' : 'rgba(251, 191, 36, 0.8)',
          size: 1.5 + Math.random() * 3,
          life: 1.0,
        });
      }

      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const s = sparksRef.current[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.025;

        if (s.life <= 0) {
          sparksRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Physics update for food pieces in pan
      const currentPieces = [...piecesRef.current];
      const heatRate = currentHeat * (hasOil ? 0.08 : 0.05) * (1 + (stoveLevel - 1) * 0.15);

      currentPieces.forEach((p) => {
        // Gravity
        p.vy += 0.45;
        p.vx *= 0.96;
        p.vRot *= 0.95;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        // Elliptical pan floor boundary collision
        const dx = (p.x - panCenter.x) / (panRadiusX - 35);
        const dy = (p.y - panCenter.y) / (panRadiusY - 25);
        const distSq = dx * dx + dy * dy;

        if (distSq > 1.0 && p.y > panCenter.y - 40) {
          // Bounced on pan wall
          p.x = panCenter.x + (dx / Math.sqrt(distSq)) * (panRadiusX - 35);
          p.y = panCenter.y + (dy / Math.sqrt(distSq)) * (panRadiusY - 25);
          p.vx = -p.vx * 0.4;
          p.vy = -Math.abs(p.vy) * 0.4;
          p.isAirborne = false;
        } else if (p.y >= panCenter.y + panRadiusY * 0.6) {
          p.y = panCenter.y + panRadiusY * 0.6;
          p.vy = -p.vy * 0.2;
          p.isAirborne = false;
        } else if (distSq < 0.9) {
          p.isAirborne = false;
        }

        // Cook doneness accumulation when in pan contact and heat > 0
        if (!p.isAirborne && currentHeat > 0) {
          p.doneness = Math.min(160, p.doneness + heatRate);
        }

        // Draw Piece Shadow
        ctx.save();
        ctx.translate(p.x, p.y + (p.isAirborne ? 18 : 3));
        ctx.scale(1, 0.4);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, p.width * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Calculate Sear Color Gradient based on doneness
        // 0% -> baseColor; 85% -> golden brown crust; >120% -> dark charred brown
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        let pieceColor = p.baseColor;
        if (p.doneness > 120) {
          pieceColor = '#3B1812'; // Burnt
        } else if (p.doneness >= 70) {
          pieceColor = '#9A3412'; // Perfect golden sear
        } else if (p.doneness >= 35) {
          pieceColor = '#C2410C'; // Medium sear
        }

        ctx.fillStyle = pieceColor;
        ctx.beginPath();
        ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 4);
        ctx.fill();

        // Grill/Sear marks if seared
        if (p.doneness > 40) {
          ctx.strokeStyle = 'rgba(67, 20, 7, 0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-p.width * 0.35, -p.height * 0.4);
          ctx.lineTo(p.width * 0.35, p.height * 0.4);
          ctx.moveTo(-p.width * 0.1, -p.height * 0.4);
          ctx.lineTo(p.width * 0.6, p.height * 0.3);
          ctx.stroke();
        }

        // Doneness indicator bar above piece
        const barWidth = 32;
        const barHeight = 4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barWidth / 2, -p.height / 2 - 8, barWidth, barHeight);

        let barColor = '#38BDF8';
        if (p.doneness >= 75 && p.doneness <= 105) barColor = '#10B981'; // Perfect
        else if (p.doneness > 105) barColor = '#EF4444'; // Overcooked

        ctx.fillStyle = barColor;
        ctx.fillRect(
          -barWidth / 2,
          -p.height / 2 - 8,
          (barWidth * Math.min(100, p.doneness)) / 100,
          barHeight
        );

        ctx.restore();
      });

      // Notify progress
      if (currentPieces.length > 0 && onCookProgress) {
        const avgDoneness = Math.round(
          currentPieces.reduce((acc, cur) => acc + cur.doneness, 0) / currentPieces.length
        );
        onCookProgress(avgDoneness);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [hasOil, stoveLevel, onCookProgress]);

  const avgDoneness = pieces.length > 0
    ? Math.round(pieces.reduce((acc, cur) => acc + cur.doneness, 0) / pieces.length)
    : 0;

  const isIdealDoneness = avgDoneness >= 70 && avgDoneness <= 105;
  const isOvercooked = avgDoneness > 115;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-sm">프라이팬 조리 스테이션 (Sauté &amp; Pan Fry)</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span>목표 굽기:</span>
            <span className="text-amber-400 font-bold tabular-nums">{targetDoneness}%</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span>현재 평균 익힘:</span>
            <span
              className={`font-bold tabular-nums ${
                isIdealDoneness ? 'text-emerald-400' : isOvercooked ? 'text-rose-400' : 'text-sky-400'
              }`}
            >
              {avgDoneness}% {isIdealDoneness && '★ 완벽'} {isOvercooked && '⚠️ 주의'}
            </span>
          </div>
        </div>

        {/* Heat Dial Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">화력 조절:</span>
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
            {[
              { lvl: 0, label: '소화 (OFF)' },
              { lvl: 1, label: '약불' },
              { lvl: 2, label: '중불' },
              { lvl: 3, label: '강불' },
            ].map((btn) => (
              <button
                key={btn.lvl}
                onClick={() => setHeatLevel(btn.lvl)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  heatLevel === btn.lvl
                    ? btn.lvl === 3
                      ? 'bg-rose-600 text-white shadow'
                      : btn.lvl === 0
                      ? 'bg-slate-700 text-slate-200'
                      : 'bg-amber-500 text-slate-950 font-bold shadow'
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
              <span>조리 완료 &gt; 다음 단계</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Pan Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={760}
          height={440}
          className="w-full h-[360px] md:h-[440px] touch-none"
        />

        {/* Interactive Action Overlays */}
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <button
            onClick={executePanFlip}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>팬 덤블링 플립 (Flip Pan)</span>
            <span className="bg-amber-950/40 text-amber-100 text-[10px] px-1.5 py-0.5 rounded-full ml-1">
              {flipsCount}회
            </span>
          </button>

          <button
            onClick={addButterOrOil}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all shadow-md ${
              hasOil
                ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300'
                : 'bg-slate-800 hover:bg-slate-700 text-yellow-300'
            }`}
          >
            <Droplets className="w-4 h-4 text-yellow-400" />
            <span>{hasOil ? '버터 오일 코팅됨' : '프랑스 버터 &amp; 올리브유 두르기'}</span>
          </button>
        </div>

        {/* Add more ingredients to pan bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-400 shrink-0 ml-1">팬에 재료 넣기:</span>
            {initialIngredients.map((ing) => (
              <button
                key={ing.id}
                onClick={() => addPieceToPan(ing, 2)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors shrink-0"
              >
                <span>{ing.icon}</span>
                <span>{ing.koreanName}</span>
                <span className="text-amber-400 text-[10px]">+2</span>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 shrink-0 mr-2">
            프라이팬 등급: <span className="text-amber-300 font-semibold">Lv.{panLevel} 무쇠 주철</span>
          </div>
        </div>
      </div>
    </div>
  );
};
