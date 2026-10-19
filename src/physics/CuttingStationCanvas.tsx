import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IngredientMeta } from '../types/cooking';
import { sound } from '../utils/soundEngine';
import { Sparkles, RefreshCw, Scissors, CheckCircle } from 'lucide-react';

interface Piece {
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
  color: string;
  category: string;
  sliceCount: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface Props {
  targetIngredients: IngredientMeta[];
  knifeLevel: number;
  onSliceProgress?: (cutPieces: Piece[], totalSlices: number) => void;
  onStepComplete?: () => void;
}

export const CuttingStationCanvas: React.FC<Props> = ({
  targetIngredients,
  knifeLevel,
  onSliceProgress,
  onStepComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [totalCuts, setTotalCuts] = useState(0);
  const [bladeMode, setBladeMode] = useState<'standard' | 'julienne' | 'dice'>('standard');
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientMeta>(targetIngredients[0] || null);

  // Mouse drag slice trail
  const isDragging = useRef(false);
  const dragPoints = useRef<{ x: number; y: number }[]>([]);
  const particles = useRef<Particle[]>([]);
  const piecesRef = useRef<Piece[]>([]);

  // Keep ref updated
  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  // Spawn ingredient onto cutting board
  const spawnIngredient = useCallback((meta: IngredientMeta) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const newPiece: Piece = {
      id: `ing-${Date.now()}-${Math.random()}`,
      name: meta.koreanName,
      x: canvas.width / 2 + (Math.random() * 60 - 30),
      y: canvas.height / 2 - 30 + (Math.random() * 40 - 20),
      vx: (Math.random() - 0.5) * 0.8,
      vy: 0,
      width: meta.defaultWidth,
      height: meta.defaultHeight,
      rotation: (Math.random() - 0.5) * 0.2,
      vRot: 0,
      color: meta.color,
      category: meta.category,
      sliceCount: 0,
    };

    setPieces((prev) => [...prev, newPiece]);
    sound.playChop();
  }, []);

  // Initialize board
  useEffect(() => {
    if (targetIngredients.length > 0 && pieces.length === 0) {
      targetIngredients.forEach((meta) => {
        spawnIngredient(meta);
      });
    }
  }, [targetIngredients, spawnIngredient]);

  // Main Canvas Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear with warm oak cutting board texture
      ctx.fillStyle = '#C68B59';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(120, 60, 20, 0.12)';
      ctx.lineWidth = 3;
      for (let y = 15; y < canvas.height; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(canvas.width * 0.3, y + 6, canvas.width * 0.7, y - 6, canvas.width, y + 2);
        ctx.stroke();
      }

      // Cutting board border groove (juice groove)
      ctx.strokeStyle = 'rgba(75, 40, 15, 0.35)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Inner lighter board area
      ctx.fillStyle = 'rgba(255, 230, 190, 0.05)';
      ctx.fillRect(25, 25, canvas.width - 50, canvas.height - 50);

      // Update & Draw Particles (Juice / Herb bits)
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
        p.life -= 0.02;

        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Update & Draw Pieces with Physics
      const currentPieces = [...piecesRef.current];
      let needsUpdate = false;

      currentPieces.forEach((p) => {
        // Friction on wood
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.vRot *= 0.88;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        // Board boundary collision
        const margin = 35;
        if (p.x < margin) {
          p.x = margin;
          p.vx = -p.vx * 0.5;
          needsUpdate = true;
        } else if (p.x > canvas.width - margin) {
          p.x = canvas.width - margin;
          p.vx = -p.vx * 0.5;
          needsUpdate = true;
        }
        if (p.y < margin) {
          p.y = margin;
          p.vy = -p.vy * 0.5;
          needsUpdate = true;
        } else if (p.y > canvas.height - margin) {
          p.y = canvas.height - margin;
          p.vy = -p.vy * 0.5;
          needsUpdate = true;
        }

        // Draw Piece Shadow
        ctx.save();
        ctx.translate(p.x + 3, p.y + 4);
        ctx.rotate(p.rotation);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 6);
        ctx.fill();
        ctx.restore();

        // Draw Piece
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Gradient & texture for food
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 5);
        ctx.fill();

        // Cut slice facet highlight (shows knife work)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Marbling or texture lines for meat/onion
        if (p.category === 'meat') {
          ctx.strokeStyle = 'rgba(255, 240, 240, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-p.width * 0.3, -p.height * 0.2);
          ctx.lineTo(p.width * 0.3, p.height * 0.2);
          ctx.stroke();
        } else if (p.name.includes('양파')) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          for (let r = 8; r < Math.min(p.width, p.height) / 2; r += 6) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Piece Label if reasonably large
        if (p.width > 36 && p.height > 20) {
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 3;
          ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.name, 0, 0);
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });

      // Draw active knife blade cut trail
      if (dragPoints.current.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#60A5FA';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        const pts = dragPoints.current;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // Knife blade tip shine
        const last = pts[pts.length - 1];
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Check line segment intersection with piece bounding box and perform slice split
  const checkAndExecuteSlice = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const minSliceWidth = 14;
    const currentPieces = [...piecesRef.current];
    const newPiecesList: Piece[] = [];
    let cutHappened = false;

    // Vector of cut line
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const cutLength = Math.hypot(dx, dy);
    if (cutLength < 25) return; // Ignore micro-jitters

    const cutAngle = Math.atan2(dy, dx);
    const normX = -Math.sin(cutAngle);
    const normY = Math.cos(cutAngle);

    currentPieces.forEach((p) => {
      // Check if cut passes near piece center
      const toCenterX = p.x - p1.x;
      const toCenterY = p.y - p1.y;
      const dot = (toCenterX * dx + toCenterY * dy) / cutLength;
      const perpDist = Math.abs(toCenterX * normX + toCenterY * normY);

      const radius = Math.max(p.width, p.height) * 0.55;

      if (dot > 0 && dot < cutLength && perpDist < radius && p.width > minSliceWidth && p.height > minSliceWidth) {
        // Successful Cut!
        cutHappened = true;

        // Split into 2 halves with impulse along the normal
        const isHorizontal = Math.abs(dx) > Math.abs(dy);
        const splitRatio = 0.45 + Math.random() * 0.1;

        const impulseStrength = 2.5 + (knifeLevel - 1) * 0.5;

        const pieceA: Piece = {
          ...p,
          id: `cut-${Date.now()}-${Math.random()}`,
          width: isHorizontal ? p.width : Math.max(minSliceWidth, p.width * splitRatio),
          height: isHorizontal ? Math.max(minSliceWidth, p.height * splitRatio) : p.height,
          x: p.x + normX * 8,
          y: p.y + normY * 8,
          vx: p.vx + normX * impulseStrength,
          vy: p.vy + normY * impulseStrength,
          vRot: (Math.random() - 0.5) * 0.3,
          sliceCount: p.sliceCount + 1,
        };

        const pieceB: Piece = {
          ...p,
          id: `cut-${Date.now()}-${Math.random()}`,
          width: isHorizontal ? p.width : Math.max(minSliceWidth, p.width * (1 - splitRatio)),
          height: isHorizontal ? Math.max(minSliceWidth, p.height * (1 - splitRatio)) : p.height,
          x: p.x - normX * 8,
          y: p.y - normY * 8,
          vx: p.vx - normX * impulseStrength,
          vy: p.vy - normY * impulseStrength,
          vRot: (Math.random() - 0.5) * 0.3,
          sliceCount: p.sliceCount + 1,
        };

        newPiecesList.push(pieceA, pieceB);

        // Spawn juice particles
        for (let k = 0; k < 6; k++) {
          particles.current.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: p.color,
            size: 2 + Math.random() * 3,
            life: 1.0,
          });
        }
      } else {
        newPiecesList.push(p);
      }
    });

    if (cutHappened) {
      sound.playChop();
      setPieces(newPiecesList);
      setTotalCuts((prev) => {
        const next = prev + 1;
        if (onSliceProgress) {
          onSliceProgress(newPiecesList, next);
        }
        return next;
      });
    }
  };

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    isDragging.current = true;
    dragPoints.current = [{ x, y }];
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const pts = dragPoints.current;
    const last = pts[pts.length - 1];
    if (last && Math.hypot(x - last.x, y - last.y) > 6) {
      pts.push({ x, y });
      if (pts.length > 8) {
        pts.shift();
      }
      checkAndExecuteSlice(last, { x, y });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    dragPoints.current = [];
    if (canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const resetBoard = () => {
    setPieces([]);
    setTotalCuts(0);
    targetIngredients.forEach((meta) => {
      spawnIngredient(meta);
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">재료 손질 도마 (Chopping Board)</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="text-xs text-slate-300">
            총 조각수: <span className="text-amber-400 font-bold tabular-nums">{pieces.length}개</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="text-xs text-slate-300">
            커팅 횟수: <span className="text-emerald-400 font-bold tabular-nums">{totalCuts}회</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetBoard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>재료 초기화</span>
          </button>

          {onStepComplete && (
            <button
              onClick={onStepComplete}
              disabled={pieces.length < 4}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                pieces.length >= 4
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>손질 완료 &gt; 다음 단계</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-amber-950/60 shadow-2xl bg-amber-950">
        <canvas
          ref={canvasRef}
          width={760}
          height={440}
          className="w-full h-[360px] md:h-[440px] cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Slice Guide Overlay Instructions */}
        <div className="absolute top-3 left-4 pointer-events-none bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs text-slate-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>마우스나 손가락으로 재료 위를 드래그하여 나이프로 정교하게 썰어내세요!</span>
        </div>

        {/* Ingredient quick add drawer */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-400 shrink-0 ml-1">추가 손질:</span>
            {targetIngredients.map((ing) => (
              <button
                key={ing.id}
                onClick={() => spawnIngredient(ing)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors shrink-0"
              >
                <span>{ing.icon}</span>
                <span>{ing.koreanName}</span>
                <span className="text-amber-400 text-[10px]">+</span>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 shrink-0 mr-2">
            나이프 등급: <span className="text-amber-300 font-semibold">Lv.{knifeLevel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
