import React, { useState, useEffect } from 'react';
import { MultiplayerPlayer, CookingStationType } from '../types/cooking';
import { sound } from '../utils/soundEngine';
import { Users, ChefHat, Play, CheckCircle, Flame, Scissors, Award, MessageSquare, Zap } from 'lucide-react';

interface TeamOrder {
  id: string;
  name: string;
  targetPrep: number; // 0 to 100%
  targetCook: number; // 0 to 100%
  targetPlate: number; // 0 to 100%
  prepDone: number;
  cookDone: number;
  plateDone: number;
  remainingSeconds: number;
  rewardPoints: number;
}

export const MultiplayerCoop: React.FC = () => {
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomCode, setRoomCode] = useState('CHEF-92');
  const [inputCode, setInputCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'prepper' | 'cooker' | 'plater'>('prepper');

  // Players in room
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([
    {
      id: 'p-1',
      name: '나 (Head Chef)',
      role: '재료 손질사 (Prepper)',
      isReady: true,
      score: 480,
      currentStation: 'CHOPPING',
      avatar: '👨‍🍳',
    },
    {
      id: 'p-2',
      name: 'AI 수셰프 민우',
      role: '화력 조리사 (Cooker)',
      isReady: true,
      score: 420,
      currentStation: 'FRYING',
      avatar: '🧑‍🍳',
    },
    {
      id: 'p-3',
      name: 'AI 셰프 엘레나',
      role: '플레이팅 & 총괄 (Plater)',
      isReady: true,
      score: 510,
      currentStation: 'PLATING',
      avatar: '👩‍🍳',
    },
  ]);

  // Live Team Relay Orders
  const [teamOrders, setTeamOrders] = useState<TeamOrder[]>([
    {
      id: 'to-1',
      name: '특선 립아이 스테이크 & 구운 버섯',
      targetPrep: 100,
      targetCook: 100,
      targetPlate: 100,
      prepDone: 80,
      cookDone: 45,
      plateDone: 0,
      remainingSeconds: 45,
      rewardPoints: 350,
    },
    {
      id: 'to-2',
      name: '로마식 정통 까르보나라',
      targetPrep: 100,
      targetCook: 100,
      targetPlate: 100,
      prepDone: 100,
      cookDone: 70,
      plateDone: 20,
      remainingSeconds: 60,
      rewardPoints: 280,
    },
  ]);

  const [teamScore, setTeamScore] = useState(1410);
  const [teamCombo, setTeamCombo] = useState(3);
  const [chatLogs, setChatLogs] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'AI 수셰프 민우', text: '화력 예열 완료되었습니다! 손질된 소고기 넘겨주세요!', time: '방금 전' },
    { sender: 'AI 셰프 엘레나', text: '따뜻한 접시와 발사믹 리덕션 준비해두었습니다.', time: '방금 전' },
  ]);

  // Timer loop for multiplayer orders
  useEffect(() => {
    if (!isInRoom) return;

    const timer = setInterval(() => {
      setTeamOrders((prev) =>
        prev
          .map((ord) => ({
            ...ord,
            remainingSeconds: ord.remainingSeconds - 1,
          }))
          .filter((ord) => ord.remainingSeconds > 0)
      );

      // AI Bot automatic relay participation
      if (Math.random() < 0.35) {
        setTeamOrders((prev) =>
          prev.map((ord) => {
            if (ord.prepDone >= 70 && ord.cookDone < 100) {
              return {
                ...ord,
                cookDone: Math.min(100, ord.cookDone + 20),
              };
            }
            if (ord.cookDone >= 80 && ord.plateDone < 100) {
              return {
                ...ord,
                plateDone: Math.min(100, ord.plateDone + 25),
              };
            }
            return ord;
          })
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isInRoom]);

  // Action for current player role
  const handlePlayerAction = (orderId: string) => {
    sound.playChop();

    setTeamOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        if (selectedRole === 'prepper') {
          const nextPrep = Math.min(100, ord.prepDone + 35);
          if (nextPrep >= 100 && ord.prepDone < 100) {
            sound.playDing();
            addChat('나 (Prepper)', `${ord.name} 재료 손질 완료! 팬 조리사에게 전달했습니다! 🥩`);
          }
          return { ...ord, prepDone: nextPrep };
        } else if (selectedRole === 'cooker') {
          sound.playPanFlip();
          const nextCook = Math.min(100, ord.cookDone + 30);
          if (nextCook >= 100 && ord.cookDone < 100) {
            sound.playDing();
            addChat('나 (Cooker)', `${ord.name} 골든 시어링 완성! 플레이팅 패스로 전달! 🍳`);
          }
          return { ...ord, cookDone: nextCook };
        } else {
          sound.playPlateSet();
          const nextPlate = Math.min(100, ord.plateDone + 40);
          if (nextPlate >= 100) {
            sound.playSuccessFanfare();
            setTeamScore((s) => s + ord.rewardPoints * teamCombo);
            setTeamCombo((c) => Math.min(5, c + 1));
            addChat('나 (Plater)', `🎉 ${ord.name} 최종 플레이팅 및 서빙 완료! (+${ord.rewardPoints * teamCombo}점)`);
          }
          return { ...ord, plateDone: nextPlate };
        }
      })
    );
  };

  const addChat = (sender: string, text: string) => {
    setChatLogs((prev) => [...prev.slice(-6), { sender, text, time: '방금 전' }]);
  };

  const createNewRoom = () => {
    const code = `CHEF-${Math.floor(10 + Math.random() * 89)}`;
    setRoomCode(code);
    setIsInRoom(true);
    sound.playDing();
  };

  const joinRoom = () => {
    if (inputCode.trim()) {
      setRoomCode(inputCode.trim().toUpperCase());
      setIsInRoom(true);
      sound.playDing();
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Users className="w-4 h-4" />
            <span>실시간 협동 키친 네트워크</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white mt-1">
            멀티플레이어 셰프 협동 모드 (Co-op Rush)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            친구들과 도마 손질사, 화력 조리사, 플레이팅 총괄로 역할을 분담하여 최고의 팀워크 릴레이 요리를 완성하세요.
          </p>
        </div>

        {isInRoom && (
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">룸 코드 (공유용)</div>
              <div className="text-lg font-bold text-amber-400 font-mono tracking-wider">{roomCode}</div>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">팀 콤보 보너스</div>
              <div className="text-lg font-bold text-emerald-400 font-mono flex items-center justify-center gap-1">
                <Zap className="w-4 h-4 fill-emerald-400" />
                <span>x{teamCombo}.0</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isInRoom ? (
        /* Room Entrance Lobby */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <ChefHat className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">새로운 협동 키친 룸 개설하기</h2>
              <p className="text-xs text-slate-400 mt-1">
                룸을 생성하고 친구에게 룸 코드를 공유하거나, 지능형 AI 수셰프 봇들과 즉시 팀을 이루어 조리를 시작합니다.
              </p>
            </div>
            <button
              onClick={createNewRoom}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              협동 주방 룸 생성 및 시작
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">친구의 주방 룸에 입장하기</h2>
              <p className="text-xs text-slate-400 mt-1">
                공유받은 4자리 룸 코드를 입력하여 친구의 요리 팀에 합류하세요.
              </p>
              <input
                type="text"
                placeholder="예: CHEF-92"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="w-full mt-4 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono uppercase"
              />
            </div>
            <button
              onClick={joinRoom}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              룸 입장하기
            </button>
          </div>
        </div>
      ) : (
        /* Active Co-op Kitchen Stage */
        <div className="flex flex-col gap-6">
          {/* Role selector banner */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">내 현재 전담 포지션:</span>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setSelectedRole('prepper')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    selectedRole === 'prepper'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>1. 재료 손질사 (도마)</span>
                </button>
                <button
                  onClick={() => setSelectedRole('cooker')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    selectedRole === 'cooker'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>2. 화력 조리사 (팬/냄비)</span>
                </button>
                <button
                  onClick={() => setSelectedRole('plater')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    selectedRole === 'plater'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>3. 플레이팅 총괄</span>
                </button>
              </div>
            </div>

            <div className="text-xs font-bold text-amber-400 tabular-nums">
              협동 팀 총점: {teamScore.toLocaleString()}점
            </div>
          </div>

          {/* Active Relay Orders Pipeline */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              주방 릴레이 주문 파이프라인 (Kitchen Relay Pipeline)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamOrders.map((ord) => {
                const isFullyReady = ord.prepDone >= 100 && ord.cookDone >= 100 && ord.plateDone >= 100;

                return (
                  <div
                    key={ord.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-white">{ord.name}</div>
                        <div className="text-xs font-mono font-semibold text-amber-400">
                          {ord.remainingSeconds}초 남음
                        </div>
                      </div>

                      {/* 3 Step Relay Meters */}
                      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                        {/* Step 1 Prep */}
                        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">1. 손질</span>
                            <span className="font-semibold text-amber-400">{ord.prepDone}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full" style={{ width: `${ord.prepDone}%` }} />
                          </div>
                        </div>

                        {/* Step 2 Cook */}
                        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">2. 조리</span>
                            <span className="font-semibold text-sky-400">{ord.cookDone}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-sky-400 h-full" style={{ width: `${ord.cookDone}%` }} />
                          </div>
                        </div>

                        {/* Step 3 Plate */}
                        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">3. 플레이팅</span>
                            <span className="font-semibold text-emerald-400">{ord.plateDone}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full" style={{ width: `${ord.plateDone}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action button based on player role */}
                    <button
                      onClick={() => handlePlayerAction(ord.id)}
                      className={`w-full py-2.5 text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 ${
                        selectedRole === 'prepper'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : selectedRole === 'cooker'
                          ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                      }`}
                    >
                      {selectedRole === 'prepper' && '칼질 손질 진행 (팬으로 전달)'}
                      {selectedRole === 'cooker' && '팬 덤블링 & 조리 진행 (플레이팅으로 전달)'}
                      {selectedRole === 'plater' && '양념 간맞춤 & 플레이팅 완성 서빙'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Chat & Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>실시간 주방 무전 &amp; 릴레이 로그 (Kitchen Comms)</span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              {chatLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-amber-400 font-bold shrink-0">[{log.sender}]</span>
                  <span className="text-slate-200">{log.text}</span>
                  <span className="text-[10px] text-slate-500 ml-auto shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
