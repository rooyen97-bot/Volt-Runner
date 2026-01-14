
import React, { useState, useEffect, useMemo } from 'react';
import { Question } from '../types';

interface QuestionModalProps {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  mistakes: number;
}

interface ShuffledOption {
  text: string;
  originalIndex: number;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ question, onAnswer, mistakes }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Slumpa ordningen på alternativen
  const shuffledOptions = useMemo(() => {
    const optsWithIndex: ShuffledOption[] = question.options.map((text, i) => ({
      text,
      originalIndex: i
    }));
    return optsWithIndex.sort(() => Math.random() - 0.5);
  }, [question]);

  const handleSubmit = () => {
    if (selected === null) return;
    setShowFeedback(true);
  };

  const handleNext = () => {
    const isCorrect = shuffledOptions[selected!].originalIndex === question.correctIndex;
    onAnswer(isCorrect);
    setSelected(null);
    setShowFeedback(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border-2 border-sky-500 rounded-2xl p-8 max-w-xl w-full shadow-[0_0_50px_rgba(56,189,248,0.3)] animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sky-400 font-bold text-xl uppercase tracking-widest">Kunskapskontroll</h2>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border ${i < mistakes ? 'bg-red-500 border-red-700' : 'bg-slate-600 border-slate-700'}`} 
              />
            ))}
          </div>
        </div>

        <p className="text-white text-2xl font-semibold mb-8 leading-relaxed">
          {question.text}
        </p>

        <div className="space-y-4">
          {shuffledOptions.map((opt, idx) => {
            const isOriginalCorrect = opt.originalIndex === question.correctIndex;
            const isUserSelected = selected === idx;
            
            return (
              <button
                key={idx}
                disabled={showFeedback}
                onClick={() => setSelected(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 text-lg ${
                  selected === idx 
                    ? 'bg-sky-500/20 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                } ${
                  showFeedback && isOriginalCorrect ? 'border-green-500 bg-green-500/20 text-green-400' : ''
                } ${
                  showFeedback && isUserSelected && !isOriginalCorrect ? 'border-red-500 bg-red-500/20 text-red-400' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900/50 text-sm font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt.text}
                </div>
              </button>
            );
          })}
        </div>

        {showFeedback ? (
          <div className="mt-8 animate-in slide-in-from-bottom duration-300">
            <div className={`p-4 rounded-xl mb-6 ${shuffledOptions[selected!].originalIndex === question.correctIndex ? 'bg-green-900/30 text-green-200' : 'bg-red-900/30 text-red-200'}`}>
              <p className="font-bold mb-1">{shuffledOptions[selected!].originalIndex === question.correctIndex ? '✅ Rätt Svar!' : '❌ Fel Svar'}</p>
              <p className="text-sm opacity-90">{question.explanation}</p>
            </div>
            <button
              onClick={handleNext}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-xl"
            >
              {mistakes >= 2 && shuffledOptions[selected!].originalIndex !== question.correctIndex ? 'FÖRSÖK IGEN (Sista chansen!)' : 'FORTSÄTT'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className={`mt-8 w-full font-bold py-4 rounded-xl shadow-lg transition-all text-xl ${
              selected !== null 
                ? 'bg-sky-500 hover:bg-sky-400 text-white active:scale-95' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            SVARA
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionModal;
