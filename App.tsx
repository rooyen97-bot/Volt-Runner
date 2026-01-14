
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, AppState, Question, HighScore } from './types';
import { INITIAL_QUESTIONS, CLASSES, GAME_CONFIG } from './constants';
import GameCanvas from './components/GameCanvas';
import QuestionModal from './components/QuestionModal';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    const saved = localStorage.getItem('el_runner_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Tvinga systemet att använda EE23 och rensa gamla klasser vid omladdning
      const courseQuestions: Record<string, Question[]> = {};
      CLASSES.forEach((c: string) => {
        // Om frågor redan finns sparade för EE23, behåll dem, annars ta grundfrågorna
        courseQuestions[c] = parsed.courseQuestions?.[c] || [...INITIAL_QUESTIONS];
      });

      return {
        playerName: parsed.playerName || '',
        playerClass: CLASSES[0], // Alltid EE23 som standard
        courseQuestions,
        highScores: parsed.highScores || [],
        availableClasses: CLASSES
      };
    }

    // Standardläge vid första start
    const initialCourseQuestions: Record<string, Question[]> = {};
    CLASSES.forEach(c => {
      initialCourseQuestions[c] = [...INITIAL_QUESTIONS];
    });

    return {
      playerName: '',
      playerClass: CLASSES[0],
      courseQuestions: initialCourseQuestions,
      highScores: [],
      availableClasses: CLASSES
    };
  });

  const [gameState, setGameState] = useState<GameState>({
    playerX: 100,
    playerY: GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLAYER_SIZE,
    velocityY: 0,
    isJumping: false,
    score: 0,
    mistakes: 0,
    currentLevel: 1,
    distance: 0,
    isPaused: false,
    gameStatus: 'START'
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminError, setAdminError] = useState(false);

  useEffect(() => {
    localStorage.setItem('el_runner_state', JSON.stringify(appState));
  }, [appState]);

  const startGame = () => {
    if (!appState.playerName) {
      alert('Vänligen fyll i ditt namn!');
      return;
    }
    const questions = appState.courseQuestions[appState.playerClass] || [];
    if (questions.length === 0) {
      alert('Det saknas frågor i klassen! Gå till Admin-panelen för att lägga till några.');
      return;
    }
    setGameState(prev => ({ ...prev, gameStatus: 'PLAYING', score: 0, mistakes: 0 }));
  };

  const handleCollision = useCallback(() => {
    const questions = appState.courseQuestions[appState.playerClass] || [];
    if (questions.length === 0) {
        setGameState(prev => ({ ...prev, gameStatus: 'PLAYING', isPaused: false }));
        return;
    }
    const randomIdx = Math.floor(Math.random() * questions.length);
    setCurrentQuestion(questions[randomIdx]);
    setGameState(prev => ({ ...prev, gameStatus: 'QUESTION', isPaused: true }));
  }, [appState.courseQuestions, appState.playerClass]);

  const handleObstaclePassed = useCallback(() => {
    setGameState(prev => ({ ...prev, score: prev.score + 1 }));
  }, []);

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'PLAYING',
        isPaused: false
      }));
      setCurrentQuestion(null);
    } else {
      const newMistakes = gameState.mistakes + 1;
      if (newMistakes >= 3) {
        saveScore(gameState.score);
        setGameState(prev => ({ ...prev, gameStatus: 'GAMEOVER', mistakes: newMistakes }));
      } else {
        const questions = appState.courseQuestions[appState.playerClass] || [];
        let nextIdx = Math.floor(Math.random() * questions.length);
        while (currentQuestion && questions[nextIdx].id === currentQuestion.id && questions.length > 1) {
          nextIdx = Math.floor(Math.random() * questions.length);
        }
        setCurrentQuestion(questions[nextIdx]);
        setGameState(prev => ({ ...prev, mistakes: newMistakes }));
      }
    }
  };

  const saveScore = (finalScore: number) => {
    const newScore: HighScore = {
      name: appState.playerName,
      className: appState.playerClass,
      score: finalScore,
      date: new Date().toLocaleDateString()
    };
    setAppState(prev => ({
      ...prev,
      highScores: [...prev.highScores, newScore].sort((a, b) => b.score - a.score).slice(0, 50)
    }));
  };

  const resetGame = () => {
    setGameState({
      playerX: 100,
      playerY: GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLAYER_SIZE,
      velocityY: 0,
      isJumping: false,
      score: 0,
      mistakes: 0,
      currentLevel: 1,
      distance: 0,
      isPaused: false,
      gameStatus: 'START'
    });
  };

  const attemptAdminAccess = () => {
    if (adminCode === '1234') {
      setGameState(prev => ({ ...prev, gameStatus: 'ADMIN' }));
      setShowAdminPrompt(false);
      setAdminCode('');
      setAdminError(false);
    } else {
      setAdminError(true);
      setTimeout(() => setAdminError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      {gameState.gameStatus === 'START' && (
        <div className="max-w-md w-full bg-slate-900 border-2 border-sky-500 rounded-3xl p-10 shadow-[0_0_40px_rgba(14,165,233,0.3)] text-center animate-in zoom-in duration-500">
          <div className="mb-8 relative inline-block">
             <h1 className="text-6xl font-black italic text-white tracking-tighter uppercase mb-2">Volt<span className="text-sky-500">Runner</span></h1>
             <div className="absolute -right-4 -top-4 text-yellow-400 animate-pulse">⚡</div>
          </div>
          <p className="text-slate-400 mb-8 font-medium">Välkommen till klass <span className="text-sky-400 font-bold">{appState.playerClass}</span>!</p>
          
          <div className="space-y-6">
            <input 
              type="text" 
              placeholder="Ditt Förnamn"
              value={appState.playerName}
              onChange={e => setAppState({...appState, playerName: e.target.value})}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-5 py-4 focus:border-sky-500 focus:outline-none transition-colors text-lg font-bold placeholder:text-slate-600"
            />
            <button 
              onClick={startGame}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-5 rounded-xl text-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest"
            >
              Starta Spelet
            </button>
            <button 
              onClick={() => setShowAdminPrompt(true)}
              className="text-slate-500 hover:text-sky-400 text-sm font-bold uppercase tracking-widest pt-4 block w-full"
            >
              Lärarkontroll
            </button>
          </div>
        </div>
      )}

      {showAdminPrompt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-slate-900 border-2 border-slate-700 p-8 rounded-3xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-white text-xl font-black uppercase mb-2 tracking-tight">Behörighet krävs</h2>
            <p className="text-slate-400 text-sm mb-6">Ange lärarkoden.</p>
            <input 
              type="password"
              placeholder="Kod"
              autoFocus
              value={adminCode}
              onChange={e => setAdminCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && attemptAdminAccess()}
              className={`w-full bg-slate-800 border-2 rounded-xl px-4 py-3 mb-4 focus:outline-none transition-all text-center text-2xl tracking-[1em] font-mono ${adminError ? 'border-red-500 animate-shake' : 'border-slate-700 focus:border-sky-500 text-white'}`}
            />
            {adminError && <p className="text-red-500 text-xs font-bold text-center mb-4 uppercase">Felaktig kod!</p>}
            <div className="flex gap-3">
              <button 
                onClick={() => {setShowAdminPrompt(false); setAdminCode('');}}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl font-bold transition-all"
              >
                AVBRYT
              </button>
              <button 
                onClick={attemptAdminAccess}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95"
              >
                LOGGA IN
              </button>
            </div>
          </div>
        </div>
      )}

      {(gameState.gameStatus === 'PLAYING' || gameState.gameStatus === 'QUESTION') && (
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
          <div className="w-full flex justify-between items-end mb-2 px-4">
            <div>
              <p className="text-slate-500 uppercase text-xs font-black tracking-widest mb-1">Klass EE23</p>
              <p className="text-2xl font-black text-white">{appState.playerName}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 uppercase text-xs font-black tracking-widest mb-1">Poäng</p>
              <p className="text-4xl font-black text-white tabular-nums">{gameState.score}</p>
            </div>
          </div>
          
          <GameCanvas 
            gameActive={true} 
            isPaused={gameState.isPaused} 
            onCollision={handleCollision}
            onObstaclePassed={handleObstaclePassed}
            score={gameState.score}
          />
          
          <div className="text-slate-500 text-sm italic text-center leading-relaxed px-4">
            {gameState.score >= 110 
              ? <span className="text-red-400 font-bold uppercase">🔥 ULTIMAT UTMANING: INVERTERAT FLYG 🔥</span>
              : gameState.score >= 55 
                ? <span className="text-purple-400 font-bold uppercase">⚠️ GRAVITATIONS-FLIP! HOPPA FRÅN TAKET ⚠️</span>
                : gameState.score >= 25 
                  ? <span className="text-blue-400 font-bold">🚀 FLYG-LÄGE AKTIVERAT: HÅLL MELLANSLAG FÖR ATT FLYGA!</span>
                  : 'Tryck MELLANSLAG eller KLICKA för att hoppa!'}
          </div>

          {gameState.gameStatus === 'QUESTION' && currentQuestion && (
            <QuestionModal 
              question={currentQuestion} 
              onAnswer={handleAnswer} 
              mistakes={gameState.mistakes} 
            />
          )}
        </div>
      )}

      {gameState.gameStatus === 'GAMEOVER' && (
        <div className="max-w-2xl w-full bg-slate-900 border-2 border-red-500 rounded-3xl p-10 shadow-2xl text-center animate-in zoom-in">
          <h1 className="text-5xl font-black text-white uppercase italic mb-4">Game <span className="text-red-500">Over</span></h1>
          <p className="text-slate-400 mb-8 text-xl">Du fick slut på liv! Träna mer på frågorna för EE23 för att komma längre.</p>
          
          <div className="bg-slate-800 rounded-2xl p-6 mb-10 border border-slate-700">
            <p className="text-slate-500 uppercase font-black text-sm tracking-widest mb-2">Ditt Resultat</p>
            <p className="text-6xl font-black text-white">{gameState.score} POÄNG</p>
          </div>

          <div className="mb-10">
            <h3 className="text-sky-400 font-bold uppercase tracking-widest text-lg mb-4">Topplista EE23</h3>
            <div className="space-y-2">
              {appState.highScores
                .filter(s => s.className === 'EE23')
                .sort((a,b) => b.score - a.score)
                .slice(0, 5)
                .map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="font-bold text-slate-300">#{idx+1} {s.name}</span>
                    <span className="font-mono text-white font-black">{s.score}</span>
                  </div>
                ))}
            </div>
          </div>

          <button 
            onClick={resetGame}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-4 rounded-xl text-xl transition-all"
          >
            Spela Igen
          </button>
        </div>
      )}

      {gameState.gameStatus === 'ADMIN' && (
        <AdminPanel 
          courseQuestions={appState.courseQuestions}
          setCourseQuestions={(cq) => setAppState({...appState, courseQuestions: cq})}
          availableClasses={appState.availableClasses}
          setAvailableClasses={(c) => {
            const newCourseQuestions = { ...appState.courseQuestions };
            c.forEach(className => {
              if (!newCourseQuestions[className]) {
                newCourseQuestions[className] = [...INITIAL_QUESTIONS];
              }
            });
            Object.keys(newCourseQuestions).forEach(k => {
              if (!c.includes(k)) delete newCourseQuestions[k];
            });
            setAppState({...appState, availableClasses: c, courseQuestions: newCourseQuestions});
          }}
          highScores={appState.highScores}
          setHighScores={(h) => setAppState({...appState, highScores: h})}
          onClose={() => setGameState(prev => ({...prev, gameStatus: 'START'}))}
        />
      )}
    </div>
  );
};

export default App;
