import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/soundEngine';
import { Swords, Trophy, Clock, Star, Flame, Scissors, Sparkles, Award, RotateCcw } from 'lucide-react';

interface Judge {
  name: string;
  avatar: string;
  role: string;
  playerScore: number;
  rivalScore: number;
  comment: string;
}

export const CulinaryBattle: React.FC = () => {
  const [battleState, setBattleState] = useState<'lobby' | 'cooking' | 'judging' | 'result'>('lobby');
  const [secretIngredient, setSecretIngredient] = useState('🥩 최상급 립아이 소고기');
  const [rivalName] = useState('스타 셰프 고든 (Gordon)');
  const [timeLeft, setTimeLeft] = useState(120);

  // Player live cooking actions in battle
  const [playerCuts, setPlayerCuts] = useState(0);
  const [playerSear, setPlayerSear] = useState(0);
  const [playerSeason, setPlayerSeason] = useState(0);
  const [playerPlating, setPlayerPlating] = useState(0);

  // Rival live stats
  const [rivalProgress, setRivalProgress] = useState(0);
  const [rivalComment, setRivalComment] = useState('재료를 정밀하게 슬라이스하는 중...');

  // Judges panel
  const [judges, setJudges] = useState<Judge[]>([
    {
      name: '고든 셰프',
      avatar: '👨‍🍳',
      role: '육류 시어링 & 불맛 심사',
      playerScore: 0,
      rivalScore: 0,
      comment: '',
    },
    {
      name: '한소희 미식가',
      avatar: '👩‍💼',
      role: '풍미 & 황금비율 시즈닝 심사',
      playerScore: 0,
      rivalScore: 0,
      comment: '',
    },
    {
      name: '박준우 칼럼니스트',
      avatar: '👨‍💼',
      role: '플레이팅 미학 & 완성도 심사',
      playerScore: 0,
      rivalScore: 0,
      comment: '',
    },
  ]);

  const [winner, setWinner] = useState<'player' | 'rival' | 'draw' | null>(null);

  // Battle Timer Loop
  useEffect(() => {
    if (battleState !== 'cooking') return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          finishBattle();
          return 0;
        }
        return t - 1;
      });

      // Rival progress simulation
      setRivalProgress((prev) => {
        const next = Math.min(100, prev + 1.2);
        if (next >= 85) setRivalComment('접시에 소스를 드로잉하며 플레이팅 마무리 중!');
        else if (next >= 50) setRivalComment('팬을 화려하게 덤블링하며 크러스트를 입히는 중!');
        else if (next >= 25) setRivalComment('특제 허브 솔트로 마리네이드 중!');
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [battleState]);

  const startBattle = () => {
    const ingredients = [
      '🥩 최상급 립아이 소고기',
      '🐟 신선한 지중해 연어 필렛',
      '🦐 점보 쉬림프 & 오징어',
      '🥓 수제 통베이컨 판체타',
    ];
    setSecretIngredient(ingredients[Math.floor(Math.random() * ingredients.length)]);
    setTimeLeft(90);
    setPlayerCuts(0);
    setPlayerSear(0);
    setPlayerSeason(0);
    setPlayerPlating(0);
    setRivalProgress(0);
    setBattleState('cooking');
    sound.playDing();
  };

  const finishBattle = () => {
    setBattleState('judging');

    // Calculate score
    const pTotal = Math.min(100, Math.round(playerCuts * 0.25 + playerSear * 0.25 + playerSeason * 0.25 + playerPlating * 0.25));
    const rTotal = Math.min(100, Math.round(rivalProgress * 0.9 + 5));

    setTimeout(() => {
      const j1Player = Math.min(100, Math.round(playerSear * 0.8 + 20));
      const j1Rival = 86;

      const j2Player = Math.min(100, Math.round(playerSeason * 0.8 + 18));
      const j2Rival = 88;

      const j3Player = Math.min(100, Math.round(playerPlating * 0.8 + 22));
      const j3Rival = 84;

      const updatedJudges: Judge[] = [
        {
          name: '고든 셰프',
          avatar: '👨‍🍳',
          role: '육류 시어링 & 불맛 심사',
          playerScore: j1Player,
          rivalScore: j1Rival,
          comment: j1Player >= j1Rival ? '크러스트가 환상적이군! 완벽한 미디엄 레어야!' : '불 조절에 조금 더 집중해야겠어.',
        },
        {
          name: '한소희 미식가',
          avatar: '👩‍💼',
          role: '풍미 & 황금비율 시즈닝 심사',
          playerScore: j2Player,
          rivalScore: j2Rival,
          comment: j2Player >= j2Rival ? '소금과 후추의 밸런스가 입안 가득 감돕니다.' : '살짝 간이 아쉽지만 훌륭한 시도였습니다.',
        },
        {
          name: '박준우 칼럼니스트',
          avatar: '👨‍💼',
          role: '플레이팅 미학 & 완성도 심사',
          playerScore: j3Player,
          rivalScore: j3Rival,
          comment: j3Player >= j3Rival ? '시각적인 볼륨감과 색상의 대비가 돋보입니다.' : '정갈함에서 라이벌이 조금 앞섰습니다.',
        },
      ];

      setJudges(updatedJudges);

      const playerAvg = Math.round((j1Player + j2Player + j3Player) / 3);
      const rivalAvg = Math.round((j1Rival + j2Rival + j3Rival) / 3);

      if (playerAvg > rivalAvg) {
        setWinner('player');
        sound.playSuccessFanfare();
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } else if (playerAvg < rivalAvg) {
        setWinner('rival');
      } else {
        setWinner('draw');
      }

      setBattleState('result');
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
            <Swords className="w-4 h-4" />
            <span>1v1 그랜드 마스터 요리 대결</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white mt-1">
            마스터 셰프 쿡오프 배틀 (Cook-Off Battle)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            제한 시간 내에 비밀 식자재를 활용하여 최고의 요리를 조리하고 3인의 심사위원단 평가를 겨루세요.
          </p>
        </div>

        {battleState === 'cooking' && (
          <div className="flex items-center gap-3">
            <div className="bg-rose-950/80 border border-rose-700/60 px-4 py-2 rounded-xl text-center">
              <div className="text-[10px] text-rose-300">남은 대결 시간</div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        )}
      </div>

      {battleState === 'lobby' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Swords className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">라이벌 셰프와의 1:1 진검승부</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              대결 시작 시 무작위 비밀 식자재가 공개됩니다. 신속하게 재료를 손질하고, 크러스트를 시어링하고, 완벽한 간을 맞춰 완성하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left">
              <div className="text-[10px] text-slate-400">도전자 (Player)</div>
              <div className="text-base font-bold text-white mt-0.5">나 (Player Chef)</div>
              <div className="text-xs text-amber-400 mt-1">도마 &amp; 팬 올라운더 셰프</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left">
              <div className="text-[10px] text-slate-400">상대 (Rival)</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">{rivalName}</div>
              <div className="text-xs text-slate-400 mt-1">미슐랭 3스타 마스터 셰프</div>
            </div>
          </div>

          <button
            onClick={startBattle}
            className="px-8 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
          >
            쿡오프 대결 시작하기 (Start Cook-Off)
          </button>
        </div>
      )}

      {battleState === 'cooking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Secret Ingredient Bar */}
          <div className="lg:col-span-12 bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs">
            <span className="text-amber-300 font-semibold">
              오늘의 비밀 주재료: <span className="font-bold text-white">{secretIngredient}</span>
            </span>
            <button
              onClick={finishBattle}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors shadow"
            >
              조리 조기 완료 &amp; 심사 제출
            </button>
          </div>

          {/* Player Cooking Arena (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Player Station
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">내 요리 작업대</h3>
              </div>
              <div className="text-xs font-bold text-emerald-400 tabular-nums">
                완성도: {Math.round((playerCuts + playerSear + playerSeason + playerPlating) / 4)}%
              </div>
            </div>

            {/* Interactive Battle Action Buttons */}
            <div className="flex flex-col gap-3">
              {/* Cutting */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">1. 재료 정밀 슬라이스</span>
                    <span className="text-amber-400 font-bold tabular-nums">{playerCuts}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full transition-all" style={{ width: `${playerCuts}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playChop();
                    setPlayerCuts((c) => Math.min(100, c + 20));
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors shrink-0"
                >
                  <Scissors className="w-3.5 h-3.5 inline mr-1" />
                  칼질
                </button>
              </div>

              {/* Searing */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">2. 팬 고온 시어링</span>
                    <span className="text-sky-400 font-bold tabular-nums">{playerSear}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-full transition-all" style={{ width: `${playerSear}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playPanFlip();
                    setPlayerSear((s) => Math.min(100, s + 20));
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors shrink-0"
                >
                  <Flame className="w-3.5 h-3.5 inline mr-1" />
                  시어링
                </button>
              </div>

              {/* Seasoning */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">3. 황금비율 시즈닝</span>
                    <span className="text-emerald-400 font-bold tabular-nums">{playerSeason}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all" style={{ width: `${playerSeason}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playSeasoningShake();
                    setPlayerSeason((s) => Math.min(100, s + 20));
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                  양념
                </button>
              </div>

              {/* Plating */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">4. 접시 플레이팅 &amp; 가니쉬</span>
                    <span className="text-purple-400 font-bold tabular-nums">{playerPlating}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full transition-all" style={{ width: `${playerPlating}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playPlateSet();
                    setPlayerPlating((p) => Math.min(100, p + 25));
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors shrink-0"
                >
                  <Award className="w-3.5 h-3.5 inline mr-1" />
                  플레이팅
                </button>
              </div>
            </div>
          </div>

          {/* Rival Cooking Arena (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                  Rival Station
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{rivalName} 작업대</h3>
              </div>
              <div className="text-xs font-bold text-rose-400 tabular-nums">
                완성도: {Math.round(rivalProgress)}%
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">라이벌 조리 진행률</span>
                  <span className="text-rose-400 font-bold tabular-nums">{Math.round(rivalProgress)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${rivalProgress}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
                <span className="text-2xl">👨‍🍳</span>
                <div>
                  <div className="font-semibold text-rose-300">라이벌 현장 코멘트</div>
                  <div className="text-slate-400 mt-0.5">&ldquo;{rivalComment}&rdquo;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {battleState === 'judging' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <Award className="w-12 h-12 text-amber-400 animate-bounce" />
          <h2 className="text-2xl font-bold text-white">미식 심사위원단 블라인드 평가 진행 중...</h2>
          <p className="text-xs text-slate-400">
            3인의 심사위원이 시어링 크러스트, 풍미 조화, 플레이팅 완성도를 엄격하게 점검하고 있습니다.
          </p>
        </div>
      )}

      {battleState === 'result' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl">
          <div className="text-center">
            <div className="text-xs font-bold text-amber-400 tracking-wider">
              그랜드 쿡오프 최종 결과
            </div>
            <h2 className="text-3xl font-extrabold font-display text-white mt-1">
              {winner === 'player' ? '🏆 플레이어 셰프 대승리!' : winner === 'rival' ? '🥈 라이벌 셰프 승리' : '🤝 무승부 접전'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {winner === 'player'
                ? '심사위원 만장일치로 감탄을 자아내며 우승 트로피와 상금을 획득했습니다!'
                : '아쉬운 차이로 승리를 내주었지만 훌륭한 요리였습니다.'}
            </p>
          </div>

          {/* Judges scorecard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {judges.map((j, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{j.avatar}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{j.name}</div>
                      <div className="text-[10px] text-slate-400">{j.role}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-slate-900 rounded-lg text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">내 점수</div>
                      <div className="text-base font-bold text-amber-400 tabular-nums">{j.playerScore}점</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">라이벌 점수</div>
                      <div className="text-base font-bold text-rose-400 tabular-nums">{j.rivalScore}점</div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 italic border-t border-slate-800 pt-2">
                  &ldquo;{j.comment}&rdquo;
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-2">
            <button
              onClick={() => setBattleState('lobby')}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>새로운 요리 대결 도전</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
