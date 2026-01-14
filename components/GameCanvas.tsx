
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GAME_CONFIG } from '../constants';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'block' | 'plumber' | 'mid-air-bolt';
  passed?: boolean;
}

interface GameCanvasProps {
  onCollision: () => void;
  onObstaclePassed: () => void;
  isPaused: boolean;
  gameActive: boolean;
  score: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onCollision, onObstaclePassed, isPaused, gameActive, score }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSpeed, setCurrentSpeed] = useState(GAME_CONFIG.SPEED_INITIAL);
  
  // Nya milstolpar
  const FLY_NORMAL_THRESHOLD = 25;
  const INVERT_JUMP_THRESHOLD = 55;
  const INVERT_FLY_THRESHOLD = 110;
  
  // Logik för att avgöra aktivt läge
  const isInvertedMode = score >= INVERT_JUMP_THRESHOLD;
  const isFlyMode = (score >= FLY_NORMAL_THRESHOLD && score < INVERT_JUMP_THRESHOLD) || score >= INVERT_FLY_THRESHOLD;
  
  const stateRef = useRef({
    playerY: GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLAYER_SIZE,
    velocityY: 0,
    jumpCount: 0,
    obstacles: [] as Obstacle[],
    distance: 0,
    frame: 0,
    currentSpeed: GAME_CONFIG.SPEED_INITIAL,
    isPressingJump: false
  });

  const handleJumpPress = useCallback((pressed: boolean) => {
    stateRef.current.isPressingJump = pressed;
    // Endast hopp-logik om vi INTE är i flygläge
    if (pressed && !isFlyMode && stateRef.current.jumpCount < 2 && gameActive && !isPaused) {
      const jumpForce = isInvertedMode ? -GAME_CONFIG.JUMP_FORCE : GAME_CONFIG.JUMP_FORCE;
      stateRef.current.velocityY = jumpForce;
      stateRef.current.jumpCount++;
    }
  }, [gameActive, isPaused, isFlyMode, isInvertedMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJumpPress(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleJumpPress(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJumpPress]);

  useEffect(() => {
    if (!gameActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const spawnObstacle = () => {
      const state = stateRef.current;
      const types: ('spike' | 'block' | 'plumber' | 'mid-air-bolt')[] = ['spike', 'block', 'plumber'];
      
      if (score >= FLY_NORMAL_THRESHOLD) {
        types.push('mid-air-bolt');
        types.push('block'); 
      }

      const type = types[Math.floor(Math.random() * types.length)];
      let width = 40;
      let height = 45;
      let y = GAME_CONFIG.GROUND_Y - height;

      if (type === 'block') {
        height = 60;
        if (isFlyMode && Math.random() > 0.4) {
          y = Math.random() * (GAME_CONFIG.GROUND_Y - 150);
        } else {
          y = GAME_CONFIG.GROUND_Y - height;
        }
      } else if (type === 'plumber') {
        width = 50;
        height = 50;
        const flyHeights = isFlyMode ? [60, 120, 180, 250, 350] : [60, 120, 160];
        const flyY = flyHeights[Math.floor(Math.random() * flyHeights.length)];
        y = GAME_CONFIG.GROUND_Y - height - flyY;
      } else if (type === 'mid-air-bolt') {
        width = 30;
        height = 80;
        y = Math.random() * (GAME_CONFIG.GROUND_Y - 100);
      }

      if (isInvertedMode && (type === 'spike' || type === 'block') && Math.random() > 0.5) {
        y = 0; 
      }

      state.obstacles.push({
        x: GAME_CONFIG.CANVAS_WIDTH + 100,
        y,
        width,
        height,
        type,
        passed: false
      });
    };

    const update = () => {
      if (isPaused) return;

      const state = stateRef.current;
      const targetSpeed = Math.min(
        GAME_CONFIG.SPEED_MAX, 
        GAME_CONFIG.SPEED_INITIAL + (state.distance / 1500) + (score >= FLY_NORMAL_THRESHOLD ? 1.5 : 0)
      );
      state.currentSpeed = targetSpeed;
      
      if (state.frame % 60 === 0) setCurrentSpeed(targetSpeed);

      const gDir = isInvertedMode ? -1 : 1;

      if (isFlyMode) {
        if (state.isPressingJump) {
          state.velocityY -= 0.6 * gDir;
        }
        state.velocityY += 0.3 * gDir;
        state.velocityY *= 0.95;
      } else {
        state.velocityY += GAME_CONFIG.GRAVITY * gDir;
      }

      state.playerY += state.velocityY;

      if (isInvertedMode) {
        if (state.playerY < 0) {
          state.playerY = 0;
          state.velocityY = 0;
          state.jumpCount = 0;
        }
        if (state.playerY > GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLAYER_SIZE) {
          state.playerY = GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLAYER_SIZE;
          state.velocityY = 0;
        }
      } else {
        if (state.playerY > GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLAYER_SIZE) {
          state.playerY = GAME_CONFIG.GROUND_Y - GAME_CONFIG.PLAYER_SIZE;
          state.velocityY = 0;
          state.jumpCount = 0;
        }
        if (state.playerY < 0) {
          state.playerY = 0;
          state.velocityY = 0;
        }
      }

      state.distance += state.currentSpeed;
      state.frame++;

      const baseSpawnRate = score >= FLY_NORMAL_THRESHOLD ? 40 : 80;
      const spawnRate = Math.max(score >= FLY_NORMAL_THRESHOLD ? 15 : 30, baseSpawnRate - Math.floor(state.distance / 800));
      
      if (state.frame % spawnRate === 0) spawnObstacle();

      const playerX = 100;
      state.obstacles = state.obstacles.filter(obs => obs.x + obs.width > -100);
      
      state.obstacles.forEach(obs => {
        obs.x -= state.currentSpeed;
        if (!obs.passed && obs.x + obs.width < playerX) {
          obs.passed = true;
          onObstaclePassed();
        }
        const playerY = state.playerY;
        const padding = 8;
        if (
          playerX + padding < obs.x + obs.width &&
          playerX + GAME_CONFIG.PLAYER_SIZE - padding > obs.x &&
          playerY + padding < obs.y + obs.height &&
          playerY + GAME_CONFIG.PLAYER_SIZE - padding > obs.y
        ) {
          onCollision();
          state.obstacles = [];
        }
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
      const state = stateRef.current;
      const playerW = GAME_CONFIG.PLAYER_SIZE;
      const playerH = GAME_CONFIG.PLAYER_SIZE;

      const gridColor = isInvertedMode ? (score >= INVERT_FLY_THRESHOLD ? '#431407' : '#4c1d95') : (isFlyMode ? '#1e1b4b' : '#1e293b');
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      const offset = (state.distance % 40);
      for (let i = 0; i < GAME_CONFIG.CANVAS_WIDTH + 40; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i - offset, 0);
        ctx.lineTo(i - offset, GAME_CONFIG.CANVAS_HEIGHT);
        ctx.stroke();
      }

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, GAME_CONFIG.GROUND_Y, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_Y);
      
      ctx.strokeStyle = isInvertedMode ? (score >= INVERT_FLY_THRESHOLD ? '#f87171' : '#a855f7') : (isFlyMode ? '#3b82f6' : '#38bdf8');
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, GAME_CONFIG.GROUND_Y);
      ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.GROUND_Y);
      ctx.stroke();

      if (isInvertedMode) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, 0);
        ctx.stroke();
      }

      const px = 100;
      const py = state.playerY;
      ctx.save();
      ctx.translate(px + playerW/2, py + playerH/2);
      if (isInvertedMode) ctx.scale(1, -1);
      ctx.rotate(state.velocityY * 0.02 * (isInvertedMode ? -1 : 1));
      
      if (isFlyMode && state.isPressingJump) {
        ctx.fillStyle = '#fbbf24';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(-playerW/2 + Math.random()*10, playerH/2 + Math.random()*20, 3 + Math.random()*5, 0, Math.PI*2);
          ctx.fill();
        }
      }

      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-playerW/2, -playerH/2 + 15, playerW, playerH - 15);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-playerW/2 - 2, -playerH/2 + 25, playerW + 4, 6);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-playerW/2 + 5, -playerH/2 + 5, playerW - 10, 18);
      ctx.fillStyle = '#000';
      ctx.fillRect(5, -playerH/2 + 10, 4, 4);
      ctx.fillRect(playerW/2 - 12, -playerH/2 + 10, 4, 4);
      ctx.fillStyle = score >= INVERT_FLY_THRESHOLD ? '#f87171' : (isInvertedMode ? '#a855f7' : (isFlyMode ? '#3b82f6' : '#facc15'));
      ctx.beginPath();
      ctx.arc(0, -playerH/2 + 8, playerW/2, Math.PI, 0);
      ctx.fill();
      ctx.restore();

      state.obstacles.forEach(obs => {
        ctx.save();
        if (obs.y === 0) {
           ctx.translate(0, obs.height);
           ctx.scale(1, -1);
           ctx.translate(0, -obs.height);
        }
        if (obs.type === 'spike') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.fill();
        } else if (obs.type === 'block') {
          ctx.fillStyle = score >= INVERT_FLY_THRESHOLD ? '#7f1d1d' : (isInvertedMode ? '#4c1d95' : '#6366f1');
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.x + 4, obs.y + 4, obs.width - 8, obs.height - 8);
        } else if (obs.type === 'mid-air-bolt') {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.width, obs.y);
          ctx.lineTo(obs.x, obs.y + obs.height/2);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height/2);
          ctx.lineTo(obs.x, obs.y + obs.height);
          ctx.fill();
        } else if (obs.type === 'plumber') {
          ctx.save();
          ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-obs.width/2 + 5, -obs.height/2 + 10, obs.width - 10, obs.height - 15);
          ctx.restore();
        }
        ctx.restore();
      });
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameActive, isPaused, onCollision, onObstaclePassed, isFlyMode, isInvertedMode, score]);

  return (
    <div className={`relative border-4 rounded-xl overflow-hidden shadow-2xl transition-all duration-1000 ${score >= INVERT_FLY_THRESHOLD ? 'border-red-500 bg-red-950/20' : (isInvertedMode ? 'border-purple-600 bg-black' : (isFlyMode ? 'border-blue-500 bg-slate-950' : 'border-slate-700 bg-slate-900'))}`}>
      <canvas 
        ref={canvasRef} 
        width={GAME_CONFIG.CANVAS_WIDTH} 
        height={GAME_CONFIG.CANVAS_HEIGHT}
        className="cursor-pointer"
        onMouseDown={() => handleJumpPress(true)}
        onMouseUp={() => handleJumpPress(false)}
      />
      <div className="absolute top-4 left-4 flex flex-wrap gap-4">
        <div className="text-white font-mono bg-black/50 p-2 rounded border border-white/20 text-xs">
          FART: {currentSpeed.toFixed(1)}x
        </div>
        
        {score >= INVERT_FLY_THRESHOLD ? (
          <div className="text-red-400 font-black animate-pulse bg-black/80 p-2 rounded border border-red-500/50 text-xs uppercase">
            🔥 ULTIMAT UTMANING: INVERTERAT FLYG 🔥
          </div>
        ) : isInvertedMode ? (
          <div className="text-purple-400 font-black bg-black/80 p-2 rounded border border-purple-500/50 text-xs uppercase">
            ⚠️ GRAVITATIONS-FLIP: HOPPA FRÅN TAKET ⚠️
          </div>
        ) : isFlyMode ? (
          <div className="text-blue-400 font-black animate-pulse bg-black/50 p-2 rounded border border-blue-400/50 text-xs uppercase">
            🚀 FLYG-LÄGE AKTIVERAT
          </div>
        ) : (
          <div className="text-sky-400 font-mono bg-black/50 p-2 rounded border border-sky-400/20 text-xs uppercase">
            FLYG-LÄGE OM {FLY_NORMAL_THRESHOLD - score} POÄNG
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCanvas;
