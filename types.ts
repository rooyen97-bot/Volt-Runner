
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface HighScore {
  name: string;
  className: string;
  score: number;
  date: string;
}

export interface GameState {
  playerX: number;
  playerY: number;
  velocityY: number;
  isJumping: boolean;
  score: number;
  mistakes: number;
  currentLevel: number;
  distance: number;
  isPaused: boolean;
  gameStatus: 'START' | 'PLAYING' | 'QUESTION' | 'GAMEOVER' | 'FINISHED' | 'ADMIN';
}

export interface AppState {
  playerName: string;
  playerClass: string;
  // Mapping class name to its specific list of questions
  courseQuestions: Record<string, Question[]>;
  highScores: HighScore[];
  availableClasses: string[];
}
