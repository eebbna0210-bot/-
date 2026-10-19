import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IngredientMeta, Recipe } from '../types/cooking';
import { sound } from '../utils/soundEngine';
import { Award, PenTool, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface PlacedFood {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  isStacked: boolean;
}

interface SauceStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface Props {
  recipe: Recipe;
  ingredients: IngredientMeta[];
  onFinishDish: (data: {
    platingScore: number;
    stackCount: number;
    sauceCoverage: number;
  }) => void;
}

export const PlatingStationCanvas: React.FC<Props> = ({
  recipe,
  ingredients,
  onFinishDish,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedFood[]>([]);
  const [sauceStrokes, setSauceStrokes] = useState<SauceStroke[]>([]);
  const [currentTool, setCurrentTool] = useState<'place' | 'sauce' | 'garnish'>('place');
  const [sauceColor, setSauceColor] = useState<string>('#451A03'); // Demi-glace / balsamic

  const placedItemsRef = useRef<PlacedFood[]>([]);
  const isDrawingSauce = useRef(false);
  const activeStroke = useRef<{ x: number; y: number }[]>([]);
  const draggedItemIndex = useRef<number | null>(null);

  useEffect(() => {
    placedItemsRef.current = placedItems;
  }, [placedItems]);

  // Initial plate setup with recipe ingredients
  useEffect(() => {
    if (placedItems.length === 0 && ingredients.length > 0) {
      const items: PlacedFood[] = ingredients.slice(0, 5).map((ing, idx) => ({
        id: `plate-${idx}-${Date.now()}`,
        name: ing.koreanName,
        x: 280 + (idx % 3) * 90,
        y: 180 + Math.floor(idx / 3) * 60,
        vx: 0,
        vy: 0,
        width: Math.max(40, ing.defaultWidth * 0.7),
        height: Math.max(25, ing.defaultHeight * 0.6),
        rotation: (Math.random() - 0.5) * 0.2,
        color: ing.color,
        isStacked: false,
      }));
      setPlacedItems(items);
      sound.playPlateSet();
    }
  }, [ingredients, placedItems.length]);

  // Main Canvas Rendering & Stacking Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const plateCenter = { x: 380, y: 220 };
    const plateRadiusX = 250;
    const plateRadiusY = 160;

    const render = () => {
      // Dark slate restaurant pass counter background
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Plate Rim Shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(plateCenter.x + 8, plateCenter.y + 12, plateRadiusX + 5, plateRadiusY + 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ceramic Platter / Dark Slate Dish
      const plateGrad = ctx.createRadialGradient(
        plateCenter.x,
        plateCenter.y,
        30,
        plateCenter.x,
        plateCenter.y,
        plateRadiusX
      );
      plateGrad.addColorStop(0, '#FFFFFF');
      plateGrad.addColorStop(0.85, '#E2E8F0');
      plateGrad.addColorStop(1, '#CBD5E1');

      ctx.fillStyle = plateGrad;
      ctx.beginPath();
      ctx.ellipse(plateCenter.x, plateCenter.y, plateRadiusX, plateRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Plate Inner Rim
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(plateCenter.x, plateCenter.y, plateRadiusX * 0.88, plateRadiusY * 0.88, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Draw Sauce Drizzle Strokes
      sauceStrokes.forEach((stroke) => {
        if (stroke.points.length < 2) return;
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      });

      // Draw active sauce stroke in progress
      if (activeStroke.current.length > 1) {
        ctx.save();
        ctx.strokeStyle = sauceColor;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(activeStroke.current[0].x, activeStroke.current[0].y);
        for (let i = 1; i < activeStroke.current.length; i++) {
          ctx.lineTo(activeStroke.current[i].x, activeStroke.current[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Update & Draw Placed Food with Stacking Gravity
      const items = [...placedItemsRef.current];
      items.forEach((item, idx) => {
        if (draggedItemIndex.current !== idx) {
          // Subtle gravity towards plate surface
          const floorY = plateCenter.y + plateRadiusY * 0.45;
          if (item.y < floorY) {
            item.vy += 0.2;
          } else {
            item.y = floorY;
            item.vy = 0;
          }

          // Check stacking collisions against lower items
          for (let j = 0; j < items.length; j++) {
            if (j === idx) continue;
            const other = items[j];
            const dx = Math.abs(item.x - other.x);
            const dy = item.y - other.y;

            if (dx < (item.width + other.width) * 0.4 && dy > 0 && dy < other.height + 4) {
              item.y = other.y - other.height * 0.7;
              item.vy = 0;
              item.isStacked = true;
            }
          }

          item.x += item.vx;
          item.y += item.vy;
          item.vx *= 0.85;
        }

        // Draw item shadow
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y + item.height / 2 + 3, item.width / 2, item.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw item body
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.roundRect(-item.width / 2, -item.height / 2, item.width, item.height, 6);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Item text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.name, 0, 0);

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [sauceStrokes, sauceColor]);

  // Pointer interactions for dragging food items or painting sauce
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (currentTool === 'sauce') {
      isDrawingSauce.current = true;
      activeStroke.current = [{ x, y }];
      return;
    }

    // Check hit on placed items
    const items = placedItemsRef.current;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (Math.abs(x - it.x) < it.width / 2 && Math.abs(y - it.y) < it.height / 2) {
        draggedItemIndex.current = i;
        sound.playPlateSet();
        canvas.setPointerCapture(e.pointerId);
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (isDrawingSauce.current) {
      activeStroke.current.push({ x, y });
      return;
    }

    if (draggedItemIndex.current !== null) {
      setPlacedItems((prev) => {
        const copy = [...prev];
        const item = copy[draggedItemIndex.current!];
        if (item) {
          copy[draggedItemIndex.current!] = {
            ...item,
            x,
            y,
            vy: 0,
          };
        }
        return copy;
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingSauce.current) {
      isDrawingSauce.current = false;
      if (activeStroke.current.length > 1) {
        setSauceStrokes((prev) => [
          ...prev,
          {
            points: activeStroke.current,
            color: sauceColor,
            width: 6,
          },
        ]);
      }
      activeStroke.current = [];
      return;
    }

    if (draggedItemIndex.current !== null) {
      draggedItemIndex.current = null;
      sound.playPlateSet();
      if (canvasRef.current) {
        try {
          canvasRef.current.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    }
  };

  // Add extra garnish or piece
  const spawnFoodOnPlate = (meta: IngredientMeta) => {
    sound.playPlateSet();
    const newItem: PlacedFood = {
      id: `add-${Date.now()}-${Math.random()}`,
      name: meta.koreanName,
      x: 380 + (Math.random() * 80 - 40),
      y: 130,
      vx: 0,
      vy: 1,
      width: Math.max(35, meta.defaultWidth * 0.65),
      height: Math.max(22, meta.defaultHeight * 0.55),
      rotation: (Math.random() - 0.5) * 0.3,
      color: meta.color,
      isStacked: false,
    };
    setPlacedItems((prev) => [...prev, newItem]);
  };

  // Submit dish for grading
  const handleFinalSubmit = () => {
    sound.playSuccessFanfare();

    // Calculate plating aesthetics
    const items = placedItemsRef.current;
    const plateCenterX = 380;
    const plateCenterY = 220;

    // Center alignment score
    let totalDist = 0;
    items.forEach((it) => {
      totalDist += Math.hypot(it.x - plateCenterX, it.y - plateCenterY);
    });
    const avgDist = items.length > 0 ? totalDist / items.length : 100;
    const centerScore = Math.max(60, Math.min(100, Math.round(100 - (avgDist / 180) * 40)));

    // Stack height & balance
    const stackBonus = items.filter((it) => it.isStacked).length * 8;
    const sauceBonus = Math.min(20, sauceStrokes.length * 6);

    const calculatedPlatingScore = Math.min(100, centerScore + stackBonus + sauceBonus);

    onFinishDish({
      platingScore: calculatedPlatingScore,
      stackCount: items.length,
      sauceCoverage: sauceStrokes.length,
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">마스터 플레이팅 &amp; 완성 (Artisan Plating)</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="text-xs text-slate-300">
            담은 재료: <span className="text-amber-400 font-bold tabular-nums">{placedItems.length}개</span>
          </div>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTool('place')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentTool === 'place'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            음식 이동 &amp; 스태킹
          </button>

          <button
            onClick={() => setCurrentTool('sauce')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentTool === 'sauce'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>소스 드로잉</span>
          </button>

          {currentTool === 'sauce' && (
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
              {[
                { color: '#451A03', label: '발사믹/데미글라스' },
                { color: '#166534', label: '바질 오일' },
                { color: '#B91C1C', label: '칠리 글레이즈' },
                { color: '#D97706', label: '치즈 소스' },
              ].map((s) => (
                <button
                  key={s.color}
                  onClick={() => setSauceColor(s.color)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    sauceColor === s.color ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: s.color }}
                  title={s.label}
                />
              ))}
            </div>
          )}

          <button
            onClick={handleFinalSubmit}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>요리 완성 &amp; 심사 제출</span>
          </button>
        </div>
      </div>

      {/* Main Plating Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={760}
          height={440}
          className={`w-full h-[360px] md:h-[440px] touch-none ${
            currentTool === 'sauce' ? 'cursor-crosshair' : 'cursor-grab'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        <div className="absolute top-3 left-4 pointer-events-none bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs text-slate-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {currentTool === 'sauce'
              ? '접시 위에 마우스를 드래그하여 멋진 셰프 소스 라인을 그려보세요!'
              : '재료를 드래그하여 중앙에 보기 좋게 높이 쌓아 올리세요!'}
          </span>
        </div>

        {/* Add more ingredients to plate */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-400 shrink-0 ml-1">접시에 올리기:</span>
            {ingredients.map((ing) => (
              <button
                key={ing.id}
                onClick={() => spawnFoodOnPlate(ing)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors shrink-0"
              >
                <span>{ing.icon}</span>
                <span>{ing.koreanName}</span>
                <span className="text-amber-400 text-[10px]">+</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
