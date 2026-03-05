import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  RotateCcw,
  ShieldCheck,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Star,
  User,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type Gender = 'male' | 'female';

type Player = {
  id: string;
  name: string;
  image: string;
  score: number;
  reasons: string[]; // reasons (already gendered text)
  gender: Gender;
};

type Category = {
  id: string;
  name: string;
  points: number;
  color: string; // tailwind classes
  reasonMale?: string;
  reasonFemale?: string;
};

const BG_MUSIC_URL =
  'https://raw.githubusercontent.com/yifatdanieli-lab/mamad-game/main/images/fauda.mpeg';

const INITIAL_PLAYERS: Player[] = [
  { id: 'ophir', name: 'אופיר', image: 'https://raw.githubusercontent.com/yifatdanieli-lab/mamad-game/main/images/ophir.png', score: 0, reasons: [], gender: 'male' },
  { id: 'yifat', name: 'יפעת', image: 'https://raw.githubusercontent.com/yifatdanieli-lab/mamad-game/main/images/yifat.png', score: 0, reasons: [], gender: 'female' },
  { id: 'ethan', name: 'איתן', image: 'https://raw.githubusercontent.com/yifatdanieli-lab/mamad-game/main/images/ethan.png', score: 0, reasons: [], gender: 'male' },
  { id: 'tommy', name: 'תומי', image: 'https://raw.githubusercontent.com/yifatdanieli-lab/mamad-game/main/images/tommy.png', score: 0, reasons: [], gender: 'male' },
  { id: 'ronny', name: 'רוני', image: 'https://raw.githubusercontent.com/yifatdanieli-lab/mamad-game/main/images/ronny.png', score: 0, reasons: [], gender: 'male' },
];

const CATEGORIES: Category[] = [
  {
    id: 'game',
    name: 'יוזמה של משחק קופסה',
    points: 5,
    color: 'bg-emerald-100 border-emerald-200 text-emerald-800',
    reasonMale: 'יזם משחק קופסה',
    reasonFemale: 'יזמה משחק קופסה',
  },
  {
    id: 'quiet',
    name: 'שמירה על השקט בממ"ד',
    points: 5,
    color: 'bg-blue-100 border-blue-200 text-blue-800',
    reasonMale: 'שמר על השקט בממ"ד',
    reasonFemale: 'שמרה על השקט בממ"ד',
  },
  {
    id: 'no-violence',
    name: 'בלי אלימות',
    points: 5,
    color: 'bg-purple-100 border-purple-200 text-purple-800',
    reasonMale: 'התנהג ללא אלימות',
    reasonFemale: 'התנהגה ללא אלימות',
  },
  {
    id: 'positive',
    name: 'אווירה חיובית',
    points: 5,
    color: 'bg-amber-100 border-amber-200 text-amber-800',
    reasonMale: 'השרה אווירה חיובית',
    reasonFemale: 'השרתה אווירה חיובית',
  },
  {
    id: 'close-mamad',
    name: 'סגירת דלת או חלון הממ"ד',
    points: 5,
    color: 'bg-indigo-100 border-indigo-200 text-indigo-800',
    reasonMale: 'סגר את דלת או חלון הממ"ד',
    reasonFemale: 'סגרה את דלת או חלון הממ"ד',
  },
  {
    id: 'when-exit',
    name: 'שאל "מתי יוצאים?"',
    points: -5,
    color: 'bg-rose-100 border-rose-200 text-rose-800',
  },
];

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);

  // Intro overlay (tap to start)
  const [showIntro, setShowIntro] = useState(true);

  // Results overlay
  const [showResults, setShowResults] = useState(false);

  // Audio
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // Category “who was dropped here” visual (last few avatars)
  const [categoryDrops, setCategoryDrops] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const c of CATEGORIES) init[c.id] = [];
    return init;
  });

  // Category highlight effect on drop
  const [highlightCategoryId, setHighlightCategoryId] = useState<string | null>(null);

  const leaders = useMemo(() => {
    const max = Math.max(...players.map(p => p.score));
    if (max <= 0) return [];
    return players.filter(p => p.score === max);
  }, [players]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players]
  );

  const startMusic = () => {
    const music = musicRef.current;
    if (!music) return;
    music.volume = 0.35;
    music.play().then(() => setMusicPlaying(true)).catch(() => {});
  };

  const stopMusic = () => {
    const music = musicRef.current;
    if (!music) return;
    music.pause();
    setMusicPlaying(false);
  };

  const toggleMusic = () => {
    if (musicPlaying) stopMusic();
    else startMusic();
  };

  // If user mutes, pause music; if un-mutes and musicPlaying was true, try resume
  useEffect(() => {
    const music = musicRef.current;
    if (!music) return;

    if (!soundEnabled) {
      music.pause();
      return;
    }

    if (musicPlaying) {
      music.play().catch(() => {});
    }
  }, [soundEnabled, musicPlaying]);

  const addDropVisual = (categoryId: string, playerId: string) => {
    setCategoryDrops(prev => {
      const current = prev[categoryId] ?? [];
      const next = [playerId, ...current].slice(0, 6); // show up to 6
      return { ...prev, [categoryId]: next };
    });

    setHighlightCategoryId(categoryId);
    window.setTimeout(() => setHighlightCategoryId(curr => (curr === categoryId ? null : curr)), 550);
  };

  const handleScore = (playerId: string, category: Category) => {
    setPlayers(prev =>
      prev.map(p => {
        if (p.id !== playerId) return p;

        const reason =
          category.points > 0
            ? p.gender === 'female'
              ? category.reasonFemale
              : category.reasonMale
            : undefined;

        return {
          ...p,
          score: p.score + category.points,
          reasons: reason ? [...p.reasons, reason] : p.reasons,
        };
      })
    );

    addDropVisual(category.id, playerId);
  };

  const buildReasonSentence = (player: Player) => {
    const uniqueReasons = uniq(player.reasons);
    if (uniqueReasons.length === 0) return '';

    const joined =
      uniqueReasons.length === 1
        ? uniqueReasons[0]
        : `${uniqueReasons.slice(0, -1).join(', ')} ו${uniqueReasons.slice(-1)[0]}`;

    return player.gender === 'female' ? `זכתה כי ${joined}.` : `זכה כי ${joined}.`;
  };

  const resetGame = () => {
    setPlayers(INITIAL_PLAYERS);
    setShowResults(false);
    const cleared: Record<string, string[]> = {};
    for (const c of CATEGORIES) cleared[c.id] = [];
    setCategoryDrops(cleared);
  };

  const openResults = () => {
    setShowResults(true);
    if (leaders.length > 0) {
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 } }), 220);
    }
  };

  const winnerSizeClass = (count: number) => {
    if (count <= 1) return 'w-64 h-64 sm:w-[340px] sm:h-[340px]';
    if (count === 2) return 'w-56 h-56 sm:w-72 sm:h-72';
    return 'w-40 h-40 sm:w-48 sm:h-48';
  };

  const winnerGridCols = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    return 'grid-cols-5'; // for 4-5 winners
  };

  const playerById = useMemo(() => {
    const m = new Map<string, Player>();
    players.forEach(p => m.set(p.id, p));
    return m;
  }, [players]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-100 pb-20" dir="rtl">
      <audio ref={musicRef} src={BG_MUSIC_URL} loop preload="auto" />

      {/* Intro Overlay - click to start + starts music */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => {
              setShowIntro(false);
              startMusic();
            }}
          >
            <div className="text-center">
              <div className="text-white text-3xl sm:text-5xl font-black leading-tight">
                הקש למשחק הממ"דים המטורף של השנה
              </div>
              <div className="mt-4 text-white/80 text-sm sm:text-base">
               באווירת פורים ובסגנון פאודה
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-200">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">מצטייני הממ"ד</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMusic}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors text-sm font-medium"
              title={musicPlaying ? 'עצור מוזיקה' : 'נגן מוזיקה'}
            >
              {musicPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>מוזיקה</span>
            </button>

            <button
              onClick={() => {
                setSoundEnabled(v => {
                  const next = !v;
                  if (!next) {
                    // mute: pause music immediately too
                    musicRef.current?.pause();
                  } else {
                    // unmute: if musicPlaying, try resume
                    if (musicPlaying) musicRef.current?.play().catch(() => {});
                  }
                  return next;
                });
              }}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-500"
              title={soundEnabled ? 'השתק' : 'הפעל קול'}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors text-sm font-medium"
            >
              <RotateCcw size={16} />
              <span>איפוס</span>
            </button>
          </div>
        </div>

        {/* Opening paragraph - restored */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-stone-800">
            <div className="font-bold mb-2">ברוכים השבים לממ"ד שלנו!</div>
            <div className="leading-relaxed">
              גם היום אתם יכולים לזכות בהרבה שימיות. שימו לב, כל שהיה בממ"ד מקנה שימיות מחדש,
              לכן אל חשש, עדיין תוכלו לזכות הפעם. מי יהיו מצטייני הממ"ד שלנו היום?
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Players Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-stone-600">
            <User size={18} />
            גרור שחקן לקטגוריה כדי להוסיף שימיות:
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {players.map((player) => (
              <motion.div
                key={player.id}
                drag
                dragSnapToOrigin
                whileDrag={{ scale: 1.08, zIndex: 50 }}
                className="relative group cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
                onDragEnd={(_, info) => {
                  const elements = document.elementsFromPoint(info.point.x, info.point.y);
                  const categoryElement = elements.find(el => (el as HTMLElement).hasAttribute?.('data-category-id'));
                  if (categoryElement) {
                    const categoryId = (categoryElement as HTMLElement).getAttribute('data-category-id');
                    const category = CATEGORIES.find(c => c.id === categoryId);
                    if (category) {
                      handleScore(player.id, category);
                    }
                  }
                }}
              >
                <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm transition-all group-hover:shadow-md group-hover:border-emerald-200 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-stone-100 bg-stone-50">
                    {/* IMPORTANT: pointer-events-none so drag works even if you grab the image */}
                    <img
                      src={player.image}
                      alt={player.name}
                      className="w-full h-full object-cover pointer-events-none select-none"
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="font-bold text-lg">{player.name}</span>
                  <div className="bg-stone-100 px-2 py-0.5 rounded-full text-xs font-mono font-semibold text-stone-500">
                    {player.score} שמ׳
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-stone-600">
            <Star size={18} />
            קטגוריות:
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIES.map((category) => {
              const dropped = categoryDrops[category.id] ?? [];
              const isHot = highlightCategoryId === category.id;

              return (
                <div
                  key={category.id}
                  data-category-id={category.id}
                  className={[
                    'p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col gap-3',
                    category.color,
                    isHot ? 'ring-4 ring-emerald-300/60 scale-[1.01]' : 'hover:scale-[1.01] active:scale-[0.99]',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-lg">{category.name}</div>
                    <div className={`text-xl font-black ${category.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {category.points > 0 ? `+${category.points}` : category.points}
                    </div>
                  </div>

                  {/* Visual: show who was dropped here recently */}
                  <div className="flex items-center gap-2 min-h-[34px]">
                    {dropped.length === 0 ? (
                      <div className="text-xs opacity-70">גררו לכאן שחקן</div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {dropped.slice(0, 6).map((pid, idx) => {
                          const p = playerById.get(pid);
                          if (!p) return null;
                          return (
                            <motion.div
                              key={`${category.id}-${pid}-${idx}`}
                              initial={{ opacity: 0, scale: 0.8, y: 6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                              className="w-8 h-8 rounded-full overflow-hidden border border-white/60 shadow-sm"
                              title={p.name}
                            >
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                draggable={false}
                              />
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Scoreboard */}
        <section className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden mb-10">
          <div className="bg-stone-900 p-4 text-white flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" />
              טבלת שימיות
            </h2>
            <span className="text-xs uppercase tracking-widest opacity-60">מעודכן לזמן אמת</span>
          </div>

          <div className="divide-y divide-stone-100">
            {sortedPlayers.map((player, index) => {
              const max = leaders.length > 0 ? leaders[0].score : 0;
              const isLeader = max > 0 && player.score === max;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 transition-colors ${isLeader ? 'bg-amber-50/50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-6 text-center font-mono font-bold ${isLeader ? 'text-amber-600' : 'text-stone-400'}`}>
                      {index + 1}.
                    </span>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-200">
                      <img src={player.image} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" draggable={false} />
                    </div>
                    <span className={`font-bold ${isLeader ? 'text-stone-900' : 'text-stone-700'}`}>
                      {player.name}
                      {isLeader && <span className="mr-2 text-amber-500">👑</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-black font-mono ${player.score > 0 ? 'text-emerald-600' : player.score < 0 ? 'text-rose-600' : 'text-stone-400'}`}>
                      {player.score}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">שמ׳</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Results Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={openResults}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl font-bold text-2xl shadow-2xl shadow-emerald-200 transition-all active:scale-95 flex items-center gap-3"
          >
            <Award size={26} />
            הצג תוצאות
          </button>
        </div>
      </main>

      {/* Results Overlay */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm"
            onClick={() => setShowResults(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 26 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 26 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="bg-white rounded-[28px] w-full max-w-5xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 p-7 text-white text-center">
                <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                  <Trophy size={32} className="text-amber-300" />
                </div>
                <div className="text-3xl sm:text-5xl font-black mb-2 tracking-tight">
                  {leaders.length > 1 ? 'מצטייני הממ"ד!' : leaders.length === 1 ? 'מצטיין הממ"ד!' : 'אין עדיין מנצחים'}
                </div>
                <div className="text-base sm:text-lg opacity-90">
                  {leaders.length > 0 ? 'טקס הכרזה רשמי - שאפו ענק!' : 'צריך לצבור שימיות כדי להכריז על מנצח.'}
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {leaders.length > 0 ? (
                  <div className="w-full flex items-center justify-center">
                    <div
                      className={[
                        'grid gap-6 w-full place-items-center',
                        leaders.length === 1 ? 'grid-cols-1' : leaders.length === 2 ? 'grid-cols-2' : leaders.length === 3 ? 'grid-cols-3' : leaders.length === 4 ? 'grid-cols-4' : 'grid-cols-5',
                      ].join(' ')}
                    >
                      {leaders.map((winner) => {
                        const size = winnerSizeClass(leaders.length);
                        const sentence = buildReasonSentence(winner);

                        return (
                          <div key={winner.id} className="text-center w-full max-w-[320px]">
                            <div className="relative mb-4 flex justify-center">
                              <div className={`rounded-full overflow-hidden border-8 border-emerald-100 shadow-[0_25px_60px_rgba(16,185,129,0.25)] ${size}`}>
                                <img src={winner.image} alt={winner.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" draggable={false} />
                              </div>
                              <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white p-3 rounded-full shadow-xl">
                                <Trophy size={22} />
                              </div>
                            </div>

                            <div className="text-2xl sm:text-3xl font-black text-stone-900">{winner.name}</div>
                            <div className="mt-1 text-emerald-700 font-black text-xl sm:text-2xl">
                              {winner.score} שימיות
                            </div>

                            {sentence ? (
                              <div className="mt-2 text-sm sm:text-base text-stone-600 leading-snug">
                                {sentence}
                              </div>
                            ) : (
                              <div className="mt-2 text-sm text-stone-400">אין סיבות זכייה עדיין</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-stone-500">אין עדיין מנצחים - תתחילו לצבור שימיות!</div>
                )}
              </div>

              <div className="border-t border-stone-200 p-4">
                <button
                  onClick={() => setShowResults(false)}
                  className="w-full bg-stone-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-stone-800 transition-all active:scale-95"
                >
                  סגור והמשך לשחק
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}